const reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;
document.querySelectorAll('.service-detail,.service-link,.project-card,.case-card,.contact-layout form').forEach(card=>{card.dataset.tilt='0.5';card.classList.add('depth-card')});
document.querySelectorAll('.case-card .case-visual[data-tilt]').forEach(node=>node.removeAttribute('data-tilt'));
if(!reduceMotion&&finePointer){
 for(const card of document.querySelectorAll('[data-tilt]')){
  if(card.matches('#work .case-card'))continue;
  let frame=0,last=0,x=0,y=0,targetX=0,targetY=0;
  function paint(time){
   frame=0;
   const elapsed=last?Math.min(time-last,40):16;last=time;
   const blend=1-Math.exp(-elapsed/85);
   x+=(targetX-x)*blend;y+=(targetY-y)*blend;
   card.style.setProperty('--tilt-x',x.toFixed(3)+'deg');
   card.style.setProperty('--tilt-y',y.toFixed(3)+'deg');
   card.style.setProperty('--shadow-x',(-y*.5).toFixed(2)+'px');
   card.style.setProperty('--shadow-y',(14+x*.5).toFixed(2)+'px');
   if(Math.abs(targetX-x)+Math.abs(targetY-y)>.015)frame=requestAnimationFrame(paint);
   else last=0;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
  card.addEventListener('pointermove',event=>{
   if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
   const rect=card.getBoundingClientRect(),amount=Math.min(2,(Number(card.dataset.tilt)||.5)*1.5);
   targetX=(.5-Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)))*amount;
   targetY=(Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))-.5)*amount*1.4;
   schedule();
  });
  function reset(){targetX=targetY=0;schedule()}
  card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',event=>{if(event.matches){cancelAnimationFrame(frame);frame=0;x=y=targetX=targetY=0;card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg')}});
 }
 for(const button of document.querySelectorAll('[data-magnetic]')){
  let frame=0;button.addEventListener('pointermove',event=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const x=event.clientX,y=event.clientY;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=button.getBoundingClientRect();button.style.transform=`translate(${((x-r.left)/r.width-.5)*3}px,${((y-r.top)/r.height-.5)*2}px)`})});
  button.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);button.style.transform=''})
 }
}
const follow=document.getElementById('follow-enquiry');
if(follow){let timers=[];follow.addEventListener('click',()=>{if(follow.disabled)return;follow.disabled=true;const nodes=[...document.querySelectorAll('[data-step]')];const descriptions=['An enquiry arrives with its context.','The system identifies the next step.','A person reviews the proposed action.'];nodes.forEach((node,i)=>timers.push(setTimeout(()=>{nodes.forEach(n=>n.classList.remove('is-active'));node.classList.add('is-active');document.getElementById('sequence-status').textContent=descriptions[i]},i*(reduceMotion?300:950))));timers.push(setTimeout(()=>{nodes.forEach(n=>n.classList.remove('is-active'));follow.disabled=false;document.getElementById('sequence-status').textContent='Illustration complete. No real enquiry was submitted.'},reduceMotion?1100:3500))});window.addEventListener('pagehide',()=>timers.forEach(clearTimeout))}
const filterButtons=[...document.querySelectorAll('[data-filter]')];
for(const button of filterButtons)button.addEventListener('click',()=>{const filter=button.dataset.filter;filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;for(const card of document.querySelectorAll('[data-category]')){card.hidden=filter!=='all'&&card.dataset.category!==filter;if(!card.hidden)count++}document.getElementById('filter-status').textContent=`Showing ${count} projects. ${button.textContent}.`});
const enquiry=document.getElementById('enquiry-form');
if(enquiry){const requested=new URLSearchParams(location.search).get('service');if(requested&&[...enquiry.elements.service.options].some(o=>o.value===requested))enquiry.elements.service.value=requested;enquiry.addEventListener('submit',event=>{event.preventDefault();if(!enquiry.reportValidity())return;const data=new FormData(enquiry),service=enquiry.elements.service.selectedOptions[0].textContent;const text=`Project enquiry for Markautomates\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${service}\n\nProject details\n${data.get('message')}\n\nPrepared locally. This enquiry has not been sent.\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='markautomates-enquiry.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);document.getElementById('form-status').textContent='Your enquiry draft has downloaded. Nothing has been sent.'})}
// Highlight the section being read; navigation is optional, never required.
const scrollSections=[...document.querySelectorAll('[data-section]')];
if(scrollSections.length){const navigation=[...document.querySelectorAll('.site-header nav a')];const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const name=entry.target.dataset.section;navigation.forEach(link=>{if(link.getAttribute('href')==='#'+name)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')})}}},{rootMargin:'-15% 0px -65% 0px',threshold:0});scrollSections.forEach(section=>observer.observe(section));}
for(const link of document.querySelectorAll('[data-service]'))link.addEventListener('click',()=>{if(enquiry)enquiry.elements.service.value=link.dataset.service});


// Section edges settle continuously with the viewport, in either direction.
// No entrance restarts when the user reverses the wheel or trackpad.
const motionPreference=matchMedia('(prefers-reduced-motion:reduce)');
const sectionSurfaces=[...document.querySelectorAll('.scroll-section:not(#work)')];
let sectionFrame=0;
function paintSectionEdges(){
 sectionFrame=0;
 for(const section of sectionSurfaces){
  if(motionPreference.matches){section.style.removeProperty('translate');section.style.removeProperty('scale');continue;}
  const rect=section.getBoundingClientRect(),band=Math.min(260,innerHeight*.3);
  const entering=Math.max(0,Math.min(1,(rect.top-(innerHeight-band))/band));
  const leaving=Math.max(0,Math.min(1,(band-rect.bottom)/band));
  // Smoothstep gives both edges a quiet, zero-slope landing.
  const ease=value=>value*value*(3-2*value);
  const edge=ease(entering)+ease(leaving);
  section.style.scale=String(1-edge*.018);
  section.style.translate=`0 ${(ease(entering)-ease(leaving))*24}px`;
 }
}
function scheduleSectionEdges(){if(!sectionFrame)sectionFrame=requestAnimationFrame(paintSectionEdges)}
addEventListener('scroll',scheduleSectionEdges,{passive:true});
addEventListener('resize',scheduleSectionEdges);
motionPreference.addEventListener('change',paintSectionEdges);
paintSectionEdges();
// Passive scroll input, one paint per frame; never take over the wheel.
const readingHeader=document.querySelector('.site-header');
let readingFrame=0;
function updateReadingProgress(){readingFrame=0;const range=document.documentElement.scrollHeight-innerHeight;readingHeader?.style.setProperty('--reading-progress',range>0?Math.min(1,Math.max(0,scrollY/range)):0)}
addEventListener('scroll',()=>{if(!readingFrame)readingFrame=requestAnimationFrame(updateReadingProgress)},{passive:true});
addEventListener('resize',updateReadingProgress);updateReadingProgress();
motionPreference.addEventListener('change',()=>{if(motionPreference.matches)document.querySelectorAll('[data-tilt],[data-magnetic]').forEach(node=>{node.style.removeProperty('transform');node.style.setProperty('--tilt-x','0deg');node.style.setProperty('--tilt-y','0deg')})});




// Project context is an editable draft; no enquiry is submitted automatically.
if(enquiry){
 const addProjectContext=name=>{if(!name)return;const field=enquiry.elements.namedItem('message');if(!(field instanceof HTMLTextAreaElement))return;const context='Project inspiration: '+name.slice(0,120);if(!field.value.includes(context))field.value=(field.value.trim()?field.value.trim()+'\n\n':'')+context+'\n';};
 addProjectContext(new URLSearchParams(location.search).get('project'));
 document.querySelectorAll('[data-project-context]').forEach(link=>{if(document.getElementById('contact')){link.href='#contact';link.addEventListener('click',()=>addProjectContext(link.dataset.projectContext));}});
}
