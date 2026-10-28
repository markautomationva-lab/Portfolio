// @ts-check
import { architectureMetadata } from './architecture-metadata.js?v=e18c9f47c6d4';
/** @typedef {{id:string,label:string,description:string,position?:{x:number,y:number}}} Component */
/** @typedef {{description:string,nodes:Component[],edges:string[][]}} Diagram */
/** @typedef {{layers:string[][],ranks:Map<string,number>,feedback:Set<string>,order:string[]}} Layout */
/** @type {Map<string,Layout>} */const layoutCache=new Map();
/** Layer a graph without treating return edges as new processing stages.
 * @param {Diagram} diagram */
export function planArchitecture(diagram){
 const signature=JSON.stringify([diagram.nodes.map(n=>n.id),diagram.edges]);const cached=layoutCache.get(signature);if(cached)return cached;
 const ids=new Set(diagram.nodes.map(n=>n.id)),visited=new Set(),visiting=new Set(),feedback=new Set();
 /** @param {string} id */function walk(id){visited.add(id);visiting.add(id);for(const [a,b] of diagram.edges){if(a!==id||!ids.has(b))continue;if(visiting.has(b))feedback.add(a+':'+b);else if(!visited.has(b))walk(b);}visiting.delete(id);}
 diagram.nodes.forEach(n=>{if(!visited.has(n.id))walk(n.id);});
 const forward=diagram.edges.filter(([a,b])=>ids.has(a)&&ids.has(b)&&!feedback.has(a+':'+b));const ranks=new Map(diagram.nodes.map(n=>[n.id,0]));
 for(let pass=0;pass<diagram.nodes.length;pass++)for(const [a,b] of forward)ranks.set(b,Math.max(ranks.get(b)||0,(ranks.get(a)||0)+1));
 /** @type {string[][]} */const layers=[];for(const node of diagram.nodes){const rank=ranks.get(node.id)||0;(layers[rank]||=[]).push(node.id);}
 // Stable barycentric ordering keeps related branches near their parent.
 /** @param {string} id */function parentOrder(id){const values=forward.filter(edge=>edge[1]===id).map(edge=>layers[ranks.get(edge[0])||0]?.indexOf(edge[0])||0);return values.reduce((sum,value)=>sum+value,0)/(values.length||1);}
 for(let rank=1;rank<layers.length;rank++)layers[rank]?.sort((a,b)=>parentOrder(a)-parentOrder(b));
 const plan={layers,ranks,feedback,order:layers.flat()};layoutCache.set(signature,plan);return plan;
}
/** @type {Record<string,string>} */
const icons={input:'M4 12h13m-5-5 5 5-5 5M4 5v14',ai:'m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z',automation:'M5 5h5v5H5zM14 14h5v5h-5zM10 7h7v7M7 10v7h7',database:'M4 6c0-4 16-4 16 0v12c0 4-16 4-16 0ZM4 6c0 4 16 4 16 0M4 12c0 4 16 4 16 0',api:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',communication:'M3 4h18v13H9l-6 4ZM7 8h10M7 12h7',approval:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM7 12l3 3 7-7',output:'M4 3h12l4 4v14H4ZM8 12l3 3 6-6',external:'M14 3h7v7m0-7L10 14M10 5H3v16h16v-7'};
/** @type {Record<string,string>} */
const categoryNames={input:'Input / trigger',ai:'AI processing',automation:'Automation',database:'Database',api:'API integration',communication:'Communication',approval:'Human approval',output:'Output',external:'External service'};
/** @param {HTMLElement} host @param {Diagram} diagram @param {string} projectId @param {()=>boolean} reduced */
export function mountArchitectureExplorer(host,diagram,projectId,reduced){
 const meta=architectureMetadata[projectId.replace(/^project-/,'')]||{nodes:{},labels:{}};const plan=planArchitecture(diagram);
 const controller=new AbortController(),{signal}=controller;const mobile=matchMedia('(max-width:600px)'),motion=matchMedia('(prefers-reduced-motion:reduce)');
 const section=document.createElement('section');section.className='architecture-explorer';section.setAttribute('aria-label','Interactive system architecture');
 section.innerHTML='<p class="ax-intro"></p><div class="ax-toolbar"><span>Select a component to inspect its role and data flow.</span><div class="ax-view-controls"><button type="button" class="ax-pan-left" aria-label="Pan diagram left">←</button><button type="button" class="ax-pan-right" aria-label="Pan diagram right">→</button><button type="button" class="ax-reset">Reset View</button></div></div><div class="ax-scroll" tabindex="0" role="group" aria-label="System architecture diagram"><div class="ax-canvas"></div></div><div class="ax-panel-home"></div><div class="ax-transfers"><p class="ax-transfer-heading">Connection reference</p><ol></ol></div>';
 const intro=/** @type {HTMLElement} */(section.querySelector('.ax-intro'));intro.textContent=diagram.description;
 const scroll=/** @type {HTMLElement} */(section.querySelector('.ax-scroll')),canvas=/** @type {HTMLElement} */(section.querySelector('.ax-canvas')),panelHome=/** @type {HTMLElement} */(section.querySelector('.ax-panel-home'));
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('ax-connections');svg.setAttribute('aria-hidden','true');canvas.append(svg);
 const detail=document.createElement('aside');detail.className='ax-detail';detail.id='ax-component-details';detail.setAttribute('aria-label','Selected component details');detail.setAttribute('aria-live','polite');detail.hidden=true;
 const svgNS='http://www.w3.org/2000/svg';
 /** @type {string|null} */let selected=null;
 /** @type {string|null} */let hovered=null;
 /** @type {Animation|null} */let entrance=null;
 let inView=false,disposed=false;
 /** @type {Map<string,HTMLElement>} */const wrappers=new Map();
 /** @type {Map<string,HTMLButtonElement>} */const buttons=new Map();
 for(const id of plan.order){const node=diagram.nodes.find(n=>n.id===id);if(!node)continue;const [category='external',role='System component',technology='']=meta.nodes[id]||[];
  const wrapper=document.createElement('div');wrapper.className='ax-component';wrapper.dataset.node=id;
  const button=document.createElement('button');button.type='button';button.className='ax-node';button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','ax-component-details');button.setAttribute('aria-label',node.label+' — '+role);
  const icon=document.createElementNS(svgNS,'svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');const path=document.createElementNS(svgNS,'path');path.setAttribute('d',icons[category]||icons.external);icon.append(path);
  const top=document.createElement('span');top.className='ax-node-top';const type=document.createElement('span');type.textContent=categoryNames[category]||'Component';top.append(icon,type);
  const label=document.createElement('strong');label.textContent=node.label;const job=document.createElement('span');job.className='ax-node-role';job.textContent=role;
  const tech=document.createElement('span');tech.className='ax-node-tech';tech.textContent=technology;
  const indicator=document.createElement('span');indicator.className='ax-node-indicator';indicator.setAttribute('aria-hidden','true');button.append(top,label,job,tech,indicator);wrapper.append(button);canvas.append(wrapper);wrappers.set(id,wrapper);buttons.set(id,button);
  button.addEventListener('pointerenter',()=>{hovered=id;emphasise();},{signal});button.addEventListener('pointerleave',()=>{hovered=null;emphasise();},{signal});button.addEventListener('focus',()=>{hovered=id;emphasise();},{signal});button.addEventListener('blur',()=>{hovered=null;emphasise();},{signal});button.addEventListener('click',()=>choose(selected===id?null:id),{signal});
  button.addEventListener('keydown',event=>{const index=plan.order.indexOf(id);let target=index;if(event.key==='ArrowRight'||event.key==='ArrowDown')target=(index+1)%plan.order.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')target=(index+plan.order.length-1)%plan.order.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=plan.order.length-1;else if(event.key==='Escape'){choose(null);return;}else return;event.preventDefault();buttons.get(plan.order[target])?.focus();},{signal});
 }
 const transferList=/** @type {HTMLElement} */(section.querySelector('.ax-transfers ol'));diagram.edges.forEach(([a,b],i)=>{const from=diagram.nodes.find(n=>n.id===a),to=diagram.nodes.find(n=>n.id===b);if(!from||!to)return;const item=document.createElement('li');item.dataset.connection=a+':'+b;const number=document.createElement('span');number.className='ax-transfer-number';number.textContent=String(i+1).padStart(2,'0');const text=document.createElement('span');const strong=document.createElement('strong');strong.textContent=meta.labels[a+':'+b]||'Connected component';const route=document.createElement('small');route.textContent=from.label+' → '+to.label;text.append(strong,route);item.append(number,text);transferList.append(item);});
 /** @type {Map<string,SVGPathElement>} */const paths=new Map();
 function route(){if(disposed||!section.isConnected)return;const width=scroll.clientWidth;const layers=plan.layers.length,nodeWidth=Math.max(188,Math.min(224,(width-48-(layers-1)*72)/layers)),gap=72,rowGap=32,padding=50;
  panelHome.append(detail);
  if(mobile.matches){canvas.style.width='100%';canvas.style.height='auto';wrappers.forEach(wrapper=>{wrapper.style.left='';wrapper.style.top='';wrapper.style.width='';});}
  else {
   canvas.style.width=Math.max(width,layers*nodeWidth+(layers-1)*gap+48)+'px';
   wrappers.forEach(wrapper=>{wrapper.style.width=nodeWidth+'px';});
   // Measure real text-driven node sizes before placing columns. A single-row
   // diagram no longer inherits the height of a multi-branch diagram.
   const heights=new Map([...buttons].map(([id,button])=>[id,button.getBoundingClientRect().height]));
   const columnHeights=plan.layers.map(layer=>layer.reduce((sum,id)=>sum+(heights.get(id)||0),0)+Math.max(0,layer.length-1)*rowGap);
   const tallest=Math.max(0,...columnHeights);let bottom=padding;
   plan.layers.forEach((layer,column)=>{let y=padding+(tallest-columnHeights[column])/2;layer.forEach(id=>{const wrapper=wrappers.get(id),node=diagram.nodes.find(n=>n.id===id);if(!wrapper)return;const top=node?.position?.y??y;wrapper.style.left=(node?.position?.x??24+column*(nodeWidth+gap))+'px';wrapper.style.top=top+'px';bottom=Math.max(bottom,top+(heights.get(id)||0));y+= (heights.get(id)||0)+rowGap;});});
   canvas.style.height=bottom+padding+'px';
  }
  const bounds=canvas.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);svg.replaceChildren();paths.clear();
  const defs=document.createElementNS(svgNS,'defs');for(const [id,color] of [['muted','#ad9f8b'],['active','#115578']]){const marker=document.createElementNS(svgNS,'marker');marker.id='ax-arrow-'+id;marker.setAttribute('viewBox','0 0 8 8');marker.setAttribute('refX','7');marker.setAttribute('refY','4');marker.setAttribute('markerWidth','6');marker.setAttribute('markerHeight','6');marker.setAttribute('orient','auto');const tip=document.createElementNS(svgNS,'path');tip.setAttribute('d','M1 1 7 4 1 7');tip.setAttribute('fill','none');tip.setAttribute('stroke',color);tip.setAttribute('stroke-width','1.3');marker.append(tip);defs.append(marker);}svg.append(defs);
  diagram.edges.forEach(([a,b],index)=>{const from=buttons.get(a),to=buttons.get(b);if(!from||!to)return;const ar=from.getBoundingClientRect(),br=to.getBoundingClientRect();let d;const feedback=plan.feedback.has(a+':'+b),span=(plan.ranks.get(b)||0)-(plan.ranks.get(a)||0);
   if(mobile.matches){const ai=plan.order.indexOf(a),bi=plan.order.indexOf(b);if(bi===ai+1){const x=ar.left+ar.width/2-bounds.left;d=`M${x} ${ar.bottom-bounds.top} V${br.top-bounds.top-3}`;}else{const lane=feedback?16:bounds.width-16;const y1=ar.top+ar.height/2-bounds.top,y2=br.top+br.height/2-bounds.top;const x1=feedback?ar.left-bounds.left:ar.right-bounds.left,x2=feedback?br.left-bounds.left:br.right-bounds.left;d=`M${x1} ${y1} H${lane} V${y2} H${x2+(feedback?-3:3)}`;}}
   else {const x1=ar.right-bounds.left,y1=ar.top+ar.height/2-bounds.top,x2=br.left-bounds.left-3,y2=br.top+br.height/2-bounds.top;if(!feedback&&span===1){const mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`;}else {const lane=feedback?bounds.height-16-index*6:18+index*6;const side=feedback?-1:1;const start=feedback?ar.left-bounds.left:x1,end=feedback?br.right-bounds.left+3:x2;d=`M${start} ${y1} H${start+side*20} V${lane} H${end-side*20} V${y2} H${end}`;}}
   const path=document.createElementNS(svgNS,'path');path.classList.add('ax-path');path.setAttribute('d',d);path.dataset.connection=a+':'+b;path.setAttribute('marker-end','url(#ax-arrow-muted)');const title=document.createElementNS(svgNS,'title');title.textContent=meta.labels[a+':'+b]||from.textContent+' to '+to.textContent;path.append(title);svg.append(path);paths.set(a+':'+b,path);
  });section.classList.toggle('ax-can-pan',!mobile.matches&&Number.parseFloat(canvas.style.width)>width+1);emphasise();
 }
 function emphasise(){const active=selected||hovered;const related=new Set(active?[active]:[]);for(const [a,b] of diagram.edges)if(active===a||active===b){related.add(a);related.add(b);}
  buttons.forEach((button,id)=>{button.setAttribute('aria-pressed',String(id===selected));button.classList.toggle('is-unrelated',!!selected&&!related.has(id));button.classList.toggle('is-emphasised',id===active);});
  paths.forEach((path,key)=>{const connected=!!active&&key.split(':').includes(active);path.classList.toggle('is-active',connected);path.classList.toggle('is-muted',!!active&&!connected);path.setAttribute('marker-end',connected?'url(#ax-arrow-active)':'url(#ax-arrow-muted)');});
  section.querySelectorAll('.ax-transfers li').forEach(item=>{const key=/** @type {HTMLElement} */(item).dataset.connection||'';item.classList.toggle('is-active',!!active&&key.split(':').includes(active));});
  svg.querySelectorAll('.ax-signal').forEach(node=>node.remove());
  const canAnimate=inView&&!document.hidden&&!reduced()&&!motion.matches;
  svg.classList.toggle('is-flowing',canAnimate&&!active);
  if(canAnimate){const flowPaths=active?[...paths].filter(([key])=>key.split(':').includes(active)).slice(0,1):[...paths];flowPaths.forEach(([,path],index)=>{const dot=document.createElementNS(svgNS,'circle');dot.classList.add('ax-signal');dot.setAttribute('r',active?'3':'2.7');dot.setAttribute('aria-hidden','true');const animation=document.createElementNS(svgNS,'animateMotion');animation.setAttribute('dur',active?'2.8s':'4.8s');animation.setAttribute('begin',(-index*.65)+'s');animation.setAttribute('repeatCount','indefinite');animation.setAttribute('path',path.getAttribute('d')||'');animation.setAttribute('calcMode','paced');dot.append(animation);svg.append(dot);});}
 }
 /** @param {string|null} id */function choose(id){entrance?.cancel();selected=id;detail.replaceChildren();detail.hidden=!id;
  if(id){const node=diagram.nodes.find(n=>n.id===id);if(!node)return;const [category='external',role='System component',technology='']=meta.nodes[id]||[];const close=document.createElement('button');close.type='button';close.className='ax-close';close.textContent='Close details';close.addEventListener('click',()=>{choose(null);buttons.get(id)?.focus({preventScroll:true});},{signal});const eyebrow=document.createElement('p');eyebrow.className='ax-detail-eyebrow';eyebrow.textContent='Component '+String(diagram.nodes.indexOf(node)+1).padStart(2,'0')+' / '+(categoryNames[category]||'Component');const h=document.createElement('h3');h.textContent=node.label;const roleText=document.createElement('p');roleText.className='ax-role';roleText.textContent=role+(technology?' · '+technology:'');const explanation=document.createElement('p');explanation.textContent=node.description;detail.append(close,eyebrow,h,roleText,explanation);
   const fields=document.createElement('dl');const incoming=diagram.edges.filter(([a,b])=>b===id&&meta.labels[a+':'+b]).map(([a,b])=>meta.labels[a+':'+b]),outgoing=diagram.edges.filter(([a,b])=>a===id&&meta.labels[a+':'+b]).map(([a,b])=>meta.labels[a+':'+b]);const connected=[...new Set(diagram.edges.filter(edge=>edge.includes(id)).flat().filter(key=>key!==id))].map(key=>diagram.nodes.find(n=>n.id===key)?.label).filter(Boolean);
   const fieldsData=/** @type {[string,(string|undefined)[]][]} */([['Inputs',incoming],['Outputs',outgoing],['Connected systems',connected]]);for(const [name,values] of fieldsData){if(!values.length)continue;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=values.join(' / ');fields.append(dt,dd);}detail.append(fields);
   panelHome.append(detail);
   if(!reduced())entrance=detail.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'});
  }else panelHome.append(detail);route();
 }
 for(const [selector,direction] of [['.ax-pan-left',-1],['.ax-pan-right',1]]){/** @type {HTMLButtonElement} */(section.querySelector(String(selector))).addEventListener('click',()=>scroll.scrollBy({left:Number(direction)*scroll.clientWidth*.7,behavior:reduced()?'instant':'smooth'}),{signal});}
 /** @type {HTMLButtonElement} */(section.querySelector('.ax-reset')).addEventListener('click',()=>{hovered=null;choose(null);scroll.scrollTo({left:0,top:0,behavior:reduced()?'instant':'smooth'});},{signal});
 host.append(section);const resize=new ResizeObserver(route);resize.observe(scroll);buttons.forEach(button=>resize.observe(button));
 const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;emphasise();},{threshold:.05});visibility.observe(scroll);
 mobile.addEventListener('change',route,{signal});motion.addEventListener('change',emphasise,{signal});document.addEventListener('visibilitychange',emphasise,{signal});route();
 return()=>{disposed=true;entrance?.cancel();controller.abort();resize.disconnect();visibility.disconnect();svg.querySelectorAll('.ax-signal').forEach(node=>node.remove());section.remove();};
}
