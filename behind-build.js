// @ts-check
import { projectEngineering } from './project-engineering.js?v=e18c9f47c6d4';
import { mountArchitectureExplorer } from './architecture-explorer.js?v=e18c9f47c6d4';
/** @typedef {import('./project-engineering.js?v=e18c9f47c6d4').TechnicalEvidence} TechnicalEvidence */
/** Preserve all approved project images alongside the curated technical evidence.
 * @param {import('./project-engineering.js?v=e18c9f47c6d4').BehindTheBuild} source @param {TechnicalEvidence[]} assets */
export function includeProjectAssets(source,assets){
 const workflow=[...source.workflow],execution=[...source.execution];const seen=new Set([...workflow,...execution].flatMap(item=>[item.imageSrc,...(item.replaces||[])]));
 for(const item of assets){if(!item.imageSrc||seen.has(item.imageSrc))continue;seen.add(item.imageSrc);const technical=!/execution/i.test(item.title)&&/workflow|instructions|knowledge.ingestion|knowledge base|routing/i.test(item.title);(technical?workflow:execution).push(item);}
 return {...source,workflow,execution};
}
/** @param {HTMLElement} host @param {string} projectId @param {()=>boolean} reduced @param {()=>void} [nextProject] @param {TechnicalEvidence[]} [assets] */
export function mountBehindBuild(host,projectId,reduced,nextProject,assets=[]){
 const original=projectEngineering[projectId.replace(/^project-/,'')];
 if(!original)return{dispose(){}};
 const data=includeProjectAssets(original,assets);
 const controller=new AbortController(),{signal}=controller;
 const section=document.createElement('section');section.className='behind-build';section.setAttribute('aria-labelledby','behind-build-heading');
 section.innerHTML='<header class="bb-heading"><p class="eyebrow">Engineering / Behind the Build</p><h2 id="behind-build-heading">The systems behind the experience.</h2><p>Explore how the project was structured, how its components connect, and what happens when the system runs.</p></header><div class="bb-tabs" role="tablist" aria-label="Technical evidence"></div><div class="bb-content"></div><section class="bb-decisions"><p class="eyebrow">04 / Technical decisions</p><h2>Why it works this way.</h2><div class="bb-decision-list"></div></section><footer class="bb-next"></footer>';
 host.append(section);
 /** @template {Element} T @param {string} query @returns {T} */const find=query=>/** @type {T} */(section.querySelector(query));
 const content=find('.bb-content'),tablist=find('.bb-tabs');
 const tabs=['Architecture','Workflow','Execution'].map((name,i)=>{
  const button=document.createElement('button');button.type='button';button.role='tab';button.id='bb-tab-'+i;button.textContent=name;button.setAttribute('aria-controls','bb-panel');button.addEventListener('click',()=>select(i),{signal});tablist.append(button);return button;
 });
 const panel=document.createElement('div');panel.id='bb-panel';panel.role='tabpanel';panel.tabIndex=0;content.append(panel);
 let tab=0,revision=0;
 /** @type {Animation|null} */let transition=null;
 /** @type {(()=>void)|null} */let disposeView=null;
 const decisions=find('.bb-decision-list');
 for(const [title,explanation] of data.technicalDecisions){const article=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=explanation;article.append(h,p);decisions.append(article);}
 if(nextProject){const button=document.createElement('button');button.type='button';button.textContent='Next project';button.addEventListener('click',nextProject,{signal});find('.bb-next').append(button);}
 tablist.addEventListener('keydown',event=>{const key=/** @type {KeyboardEvent} */(event).key;let target=tab;if(key==='ArrowRight')target=(tab+1)%3;else if(key==='ArrowLeft')target=(tab+2)%3;else if(key==='Home')target=0;else if(key==='End')target=2;else return;event.preventDefault();tabs[target].focus();select(target);},{signal});
 /** @param {number} index @param {boolean} [initial] */async function select(index,initial=false){
  tab=index;const ticket=++revision;transition?.cancel();tabs.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});panel.setAttribute('aria-labelledby',tabs[index].id);panel.setAttribute('aria-busy','true');
  if(!initial&&!reduced()){transition=panel.animate([{opacity:1},{opacity:.25}],{duration:110,easing:'cubic-bezier(.33,0,.12,1)'});await transition.finished.catch(()=>{});}
  if(ticket!==revision)return;
  disposeView?.();panel.replaceChildren();
  disposeView=index===0?architecture():viewer(index===1?data.workflow:data.execution,index===2);
  panel.setAttribute('aria-busy','false');
  if(!initial&&!reduced()){transition=panel.animate([{opacity:.25},{opacity:1}],{duration:170,easing:'cubic-bezier(.23,1,.32,1)'});await transition.finished.catch(()=>{});}
 }
 function architecture(){return mountArchitectureExplorer(panel,data.architecture,projectId,reduced);}
 /** @param {TechnicalEvidence[]} evidence @param {boolean} execution */
 function viewer(evidence,execution){
  const items=evidence.filter(item=>item.imageSrc&&item.reviewed);
  if(execution){const summary=document.createElement('ol');summary.className='bb-run';const labels=['Trigger','Processing','Output','Verified'];data.run.forEach((text,i)=>{const li=document.createElement('li'),strong=document.createElement('strong'),p=document.createElement('p');strong.textContent=labels[i];p.textContent=text;li.append(strong,p);summary.append(li);});panel.append(summary);}
  if(!items.length){const empty=document.createElement('p');empty.className='bb-empty';empty.textContent='Technical walkthrough coming soon. No reviewed screenshots are available for this view.';panel.append(empty);return()=>{};}
  const events=new AbortController(),local={signal:events.signal};
  const shell=document.createElement('div');shell.className='bb-viewer';shell.setAttribute('role','region');shell.setAttribute('aria-label','Technical screenshot viewer');
  shell.innerHTML='<div class="bb-viewer-tools"><div class="bb-image-nav"><button type="button" data-action="previous">Previous image</button><span class="bb-image-count" role="status"></span><button type="button" data-action="next">Next image</button></div><div class="bb-zoom-tools"><button type="button" data-action="out" aria-label="Zoom out">−</button><span class="bb-zoom-label">100%</span><button type="button" data-action="in" aria-label="Zoom in">+</button><button type="button" data-action="reset">Reset view</button><button type="button" data-action="expand">Inspect full screen</button></div></div><div class="bb-image-viewport" tabindex="0" role="group" aria-label="Screenshot. Use plus or minus to zoom; arrow keys to pan when zoomed."><div class="bb-image-space"><img loading="lazy" decoding="async" draggable="false"></div></div><div class="bb-evidence-copy"><h3></h3><p></p><small></small><p class="bb-image-error" role="status" hidden>Image unavailable. The explanation above is still available.</p></div>';
  /** @template {Element} T @param {string} query @returns {T} */const get=query=>/** @type {T} */(shell.querySelector(query));
  const viewport=/** @type {HTMLElement} */(get('.bb-image-viewport')),space=/** @type {HTMLElement} */(get('.bb-image-space')),image=/** @type {HTMLImageElement} */(get('img'));
  const modal=document.createElement('dialog');modal.className='bb-lightbox';modal.setAttribute('aria-label','Expanded technical screenshot');const close=document.createElement('button');close.type='button';close.className='bb-lightbox-close';close.textContent='Close image';modal.append(close);section.append(modal);
  const anchor=document.createComment('viewer position');panel.append(anchor,shell);
  const thumbnails=document.createElement('div');thumbnails.className='bb-thumbnails';thumbnails.setAttribute('role','group');thumbnails.setAttribute('aria-label','All screenshots in this tab');shell.append(thumbnails);
  const thumbnailButtons=items.map((item,index)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','View '+item.title);button.setAttribute('aria-pressed',String(index===0));const thumb=document.createElement('img');thumb.src=item.imageSrc||'';thumb.alt='';thumb.loading='lazy';thumb.decoding='async';const title=document.createElement('span');title.textContent=item.title;button.append(thumb,title);button.addEventListener('click',()=>{current=index;renderImage();},local);thumbnails.append(button);return button;});
  let current=0,zoom=1;
  /** @type {{x:number,y:number,left:number,top:number,id:number}|null} */let drag=null;
  function fitImage(){if(!image.naturalWidth)return;const limit=modal.open?window.innerHeight*.65:640;const height=Math.max(250,Math.min(limit,viewport.clientWidth*image.naturalHeight/image.naturalWidth));viewport.style.height=Math.round(height)+'px';}
  const imageSize=new ResizeObserver(fitImage);imageSize.observe(viewport);
  image.addEventListener('load',fitImage,local);
  function renderImage(){thumbnailButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===current)));const item=items[current];image.src=/** @type {string} */(item.imageSrc);image.alt=item.imageAlt||item.title;get('h3').textContent=item.title;get('.bb-evidence-copy>p').textContent=item.description;get('small').textContent=item.caption||'';get('.bb-image-count').textContent=`${current+1} / ${items.length}`;/** @type {HTMLButtonElement} */(get('[data-action=previous]')).disabled=current===0;/** @type {HTMLButtonElement} */(get('[data-action=next]')).disabled=current===items.length-1;/** @type {HTMLElement} */(get('.bb-image-error')).hidden=true;setZoom(1);if(image.complete)fitImage();}
  /** @param {number} value */function setZoom(value){zoom=Math.max(1,Math.min(4,value));space.style.width=zoom*100+'%';space.style.height=zoom*100+'%';get('.bb-zoom-label').textContent=Math.round(zoom*100)+'%';shell.dataset.zoomed=String(zoom>1);/** @type {HTMLButtonElement} */(get('[data-action=out]')).disabled=zoom===1;/** @type {HTMLButtonElement} */(get('[data-action=in]')).disabled=zoom===4;if(zoom===1){viewport.scrollLeft=0;viewport.scrollTop=0;}}
  /** @param {number} direction */function step(direction){current=Math.max(0,Math.min(items.length-1,current+direction));renderImage();}
  shell.addEventListener('click',event=>{const action=/** @type {HTMLElement} */(event.target).closest('[data-action]')?.getAttribute('data-action');if(action==='previous')step(-1);if(action==='next')step(1);if(action==='in')setZoom(zoom+.5);if(action==='out')setZoom(zoom-.5);if(action==='reset')setZoom(1);if(action==='expand'){modal.append(shell);modal.showModal();close.focus();}},local);
  close.addEventListener('click',()=>modal.close(),local);modal.addEventListener('close',()=>{anchor.after(shell);/** @type {HTMLElement} */(get('[data-action=expand]')).focus();},local);
  function enlarge(){if(modal.open)return;modal.append(shell);modal.showModal();fitImage();close.focus();}
  viewport.setAttribute('aria-label','Project screenshot. Click or press Enter to enlarge. Use plus or minus to zoom, arrow keys to browse or pan, and zero to reset.');
  viewport.addEventListener('click',()=>{if(zoom===1)enlarge();},local);
  viewport.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();enlarge();}},local);
  viewport.addEventListener('keydown',event=>{if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom+.5);}else if(event.key==='-'){event.preventDefault();setZoom(zoom-.5);}else if(event.key==='0'){event.preventDefault();setZoom(1);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();if(zoom===1){if(event.key==='ArrowLeft')step(-1);if(event.key==='ArrowRight')step(1);}else viewport.scrollBy({left:event.key==='ArrowLeft'?-80:event.key==='ArrowRight'?80:0,top:event.key==='ArrowUp'?-80:event.key==='ArrowDown'?80:0,behavior:'instant'});}},local);
  viewport.addEventListener('pointerdown',event=>{if(zoom===1||event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,id:event.pointerId};viewport.setPointerCapture(event.pointerId);},local);
  viewport.addEventListener('pointermove',event=>{if(!drag)return;viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;},local);
  const release=()=>{drag=null;};viewport.addEventListener('pointerup',release,local);viewport.addEventListener('pointercancel',release,local);viewport.addEventListener('lostpointercapture',release,local);
  image.addEventListener('error',()=>{/** @type {HTMLElement} */(get('.bb-image-error')).hidden=false;},local);
  renderImage();return()=>{imageSize.disconnect();events.abort();if(modal.open)modal.close();modal.remove();};
 }
 void select(0,true);
 return{dispose(){revision++;transition?.cancel();disposeView?.();controller.abort();section.remove();}};
}
