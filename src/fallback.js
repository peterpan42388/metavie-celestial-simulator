import {state,select} from './state.js';
export function drawFallback(ctx,width,height,data,options){
 const s=state(data,options),cx=width/2,cy=height/2,r=Math.min(width,height)*0.37;ctx.fillStyle='#02040a';ctx.fillRect(0,0,width,height);
 const point=(angle,rad=r)=>[cx+Math.sin(angle*Math.PI/180)*rad,cy-Math.cos(angle*Math.PI/180)*rad];
 for(const seg of s.ring){ctx.strokeStyle=seg.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,(seg.start_deg-90)*Math.PI/180,(seg.start_deg+seg.width_deg-90)*Math.PI/180);ctx.stroke();}
 const hits=[];
 for(const b of s.bodies){const [x,y]=point(b.longitude_deg,r*(0.68+0.18*(b.latitude_deg+90)/180));ctx.globalAlpha=b.opacity;ctx.fillStyle=b.color;ctx.beginPath();if(b.kind==='axis'){ctx.moveTo(x,y-7);ctx.lineTo(x+7,y);ctx.lineTo(x,y+7);ctx.lineTo(x-7,y);}else ctx.arc(x,y,b.id==='sun'?10:5,0,2*Math.PI);ctx.fill();ctx.font='12px sans-serif';ctx.fillText(b.label,x+12,y+4);hits.push({id:b.id,x,y});}ctx.globalAlpha=1;
 return {state:s,selectAt(x,y){const hit=hits.find(h=>Math.hypot(x-h.x,y-h.y)<18);if(hit)return select(hit.id,options.selection??{},options.onSelect);const a=(Math.atan2(x-cx,cy-y)*180/Math.PI+360)%360;const seg=s.ring.find(v=>(a-v.start_deg+360)%360<v.width_deg);return Math.abs(Math.hypot(x-cx,y-cy)-r)<14&&seg?select(seg.id,options.selection??{},options.onSelect):false;}};
}
export function fallbackReason({webgl2,contextLost=false,frame_ms=0}){return !webgl2?'webgl2-unavailable':contextLost?'context-lost':frame_ms>33.34?'performance':null;}
