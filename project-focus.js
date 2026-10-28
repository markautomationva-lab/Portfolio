// @ts-check
import { mountBehindBuild } from './behind-build.js?v=e18c9f47c6d4';
/** @typedef {{card:HTMLElement,name:string}} FocusProject */
/** @param {{root:HTMLElement,gallery:HTMLElement,index:HTMLElement,getProjects:()=>FocusProject[],selectProject:(project:FocusProject)=>void,onState:(open:boolean)=>void,isReduced:()=>boolean,onProjectChange?:(project:FocusProject|null)=>void}} options */
export function createProjectFocus(options){
 const {root,gallery,index,getProjects,selectProject,onState,isReduced}=options;
 const focus=document.createElement('section');focus.className='project-focus';focus.hidden=true;focus.setAttribute('aria-labelledby','project-focus-title');
 focus.innerHTML='<div class="project-focus-toolbar"><button type="button" class="project-focus-back">Back to gallery</button><nav aria-label="Focused project navigation"><button type="button" class="project-focus-previous">Previous project</button><button type="button" class="project-focus-next">Next project</button></nav></div><div class="project-focus-layout"><div class="project-focus-media-column"><div class="project-focus-media"></div><p class="project-focus-film-label"></p><p class="project-focus-status" role="status" hidden></p></div><article class="project-focus-details"></article></div>';
 gallery.after(focus);
 const media=/** @type {HTMLElement} */(focus.querySelector('.project-focus-media'));
 const details=/** @type {HTMLElement} */(focus.querySelector('.project-focus-details'));
 const status=/** @type {HTMLElement} */(focus.querySelector('.project-focus-status'));
 const label=/** @type {HTMLElement} */(focus.querySelector('.project-focus-film-label'));
 const back=/** @type {HTMLButtonElement} */(focus.querySelector('.project-focus-back'));
 const previous=/** @type {HTMLButtonElement} */(focus.querySelector('.project-focus-previous'));
 const next=/** @type {HTMLButtonElement} */(focus.querySelector('.project-focus-next'));
 /** @type {FocusProject|null} */ let active=null;
 /** @type {HTMLElement|null} */ let opener=null;
 /** @type {HTMLVideoElement|null} */ let video=null;
 /** @type {AbortController|null} */ let mediaEvents=null;
 /** @type {Set<Animation>} */const animations=new Set();
 let state='closed',epoch=0,savedScroll=0;
 /** @type {HTMLElement|null} */let enquiry=null;
 /** @type {{dispose:()=>void}|null} */let engineering=null;
 /** @param {Element} target @param {Keyframe[]} frames @param {number} duration */
 function animate(target,frames,duration){
  if(isReduced())return Promise.resolve();
  const animation=target.animate(frames,{duration,easing:'cubic-bezier(.77,0,.175,1)'});animations.add(animation);
  return animation.finished.then(()=>{animations.delete(animation);},()=>{animations.delete(animation);});
 }
 function cancel(){for(const animation of animations)animation.cancel();animations.clear();}
 function releaseVideo(){
  mediaEvents?.abort();mediaEvents=null;
  const old=video;video=null;
  if(!old)return;
  if(document.fullscreenElement===old)void document.exitFullscreen().catch(()=>{});
  old.pause();old.removeAttribute('src');old.querySelectorAll('source,track').forEach(node=>node.remove());old.load();old.remove();
 }
 /** @param {string} message */
 function message(message){status.textContent=message;status.hidden=!message;media.setAttribute('aria-busy',String(message==='Loading video…'));}
 /** @param {FocusProject} project @param {HTMLVideoElement|null} [handoff] */
 function render(project,handoff=null){
  releaseVideo();media.replaceChildren();details.replaceChildren();engineering?.dispose();engineering=null;enquiry?.remove();enquiry=null;message('');active=project;selectProject(project);
  focus.dataset.project=project.card.id;options.onProjectChange?.(project);
  const category=document.createElement('p');category.className='project-focus-category';category.textContent=project.card.dataset.serviceCategory||'';
  const title=document.createElement('h2');title.id='project-focus-title';title.textContent=project.name;
  const description=document.createElement('p');description.className='project-focus-intro';description.textContent=project.card.querySelector('.case-intro')?.textContent||'';
  details.append(category,title,description);
  const projectAssets=[...project.card.querySelectorAll('.project-asset')].map((figure,index)=>{const image=figure.querySelector('img');return {id:'asset-'+index,title:figure.querySelector('figcaption')?.textContent||'Project screenshot',description:'Supplied project image: '+(figure.querySelector('figcaption')?.textContent||'Project screenshot')+'. This captures the visible interface or configuration; it does not independently verify the complete system.',imageSrc:image?.getAttribute('src')||'',imageAlt:image?.getAttribute('alt')||'Project screenshot',caption:'Original supplied project asset.',reviewed:true};});
  engineering=mountBehindBuild(focus,project.card.id,isReduced,()=>step(1,true),projectAssets);
  const source=project.card.querySelector('details');
  if(source)for(const child of source.children){if(child.tagName!=='SUMMARY'&&!child.classList.contains('case-similar'))details.append(child.cloneNode(true));}
  const full=document.createElement('a');full.className='text-link project-focus-case';full.href='#'+project.card.id;full.textContent='View full case study ↗';
  full.addEventListener('click',event=>{event.preventDefault();engineering&&focus.querySelector('.behind-build')?.scrollIntoView({block:'start',behavior:isReduced()?'instant':'smooth'});/** @type {HTMLElement|null} */(focus.querySelector('.bb-tabs button'))?.focus({preventScroll:true});});details.append(full);
  const poster=project.card.dataset.videoPoster||project.card.querySelector('.case-visual img')?.getAttribute('src')||'';
  const image=document.createElement('img');image.className='project-focus-poster';image.alt=project.name+' project preview';if(poster)image.src=poster;
  media.append(image);focus.dataset.playback='idle';
  const src=project.card.dataset.videoSrc;
  label.textContent='Project overview';
  if(src){
   const resume=!!handoff&&!handoff.paused&&!handoff.ended;
   const element=handoff||document.createElement('video');video=element;mediaEvents=new AbortController();const signal=mediaEvents.signal;
   element.controls=true;element.playsInline=true;element.preload='none';element.poster=poster;element.setAttribute('aria-label',project.name+' project film');if(!handoff)element.src=src;image.hidden=true;media.append(element);
   const duration=Number(project.card.dataset.videoDuration);label.textContent=Number.isFinite(duration)&&duration>0?`Project film · ${Math.floor(duration/60)}:${String(Math.round(duration%60)).padStart(2,'0')}`:'Project film';
   const captions=project.card.dataset.videoCaptions;
   if(captions&&!handoff){const track=document.createElement('track');track.kind='captions';track.srclang='en';track.label='English';track.src=captions;element.append(track);}
   const play=document.createElement('button');play.type='button';play.className='project-focus-play';play.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';play.setAttribute('aria-label','Play '+project.name+' film');media.append(play);
   if(handoff){play.hidden=true;focus.dataset.playback=resume?'playing':'paused';}
   play.addEventListener('click',()=>{play.disabled=true;message('Loading video…');void element.play().catch(error=>{if(video!==element||error.name==='AbortError')return;play.disabled=false;message('Playback could not start. Use the video controls to try again.');});},{signal});
   element.addEventListener('play',()=>{play.hidden=true;play.disabled=false;focus.dataset.playback='starting';},{signal});
   element.addEventListener('waiting',()=>{focus.dataset.playback='loading';message('Loading video…');},{signal});
   element.addEventListener('playing',()=>{focus.dataset.playback='playing';message('');},{signal});
   element.addEventListener('canplay',()=>message(''),{signal});
   element.addEventListener('pause',()=>{focus.dataset.playback='paused';message('');},{signal});
   element.addEventListener('ended',()=>{play.hidden=false;play.setAttribute('aria-label','Replay '+project.name+' film');focus.dataset.playback='ended';},{signal});
   element.addEventListener('error',()=>{releaseVideo();focus.dataset.playback='unavailable';image.hidden=false;play.remove();message('This film is unavailable. The project preview and case study are still available.');},{signal});
   if(resume)void element.play().catch(()=>{if(video===element){play.hidden=false;message('Press play to continue from the same position.');}});
  }else message('A project film has not been added yet. Explore the preview and case study.');
  const available=getProjects(),position=available.findIndex(p=>p.card.id===project.card.id);previous.disabled=position<=0;next.disabled=position<0||position>=available.length-1;const nextBuild=focus.querySelector('.bb-next button');if(nextBuild instanceof HTMLButtonElement){const following=available[position+1]||available[0];nextBuild.hidden=available.length<2;if(following)nextBuild.textContent='Next project: '+following.name;}
  enquiry=document.createElement('section');enquiry.className='project-focus-enquiry';
  const enquiryTitle=document.createElement('h2');enquiryTitle.textContent='Need something similar for your business?';
  const enquiryCopy=document.createElement('p');enquiryCopy.textContent='Explore how a tailored system could simplify your workflow, connect your tools, or automate repetitive tasks.';
  const discuss=document.createElement('a');discuss.className='text-link';discuss.textContent='Discuss a similar project ↗';discuss.href=document.getElementById('enquiry-form')?'#contact':'about.html?project='+encodeURIComponent(project.name)+'#contact';
  discuss.addEventListener('click',event=>{const form=document.getElementById('enquiry-form');if(!(form instanceof HTMLFormElement))return;event.preventDefault();const field=form.elements.namedItem('message');if(field instanceof HTMLTextAreaElement){const context='Project inspiration: '+project.name;if(!field.value.includes(context))field.value=(field.value.trim()?field.value.trim()+'\n\n':'')+context+'\n';}void close({restoreFocus:false,restoreScroll:false}).then(()=>{location.hash='contact';document.getElementById('contact')?.scrollIntoView({block:'start',behavior:isReduced()?'instant':'smooth'});document.getElementById('contact')?.setAttribute('tabindex','-1');document.getElementById('contact')?.focus({preventScroll:true});});});
  enquiry.append(enquiryTitle,enquiryCopy,discuss);focus.append(enquiry);
 }
 /** @param {FocusProject} project @param {HTMLElement} trigger @param {HTMLVideoElement|null} [handoff] */
 async function open(project,trigger,handoff=null){
  if(state==='open'){render(project,handoff);return;}
  back.textContent=root.dataset.projectView==='index'?'Back to index':'Back to gallery';
  const ticket=++epoch;cancel();savedScroll=window.scrollY;opener=trigger;state='opening';onState(true);gallery.inert=true;index.inert=true;render(project,handoff);
  const departure=root.dataset.projectView==='index'?root.querySelector('.project-directory')||gallery:gallery;
  await animate(departure,[{opacity:1},{opacity:0}],140);
  if(ticket!==epoch)return;
  gallery.hidden=true;index.hidden=true;focus.hidden=false;back.focus({preventScroll:true});focus.scrollIntoView({block:'start',behavior:isReduced()?'instant':'smooth'});
  await Promise.all([animate(focus,[{opacity:.15,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],560),animate(media,[{opacity:.65,transform:'scale(.99)'},{opacity:1,transform:'scale(1)'}],620)]);
  if(ticket===epoch){state='open';root.dataset.focusState='open';}
 }
 /** @param {{immediate?:boolean,restoreFocus?:boolean,restoreScroll?:boolean}} [settings] */
 async function close(settings={}){
  if(state==='closed'||(state==='closing'&&!settings.immediate))return;
  const ticket=++epoch;cancel();state='closing';releaseVideo();
  if(!settings.immediate&&!focus.hidden)await animate(focus,[{opacity:1},{opacity:0}],220);
  if(ticket!==epoch)return;
  focus.hidden=true;media.replaceChildren();details.replaceChildren();engineering?.dispose();engineering=null;enquiry?.remove();enquiry=null;gallery.hidden=false;index.hidden=false;gallery.inert=false;index.inert=false;active=null;state='closed';root.dataset.focusState='closed';onState(false);
  options.onProjectChange?.(null);
  if(settings.restoreScroll!==false)window.scrollTo({top:savedScroll,behavior:'instant'});
  if(settings.restoreFocus!==false&&opener?.isConnected)opener.focus({preventScroll:true});
 }
 /** @param {number} direction @param {boolean} [wrap] */
 function step(direction,wrap=false){
  if(!active||state!=='open')return;const available=getProjects(),position=available.findIndex(p=>p.card.id===active?.card.id),target=available[position+direction]||(wrap?available[0]:null);
  if(!target)return;cancel();render(target);focus.scrollIntoView({block:'start',behavior:'instant'});void animate(focus,[{opacity:.65},{opacity:1}],320);
 }
 const onBack=()=>{void close();};const onPrevious=()=>step(-1),onNext=()=>step(1);
 /** @param {KeyboardEvent} event */const onKey=event=>{if(event.key==='Escape'&&state!=='closed'&&!document.fullscreenElement&&!focus.querySelector('.bb-lightbox[open]')){event.preventDefault();void close();}};
 back.addEventListener('click',onBack);previous.addEventListener('click',onPrevious);next.addEventListener('click',onNext);document.addEventListener('keydown',onKey);
 function dispose(){epoch++;cancel();engineering?.dispose();releaseVideo();document.removeEventListener('keydown',onKey);back.removeEventListener('click',onBack);previous.removeEventListener('click',onPrevious);next.removeEventListener('click',onNext);focus.remove();}
 return{open,close,dispose,isOpen:()=>state!=='closed'};
}

