const ids=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north_node','south_node'];
const fixture={schema_version:'celestial_positions.v1',moments:[0,1].map(n=>({id:`moment_${n}`,color:n?'#FB6A4A':'#7DD3FC',bodies:ids.map((id,i)=>({id,kind:id.endsWith('node')?'axis':'sphere',longitude_deg:id==='south_node'?220+n*20:id==='north_node'?40+n*20:(i*31+n*88)%360,latitude_deg:id.endsWith('node')?0:(i%3-1)*6,distance_au:id.endsWith('node')?0:i+0.1,altitude_deg:i%2?30:-20,label:id}))}))};
export function syntheticFixture(id){if(id!=='synthetic_geometry_001')throw new TypeError('Fixture not allowlisted');return structuredClone(fixture);}
export const assetLicences=Object.freeze([{id:'procedural-geometry',license:'MIT',source:'repository/src'},{id:'procedural-surface-pack.v1',license:'MIT',source:'assets/ASSET_MANIFEST.json'},{id:'seeded-stars-and-label-atlas',license:'MIT',source:'repository/src'},{id:'three',license:'MIT',source:'https://github.com/mrdoob/three.js/tree/r180'}]);

export function syntheticRing(){return Array.from({length:12},(_,i)=>({id:`sector_${i}`,start_deg:i*30,width_deg:29,color:i%2?'#334155':'#64748b'}));}
