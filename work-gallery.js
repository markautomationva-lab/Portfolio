import * as THREE from './vendor/three.module.js?v=1bcd23e21865';
import { createProjectFocus } from './project-focus.js?v=1bcd23e21865';
import { createGalleryVideo } from './gallery-video.js?v=1bcd23e21865';
// The official distribution is UMD and must run as a classic script, not in
// strict ES-module scope. Load it once, locally, before creating gallery motion.
function loadMotionScript(file) {
  return new Promise((resolve, reject) => {
    const script=document.createElement('script');script.src=new URL(file,import.meta.url).href;
    script.onload=resolve;script.onerror=()=>reject(new Error('Could not load '+file));document.head.append(script);
  });
}
if(!window.gsap)await loadMotionScript('./vendor/gsap.min.js?v=1bcd23e21865');
if(!window.CustomEase)await loadMotionScript('./vendor/CustomEase.min.js?v=1bcd23e21865');
const gsap=window.gsap;
gsap.registerPlugin(window.CustomEase);
window.CustomEase.create('gallery.camera','.77,0,.175,1');
window.CustomEase.create('gallery.info','.23,1,.32,1');
window.CustomEase.create('gallery.stack','.33,0,.12,1');

// One camera path shared by explicit navigation and gestures across all six projects.
// Project text and links are read from the existing HTML, never duplicated as data.
async function createWorkGallery() {
  const root = document.querySelector('#work') || document.querySelector('body[data-page="work"] main');
  const index = root?.querySelector('.case-grid');
  if (!index) return;
  root.classList.add('work-spatial');
  index.className = 'spatial-project-index';
  const cards = [...index.children];
  let graphicsUnavailable=false;
  function restoreHtmlIndex(){
    graphicsUnavailable=true;root.dataset.galleryState='fallback';root.classList.remove('spatial-gallery-ready');figure.hidden=true;index.hidden=false;index.inert=false;
    root.querySelector('.project-directory')?.setAttribute('hidden','');root.querySelector('.project-view-toggle')?.setAttribute('hidden','');
    let notice=root.querySelector('.gallery-fallback-notice');if(!notice){notice=document.createElement('p');notice.className='gallery-fallback-notice';notice.setAttribute('role','status');notice.textContent='The 3D gallery is unavailable. All projects remain available below.';const retry=document.createElement('button');retry.type='button';retry.textContent='Reload 3D gallery';retry.addEventListener('click',()=>location.reload());notice.append(' ',retry);index.before(notice);}
    const routeFallback=()=>{const card=cards.find(card=>'#'+card.id===location.hash);if(card){const detail=card.querySelector('details');if(detail)detail.open=true;card.scrollIntoView({block:'start',behavior:'instant'});}};
    routeFallback();window.addEventListener('hashchange',routeFallback);window.addEventListener('pagehide',()=>window.removeEventListener('hashchange',routeFallback),{once:true});
  }
  cards.forEach(card => {
    card.className = 'spatial-project-entry';
    card.removeAttribute('data-tilt');
    card.querySelector('.case-visual')?.removeAttribute('data-tilt');
  });

  const figure = document.createElement('figure');
  figure.className = 'spatial-gallery';
  figure.setAttribute('aria-label', 'Spatial project gallery');
  const stage = document.createElement('div');
  stage.className = 'spatial-gallery-stage';
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Project gallery. Use left and right arrow keys to navigate projects.');
  stage.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight');
  stage.setAttribute('aria-description', 'Drag or swipe horizontally to explore. Press Enter to open the project film. Vertical gestures scroll the page.');
  const note = document.createElement('figcaption');
  note.className = 'spatial-gallery-note';
  note.textContent = 'Drag, swipe or use the mouse wheel to explore. Use Previous / Next or the arrow keys.';
  const information = document.createElement('div');
  information.className = 'spatial-project-information';
  information.innerHTML = '<div><p class="spatial-category"></p><h3></h3></div><p class="spatial-description"></p><a class="text-link spatial-project-cta">Explore the project</a>';
  const navigation = document.createElement('nav');
  navigation.className = 'spatial-navigation';
  navigation.setAttribute('aria-label', 'Project gallery navigation');
  navigation.innerHTML = '<button type="button" class="spatial-previous">Previous</button><span class="spatial-counter">01 / 06</span><button type="button" class="spatial-next">Next</button>';
  const announcement = document.createElement('p');announcement.className='sr-only';announcement.setAttribute('role','status');
  figure.append(stage, information, navigation, note, announcement);
  const previous = navigation.querySelector('.spatial-previous');
  const next = navigation.querySelector('.spatial-next');
  const counter = navigation.querySelector('.spatial-counter');
  index.before(figure);

  const projects = cards.map(card => {
    const name = card.querySelector('h2').textContent;
    return { card, name, mesh: null, panel: null };
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (error) {
    restoreHtmlIndex();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 24, 68);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 150);
  const loader = new THREE.TextureLoader();
  // Shared rounded face and bevelled solid core keep the boards tangible.
    function roundedCard(width,height,radius){
      const x=-width/2,y=-height/2,shape=new THREE.Shape();
      shape.moveTo(x+radius,y);shape.lineTo(x+width-radius,y);
      shape.quadraticCurveTo(x+width,y,x+width,y+radius);
      shape.lineTo(x+width,y+height-radius);shape.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);
      shape.lineTo(x+radius,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-radius);
      shape.lineTo(x,y+radius);shape.quadraticCurveTo(x,y,x+radius,y);return shape;
    }
    const cardShape=roundedCard(6.4,3.6,.18);
    const geometry = new THREE.ShapeGeometry(cardShape,12);
    const positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    for(let i=0;i<positions.count;i++)uv.setXY(i,(positions.getX(i)+3.2)/6.4,(positions.getY(i)+1.8)/3.6);
  const textures = [];
  const materials = [];
  const edgeGeometry = new THREE.ExtrudeGeometry(cardShape,{depth:.18,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:6,steps:1,curveSegments:12});
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xa99f8f, roughness: .54, metalness: .02, toneMapped: false });
  materials.push(edgeMaterial);
    scene.add(new THREE.HemisphereLight(0xffffff,0x62574a,1.5));
    const cardLight=new THREE.DirectionalLight(0xfff4e3,2.8);cardLight.position.set(-5,8,12);scene.add(cardLight);
  // Rounded signed-distance falloff: no clipped blur or rectangular texture edge.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width=1024;shadowCanvas.height=640;
  const shadowContext=shadowCanvas.getContext('2d');
  const shadowPixels=shadowContext.createImageData(1024,640);
  for(let y=0;y<640;y++)for(let x=0;x<1024;x++){
    const qx=Math.abs(x-512)-378,qy=Math.abs(y-320)-203;
    const distance=Math.max(0,Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-22);
    const broad=.24*Math.exp(-distance*distance/(2*34*34));
    const contact=.15*Math.exp(-distance*distance/(2*12*12));
    const boundary=Math.min(x,1023-x,y,639-y)/28;
    const fade=Math.max(0,Math.min(1,boundary));
    const i=(y*1024+x)*4;
    shadowPixels.data[i]=48;shadowPixels.data[i+1]=43;shadowPixels.data[i+2]=37;
    shadowPixels.data[i+3]=Math.round(255*(broad+contact)*fade*fade*(3-2*fade));
  }
  shadowContext.putImageData(shadowPixels,0,0);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  textures.push(shadowTexture);
  const shadowGeometry = new THREE.PlaneGeometry(8.192,5.12);


  // Three previews were HTML illustrations rather than files. Reuse their own text
  // and existing four-block motif in a texture, without inventing project imagery.
  function illustrationTexture(card) {
    const visual = card.querySelector('.built-visual');
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext('2d');
    const style = getComputedStyle(visual);
    context.fillStyle = style.backgroundColor;
    context.fillRect(0, 0, 1600, 900);
    context.fillStyle = style.color;
    context.font = '24px "DM Sans", sans-serif';
    context.fillText(visual.querySelector('.mini-label').textContent, 90, 100);
    context.font = '500 132px "Cormorant Garamond", Georgia, serif';
    context.fillText(visual.querySelector('.visual-word').textContent, 90, 400);
    const blocks = [...visual.querySelectorAll('.mini-blocks i')];
    blocks.forEach((block, i) => {
      context.save();
      context.translate(210 + i * 235, 565);
      context.rotate((i % 2 ? 3 : -5) * Math.PI / 180);
      context.fillStyle = '#36383b26';
      context.beginPath(); context.roundRect(-95, -45, 200, 110, 22); context.fill();
      context.fillStyle = getComputedStyle(block).backgroundColor;
      context.beginPath(); context.roundRect(-100, -55, 200, 110, 22); context.fill();
      context.restore();
    });
    context.fillStyle = style.color;
    context.font = '20px "DM Sans", sans-serif';
    context.textAlign = 'right';
    context.fillText(visual.querySelector('small').textContent, 1510, 825);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  await document.fonts.ready;
  try {
    await Promise.all(projects.map(async project => {
      const image = project.card.querySelector('.case-visual img');
      const texture = image ? await loader.loadAsync(image.getAttribute('src')) : illustrationTexture(project.card);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.push(texture);
      const material = new THREE.MeshBasicMaterial({ map: texture, fog: false, side: THREE.DoubleSide, toneMapped: false, transparent: true });
      materials.push(material);
      project.panel = new THREE.Mesh(geometry, material);
      project.mesh = new THREE.Group();
      const individualEdgeMaterial=edgeMaterial.clone();materials.push(individualEdgeMaterial);individualEdgeMaterial.transparent=true;
      const edge = new THREE.Mesh(edgeGeometry, individualEdgeMaterial);
      project.edge=edge;
      edge.position.z = -.208;
      const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .82, toneMapped: false });
      materials.push(shadowMaterial);
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      project.shadow=shadow;
      shadow.position.set(.12, -.20, -.26);
      project.mesh.add(shadow, edge, project.panel);
      project.mesh.name = project.name;
      project.mesh.userData.projectId = project.card.id;
      scene.add(project.mesh);
    }));
  } catch (error) {
    renderer.dispose(); textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometry.dispose(); edgeGeometry.dispose(); shadowGeometry.dispose();
    restoreHtmlIndex();
    return;
  }

  let renderCount = 0;
  let activeId = projects[0].card.id;
  let pendingId = null;
  let timeline = null;
  let inView = true;
  let targetMode = 'desktop';
  const lookAt = new THREE.Vector3(0, 0, 0);
  const travel = { progress: 0 };
  let gesture = null, dragging = false, suppressClickUntil = 0;
  const pointerListeners = [];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const cameraTargets = new Map();
  let stackSlots=[];
  let recycleRoute=null;
  const recyclePoint=new THREE.Vector3();
  const wrap=(value,count)=>((value%count)+count)%count;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => reducedMotion.matches || new URLSearchParams(location.search).get('gallery-motion') === 'reduce';
  const navigationIds = new Set(projects.map(p => p.card.id));
  const enabledProjects = () => projects.filter(p => !p.card.hidden && navigationIds.has(p.card.id));
  const currentProject = () => projects.find(p => p.card.id === activeId);

  function updateInformation(project) {
    information.querySelector('h3').textContent = project.name;
    const group = project.card.dataset.category;
    information.querySelector('.spatial-category').textContent = String(projects.indexOf(project)+1).padStart(2,'0')+' / '+ project.card.dataset.serviceCategory || [...root.querySelectorAll('[data-filter]')].find(button => button.dataset.filter === group)?.textContent || group;
    information.querySelector('.spatial-description').textContent = project.card.querySelector('.case-intro').textContent;
    information.querySelector('a').href = `#${project.card.id}`;
    information.querySelector('a').setAttribute('aria-label',`Explore ${project.name} project details`);
    const ordinal = projects.indexOf(project) + 1;
    counter.textContent = `${String(ordinal).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    announcement.textContent = `${project.name}. Project ${ordinal} of ${projects.length}.`;
  }

  function updateControls() {
    const enabled = enabledProjects(), selected = enabled.findIndex(p => p.card.id === activeId);
    previous.disabled = dragging || !!pendingId || enabled.length<2;
    next.disabled = dragging || !!pendingId || enabled.length<2;
    previous.setAttribute('aria-label', enabled.length>1 ? `Previous project: ${enabled[wrap(selected-1,enabled.length)].name}` : 'Previous project');
    next.setAttribute('aria-label', enabled.length>1 ? `Next project: ${enabled[wrap(selected+1,enabled.length)].name}` : 'Next project');
    root.dataset.galleryActive = activeId;
    root.dataset.galleryBusy = String(dragging || !!pendingId);
    root.dataset.galleryDragging = String(dragging);
    root.dataset.galleryReducedMotion = String(reduce());
    information.setAttribute('aria-busy', String(dragging || !!pendingId));
  }

  let focusActive=false;
  function draw() {
    if (!inView || document.hidden || focusActive || root.dataset.projectView === 'index') return;
    camera.lookAt(lookAt);
    camera.updateMatrixWorld(true);
    const enabled=enabledProjects(),count=enabled.length;
    // One shared ease for the entire procession: no separate card acceleration.
    const cycle=Math.floor(travel.progress),fraction=travel.progress-cycle;
    const visualProgress=cycle+fraction*fraction*(3-2*fraction);
    projects.forEach(project=>{
      const index=enabled.indexOf(project);project.mesh.visible=index>=0;if(index<0||!stackSlots.length)return;
      const rank=wrap(index-visualProgress,count);
      const recycling=count>1&&rank>count-1;
      // Continuous depth occlusion lets the returning card slip behind the stack
      // without changing render order abruptly at the final frame.
      project.panel.material.depthTest=true;project.panel.material.depthWrite=true;
      project.edge.material.depthTest=true;project.edge.material.depthWrite=true;
      project.shadow.material.depthTest=true;
      project.shadow.renderOrder=0;project.edge.renderOrder=0;project.panel.renderOrder=0;
      let opacity=1;
      if(recycling){
        // Travel below and around the visible edge of the stack rather than
        // vanishing behind its second board. Perspective and scale shrink together.
        const t=count-rank,front=stackSlots[0],rear=stackSlots[count-1];
        if(recycleRoute){
          recycleRoute.getPoint(t,recyclePoint);
          const depth=recyclePoint.z,tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
          project.mesh.position.set(recyclePoint.x*depth*tanY*camera.aspect,recyclePoint.y*depth*tanY,-depth).applyQuaternion(camera.quaternion).add(camera.position);
        }else project.mesh.position.lerpVectors(front.position,rear.position,t);
        const retreat=clamp((t-.12)/.88,0,1);
        const scaleBlend=retreat*retreat*(3-2*retreat);
        const scale=front.scale.x*Math.pow(rear.scale.x/front.scale.x,scaleBlend);
        project.mesh.scale.setScalar(scale);
        if(recycleRoute){
          const depth=recyclePoint.z,tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
          const marginX=Math.min(.96,3.3*scale/(depth*tanY*camera.aspect)+.035);
          const marginY=Math.min(.96,1.9*scale/(depth*tanY)+.035);
          const x=clamp(recyclePoint.x,-1+marginX,1-marginX),y=clamp(recyclePoint.y,-1+marginY,1-marginY);
          project.mesh.position.set(x*depth*tanY*camera.aspect,y*depth*tanY,-depth).applyQuaternion(camera.quaternion).add(camera.position);
        }
        project.mesh.quaternion.slerpQuaternions(front.rotation,rear.rotation,t);
        const fade=clamp((t-.3)/.6,0,1);
        // Fade only during travel; smoothly restore the printed card before docking.
        const dock=clamp((t-.72)/.28,0,1);
        opacity=1-.55*fade*fade*(3-2*fade)*(1-dock*dock*(3-2*dock));
      }else{
        const lower=Math.floor(rank),upper=Math.min(lower+1,count-1),mix=rank-lower;
        const from=stackSlots[lower],to=stackSlots[upper];
        project.mesh.position.lerpVectors(from.position,to.position,mix);
        project.mesh.scale.lerpVectors(from.scale,to.scale,mix);
        project.mesh.quaternion.slerpQuaternions(from.rotation,to.rotation,mix);

      }
      project.mesh.updateMatrixWorld(true);
      project.panel.material.opacity=opacity;project.edge.material.opacity=opacity**2;project.shadow.material.opacity=.82*opacity**2;
    });
    renderer.render(scene, camera);
    root.dataset.galleryRenders = String(++renderCount);
    root.dataset.galleryProgress = String(travel.progress);
    root.dataset.galleryCamera = JSON.stringify({ position: camera.position.toArray(), lookAt: lookAt.toArray() });
    const width=stage.clientWidth,height=stage.clientHeight;
    stage.dataset.composition = JSON.stringify(projects.filter(p => !p.card.hidden).map(project => {
      const corners=[];
      for(const x of [-3.2,3.2])for(const y of [-1.8,1.8]){
        const point=project.mesh.localToWorld(new THREE.Vector3(x,y,0)).project(camera);
        corners.push([(point.x*.5+.5)*width,(-point.y*.5+.5)*height]);
      }
      return {id:project.card.id,position:project.mesh.position.toArray(),corners};
    }));
  }

  function finishAt(project, target) {
    camera.position.copy(target.cameraPosition);
    lookAt.copy(target.lookAt);
    activeId = project.card.id;
    travel.progress = Math.max(0, enabledProjects().indexOf(project));
    pendingId = null;
    gsap.set(information, { clearProps: 'opacity,transform' });
    updateInformation(project); updateControls(); draw();
  }

  // Responsive spatial slots are recycled in a continuous circular procession.
  function renderComposition() {
    const width=stage.clientWidth,height=stage.clientHeight;
    if(!width||!height)return;
    const wantedId=pendingId||activeId;
    releaseGesture();
    timeline?.kill();timeline=null;
    gsap.killTweensOf(projects.map(p=>p.panel.scale));
    projects.forEach(p=>p.panel.scale.setScalar(1));
    const portrait=width<620;
    targetMode=portrait?'mobile':width<900?'tablet':'desktop';
    const visible=projects.filter(p=>!p.card.hidden);
    projects.forEach(p=>p.mesh.visible=!p.card.hidden);
    camera.aspect=width/height;
    camera.fov=portrait?34:targetMode==='tablet'?36:40;
    const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanX=tanY*camera.aspect;
    camera.position.set(0,0,20);lookAt.set(0,0,0);
    camera.updateProjectionMatrix();camera.lookAt(lookAt);camera.updateMatrixWorld(true);
    const composition=portrait
      ? [[.49,.70,.92],[.515,.64,.88],[.54,.58,.84],[.565,.52,.80],[.59,.46,.76],[.615,.40,.72]]
      : [[.355,.63,.64],[.410,.56,.605],[.465,.49,.57],[.520,.42,.535],[.575,.35,.50],[.630,.28,.465]];
    visible.forEach((project,i)=>{
      const [slotX,slotY,relativeWidth]=composition[i];
      const cx=composition[0][0]+(slotX-composition[0][0])*1.2;
      const cy=composition[0][1]+(slotY-composition[0][1])*.95;
      const z=6-i*3.6,depth=20-z;
      const scale=relativeWidth*2*depth*tanX/(6.4*Math.cos(.22));
      project.mesh.scale.setScalar(scale);
      project.mesh.position.set((cx*2-1)*depth*tanX,(1-cy*2)*depth*tanY,z);
      project.mesh.rotation.set(.015,portrait?-.16:-.22,-.025);
      project.mesh.updateMatrixWorld(true);
    });
    stackSlots=visible.map(project=>({position:project.mesh.position.clone(),scale:project.mesh.scale.clone(),rotation:project.mesh.quaternion.clone()}));
    cameraTargets.clear();
    visible.forEach(project=>{
      if(!navigationIds.has(project.card.id))return;
      // Frame each selected plane through the lens, leaving the original six
      // transforms intact. The slight leftward viewpoint reveals the diagonal
      // procession behind it while keeping the selected image near the centre.
      const preferredWidth=portrait ? .92 : targetMode==='tablet' ? .76 : .76;
      const widthDistance=6.4*project.mesh.scale.x/(2*tanX*preferredWidth);
      const heightDistance=3.6*project.mesh.scale.y/(2*tanY*.80);
      const preferredDistance=Math.max(widthDistance,heightDistance);
      const framing=project.mesh.position.clone();
      framing.y+=preferredDistance*tanY*(portrait ? .28 : .08);
      const offset=new THREE.Vector3(-preferredDistance*.22,preferredDistance*.02,preferredDistance);
      cameraTargets.set(project.card.id,{projectId:project.card.id,projectPosition:project.mesh.position.clone(),cameraPosition:framing.clone().add(offset),lookAt:framing,preferredDistance});
    });
    const frontTarget=cameraTargets.get(visible[0]?.card.id);
    if(frontTarget)for(const [id,target] of cameraTargets)cameraTargets.set(id,{...target,cameraPosition:frontTarget.cameraPosition.clone(),lookAt:frontTarget.lookAt.clone()});
    recycleRoute=null;
    if(frontTarget&&visible.length>1){
      camera.position.copy(frontTarget.cameraPosition);camera.lookAt(frontTarget.lookAt);camera.updateMatrixWorld(true);
      const front=stackSlots[0],rear=stackSlots[stackSlots.length-1];
      const first=front.position.clone().project(camera),last=rear.position.clone().project(camera);
      const nearDepth=-front.position.clone().applyMatrix4(camera.matrixWorldInverse).z;
      const farDepth=-rear.position.clone().applyMatrix4(camera.matrixWorldInverse).z;
      recycleRoute=new THREE.CatmullRomCurve3([
        new THREE.Vector3(first.x,first.y,nearDepth),
        new THREE.Vector3(first.x+.015,first.y-.045,nearDepth*.9),
        new THREE.Vector3(.30,-.36,nearDepth*1.25),
        new THREE.Vector3(.73,-.18,nearDepth+(farDepth-nearDepth)*.56),
        new THREE.Vector3(.85,.36,nearDepth+(farDepth-nearDepth)*.86),
        new THREE.Vector3(last.x,last.y,farDepth)
      ],false,'catmullrom',.35);
    }
    const featured=visible.find(p=>p.card.id===wantedId)||visible[0];
    if(!featured)return;
    const target=cameraTargets.get(featured.card.id)||{cameraPosition:new THREE.Vector3(0,0,20),lookAt:new THREE.Vector3(0,0,0)};
    renderer.setSize(width,height,false);
    pendingId=null;finishAt(featured,target);
    root.dataset.galleryPanels=String(visible.length);
    root.dataset.galleryViewport=targetMode;
    root.dataset.galleryTargets=JSON.stringify([...cameraTargets.values()].map(t=>({projectId:t.projectId,projectPosition:t.projectPosition.toArray(),cameraPosition:t.cameraPosition.toArray(),lookAt:t.lookAt.toArray(),preferredDistance:t.preferredDistance})));
  }

  // One continuous progress value drives buttons, keyboard and direct gestures.
  // The same progress recycles dimensional cards through the exhibition slots.
  function applyProgress() {
    const enabled=enabledProjects();
    if(!enabled.length)return;
    const wrapped=wrap(travel.progress,enabled.length);
    const lower=Math.floor(wrapped),upper=wrap(lower+1,enabled.length);
    const from=cameraTargets.get(enabled[lower].card.id),to=cameraTargets.get(enabled[upper].card.id);
    if(!from||!to)return;
    const mix=wrapped-lower;
    camera.position.lerpVectors(from.cameraPosition,to.cameraPosition,mix);
    lookAt.lerpVectors(from.lookAt,to.lookAt,mix);
    draw();
  }

  function navigateTo(projectId, fromDrag=false) {
    if(focusActive||dragging||(!fromDrag&&pendingId)||!navigationIds.has(projectId))return;
    const project=projects.find(p=>p.card.id===projectId&&!p.card.hidden),target=cameraTargets.get(projectId);
    if(!project||!target)return;
    const count=enabledProjects().length,index=enabledProjects().indexOf(project);
    const candidates=[index-count,index,index+count];
    const destination=candidates.reduce((best,value)=>Math.abs(value-travel.progress)<Math.abs(best-travel.progress)?value:best,candidates[0]);
    if(!fromDrag&&projectId===activeId&&Math.abs(travel.progress-destination)<.001)return;
    timeline?.kill();gsap.killTweensOf(information);
    gsap.killTweensOf(projects.map(p=>p.panel.scale));projects.forEach(p=>p.panel.scale.setScalar(1));
    renderer.domElement.style.cursor='';
    if(reduce()){finishAt(project,target);return;}
    pendingId=projectId;updateControls();
    const initiator=document.activeElement;
    const distance=Math.abs(destination-travel.progress);
    const duration=fromDrag ? clamp(.65+distance*.85,.65,1.5) : targetMode==='mobile'?2.1:2.4;
    timeline=gsap.timeline({
      onComplete:()=>{
        timeline=null;finishAt(project,target);
        gsap.fromTo(information,{opacity:.6},{opacity:1,duration:.3,ease:'gallery.info',clearProps:'opacity'});
        if(document.activeElement===document.body&&(initiator===next||initiator===previous))(!previous.disabled?previous:next).focus({preventScroll:true});
      }
    });
    timeline.to(travel,{progress:destination,duration,ease:fromDrag?'power3.out':'none',onUpdate:applyProgress},0);
    // Keep the last settled project accessible throughout partial exploration.
    timeline.to(information,{opacity:.6,duration:.2,ease:'gallery.info'},0);
    if(!inView||document.hidden)timeline.pause();
  }

  function step(direction){const enabled=enabledProjects(),i=enabled.findIndex(p=>p.card.id===activeId);if(i>=0&&enabled.length>1)navigateTo(enabled[wrap(i+direction,enabled.length)].card.id)}
  previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  figure.addEventListener('keydown',event=>{
    if(dragging||event.target.closest('a')||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='ArrowRight'){event.preventDefault();step(1)}
    if(event.key==='ArrowLeft'){event.preventDefault();step(-1)}
    if((event.key==='Enter'||event.key===' ')&&event.target===stage&&!pendingId&&!dragging){event.preventDefault();const project=currentProject();if(project)void focusView.open(project,stage);}
  });

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let hovered=null;
  function hitActive(event){
    if(pendingId||dragging)return null;
    const bounds=renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX-bounds.left)/bounds.width)*2-1,-((event.clientY-bounds.top)/bounds.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(projects.filter(p=>!p.card.hidden&&p.mesh.visible).map(p=>p.panel),false)[0];
    return hit&&currentProject()?.panel===hit.object?currentProject():null;
  }
  function hover(project){
    if(hovered===project)return;
    const old=hovered;hovered=project;
    for(const [item,scale]of[[old,1],[project,1.008]]){
      if(!item)continue;gsap.killTweensOf(item.panel.scale);
      if(reduce()){item.panel.scale.setScalar(scale);draw()}
      else gsap.to(item.panel.scale,{x:scale,y:scale,z:scale,duration:.2,ease:'gallery.info',onUpdate:draw});
    }
    renderer.domElement.style.cursor=dragging?'grabbing':'grab';
  }
  function releaseGesture() {
    const pointerId=gesture?.id;
    gesture=null;dragging=false;
    renderer.domElement.style.cursor='';
    if(pointerId!==undefined&&renderer.domElement.hasPointerCapture(pointerId))renderer.domElement.releasePointerCapture(pointerId);
  }
  function onPointerDown(event) {
    if(focusActive||!event.isPrimary||event.button!==0||gesture||enabledProjects().length<2)return;
    suppressClickUntil=0;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,lastTime:event.timeStamp,velocity:0,axis:null,startProgress:travel.progress,origin:Math.round(travel.progress)};
    // Capture before a fast move can leave the canvas. Touch-action still lets
    // the browser cancel this pointer for ordinary vertical scrolling.
    renderer.domElement.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event) {
    if(!gesture||gesture.id!==event.pointerId){if(!gesture&&event.pointerType!=='touch')hover(hitActive(event));return;}
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.axis){
      if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
      const vertical=Math.abs(dy)>Math.abs(dx)*1.15;
      if(vertical&&event.pointerType!=='mouse'){releaseGesture();suppressClickUntil=event.timeStamp+600;return;}
      if(!vertical&&Math.abs(dx)<Math.abs(dy)*1.3)return;
      gesture.axis=vertical?'vertical':'horizontal';
      timeline?.kill();timeline=null;gsap.killTweensOf(information);
      hover(null);gsap.killTweensOf(projects.map(p=>p.panel.scale));projects.forEach(p=>p.panel.scale.setScalar(1));
      gesture.startProgress=travel.progress;gesture.origin=Math.round(travel.progress);
      pendingId=null;dragging=true;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor='grabbing';updateControls();
    }
    event.preventDefault();
    const vertical=gesture.axis==='vertical';
    const span=Math.max(180,Math.min(560,(vertical?stage.clientHeight:stage.clientWidth)*.55));
    const elapsed=event.timeStamp-gesture.lastTime;
    if(elapsed>0){
      const sample=clamp((vertical?event.clientY-gesture.lastY:gesture.lastX-event.clientX)/elapsed/span,-.004,.004);
      gesture.velocity=gesture.velocity*.35+sample*.65;
    }
    gesture.lastX=event.clientX;gesture.lastY=event.clientY;gesture.lastTime=event.timeStamp;
    const displacement=vertical?event.clientY-gesture.y:gesture.x-event.clientX;
    travel.progress=clamp(gesture.startProgress+displacement/span,gesture.origin-1,gesture.origin+1);
    if(!reduce())applyProgress();
    root.dataset.galleryProgress=String(travel.progress);
  }
  function endGesture(event, cancelled=false) {
    if(!gesture||gesture.id!==event.pointerId)return;
    // Include a final coalesced movement that may arrive only on pointerup.
    if(!cancelled&&(event.clientX!==gesture.lastX||event.clientY!==gesture.lastY))onPointerMove(event);
    if(!gesture)return;
    const wasDragging=dragging;
    const velocity=event.timeStamp-gesture.lastTime<100?gesture.velocity:0;
    // At most one neighbouring stop, with at most 18% of a stop of momentum.
    const momentum=cancelled?0:clamp(velocity*120,-.18,.18);
    const destination=clamp(Math.round(travel.progress+momentum),gesture.origin-1,gesture.origin+1);
    const project=enabledProjects()[wrap(destination,enabledProjects().length)];
    releaseGesture();
    if(!wasDragging)return;
    suppressClickUntil=event.timeStamp+600;
    navigateTo(project.card.id,true);
  }
  let applyingRoute=false,lastRoute='',routeRevision=0;
  const focusView=createProjectFocus({
    root,gallery:figure,index,getProjects:enabledProjects,
    onProjectChange(project){if(applyingRoute)return;const hash=project?'#'+project.card.id:'#work';if(location.hash!==hash)history.pushState(null,'',hash);lastRoute=location.href;},
    selectProject(project){const target=cameraTargets.get(project.card.id);if(target)finishAt(project,target);},
    onState(open){modeBar.hidden=open;directory.hidden=true;if(!open)index.hidden=true;focusActive=open;root.dataset.galleryFocus=String(open);if(open){hover(null);releaseGesture();timeline?.pause();gsap.killTweensOf(information);gsap.killTweensOf(projects.map(p=>p.panel.scale));projects.forEach(p=>p.panel.scale.setScalar(1));}else {setView(root.dataset.projectView||'gallery');draw();}},isReduced:reduce
  });
  const inlineVideo=createGalleryVideo({root,stage,currentProject,maximize:(project,trigger,player)=>focusView.open(project,trigger,player)});
  // The original articles remain the single source for focus-mode case studies.
  // A separate, lightweight directory selects camera stops without opening details.
  const modeBar=document.createElement('div');modeBar.className='project-view-toggle';modeBar.setAttribute('role','group');modeBar.setAttribute('aria-label','Project presentation');
  modeBar.innerHTML='<button type="button" data-project-view="gallery" aria-pressed="true" aria-controls="project-gallery-view">Gallery</button><span aria-hidden="true">/</span><button type="button" data-project-view="index" aria-pressed="false" aria-controls="project-directory-view">Index</button>';
  figure.id='project-gallery-view';
  const directory=document.createElement('nav');directory.id='project-directory-view';directory.className='project-directory';directory.setAttribute('aria-label','Project index');directory.hidden=true;
  const viewButtons=[...modeBar.querySelectorAll('button')];
  cards.forEach((card,position)=>{
    const button=document.createElement('button');button.type='button';button.className='project-directory-row';button.dataset.projectId=card.id;
    const number=document.createElement('span');number.className='project-directory-number';number.textContent=String(position+1).padStart(2,'0');
    const title=document.createElement('span');title.className='project-directory-title';title.textContent=projects[position].name;
    const category=document.createElement('span');category.className='project-directory-category';category.textContent=card.dataset.serviceCategory;
    const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('viewBox','0 0 24 24');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<path d="M5 19 19 5M5 5h14v14" fill="none" stroke="currentColor" stroke-width="1.4"/>';
    button.append(number,title,category,arrow);directory.append(button);
    button.addEventListener('click',()=>{inlineVideo.release();timeline?.kill();timeline=null;pendingId=null;releaseGesture();void focusView.open(projects[position],button);});
  });
  figure.before(modeBar);figure.after(directory);
  function setView(mode){
    if(graphicsUnavailable){figure.hidden=true;directory.hidden=true;modeBar.hidden=true;index.hidden=false;return;}
    inlineVideo.release();hover(null);releaseGesture();
    root.dataset.projectView=mode;figure.hidden=mode!=='gallery';directory.hidden=mode!=='index';index.hidden=true;
    cards.forEach(card=>{card.classList.remove('is-case-study');const details=card.querySelector('details');if(details)details.open=false;});
    viewButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.projectView===mode)));
    if(mode==='index')timeline?.pause();else {timeline?.resume();renderComposition();draw();}
    if(!reduce()){const target=mode==='index'?directory:figure;target.getAnimations().forEach(animation=>animation.cancel());target.animate([{opacity:.6},{opacity:1}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'});}
  }
  viewButtons.forEach(button=>button.addEventListener('click',()=>setView(button.dataset.projectView)));
  const directoryFilter=new MutationObserver(()=>{cards.forEach(card=>{const row=directory.querySelector('[data-project-id="'+card.id+'"]');if(row)row.hidden=card.hidden;});});
  directoryFilter.observe(index,{subtree:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',()=>directoryFilter.disconnect(),{once:true});
  root.dataset.projectView='gallery';index.hidden=true;
  async function syncProjectRoute(){if(graphicsUnavailable||lastRoute===location.href)return;lastRoute=location.href;const revision=++routeRevision;applyingRoute=true;try{const project=projects.find(project=>'#'+project.card.id===location.hash);if(project){inlineVideo.release();timeline?.kill();timeline=null;pendingId=null;await focusView.open(project,stage);}else if(focusView.isOpen())await focusView.close({restoreFocus:false,restoreScroll:false});}finally{if(revision===routeRevision)applyingRoute=false;}}
  window.addEventListener('hashchange',syncProjectRoute);window.addEventListener('popstate',syncProjectRoute);

  information.querySelector('a').addEventListener('click',event=>{event.preventDefault();const project=currentProject();if(project&&!pendingId&&!dragging)void focusView.open(project,information.querySelector('a'));});
  function listen(type,handler,options){renderer.domElement.addEventListener(type,handler,options);pointerListeners.push([type,handler,options]);}
  let wheelAmount=0,lastWheel=0,wheelDirection=0;
  listen('wheel',event=>{
    if(event.ctrlKey||focusActive||enabledProjects().length<2)return;
    event.preventDefault();
    if(dragging)return;
    const delta=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1);
    if(!delta)return;
    const direction=Math.sign(delta),reversing=wheelDirection&&direction!==wheelDirection;
    if(pendingId&&!reversing)return;
    if(event.timeStamp-lastWheel<180&&!reversing)return;
    if(Math.sign(delta)!==Math.sign(wheelAmount))wheelAmount=0;
    wheelAmount+=delta;if(Math.abs(wheelAmount)<55)return;
    const enabled=enabledProjects();
    const destination=direction>0?Math.floor(travel.progress+.001)+1:Math.ceil(travel.progress-.001)-1;
    wheelAmount=0;lastWheel=event.timeStamp;wheelDirection=direction;
    timeline?.kill();timeline=null;pendingId=null;
    inlineVideo.release();navigateTo(enabled[wrap(destination,enabled.length)].card.id,true);
  },{passive:false});
  listen('pointerdown',onPointerDown);
  listen('pointermove',onPointerMove,{passive:false});
  listen('pointerup',event=>endGesture(event));
  listen('pointercancel',event=>endGesture(event,true));
  listen('lostpointercapture',event=>endGesture(event,true));
  listen('pointerleave',()=>{if(!dragging){gesture=null;hover(null)}});
  listen('dragstart',event=>event.preventDefault());
  listen('click',event=>{
    if(event.timeStamp<suppressClickUntil){event.preventDefault();return;}
    const project=hitActive(event);if(project)void focusView.open(project,stage);
  });
  function onMotionChange(){if(reduce()&&dragging){const project=enabledProjects()[wrap(Math.round(travel.progress),enabledProjects().length)];releaseGesture();finishAt(project,cameraTargets.get(project.card.id));}if(reduce()&&pendingId){const project=projects.find(p=>p.card.id===pendingId),target=cameraTargets.get(pendingId);timeline?.kill();timeline=null;finishAt(project,target)}}
  reducedMotion.addEventListener('change',onMotionChange);
  const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView&&!document.hidden){timeline?.resume();draw()}else timeline?.pause()},{threshold:.01});
  visibility.observe(figure);
  function onVisibility(){if(document.hidden)timeline?.pause();else if(inView){timeline?.resume();draw()}}
  document.addEventListener('visibilitychange',onVisibility);
  root.dataset.galleryState = 'ready';
  root.classList.add('spatial-gallery-ready');
  renderComposition();
  void syncProjectRoute();
  const resize = new ResizeObserver(renderComposition);
  resize.observe(stage);
  const filter = new MutationObserver(records=>{if(!records.some(record=>cards.includes(record.target)))return;void focusView.close({immediate:true,restoreFocus:false,restoreScroll:false});renderComposition();});
  filter.observe(index, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();timeline?.kill();inlineVideo.release();releaseGesture();void focusView.close({immediate:true,restoreFocus:false,restoreScroll:false});restoreHtmlIndex();
  });
  window.addEventListener('pagehide', () => {
    inlineVideo.dispose();focusView.dispose();releaseGesture();pointerListeners.forEach(([type,handler,options])=>renderer.domElement.removeEventListener(type,handler,options));
    timeline?.kill();gsap.killTweensOf(information);gsap.killTweensOf(projects.map(p=>p.panel.scale));visibility.disconnect();reducedMotion.removeEventListener('change',onMotionChange);document.removeEventListener('visibilitychange',onVisibility);
    resize.disconnect(); filter.disconnect(); geometry.dispose(); edgeGeometry.dispose(); shadowGeometry.dispose();
    window.removeEventListener('hashchange',syncProjectRoute);window.removeEventListener('popstate',syncProjectRoute);
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
  }, { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createWorkGallery, { once: true });
else createWorkGallery();



