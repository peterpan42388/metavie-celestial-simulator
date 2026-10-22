import * as THREE from 'three';
import {camera as validateCamera} from './contracts.js';
import {state,direction,select} from './state.js';
import {surfacePixels,surfaceDetails} from './surfaces.js';
import {stars,projection,labelLayout} from './visuals.js';
import {labelTexture} from './label-atlas.js';
import {observationFrame} from './observer.js';
function radialTexture(ring=false){const size=64,bytes=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const d=Math.hypot(x-size/2,y-size/2)/(size/2),a=ring?Math.max(0,1-Math.abs(d-.78)/.055):Math.max(0,1-d)**3;const i=(y*size+x)*4;bytes.set([255,255,255,Math.round(a*255)],i);}const t=new THREE.DataTexture(bytes,size,size);t.needsUpdate=true;return t;}
export function createScene(data,options){
 const s=state(data,options),visuals=options.visuals??{},scene=new THREE.Scene();scene.background=new THREE.Color('#040914');
 const owned=new Set(),pickables=[],raycaster=new THREE.Raycaster();raycaster.params.Line.threshold=.08;
 const camera=new THREE.PerspectiveCamera(s.camera.fov_deg,1,.01,100);camera.position.fromArray(observationFrame.camera_position);camera.rotation.order='YXZ';camera.rotation.set(s.camera.pitch_deg*Math.PI/180,s.camera.yaw_deg*Math.PI/180,0);
 const labelScene=new THREE.Scene(),labelCamera=new THREE.OrthographicCamera(0,1,1,0,-10,10),labels=new Map(),halos=new Map();
 const register=t=>{if(t.isDataTexture){t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;}owned.add(t);return t;};
 scene.add(new THREE.AmbientLight('#a5bedc',.38));const key=new THREE.DirectionalLight('#fff0d7',3.1);key.position.set(-7,10,5);scene.add(key);const rim=new THREE.DirectionalLight('#6a9dce',.5);rim.position.set(5,-2,-8);scene.add(rim);
 if(visuals.stars!==false)for(let layer=0;layer<3;layer++){
  const subset=stars.filter(p=>p.layer===layer),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(subset.flatMap(p=>p.position),3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(subset.flatMap(p=>[p.brightness*.65,p.brightness*.78,p.brightness]),3));const material=new THREE.PointsMaterial({vertexColors:true,size:[.09,.14,.21][layer],transparent:true,opacity:[.55,.65,.72][layer],sizeAttenuation:true,depthWrite:false});const points=new THREE.Points(geometry,material);points.userData.decorative=true;scene.add(points);
 }
 const assetStatus={};
 const earthMap=surfacePixels('earth',visuals.quality==='low_memory'?128:512),earthTexture=register(new THREE.DataTexture(earthMap.pixels,earthMap.width,earthMap.height));earthTexture.needsUpdate=true;earthTexture.colorSpace=THREE.SRGBColorSpace;
 const earthDetail=surfaceDetails('earth',visuals.quality==='low_memory'?64:256),earthNormal=register(new THREE.DataTexture(earthDetail.normal,earthDetail.width,earthDetail.height)),earthRoughness=register(new THREE.DataTexture(earthDetail.roughness,earthDetail.width,earthDetail.height));earthNormal.needsUpdate=true;earthRoughness.needsUpdate=true;
 const earth=new THREE.Mesh(new THREE.SphereGeometry(observationFrame.earth_radius,visuals.quality==='low_memory'?48:96,visuals.quality==='low_memory'?32:64),new THREE.MeshStandardMaterial({map:earthTexture,normalMap:earthNormal,normalScale:new THREE.Vector2(.3,.3),roughnessMap:earthRoughness,roughness:1}));earth.userData={observerReference:true};scene.add(earth);pickables.push(earth);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(observationFrame.atmosphere_radius,visuals.quality==='low_memory'?48:96,visuals.quality==='low_memory'?32:64),new THREE.MeshBasicMaterial({color:'#6eb8ed',transparent:true,opacity:.055,side:THREE.BackSide,depthWrite:false}));atmosphere.userData={observerReference:true};scene.add(atmosphere);

 for(const b of s.bodies){
  const radius=b.id==='sun'?.64:b.id==='jupiter'?.4:b.id==='saturn'?.35:.29;
  const geometry=b.kind==='axis'?new THREE.OctahedronGeometry(.13):new THREE.SphereGeometry(radius,visuals.quality==='low_memory'?20:40,visuals.quality==='low_memory'?12:24);
  let texture;
  if(b.kind!=='axis'){
   try{const asset=visuals.asset_resolver?.(b.id)??visuals.asset_map?.[b.id];if(asset?.isTexture)texture=asset;else if(asset&&typeof asset.width==='number'&&typeof asset.height==='number'){texture=register(new THREE.Texture(asset));texture.needsUpdate=true;}assetStatus[b.id]=texture?'injected':'procedural';}catch{assetStatus[b.id]='procedural-after-resolver-failure';}
   if(!texture){const map=surfacePixels(b.id,visuals.quality==='low_memory'?128:512);texture=register(new THREE.DataTexture(map.pixels,map.width,map.height));texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;}
  }
  const detailOptions={};if(b.kind!=='axis'&&b.id!=='sun'){const detail=surfaceDetails(b.id,visuals.quality==='low_memory'?64:256);for(const [name,bytes]of [['normalMap',detail.normal],['roughnessMap',detail.roughness]]){const map=register(new THREE.DataTexture(bytes,detail.width,detail.height));map.needsUpdate=true;detailOptions[name]=map;}detailOptions.normalScale=new THREE.Vector2(.65,.65);}
  const material=b.kind==='axis'?new THREE.MeshBasicMaterial({color:b.color,transparent:true,opacity:b.opacity}):new THREE.MeshStandardMaterial({...detailOptions,map:texture,roughness:1,metalness:0,transparent:b.opacity<1,opacity:b.opacity<1?.58:1,emissive:b.id==='sun'?'#ffd18a':'#000000',emissiveMap:b.id==='sun'?texture:null,emissiveIntensity:b.id==='sun'?1.35:0});
  const object=new THREE.Mesh(geometry,material);object.position.fromArray(b.position);object.userData={id:b.id,kind:'body',baseRadius:radius};scene.add(object);pickables.push(object);
  if(b.id==='saturn'){
   const rings=new THREE.Mesh(new THREE.RingGeometry(.48,.78,64),new THREE.MeshStandardMaterial({color:'#c8b586',emissive:'#83734c',emissiveIntensity:.28,side:THREE.DoubleSide,transparent:true,opacity:.8,roughness:1}));rings.rotation.set(1.05,.25,.3);rings.position.copy(object.position);rings.userData={id:b.id};scene.add(rings);pickables.push(rings);
   const gap=new THREE.Mesh(new THREE.RingGeometry(.60,.63,64),new THREE.MeshBasicMaterial({color:'#302c28',side:THREE.DoubleSide,transparent:true,opacity:.6}));gap.rotation.copy(rings.rotation);gap.position.copy(rings.position);scene.add(gap);
  }
  if(b.id==='sun'||b.selection!=='disabled'){
   const halo=b.id==='sun'?new THREE.Sprite(new THREE.SpriteMaterial({map:register(radialTexture()),color:'#ffba57',transparent:true,opacity:.27,depthWrite:false})):new THREE.Mesh(b.kind==='axis'?new THREE.OctahedronGeometry(.15):new THREE.SphereGeometry(radius*1.07,32,20),new THREE.MeshBasicMaterial({color:b.color,side:THREE.BackSide,transparent:true,opacity:.25,depthWrite:false}));
   halo.position.copy(object.position);if(b.id==='sun')halo.scale.setScalar(2.7);halo.userData={affordance:true};halo.visible=b.id==='sun'||b.selection==='discovered'||visuals.focus_id===b.id;scene.add(halo);halos.set(b.id,halo);
  }
  if(visuals.labels!=='none'){
   const texture=options.labelTextures?.[b.id]??register(labelTexture(b,visuals.labels));const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,opacity:b.selection==='disabled'?.65:.95}));sprite.center.set(0,1);labelScene.add(sprite);labels.set(b.id,sprite);
  }
 }
 for(const segment of s.ring){const pts=Array.from({length:33},(_,i)=>new THREE.Vector3(...direction(segment.start_deg+segment.width_deg*i/32,0,12)));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:segment.color,transparent:true,opacity:.38}));line.userData={id:segment.id};scene.add(line);pickables.push(line);}
 const horizon=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:180},(_,i)=>new THREE.Vector3(...direction(i*2,0,14)))),new THREE.LineDashedMaterial({color:'#53758b',transparent:true,opacity:.22,dashSize:.12,gapSize:.16}));horizon.computeLineDistances();scene.add(horizon);
 const core={scene,camera,labelScene,labelCamera,state:s,assetStatus,observationFrame,
  setCamera(next){s.camera=validateCamera(next);camera.fov=s.camera.fov_deg;camera.rotation.set(s.camera.pitch_deg*Math.PI/180,s.camera.yaw_deg*Math.PI/180,0);camera.updateProjectionMatrix();},
  setFocus(id){for(const b of s.bodies){const halo=halos.get(b.id);if(halo)halo.visible=b.id==='sun'||b.selection==='discovered'||b.id===id;}},
  layout(width,height){camera.aspect=width/height;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);labelCamera.left=0;labelCamera.right=width;labelCamera.top=height;labelCamera.bottom=0;labelCamera.updateProjectionMatrix();const proj=projection(s.camera,width,height);const items=s.bodies.map(b=>{const point=proj.point(b.position),worldRadius=b.id==='sun'?.64:b.id==='jupiter'?.4:b.id==='saturn'?.78:b.kind==='axis'?.13:.29;return {...b,...point,radius:worldRadius/Math.max(.1,-point.z)*height/(2*Math.tan(s.camera.fov_deg*Math.PI/360))};});const placements=labelLayout(items,width,height,visuals.label_padding);for(const sprite of labels.values())sprite.visible=false;for(const item of placements){const sprite=labels.get(item.id);if(!sprite)continue;sprite.visible=true;sprite.position.set(item.x,height-item.y,1);sprite.scale.set(item.w,item.h,1);}return placements;},
  hitAt(x,y,width,height){if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0||x<0||y<0||x>=width||y>=height)return null;camera.aspect=width/height;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);raycaster.near=camera.near;raycaster.far=camera.far;raycaster.setFromCamera(new THREE.Vector2(x/width*2-1,1-y/height*2),camera);return raycaster.intersectObjects(pickables,false)[0]?.object.userData.id??null;},
  selectAt(x,y,width,height){const id=core.hitAt(x,y,width,height);return id?select(id,options.selection??{},options.onSelect):false;},
  select:id=>select(id,options.selection??{},options.onSelect),
  dispose(){for(const graph of [scene,labelScene])graph.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});for(const texture of owned)texture.dispose();}
 };return core;
}
export function createRenderer(canvas,data,options){const core=createScene(data,options);let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;}catch(error){core.dispose();throw error;}return {...core,render(width,height){renderer.setSize(width,height,false);core.layout(width,height);renderer.autoClear=true;renderer.render(core.scene,core.camera);renderer.autoClear=false;renderer.clearDepth();renderer.render(core.labelScene,core.labelCamera);renderer.autoClear=true;},dispose(){core.dispose();renderer.dispose();}};}
