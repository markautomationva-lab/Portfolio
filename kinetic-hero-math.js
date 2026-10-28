// Analytic, periodic poses: no accumulated rotations, random bounces or frame-dependent drift.
export const LOOP_SECONDS = 8;
const clamp=x=>Math.max(0,Math.min(1,x));
export function bezier(x,x1,y1,x2,y2){
  x=clamp(x);let t=x;
  for(let i=0;i<7;i++){const u=1-t;const f=3*u*u*t*x1+3*u*t*t*x2+t*t*t-x;const d=3*u*u*x1+6*u*t*(x2-x1)+3*t*t*(1-x2);if(Math.abs(d)<1e-7)break;t=clamp(t-f/d)}
  const u=1-t;return 3*u*u*t*y1+3*u*t*t*y2+t*t*t;
}
export const ease={depart:x=>bezier(x,.33,0,.12,1),inout:x=>bezier(x,.77,0,.175,1),settle:x=>1-Math.pow(1-clamp(x),5)};
export function envelope(t,start,rise,hold,fall){return t<start?0:t<start+rise?ease.depart((t-start)/rise):t<start+rise+hold?1:t<start+rise+hold+fall?1-ease.inout((t-start-rise-hold)/fall):0}
export function leadPose(seconds,intensity=1){
 const t=((seconds%LOOP_SECONDS)+LOOP_SECONDS)%LOOP_SECONDS;
 // Lift → fold → hold → unfold → settle. Eight seconds approximates the visible opening motif.
 const lift=envelope(t,.2,1.5,3.8,1.9);
 const fold=envelope(t,.55,1.1,1.35,1.5)*.8+envelope(t,4.55,.8,.35,1.05)*.55;
 return {lift:(.12+lift*.56)*intensity,fold:(.42+fold*.58)*intensity,tilt:envelope(t,.5,1.4,2.9,1.65)*.085*intensity,yaw:envelope(t,.65,1.6,2.6,1.6)*.08*intensity};
}
export function supportPose(seconds,offset,intensity=1){const t=((seconds-offset)%LOOP_SECONDS+LOOP_SECONDS)%LOOP_SECONDS;return envelope(t,0,1.6,.65,1.85)*.09*intensity}
export function leadTurn(seconds,enabled=true){
 const t=((seconds%LOOP_SECONDS)+LOOP_SECONDS)%LOOP_SECONDS;
 // Turn only on the elevated hold; 2π and zero are the same resting orientation.
 if(!enabled||t<=1.9||t>=5.1)return 0;
 return Math.PI*2*ease.inout((t-1.9)/3.2);
}
export function collectionPlan(home,stops){
 let cursor=0,index=0;const visits=[],trips=[];
 while(index<stops.length){
  const count=stops.length-index<=7?stops.length-index:4;
  const trip={start:cursor,riseStart:cursor+.4,visits:[]};cursor+=1.9;let previous=home;
  for(let j=0;j<count;j++){
   const stop=stops[index++],travel=Math.min(3.8,1.6+Math.hypot(stop.x-previous.x,stop.z-previous.z)*.25);
   const visit={start:cursor,arrival:cursor+travel,from:previous,to:stop};
   trip.visits.push(visit);visits.push(visit);cursor=visit.arrival+2.15;previous=stop;
  }
  trip.returnStart=cursor;trip.returnEnd=cursor+Math.min(4.2,1.9+Math.hypot(previous.x-home.x,previous.z-home.z)*.25);trip.last=previous;
  trip.lowerStart=trip.returnEnd+.3;trip.end=trip.lowerStart+2.4;
  trips.push(trip);cursor=trip.end;
 }
 const final=trips.at(-1),restoreStart=cursor+.2;
 return {visits,trips,returnStart:final?.returnStart??0,returnEnd:final?.returnEnd??0,lowerStart:final?.lowerStart??0,restoreStart,duration:restoreStart+2.1};
}
// Cubic power2.inOut: gradual acceleration and deceleration without a sharp midpoint whip.
const glide=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
export function collectionPose(seconds,home,stops,enabled=true){
 const plan=collectionPlan(home,stops),t=((seconds%plan.duration)+plan.duration)%plan.duration;
 if(!enabled||!stops.length)return {x:home.x,z:home.z,lift:0,t,duration:plan.duration,returnEnd:plan.returnEnd,absorptions:[]};
 const trip=plan.trips.find(trip=>t>=trip.start&&t<trip.end);
 const lift=trip?envelope(t,trip.riseStart,1.4,trip.lowerStart-trip.riseStart-1.4,1.7)*.98:0;
 let x=home.x,z=home.z;
 const moves=trip?[...trip.visits.map(v=>({...v,end:v.arrival})),{start:trip.returnStart,end:trip.returnEnd,from:trip.last,to:home}]:[];
 for(const move of moves){if(t<move.start)break;const p=glide((t-move.start)/(move.end-move.start));x=move.from.x+(move.to.x-move.from.x)*p;z=move.from.z+(move.to.z-move.from.z)*p}
 const pickup=trip?.visits.find(v=>t>=v.arrival&&t<v.arrival+1.95);
 const yaw=pickup?Math.PI*2*glide((t-pickup.arrival)/1.95):0;
 const restore=ease.settle(clamp((t-plan.restoreStart)/1.5));
 return {x,z,lift,yaw,t,trip:trip?plan.trips.indexOf(trip)+1:0,tripSize:trip?.visits.length??0,duration:plan.duration,returnEnd:plan.returnEnd,absorptions:plan.visits.map(v=>({progress:glide((t-v.arrival-.15)/1.65),restore}))};
}


