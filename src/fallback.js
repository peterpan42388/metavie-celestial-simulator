import {state,select} from './state.js';
import {stars,projection,labelLayout,glyphs} from './visuals.js';
import {surfacePixels} from './surfaces.js';
const surfaces=new Map();
function drawSurface(ctx,x,y,r,id){
 if(!surfaces.has(id))surfaces.set(id,surfacePixels(id,128));const map=surfaces.get(id),step=1;
 for(let dy=-r;dy<r;dy+=step)for(let dx=-r;dx<r;dx+=step){const nx=dx/r,ny=dy/r,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d),u=(Math.atan2(nx,nz)/(2*Math.PI)+.5)%1,v=Math.acos(Math.max(-1,Math.min(1,-ny)))/Math.PI,i=(Math.floor(v*(map.height-1))*map.width+Math.floor(u*(map.width-1)))*4;const light=id==='sun'?1:Math.max(.24,(-nx*.45-ny*.55+nz*.6)*.7+.3);ctx.fillStyle=`rgb(${Math.round(map.pixels[i]*light)},${Math.round(map.pixels[i+1]*light)},${Math.round(map.pixels[i+2]*light)})`;ctx.fillRect(x+dx,y+dy,step,step);}
}
export function drawFallback(ctx,width,height,data,options){
 const s=state(data,options),visuals=options.visuals??{},cx=width/2,cy=height/2+s.camera.pitch_deg/52*height*.12,r=Math.min(width,height)*.37*(70/s.camera.fov_deg);
 ctx.fillStyle='#040914';ctx.fillRect(0,0,width,height);
 if(visuals.stars!==false){const proj=projection(s.camera,width,height);for(const star of stars){const p=proj.point(star.position);if(!p.visible)continue;ctx.globalAlpha=star.brightness*.6;ctx.fillStyle='#c1d9ed';const size=[.7,1,1.4][star.layer];ctx.fillRect(p.x,p.y,size,size);}ctx.globalAlpha=1;}
 const point=(angle,rad=r)=>[cx+Math.sin((angle+s.camera.yaw_deg)*Math.PI/180)*rad,cy-Math.cos((angle+s.camera.yaw_deg)*Math.PI/180)*rad];
 ctx.strokeStyle='#244050';ctx.lineWidth=.7;ctx.setLineDash?.([2,7]);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);
 for(const seg of s.ring){ctx.strokeStyle=seg.color;ctx.globalAlpha=.45;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,(seg.start_deg+s.camera.yaw_deg-90)*Math.PI/180,(seg.start_deg+s.camera.yaw_deg+seg.width_deg-90)*Math.PI/180);ctx.stroke();}ctx.globalAlpha=1;
 const hits=[],maxDistance=Math.max(1,...s.bodies.map(b=>Math.log1p(b.distance_au)));
 for(const b of s.bodies){const [x,y]=point(b.longitude_deg,r*(.22+.66*Math.log1p(b.distance_au)/maxDistance)),radius=b.id==='sun'?18:b.kind==='axis'?6:b.id==='jupiter'?13:10;ctx.globalAlpha=b.opacity<1?.65:1;
  if(b.id==='sun'){const glow=ctx.createRadialGradient?.(x,y,0,x,y,40);glow?.addColorStop?.(0,'#ffd57b44');glow?.addColorStop?.(1,'#ffd57b00');ctx.fillStyle=glow??'#ffd57b11';ctx.fillRect(x-40,y-40,80,80);}
  if(b.kind==='axis'){ctx.strokeStyle=b.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x,y+6);ctx.lineTo(x-6,y);ctx.closePath();ctx.stroke();}else drawSurface(ctx,x,y,radius,b.id);
  if(b.id==='saturn'){ctx.strokeStyle='#c8b586';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse?.(x,y,20,7,-.3,0,Math.PI*2);ctx.stroke();}
  if(b.selection==='discovered'||(visuals.focus_id===b.id&&b.selection!=='disabled')){ctx.strokeStyle=b.color;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(x,y,radius+4,0,Math.PI*2);ctx.stroke();}
  hits.push({...b,x,y,radius,visible:x>0&&y>0&&x<width&&y<height});
 }ctx.globalAlpha=1;
 const placements=visuals.labels==='none'?[]:labelLayout(hits,width,height,visuals.label_padding);
 for(const item of placements){ctx.globalAlpha=item.selection==='disabled'?.65:.95;ctx.font='12px sans-serif';ctx.fillStyle='#dce8f2';ctx.fillText(`${glyphs[item.id]??'·'} ${visuals.labels==='symbols'?'':item.label}`,item.x,item.y+16);ctx.fillStyle=item.color;ctx.fillRect(item.x,item.y+22,14,1);}ctx.globalAlpha=1;
 function hitAt(x,y){if(![x,y].every(Number.isFinite)||x<0||y<0||x>=width||y>=height)return null;const hit=hits.find(h=>Math.hypot(x-h.x,y-h.y)<Math.max(18,h.radius+4));if(hit)return hit.id;const a=(Math.atan2(x-cx,cy-y)*180/Math.PI-s.camera.yaw_deg+360)%360;const seg=s.ring.find(v=>(a-v.start_deg+360)%360<v.width_deg);return Math.abs(Math.hypot(x-cx,y-cy)-r)<14&&seg?seg.id:null;}
 return {state:s,placements,hits,hitAt,selectAt(x,y){const id=hitAt(x,y);return id?select(id,options.selection??{},options.onSelect):false;}};
}
export function fallbackReason({webgl2,contextLost=false,frame_ms=0}){return !webgl2?'webgl2-unavailable':contextLost?'context-lost':frame_ms>33.34?'performance':null;}
