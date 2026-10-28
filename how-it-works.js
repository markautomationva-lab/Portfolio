// @ts-check
import {createWorkflowExplorer} from './workflow-explorer.js?v=e18c9f47c6d4';
const processRoot=document.querySelector('.process-page');
if(processRoot instanceof HTMLElement){
 const page=processRoot;
 const journey=/** @type {HTMLElement} */(page.querySelector('.client-journey'));
 const stages=[...page.querySelectorAll('.journey-stage')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let scrollFrame=0,lineCurrent=0,lineTarget=0,lineTime=0,measureNeeded=true;
 function measureJourney(){
  const box=journey.getBoundingClientRect(),anchor=window.innerHeight*.52;
  lineTarget=Math.max(0,Math.min(1,(anchor-box.top)/Math.max(1,box.height)));
  const markers=stages.map(stage=>stage.querySelector('.stage-number')?.getBoundingClientRect().top??stage.getBoundingClientRect().top);
  const centres=stages.map(stage=>{const rect=stage.getBoundingClientRect();return rect.top+rect.height/2;});
  const focus=window.innerHeight*.42;let current=0;centres.forEach((centre,index)=>{if(Math.abs(centre-focus)<Math.abs(centres[current]-focus))current=index;});
  stages.forEach((stage,index)=>{stage.classList.toggle('is-current-stage',index===current);stage.classList.toggle('is-past',markers[index]<anchor-45);});journey.dataset.activeStage=String(current+1);
 }
 function updateLine(now=performance.now()){
  scrollFrame=0;if(measureNeeded){measureJourney();measureNeeded=false;}
  const delta=Math.min(.05,lineTime?(now-lineTime)/1000:1/60);lineTime=now;
  lineCurrent=reduced.matches?lineTarget:lineCurrent+(lineTarget-lineCurrent)*(1-Math.exp(-11*delta));
  if(Math.abs(lineTarget-lineCurrent)<.0004)lineCurrent=lineTarget;
  journey.style.setProperty('--journey-progress',String(lineCurrent));
  if(lineCurrent!==lineTarget)scrollFrame=requestAnimationFrame(updateLine);
 }
 function scheduleLine(){measureNeeded=true;if(!scrollFrame){lineTime=0;scrollFrame=requestAnimationFrame(updateLine);}}
 function syncVisualMotion(){for(const stage of stages){const svg=stage.querySelector('svg');if(svg instanceof SVGSVGElement){if(stage.classList.contains('is-active')&&!document.hidden&&!reduced.matches)svg.unpauseAnimations();else svg.pauseAnimations();}}}
 function motionPreference(){scheduleLine();syncVisualMotion();}
 reduced.addEventListener('change',motionPreference);
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){entry.target.classList.toggle('is-active',entry.isIntersecting);if(entry.isIntersecting)entry.target.classList.add('has-entered');}syncVisualMotion();},{threshold:.12,rootMargin:'0px 0px -7% 0px'});
 stages.forEach(stage=>{const svg=stage.querySelector('svg');if(svg instanceof SVGSVGElement)svg.pauseAnimations();observer.observe(stage);});page.classList.add('process-ready');updateLine();
 function onVisibility(){page.classList.toggle('is-page-hidden',document.hidden);syncVisualMotion();}
 document.addEventListener('visibilitychange',onVisibility);window.addEventListener('scroll',scheduleLine,{passive:true});window.addEventListener('resize',scheduleLine);
 const explorer=createWorkflowExplorer(page);
 window.addEventListener('pagehide',()=>{explorer.dispose();reduced.removeEventListener('change',motionPreference);observer.disconnect();cancelAnimationFrame(scrollFrame);window.removeEventListener('scroll',scheduleLine);window.removeEventListener('resize',scheduleLine);document.removeEventListener('visibilitychange',onVisibility);},{once:true});
}
