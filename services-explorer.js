// @ts-check
// The selected intent and rendered panel are separate so rapid clicks never race.
(() => {
  const candidate=document.querySelector('[data-service-explorer]');
  if(!(candidate instanceof HTMLElement))return;
  const explorer=candidate;
  const buttons=Array.from(explorer.querySelectorAll('.service-row')).filter(node=>node instanceof HTMLButtonElement);
  const panels=Array.from(explorer.querySelectorAll('.service-preview-panel')).filter(node=>node instanceof HTMLElement);
  if(!buttons.length||panels.length!==buttons.length)return;
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  const reduced=()=>motion.matches;
  /** @type {number|null} */
  let selected=null;
  /** @type {number|null} */
  let requested=null;
  let revision=0,sectionVisible=false,disposed=false;
  /** @type {Set<Animation>} */
  const animations=new Set();
  /** @type {Set<Element>} */
  const visibleVisuals=new Set(),revealedVisuals=new Set();
  /** @type {Array<()=>void>} */
  const cleanups=[];
  /** @type {string|null} */let savedAnchor=null;
  function suspendAnchoring(){const root=document.documentElement;if(!root||savedAnchor!==null)return;savedAnchor=root.style.overflowAnchor;root.style.overflowAnchor='none';}
  function restoreAnchoring(){const root=document.documentElement;if(root&&savedAnchor!==null)root.style.overflowAnchor=savedAnchor;savedAnchor=null;}
  function updateMotion(){
    if(!sectionVisible||document.hidden)restoreAnchoring();
    for(const animation of animations){
      if(reduced()){animation.finish();continue;}
      if(sectionVisible&&!document.hidden)animation.play();else animation.pause();
    }
    panels.forEach((panel,i)=>{
      const visual=panel.querySelector('.service-viz');
      visual?.classList.toggle('is-running',i===selected&&revealedVisuals.has(visual)&&visibleVisuals.has(visual)&&!document.hidden&&!reduced());
    });
  }
  /** @param {Element} element @param {Keyframe[]} frames @param {KeyframeAnimationOptions} timing */
  function animate(element,frames,timing){
    const animation=element.animate(frames,timing);
    animations.add(animation);
    animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
    if(!sectionVisible||document.hidden)animation.pause();
    return animation;
  }
  function cancelAnimations(){for(const animation of animations)animation.cancel();animations.clear();}
  /** @param {HTMLElement} panel */
  function stopVisual(panel){
    const visual=panel.querySelector('.service-viz');
    if(!visual)return;
    revealedVisuals.delete(visual);visual.classList.remove('is-running','is-started');
  }
  function snapshotLayout(){
    if(!(window.innerWidth>900))return null;
    return {height:explorer.getBoundingClientRect().height,rows:buttons.map(button=>button.getBoundingClientRect())};
  }
  /** @param {{height:number,rows:DOMRect[]}|null} before @param {number} ticket */
  async function transitionLayout(before,ticket){
    if(!before||reduced())return;
    const ease='cubic-bezier(.23,1,.32,1)',duration=340;
    /** @type {Promise<Animation>[]} */const moves=[];
    buttons.forEach((button,i)=>{
      const after=button.getBoundingClientRect(),x=before.rows[i].left-after.left,y=before.rows[i].top-after.top;
      if(Math.abs(x)+Math.abs(y)<1)return;
      moves.push(animate(button,[{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration,easing:ease}).finished);
    });
    const height=explorer.getBoundingClientRect().height;
    if(Math.abs(height-before.height)>1)moves.push(animate(explorer,[{height:before.height+'px'},{height:height+'px'}],{duration,easing:ease}).finished);
    await Promise.all(moves);
    if(ticket===revision)explorer.dataset.layoutState='idle';
  }
  function commit(){
    selected=requested;
    explorer.classList.toggle('has-selection',selected!==null);
    explorer.dataset.view=selected===null?'overview':'focused';
    buttons.forEach((button,i)=>button.setAttribute('aria-expanded',String(i===selected)));
    panels.forEach((panel,i)=>{panel.hidden=i!==selected;panel.inert=i!==selected;});
    explorer.setAttribute('data-selected-service',selected===null?'':buttons[selected].id.replace('service-select-',''));
  }
  /** @param {HTMLElement} panel @param {number} ticket */
  async function enter(panel,ticket){
    const visual=panel.querySelector('.service-viz');
    visual?.classList.add('is-started');
    if(reduced()){
      if(visual)revealedVisuals.add(visual);
      updateMotion();return;
    }
    const ease='cubic-bezier(.23,1,.32,1)';
    /** @type {Promise<Animation>[]} */
    const arrivals=[];
    /** @param {Element|null} element @param {number} delay @param {number} duration @param {Keyframe[]} [frames] */
    function reveal(element,delay,duration,frames=[{opacity:0},{opacity:1}]){
      if(!element)return null;
      const animation=animate(element,frames,{delay,duration,easing:ease,fill:'backwards'});
      arrivals.push(animation.finished);return animation;
    }
    reveal(panel.querySelector('.service-preview-category'),0,180);
    reveal(panel.querySelector('h3'),55,320,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}]);
    reveal(panel.querySelector('.service-preview-description'),145,250);
    reveal(panel.querySelector('h4'),215,200);
    panel.querySelectorAll('li').forEach((item,i)=>reveal(item,250+i*45,220));
    const masked=reveal(visual,330,320,[{opacity:.4,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}]);
    masked?.finished.then(()=>{
      if(ticket===revision&&visual&&!panel.hidden){revealedVisuals.add(visual);updateMotion();}
    },()=>{});
    reveal(panel.querySelector('.service-discuss'),510,220);
    await Promise.all(arrivals);
  }
  /** @param {number|null} index */
  async function select(index){
    requested=index;
    const ticket=++revision;
    const modeChange=(selected===null)!==(requested===null);
    const before=modeChange?snapshotLayout():null;
    const wasMoving=explorer.dataset.layoutState==='moving';
    if(before&&!reduced())suspendAnchoring();
    cancelAnimations();
    panels.forEach(stopVisual);
    const old=selected===null?null:panels[selected];
    explorer.setAttribute('aria-busy','true');
    try{
      if(old&&!old.hidden&&!reduced()&&!wasMoving){
        explorer.dataset.transitionState='exiting';
        old.inert=true;
        await animate(old,[{opacity:1},{opacity:0}],{duration:140,easing:'cubic-bezier(.33,0,.12,1)'}).finished;
      }
      if(ticket!==revision||disposed)return;
      explorer.dataset.layoutState=before&&!reduced()?'moving':'idle';
      explorer.dataset.transitionState=before&&!reduced()?'layout':'entering';
      commit();
      if(before&&!reduced())await transitionLayout(before,ticket);
      if(ticket!==revision||disposed)return;
      if(selected!==null){
        explorer.dataset.transitionState='entering';
        await enter(panels[selected],ticket);
      }
      if(ticket===revision){explorer.dataset.transitionState='idle';explorer.setAttribute('aria-busy','false');restoreAnchoring();}
    }catch{
      // A newer click, reduced-motion change, or teardown owns the next state.
    }
  }
  buttons.forEach((button,index)=>{
    const click=()=>{void select(requested===index?null:index);};
    /** @param {KeyboardEvent} event */
    const keydown=event=>{
      let target=index;
      if(event.key==='ArrowDown')target=(index+1)%buttons.length;
      else if(event.key==='ArrowUp')target=(index+buttons.length-1)%buttons.length;
      else if(event.key==='Home')target=0;
      else if(event.key==='End')target=buttons.length-1;
      else return;
      event.preventDefault();buttons[target].focus();
    };
    button.addEventListener('click',click);button.addEventListener('keydown',keydown);
    cleanups.push(()=>{button.removeEventListener('click',click);button.removeEventListener('keydown',keydown);});
  });
  const visualVisibility=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting)visibleVisuals.add(entry.target);else visibleVisuals.delete(entry.target);}
    updateMotion();
  },{threshold:.05});
  explorer.querySelectorAll('.service-viz').forEach(visual=>visualVisibility.observe(visual));
  const sectionVisibility=new IntersectionObserver(entries=>{sectionVisible=entries[0].isIntersecting;updateMotion();},{threshold:.01});
  sectionVisibility.observe(explorer);
  document.addEventListener('visibilitychange',updateMotion);
  motion.addEventListener('change',updateMotion);
  window.addEventListener('pagehide',()=>{
    disposed=true;revision++;restoreAnchoring();cancelAnimations();panels.forEach(stopVisual);
    visualVisibility.disconnect();sectionVisibility.disconnect();
    document.removeEventListener('visibilitychange',updateMotion);motion.removeEventListener('change',updateMotion);
    cleanups.forEach(cleanup=>cleanup());
  },{once:true});
  commit();explorer.dataset.transitionState='idle';explorer.dataset.layoutState='idle';explorer.classList.add('is-enhanced');
})();

