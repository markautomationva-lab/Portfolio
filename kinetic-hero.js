import * as THREE from './vendor/three.module.js?v=e18c9f47c6d4';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js?v=e18c9f47c6d4';
import {RoomEnvironment} from './vendor/RoomEnvironment.js?v=e18c9f47c6d4';

import {supportPose,collectionPose,ease} from './kinetic-hero-math.js?v=e18c9f47c6d4';

export function mountKineticHero(hero){
if(hero.kineticHero)return hero.kineticHero;
const host=hero.querySelector('[data-kinetic-surface]');
const header=document.querySelector('.site-header');
let resizeFrame=0;
const defaults={density:innerWidth<740?7:8,spacing:.075,bevel:.065,intensity:1,speed:1,pointer:1,angle:35,light:3,quality:innerWidth<740?'low':'balanced'};
const config={...defaults},reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,scene,camera,mesh,geometry,ground,environment,pmrem,room,lead,shadowLight;
let tiles=[],leadIndex=0,frame=0,elapsed=0,last=0,paused=reduced.matches,visible=false,disposed=false,refMode=false,contextLost=false;
let pointerAmount=0,pointerTarget=0,pointerHit=new THREE.Vector3(),pointerDestination=new THREE.Vector3();
const object=new THREE.Object3D(),projected=new THREE.Vector3(),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),mouse=new THREE.Vector2();
const abort=new AbortController(),listen=(target,type,fn)=>target.addEventListener(type,fn,{signal:abort.signal});
const stats={frames:0,renderMs:[],frameMs:[],drawCalls:0,triangles:0,interaction:0};
const materials=[],resources=[];
function material(options){const m=new THREE.MeshPhysicalMaterial(options);materials.push(m);return m}
function init(){
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('webgl2',{alpha:false,depth:true,stencil:false,antialias:true,powerPreference:'default'});
 if(!context)throw Error('WebGL 2 is unavailable');
 renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,powerPreference:'default'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,config.quality==='high'?1.75:config.quality==='low'?1:1.35));renderer.setSize(host.clientWidth,host.clientHeight);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=config.quality!=='low';renderer.shadowMap.type=THREE.PCFShadowMap;host.append(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color('#eee5d8');
 camera=new THREE.OrthographicCamera(-10,10,5,-5,.1,100);
 pmrem=new THREE.PMREMGenerator(renderer);room=new RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight('#fffaf2','#ded8ce',2));
 shadowLight=new THREE.DirectionalLight('#fffaf2',config.light);shadowLight.position.set(-5,11,5);shadowLight.castShadow=true;shadowLight.shadow.mapSize.set(1024,1024);shadowLight.shadow.camera.left=-17;shadowLight.shadow.camera.right=17;shadowLight.shadow.camera.top=17;shadowLight.shadow.camera.bottom=-17;shadowLight.shadow.normalBias=.025;shadowLight.shadow.bias=-.00015;scene.add(shadowLight);
 const fill=new THREE.DirectionalLight('#fffaf2',1.1);fill.position.set(8,4,-6);scene.add(fill);
 ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),material({color:'#ded8ce',roughness:.85}));ground.rotation.x=-Math.PI/2;ground.position.y=-.28;ground.receiveShadow=true;scene.add(ground);
 resources.push(ground.geometry);
 resize();rebuild();
 listen(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();contextLost=true;stop();showFallback('3D paused. Showing the static surface.');});
 listen(renderer.domElement,'webglcontextrestored',()=>{location.reload()});
}
const bodyMaterial=()=>material({color:'#fffaf2',roughness:.34,metalness:.08,clearcoat:.25,clearcoatRoughness:.3});
let tileMaterial;
const tileMarks=[];
let collectionStops=[],collectionState;
const absorbTarget=new THREE.Vector3(),absorbPosition=new THREE.Vector3(),absorbRotation=new THREE.Quaternion(),absorbScale=new THREE.Vector3(),identityRotation=new THREE.Quaternion();
function drawTileSymbol(ctx,type){
 const path=points=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()};
 const box=(x,y,w,h,r=12)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.stroke()};
 const circle=(x,y,r,fill=false)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);fill?ctx.fill():ctx.stroke()};
 if(type==='flow'){
  path([[76,128],[115,128],[115,72],[168,72]]);
  path([[115,128],[115,184],[168,184]]);
  circle(57,128,19);circle(187,72,19);circle(187,184,19);
 }
 if(type==='email'){box(40,65,176,126);path([[44,74],[128,137],[212,74]])}
 if(type==='call'){
  ctx.beginPath();ctx.moveTo(77,48);ctx.lineTo(105,88);ctx.quadraticCurveTo(108,96,92,110);ctx.quadraticCurveTo(107,144,143,161);ctx.lineTo(162,143);ctx.quadraticCurveTo(167,140,174,144);ctx.lineTo(207,168);ctx.quadraticCurveTo(212,175,197,194);ctx.quadraticCurveTo(182,213,151,200);ctx.quadraticCurveTo(68,170,48,91);ctx.quadraticCurveTo(41,65,62,51);ctx.closePath();ctx.stroke();
  circle(199,54,11,true);
 }
 if(type==='message'){ctx.beginPath();ctx.roundRect(40,57,173,123,18);ctx.stroke();path([[79,180],[63,207],[111,180]]);path([[77,102],[174,102]]);path([[77,132],[145,132]]);circle(213,47,11,true)}
 if(type==='calendar'){box(49,59,160,151);path([[49,101],[209,101]]);path([[88,43],[88,76]]);path([[169,43],[169,76]]);for(const y of [133,168])for(const x of [88,129,170])circle(x,y,4,true)}
 if(type==='meeting'){circle(128,87,24);circle(65,109,18);circle(191,109,18);ctx.beginPath();ctx.arc(128,168,40,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(65,177,28,Math.PI,Math.PI*1.8);ctx.stroke();ctx.beginPath();ctx.arc(191,177,28,Math.PI*1.2,Math.PI*2);ctx.stroke();path([[88,168],[88,199],[168,199],[168,168]])}
 if(type==='invoice'){
  path([[63,46],[191,46],[191,213],[175,201],[159,213],[143,201],[127,213],[111,201],[95,213],[79,201],[63,213],[63,46]]);
  path([[88,79],[165,79]]);path([[88,110],[134,110]]);path([[88,141],[134,141]]);path([[88,177],[165,177]]);circle(164,110,4,true);circle(164,141,4,true);
 }
 if(type==='checklist'){
  box(53,43,151,174);for(const y of [84,130,176]){path([[73,y],[83,y+10],[101,y-11]]);path([[122,y],[180,y]])}
 }
 if(type==='approval'){
  circle(128,128,78);path([[88,127],[116,154],[170,98]]);
 }
 if(type==='signature'){
  path([[66,43],[157,43],[193,80],[193,210],[66,210],[66,43]]);path([[157,43],[157,80],[193,80]]);path([[88,104],[164,104]]);path([[88,127],[143,127]]);
  ctx.beginPath();ctx.moveTo(85,178);ctx.bezierCurveTo(104,175,125,141,119,144);ctx.bezierCurveTo(102,152,101,190,120,179);ctx.bezierCurveTo(143,165,131,185,146,176);ctx.bezierCurveTo(154,170,160,176,169,170);ctx.stroke();path([[86,193],[169,193]]);
 }
 if(type==='invoice-due'){drawTileSymbol(ctx,'invoice');circle(188,178,31);path([[188,160],[188,179],[201,186]])}
 if(type==='payment-received'){box(39,69,178,122);path([[40,103],[216,103]]);path([[62,151],[95,151]]);circle(181,174,32);path([[166,174],[177,185],[197,162]])}
 if(type==='task-reminder'){drawTileSymbol(ctx,'checklist');circle(204,49,12,true)}
 if(type==='approval-needed'){drawTileSymbol(ctx,'approval');circle(203,53,12,true)}
 if(type==='new-enquiry'){drawTileSymbol(ctx,'message');path([[174,165],[174,201]]);path([[156,183],[192,183]])}
 if(type==='document-to-sign'){drawTileSymbol(ctx,'signature');circle(199,49,11,true)}
 if(type==='booking-confirmed'){box(49,59,160,151);path([[49,101],[209,101]]);path([[88,43],[88,76]]);path([[169,43],[169,76]]);path([[91,153],[117,179],[166,129]])}
 if(type==='deadline'){path([[76,43],[180,43]]);path([[76,212],[180,212]]);ctx.beginPath();ctx.moveTo(89,45);ctx.bezierCurveTo(87,100,99,110,128,128);ctx.bezierCurveTo(158,146,170,162,168,210);ctx.moveTo(167,45);ctx.bezierCurveTo(169,100,157,110,128,128);ctx.bezierCurveTo(98,146,86,162,88,210);ctx.stroke();path([[104,191],[128,166],[152,191],[104,191]])}
 if(type==='order-update'){path([[128,43],[211,87],[211,176],[128,220],[45,176],[45,87],[128,43]]);path([[45,87],[128,131],[211,87]]);path([[128,131],[128,220]]);path([[88,65],[170,109],[170,143]])}
 if(type==='follow-up'){ctx.beginPath();ctx.arc(128,132,76,-Math.PI*.75,Math.PI*.86);ctx.stroke();path([[58,49],[75,91],[117,74]]);path([[128,88],[128,134],[163,154]])}
}
function placeEmailMark(){
 if(!tileMarks.length)for(const [type,target] of [['email',[.55,-.48]],['call',[.67,.61]],['message',[.86,.02]],['calendar',[.12,.46]],['meeting',[.09,-.72]],['invoice',[-.72,.55]],['checklist',[.85,-.72]],['approval',[-.7,-.75]],['signature',[.25,-.22]],['email',[-.28,.7]],['calendar',[.9,.4]],['approval',[.42,.2]],['checklist',[-.2,-.45]],['invoice',[.5,-.88]],['message',[-.95,-.1]],['invoice-due',[-.95,.75]],['payment-received',[-.5,.94]],['task-reminder',[0,.88]],['approval-needed',[.5,.9]],['new-enquiry',[.97,.7]],['document-to-sign',[.98,-.25]],['booking-confirmed',[.8,-.96]],['deadline',[.25,-.98]],['order-update',[-.45,-.94]],['follow-up',[-.98,-.55]]]){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.strokeStyle=ctx.fillStyle='#ded8ce';ctx.lineWidth=9;ctx.lineJoin='round';ctx.lineCap='round';drawTileSymbol(ctx,type);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const ink=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.58,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});materials.push(ink);
  const decal=new THREE.Mesh(new THREE.PlaneGeometry(1.08,1.08),ink);decal.rotation.x=-Math.PI/2;decal.position.y=.137;
  const mark=new THREE.Group();mark.name=`faded-${type}-mark`;mark.matrixAutoUpdate=false;mark.add(decal);scene.add(mark);tileMarks.push({mark,type,target,index:-1});
 }
 const used=new Set([leadIndex]);
 for(const entry of tileMarks){let best=Infinity;entry.index=-1;
 if(entry.type==='flow'){entry.index=leadIndex;continue}
 tiles.forEach((tile,i)=>{
  if(used.has(i)||Math.hypot(tile.x-tiles[leadIndex].x,tile.z-tiles[leadIndex].z)<2.2)return;
  projected.set(tile.x,0,tile.z).project(camera);
  const score=(projected.x-entry.target[0])**2+(projected.y-(1-(1-entry.target[1])*(hero.clientHeight+parseFloat(hero.style.getPropertyValue('--kinetic-header-space')||'0'))/host.clientHeight))**2;
  if(score<best){best=score;entry.index=i}
 });
 used.add(entry.index);
 }
 const home=tiles[leadIndex];
 const remaining=tileMarks.filter(entry=>tiles[entry.index]&&entry.index!==leadIndex);
 collectionStops=[];let previous=home;
 while(remaining.length){
  remaining.sort((a,b)=>{const first=tiles[a.index],second=tiles[b.index];return Math.hypot(first.x-previous.x,first.z-previous.z)-Math.hypot(second.x-previous.x,second.z-previous.z)});
  const next=remaining.shift();collectionStops.push(next);previous=tiles[next.index];
 }
}
function rebuild(){
 if(!scene)return;
 if(mesh){scene.remove(mesh);mesh.dispose();geometry.dispose();scene.remove(lead);lead.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
 tileMaterial??=bodyMaterial();
 const segments=config.quality==='high'?4:config.quality==='low'?2:3;
 geometry=new RoundedBoxGeometry(1.5,.27,1.5,segments,config.bevel);
 const side=config.density*2+1;mesh=new THREE.InstancedMesh(geometry,tileMaterial,side*side-1);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);
 tiles=[];let nearest=Infinity;const pitch=1.5+config.spacing;
 for(let z=-config.density;z<=config.density;z++)for(let x=-config.density;x<=config.density;x++){
  const pos=new THREE.Vector3(x*pitch,0,z*pitch);projected.copy(pos).project(camera);
  const desired=refMode?new THREE.Vector2(.03,-.05):new THREE.Vector2(innerWidth<740?.5:.49,1-(1-(innerWidth<740?-.92:-.03))*(hero.clientHeight+parseFloat(hero.style.getPropertyValue('--kinetic-header-space')||'0'))/host.clientHeight);
  const dist=(projected.x-desired.x)**2+(projected.y-desired.y)**2;
  if(dist<nearest){nearest=dist;leadIndex=tiles.length}
  const screenX=(projected.x+1)/2,screenY=(1-projected.y)/2;
  const activity=THREE.MathUtils.smoothstep(screenX,.38,.75)*(1-THREE.MathUtils.smoothstep(screenY,.8,1));
  tiles.push({x:pos.x,z:pos.z,activity,pointer:0,depth:((x*17+z*7+1000)%11===0?.045:0)*activity});
 }
 let slot=0;const color=new THREE.Color();tiles.forEach((tile,i)=>{if(i===leadIndex)return;tile.slot=slot;color.set(tile.activity>.4&&(i%13===0)?'#eee5d8':'#fffaf2');mesh.setColorAt(slot++,color)});
 lead=new THREE.Group();const base=new THREE.Mesh(geometry.clone(),tileMaterial);base.castShadow=true;base.receiveShadow=true;lead.add(base);
 scene.add(lead);placeEmailMark();render(0);
}
function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight,baseH=hero.clientHeight+parseFloat(hero.style.getPropertyValue('--kinetic-header-space')||'0'),aspect=w/baseH;const vh=innerWidth<740?9.1*(config.density/7):innerWidth<1000?8.55*(config.density/8):config.density*.8;camera.left=-vh*aspect/2;camera.right=vh*aspect/2;camera.top=vh/2;camera.bottom=-vh/2-vh*(h-baseH)/baseH;const angle=THREE.MathUtils.degToRad(config.angle);camera.position.set(8,Math.tan(angle)*Math.hypot(8,10),10);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();renderer.setSize(w,h);}
function render(dt){
 if(!renderer||contextLost||disposed)return;
 const begin=performance.now();const damp=1-Math.exp(-dt*7);
 pointerAmount+= (pointerTarget-pointerAmount)*damp;pointerHit.lerp(pointerDestination,damp);
 const effective=config.intensity*(innerWidth<740?.65:1);const leadTile=tiles[leadIndex];
 for(const entry of tileMarks)entry.mark.children[0].material.opacity=.58;
 for(let i=0;i<tiles.length;i++){
  const tile=tiles[i];const dist=Math.hypot(tile.x-pointerHit.x,tile.z-pointerHit.z);
  const targetInfluence=reduced.matches?0:Math.exp(-dist*dist/3.6)*pointerAmount*config.pointer;tile.pointer+=(targetInfluence-tile.pointer)*(1-Math.exp(-dt*9/(1+dist*.45)));const influence=tile.pointer;

  if(i===leadIndex)continue;
  const dx=tile.x-leadTile.x,dz=tile.z-leadTile.z;
  const follow=(Math.abs(dx)+Math.abs(dz)<4.9&&tile.activity>.4)?supportPose(elapsed,1.4+Math.hypot(dx,dz)*.19,effective)*tile.activity:0;
  const edge=(i%97===0&&tile.activity>.7)?supportPose(elapsed,4.2,effective)*.6:0;
  const wave=(1-dist/4)*Math.exp(-dist*.7)*influence*.06;
  object.position.set(tile.x,tile.depth+follow+edge+influence*.19+Math.max(0,wave),tile.z);
  object.rotation.set(influence*(pointerHit.z-tile.z)*.025,0,-influence*(pointerHit.x-tile.x)*.025);object.scale.setScalar(1);object.updateMatrix();mesh.setMatrixAt(tile.slot,object.matrix);
  for(const entry of tileMarks)if(i===entry.index){entry.mark.matrix.copy(object.matrix);entry.mark.matrixWorldNeedsUpdate=true}
 }
 mesh.instanceMatrix.needsUpdate=true;
 // Collect four tasks per trip, rotate for each pickup, and return home between batches.
 collectionState=collectionPose(elapsed,leadTile,collectionStops.map(entry=>tiles[entry.index]),effective>0&&!reduced.matches);
 lead.position.set(collectionState.x,collectionState.lift,collectionState.z);
 const turn=collectionState.yaw??0;
 lead.rotation.set(0,collectionState.lift>0?turn:0,0);
 lead.updateMatrix();
 collectionStops.forEach((entry,i)=>{
  const phase=collectionState.absorptions[i];if(!phase)return;
  const {progress,restore}=phase;const ink=entry.mark.children[0].material;
  if(progress<=0)return;
  if(restore>0){ink.opacity=.58*restore;return}
  entry.mark.matrix.decompose(absorbPosition,absorbRotation,absorbScale);
  absorbTarget.copy(lead.position);absorbTarget.y+=.22;absorbPosition.lerp(absorbTarget,progress);absorbPosition.y+=Math.sin(Math.PI*progress)*.45;
  absorbRotation.slerp(identityRotation,progress);
  absorbScale.setScalar(1-progress*.85);
  entry.mark.matrix.compose(absorbPosition,absorbRotation,absorbScale);entry.mark.matrixWorldNeedsUpdate=true;
  ink.opacity=.58*(1-ease.settle(Math.max(0,(progress-.85)/.15)));
 });
 for(const entry of tileMarks)if(entry.type==='flow'){entry.mark.matrix.copy(lead.matrix);entry.mark.matrixWorldNeedsUpdate=true}

 renderer.render(scene,camera);stats.frames++;stats.drawCalls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;stats.interaction=pointerAmount;
 if(dt>0&&stats.frames>20){stats.renderMs.push(performance.now()-begin);stats.frameMs.push(dt*1000);if(stats.renderMs.length>300){stats.renderMs.shift();stats.frameMs.shift()}}

}
function tick(now){if(!last)last=now;const dt=Math.max(0,(now-last)/1000);last=now;if(!paused)elapsed+=dt*config.speed;render(dt);if(paused&&pointerAmount<.001)stop()}
function start(){if(frame||!renderer||disposed||contextLost||!visible||document.hidden)return;last=0;renderer.setAnimationLoop(tick);frame=1}
function stop(){renderer?.setAnimationLoop(null);frame=0;last=0}
function syncPause(){if(paused){pointerTarget=pointerAmount=0;render(0);stop()}else start()}
function setQuality(){const quality=config.quality;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:quality==='high'?1.75:1.35));renderer.shadowMap.enabled=quality!=='low';renderer.shadowMap.needsUpdate=true;resize();rebuild();if(paused)render(0);else start()}
function showFallback(message='A static surface is shown on this device.'){
 if(renderer?.domElement)renderer.domElement.hidden=true;
 hero.dataset.kineticState='fallback';
}
function pointerMove(e){if(reduced.matches||paused||e.pointerType==='touch')return;if(e.target.closest('a,button,input,select,textarea,dialog,.hero-copy')){pointerTarget=0;return}const r=host.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);if(ray.ray.intersectPlane(plane,pointerDestination)){pointerTarget=1;start()}}
listen(hero,'pointermove',pointerMove);listen(hero,'pointerleave',()=>{pointerTarget=0});
function measureLayout(){
 if(hero.classList.contains('kinetic-page-ending')){const footer=document.querySelector('.site-footer');if(footer)host.style.bottom=-Math.max(0,footer.getBoundingClientRect().bottom-hero.getBoundingClientRect().bottom)+'px'}
 hero.style.setProperty('--kinetic-width',document.body.clientWidth+'px');
 const space=header?header.offsetHeight+parseFloat(getComputedStyle(header).marginTop||0):0;
 hero.style.setProperty('--kinetic-header-space',space+'px');
}
function scheduleResize(){if(resizeFrame||disposed)return;resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;measureLayout();resize();rebuild();if(!paused)start()})}
listen(window,'resize',scheduleResize);
const layoutObserver=new ResizeObserver(scheduleResize);layoutObserver.observe(hero);if(header)layoutObserver.observe(header);if(hero.classList.contains('kinetic-page-ending')){const footer=document.querySelector('.site-footer');if(footer)layoutObserver.observe(footer);}
listen(document,'visibilitychange',()=>{document.hidden?stop():start()});
listen(reduced,'change',()=>{paused=reduced.matches;elapsed=0;pointerTarget=pointerAmount=0;for(const tile of tiles)tile.pointer=0;syncPause()});
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop()},{threshold:0});observer.observe(host);

