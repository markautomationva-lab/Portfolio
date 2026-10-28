// A single DOM player follows the active image plane; other boards stay images.
/** @param {{root: HTMLElement, stage: HTMLElement, currentProject: ()=>({card: HTMLElement,name: string}|undefined), maximize: (project: {card: HTMLElement,name: string}, trigger: HTMLElement, player?: HTMLVideoElement|null)=>unknown}} options */
export function createGalleryVideo({root,stage,currentProject,maximize}){
 const surface=document.createElement('div');surface.className='gallery-inline-video';surface.hidden=true;
 const controls=document.createElement('div');controls.className='gallery-video-actions';
 const play=document.createElement('button');play.type='button';play.className='gallery-inline-play';play.textContent='▶ Play video';
 const expand=document.createElement('button');expand.type='button';expand.className='gallery-inline-maximize';expand.textContent='Maximize ↗';
 const stop=document.createElement('button');stop.type='button';stop.className='gallery-inline-close';stop.textContent='Close video';stop.hidden=true;
 const status=document.createElement('span');status.setAttribute('role','status');
 controls.append(play,expand,stop,status);stage.append(surface);stage.after(controls);
 const navigation=stage.parentElement?.querySelector('.spatial-navigation');if(navigation)controls.append(navigation);
 /** @type {HTMLVideoElement|null} */ let video=null;
 let projectId='';
 function release(){if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=null;}surface.hidden=true;stop.hidden=true;play.hidden=false;status.textContent='';}
 function update(){
  const project=currentProject();const busy=root.dataset.galleryBusy==='true'||root.dataset.galleryFocus==='true';
  if(busy||projectId!==project?.card.id)release();projectId=project?.card.id||'';
  controls.hidden=root.dataset.galleryFocus==='true'||!project;play.disabled=busy||!project?.card.dataset.videoSrc;expand.disabled=busy;
  if(!project)return;
  play.setAttribute('aria-label','Play '+project.name+' in gallery');expand.setAttribute('aria-label','Maximize '+project.name);
  const panel=JSON.parse(stage.dataset.composition||'[]').find(/** @param {{id:string,corners:number[][]}} item */ item=>item.id===projectId);if(!panel)return;
  const [p0,p1,p2,p3]=[panel.corners[1],panel.corners[3],panel.corners[2],panel.corners[0]];
  const [x0,y0]=p0,[x1,y1]=p1,[x2,y2]=p2,[x3,y3]=p3;
  const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
  const den=dx1*dy2-dx2*dy1;if(Math.abs(den)<.001)return;
  const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
  surface.style.transform=`matrix3d(${(x1-x0+g*x1)/640},${(y1-y0+g*y1)/640},0,${g/640},${(x3-x0+h*x3)/360},${(y3-y0+h*y3)/360},0,${h/360},0,0,1,0,${x0},${y0},0,1)`;
 }
 play.addEventListener('click',()=>{
  const project=currentProject();if(!project?.card.dataset.videoSrc)return;release();
  const player=document.createElement('video');video=player;player.controls=true;player.playsInline=true;player.preload='none';player.poster=project.card.dataset.videoPoster||'';player.src=project.card.dataset.videoSrc;player.setAttribute('aria-label',project.name+' project video');
  const captions=project.card.dataset.videoCaptions;if(captions){const track=document.createElement('track');track.kind='captions';track.srclang='en';track.label='English';track.src=captions;player.append(track);}
  surface.append(player);surface.hidden=false;play.hidden=true;stop.hidden=false;status.textContent='Loading video…';
  player.addEventListener('playing',()=>{if(video===player)status.textContent='';});
  player.addEventListener('error',()=>{if(video===player){release();status.textContent='Video unavailable. Try the expanded view.';}});
  void player.play().catch(()=>{if(video===player)status.textContent='Press play in the video controls to continue.';});update();
 });
 stop.addEventListener('click',release);
 expand.addEventListener('click',()=>{const project=currentProject();const player=video;video=null;release();if(project)void maximize(project,expand,player);});
 const observer=new MutationObserver(update);observer.observe(stage,{attributes:true,attributeFilter:['data-composition']});observer.observe(root,{attributes:true,attributeFilter:['data-gallery-active','data-gallery-busy','data-gallery-focus']});
 function pause(){if(document.hidden)video?.pause();}document.addEventListener('visibilitychange',pause);
 update();return {release,dispose(){release();observer.disconnect();document.removeEventListener('visibilitychange',pause);surface.remove();controls.remove();}};
}



