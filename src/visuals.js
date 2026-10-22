import * as THREE from 'three';
export const glyphs={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',earth:'⊕',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',north_node:'☊',south_node:'☋'};
export function starField(){let seed=0x1ca7be;const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};return Array.from({length:720},(_,i)=>{const lon=next()*360,lat=Math.asin(next()*2-1)*180/Math.PI,a=lon*Math.PI/180,b=lat*Math.PI/180;return {position:[60*Math.cos(b)*Math.sin(a),60*Math.sin(b),-60*Math.cos(b)*Math.cos(a)],layer:i%3,brightness:.25+next()*.55};});}
export const stars=starField();
export function projection(cam,width,height){const camera=new THREE.PerspectiveCamera(cam.fov_deg,width/height,.01,100);camera.rotation.order='YXZ';camera.rotation.set(cam.pitch_deg*Math.PI/180,cam.yaw_deg*Math.PI/180,0);camera.updateMatrixWorld(true);return {camera,point(position){const local=new THREE.Vector3(...position).applyMatrix4(camera.matrixWorldInverse),p=new THREE.Vector3(...position).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:local.z<0&&Math.abs(p.x)<1&&Math.abs(p.y)<1,z:local.z};}};}
export function labelLayout(items,width,height){
 const occupied=items.filter(i=>i.visible).map(i=>({x:i.x-(i.radius??8)-4,y:i.y-(i.radius??8)-4,w:2*((i.radius??8)+4),h:2*((i.radius??8)+4)})),result=[];
 for(const item of [...items].sort((a,b)=>a.id.localeCompare(b.id))){if(!item.visible)continue;const w=Math.min(142,Math.max(72,item.label.length*7+26)),h=25,r=item.radius??8;
  const candidates=[];for(const pad of [10,28,48])candidates.push([r+pad,-12],[-w-r-pad,-12],[-w/2,-r-h-pad],[-w/2,r+pad],[r+pad,-r-h-pad],[-w-r-pad,r+pad]);
  for(const [dx,dy]of candidates){const x=item.x+dx,y=item.y+dy;if(x<8||y<8||x+w>width-8||y+h>height-8)continue;if(occupied.some(b=>x<b.x+b.w+4&&x+w+4>b.x&&y<b.y+b.h+3&&y+h+3>b.y))continue;const box={...item,x,y,w,h};occupied.push(box);result.push(box);break;}
 }return result;
}
