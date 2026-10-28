// @ts-check
/** @typedef {{title:string,description:string,activeStatus:string,announcement:string,recordStatus?:string}} WorkflowStage */
/** @typedef {{id:string,title:string,description:string,record:{title:string,fields:{label:string,value:string}[]},initial:{status:string,announcement:string},stages:WorkflowStage[],approval:{stage:number,label:string,approvedStatus:string,note:string},completion:{status:string,announcement:string}}} Scenario */
/** @typedef {{remaining:number,started:number,timer:number|null,signal:AbortSignal,abort:()=>void,resolve:(value:boolean)=>void}} PendingWait */
/** @param {HTMLElement} page */
export function createWorkflowExplorer(page){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const example=/** @type {HTMLElement} */(page.querySelector('.workflow-example'));
 const panel=/** @type {HTMLElement} */(page.querySelector('#workflow-panel'));
 const data=page.querySelector('#workflow-scenarios')?.textContent||'[]';
 const scenarios=/** @type {Scenario[]} */(JSON.parse(data));
 const tabs=/** @type {HTMLButtonElement[]} */([...page.querySelectorAll('.scenario-tab')]);
 const run=/** @type {HTMLButtonElement} */(page.querySelector('#run-example'));
 const approve=/** @type {HTMLButtonElement} */(page.querySelector('#approve-example'));
 const reset=/** @type {HTMLButtonElement} */(page.querySelector('#reset-example'));
 const status=/** @type {HTMLElement} */(page.querySelector('#workflow-status'));
 const record=/** @type {HTMLElement} */(page.querySelector('#record-status'));
 const recordFields=/** @type {HTMLElement} */(page.querySelector('[data-record-fields]'));
 const recordStatusRow=/** @type {HTMLElement} */(record.parentElement);
 const recordLabel=/** @type {HTMLElement} */(page.querySelector('.record-label'));
 const description=/** @type {HTMLElement} */(page.querySelector('#scenario-description'));
 const note=/** @type {HTMLElement} */(page.querySelector('.approval-note'));
 const nodes=[...page.querySelectorAll('.demo-node')];
 let selected=scenarios[0],state='idle',inView=false,disposed=false;
 /** @type {AbortController|null} */let controller=null;
 /** @type {PendingWait|null} */let waiting=null;
 /** @type {Animation|null} */let transition=null;
 /** @param {boolean} result */
 function finishWait(result){const pending=waiting;if(!pending)return;waiting=null;if(pending.timer!==null)window.clearTimeout(pending.timer);pending.signal.removeEventListener('abort',pending.abort);pending.resolve(result);}
 function pauseWait(){if(waiting&&waiting.timer!==null){waiting.remaining=Math.max(0,waiting.remaining-(performance.now()-waiting.started));window.clearTimeout(waiting.timer);waiting.timer=null;}}
 function resumeWait(){if(!waiting||waiting.timer!==null||!inView||document.hidden||disposed)return;if(waiting.signal.aborted){finishWait(false);return;}waiting.started=performance.now();waiting.timer=window.setTimeout(()=>finishWait(true),waiting.remaining);}
 function updatePaused(){page.dataset.workflowPaused=String((state==='running'||state==='approval')&&(!inView||document.hidden));}
 /** @param {number} ms @param {AbortSignal} signal */
 function wait(ms,signal){return new Promise(resolve=>{if(signal.aborted||disposed){resolve(false);return;}waiting={remaining:reduced.matches?0:ms,started:0,timer:null,signal,abort:()=>finishWait(false),resolve};signal.addEventListener('abort',waiting.abort,{once:true});resumeWait();});}
 /** @param {number} current @param {string} label */
 function show(current,label){nodes.forEach((node,index)=>{node.classList.toggle('is-done',index<current);node.classList.toggle('is-current',index===current);if(index===current)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');const text=node.querySelector('.node-status');if(text)text.textContent=index<current?'Complete':index===current?label:'Waiting';});page.dataset.workflowState=state;updatePaused();}
 function clear(){controller?.abort();controller=null;state='idle';run.disabled=false;run.textContent='Run example workflow →';reset.disabled=true;approve.hidden=true;approve.disabled=false;approve.textContent=selected.approval.label;note.hidden=true;note.textContent=selected.approval.note;record.textContent=selected.initial.status;status.textContent=selected.initial.announcement;show(-1,'');}
 /** @param {string} id @param {boolean} [animate] */
 function select(id,animate=true){
  const scenario=scenarios.find(item=>item.id===id);if(!scenario||disposed)return;
  controller?.abort();selected=scenario;transition?.cancel();
  tabs.forEach(tab=>{const active=tab.dataset.scenario===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  panel.setAttribute('aria-labelledby','scenario-'+id);page.dataset.workflowScenario=id;description.textContent=selected.description;recordLabel.textContent=selected.record.title;
  nodes.forEach((node,index)=>{const title=node.querySelector('h3'),text=node.querySelector('p');if(title)title.textContent=selected.stages[index].title;if(text)text.textContent=selected.stages[index].description;});
  const fields=selected.record.fields.map(field=>{const row=document.createElement('div'),term=document.createElement('dt'),value=document.createElement('dd');term.textContent=field.label;value.textContent=field.value;row.append(term,value);return row;});recordFields.replaceChildren(...fields,recordStatusRow);
  clear();
  if(animate&&!reduced.matches)transition=panel.animate([{opacity:.6,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.23,1,.32,1)'});
 }
 async function begin(){
  if(disposed||state==='running'||state==='approval')return;
  const bounds=example.getBoundingClientRect();inView=bounds.bottom>0&&bounds.top<window.innerHeight;if(!inView||document.hidden)return;
  clear();controller=new AbortController();const signal=controller.signal;state='running';run.disabled=true;reset.disabled=false;
  for(let index=0;index<=selected.approval.stage;index++){
   const stage=selected.stages[index];if(stage.recordStatus)record.textContent=stage.recordStatus;status.textContent=stage.announcement;
   if(index===selected.approval.stage){state='approval';show(index,stage.activeStatus);approve.hidden=false;note.hidden=false;if(document.activeElement===run||document.activeElement===document.body)approve.focus({preventScroll:true});return;}
   show(index,stage.activeStatus);if(!await wait(650,signal))return;
  }
 }
 async function confirm(){
  if(disposed||state!=='approval'||!controller)return;
  const signal=controller.signal;state='running';approve.disabled=true;note.hidden=true;record.textContent=selected.approval.approvedStatus;
  for(let index=selected.approval.stage+1;index<selected.stages.length;index++){
   const stage=selected.stages[index];show(index,stage.activeStatus);status.textContent=stage.announcement;if(!await wait(650,signal))return;
  }
  state='complete';show(selected.stages.length,'Complete');record.textContent=selected.completion.status;status.textContent=selected.completion.announcement;approve.hidden=true;approve.disabled=false;run.disabled=false;run.textContent='Run again →';if(document.activeElement===approve)run.focus({preventScroll:true});
 }
 function resetExample(){clear();run.focus({preventScroll:true});}
 /** @param {KeyboardEvent} event */
 function tabKey(event){const index=tabs.indexOf(/** @type {HTMLButtonElement} */(event.currentTarget));let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(tabs[next].dataset.scenario||'');tabs[next].focus();}
 const clicks=tabs.map(tab=>()=>select(tab.dataset.scenario||''));tabs.forEach((tab,index)=>{tab.addEventListener('click',clicks[index]);tab.addEventListener('keydown',tabKey);});
 const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)resumeWait();else pauseWait();updatePaused();},{threshold:0});visibility.observe(example);
 function documentVisibility(){if(document.hidden)pauseWait();else resumeWait();updatePaused();}
 document.addEventListener('visibilitychange',documentVisibility);run.addEventListener('click',begin);approve.addEventListener('click',confirm);reset.addEventListener('click',resetExample);select(selected.id,false);
 return{dispose(){disposed=true;controller?.abort();finishWait(false);transition?.cancel();visibility.disconnect();document.removeEventListener('visibilitychange',documentVisibility);run.removeEventListener('click',begin);approve.removeEventListener('click',confirm);reset.removeEventListener('click',resetExample);tabs.forEach((tab,index)=>{tab.removeEventListener('click',clicks[index]);tab.removeEventListener('keydown',tabKey);});}};
}

