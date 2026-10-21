const fail = message => { throw new TypeError(message); };
export const finite = (n,min,max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
export function exact(o, keys) { if (!o || typeof o !== 'object' || Array.isArray(o) || Object.keys(o).some(k=>!keys.includes(k))) fail('Unexpected contract field'); }
export function positions(data) {
 exact(data,['schema_version','moments']);
 if(data.schema_version !== 'celestial_positions.v1' || !Array.isArray(data.moments) || !data.moments.length) fail('Invalid positions');
 const ids=new Set();
 for(const m of data.moments){
  exact(m,['id','color','bodies']);
  if(typeof m.id!=='string'||ids.has(m.id)||!/^#[0-9a-f]{6}$/i.test(m.color)||!Array.isArray(m.bodies)) fail('Invalid moment'); ids.add(m.id);
  const bodies=new Set();
  for(const b of m.bodies){
   exact(b,['id','kind','longitude_deg','latitude_deg','distance_au','altitude_deg','label']);
   if(typeof b.id!=='string'||b.id==='earth'||bodies.has(b.id)||!['sphere','axis'].includes(b.kind)||!finite(b.longitude_deg,0,359.99999999999994)||!finite(b.latitude_deg,-90,90)||!finite(b.distance_au,0,1e6)||!finite(b.altitude_deg,-90,90)||typeof b.label!=='string') fail('Invalid body'); bodies.add(b.id);
  }
 }
 return structuredClone(data);
}
export function camera(value={}) {
 exact(value,['yaw_deg','pitch_deg','fov_deg']);
 const c={yaw_deg:0,pitch_deg:0,fov_deg:70,...value};
 if(!finite(c.yaw_deg,-45,45)||!finite(c.pitch_deg,-30,30)||!finite(c.fov_deg,45,85)) fail('Camera outside controlled Earth-view bounds'); return c;
}
export function ring(value=[]) {
 if(!Array.isArray(value)) fail('Invalid ring'); const ids=new Set();
 for(const s of value){ exact(s,['id','start_deg','width_deg','color']); if(typeof s.id!=='string'||ids.has(s.id)||!finite(s.start_deg,0,360)||!finite(s.width_deg,0.001,360)||!/^#[0-9a-f]{6}$/i.test(s.color)) fail('Invalid ring segment'); ids.add(s.id); } return structuredClone(value);
}