function dispose(){if(disposed)return;stop();disposed=true;observer.disconnect();layoutObserver.disconnect();cancelAnimationFrame(resizeFrame);abort.abort();if(scene){const geometries=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.isInstancedMesh)o.dispose()});for(const g of geometries)g.dispose();for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose()}for(const t of textures)t.dispose();environment?.dispose();shadowLight?.shadow.dispose()}renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();hero.dataset.kineticState="disposed";delete hero.kineticHero}

const controller={pause(){paused=true;pointerTarget=pointerAmount=0;syncPause()},resume(){paused=false;syncPause()},dispose,
 get state(){return {elapsed,paused,reduced:reduced.matches,rendering:!!frame,disposed,frames:stats.frames,drawCalls:stats.drawCalls,tileCount:tiles.length,pointer:Math.max(0,...tiles.map(tile=>tile.pointer)),collection:{total:collectionStops.length,trip:collectionState?.trip??0,collected:collectionState?.absorptions.filter(a=>a.progress===1&&a.restore===0).length??0}}}};
hero.kineticHero=controller;
measureLayout();
try{init();hero.dataset.kineticState='ready';render(0);syncPause()}catch(error){renderer?.dispose();renderer?.domElement.remove();showFallback()}
return controller;
}
function mountAll(){for(const root of document.querySelectorAll('[data-kinetic-hero]'))mountKineticHero(root)}
function disposeAll(){for(const root of document.querySelectorAll('[data-kinetic-hero]'))root.kineticHero?.dispose()}
addEventListener('pagehide',disposeAll);
addEventListener('pageshow',mountAll);
mountAll();


