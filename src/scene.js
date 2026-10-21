import * as THREE from 'three';
import {state,direction,select} from './state.js';
export function createScene(data,options){
 const s=state(data,options),scene=new THREE.Scene(); scene.background=new THREE.Color('#02040a');
 const camera=new THREE.PerspectiveCamera(s.camera.fov_deg,1,0.01,100); camera.rotation.order='YXZ'; camera.rotation.set(s.camera.pitch_deg*Math.PI/180,s.camera.yaw_deg*Math.PI/180,0);
 for(const b of s.bodies){
  const geometry=b.kind==='axis'?new THREE.OctahedronGeometry(0.13):new THREE.SphereGeometry(b.id==='sun'?0.33:0.15,24,16);
  const object=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:b.color,transparent:true,opacity:b.opacity}));object.position.fromArray(b.position);object.userData={id:b.id};scene.add(object);
  const texture=options.labelTextures?.[b.id];if(texture){const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,opacity:b.opacity,depthTest:false}));label.position.copy(object.position).add(new THREE.Vector3(0,0.5,0));label.scale.set(1.6,0.4,1);scene.add(label);}
 }
 for(const segment of s.ring){const pts=Array.from({length:33},(_,i)=>new THREE.Vector3(...direction(segment.start_deg+segment.width_deg*i/32,0,12)));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:segment.color}));line.userData={id:segment.id};scene.add(line);}
 const horizon=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:180},(_,i)=>new THREE.Vector3(...direction(i*2,0,14)))),new THREE.LineBasicMaterial({color:'#334155'}));scene.add(horizon);
 return {scene,camera,state:s,select:id=>select(id,options.selection??{},options.onSelect),dispose(){scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}
export function createRenderer(canvas,data,options){const core=createScene(data,options);const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});return {...core,render(width,height){renderer.setSize(width,height,false);core.camera.aspect=width/height;core.camera.updateProjectionMatrix();renderer.render(core.scene,core.camera);},dispose(){core.dispose();renderer.dispose();}};}
