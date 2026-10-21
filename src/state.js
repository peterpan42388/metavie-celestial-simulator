import {positions,camera,ring} from './contracts.js';
export function direction(lon,lat,r=1){ const a=lon*Math.PI/180,b=lat*Math.PI/180; return [r*Math.cos(b)*Math.sin(a),r*Math.sin(b),-r*Math.cos(b)*Math.cos(a)]; }
export function state(data,{moment_id,camera:cam={},ring:segments=[],selection={}}={}){
 const d=positions(data),m=d.moments.find(m=>m.id===moment_id); if(!m) throw new TypeError('Unknown moment');
 return {moment_id:m.id,camera:camera(cam),ring:ring(segments),bodies:m.bodies.map(b=>({...b,position:direction(b.longitude_deg,b.latitude_deg,8+Math.log1p(b.distance_au)),color:b.altitude_deg<0?'#64748b':m.color,opacity:b.altitude_deg<0?0.35:1,selection:selection[b.id]??'disabled'}))};
}
export function select(id,selection,onSelect){ if(['pending','discovered'].includes(selection[id])){ onSelect?.({id,state:selection[id]}); return true; } return false; }
