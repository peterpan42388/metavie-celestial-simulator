import {createView} from '../src/view.js';
import {createGestureController} from '../src/gestures.js';
import {syntheticFixture} from '../src/fixtures.js';
import {glyphs,projection} from '../src/visuals.js';
const fixture=syntheticFixture('synthetic_geometry_001');
// Synthetic visual-composition fixture only. No real astronomical moment.
for(const [index,m]of fixture.moments.entries()){
 const coords=[[-20,13],[8,-10],[30,10],[-31,-8],[18,19],[-5,-18],[25,-17],[80,6],[160,-7],[230,10],[45,0],[225,0]];
 for(const [i,b]of m.bodies.entries()){b.longitude_deg=(coords[i][0]+index*8+360)%360;b.latitude_deg=coords[i][1];b.altitude_deg=i===2?-12:25;b.label=b.id.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
}
const selection={sun:'pending',moon:'discovered',mercury:'disabled',venus:'pending',mars:'pending',jupiter:'discovered',saturn:'pending'};
const params=new URLSearchParams(location.search),mount=document.querySelector('#mount');let view,gestures,renderWidth=1,renderHeight=1,moment='moment_0';
const options=()=>({moment_id:moment,selection,onSelect:e=>{document.querySelector('#selection').textContent=`${glyphs[e.id]??'·'} ${e.id} / ${e.state}`;},visuals:{label_padding:{top:64,bottom:36},quality:params.has('low')?'low_memory':'standard'}});
function viewport(){const r=mount.getBoundingClientRect();return {css_width:r.width,css_height:r.height,render_width:renderWidth,render_height:renderHeight};}
function canvasFactory(){const canvas=document.createElement('canvas');const point=e=>{const r=canvas.getBoundingClientRect();return {pointer_id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;try{canvas.setPointerCapture(e.pointerId);}catch{}gestures?.pointerDown(point(e));});
 canvas.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch'){gestures?.pointerMove(point(e));update();}else if(view){const p=point(e),v=viewport();const id=view.hoverAt(p.x/v.css_width*renderWidth,p.y/v.css_height*renderHeight);canvas.style.cursor=id?'pointer':'grab';}});
 canvas.addEventListener('pointerup',e=>{gestures?.pointerUp(point(e));update();});canvas.addEventListener('pointercancel',e=>gestures?.pointerCancel(point(e)));canvas.addEventListener('lostpointercapture',e=>gestures?.pointerCancel(point(e)));
 canvas.addEventListener('wheel',e=>{e.preventDefault();gestures.wheel({delta:e.deltaY*(e.deltaMode===1?16:1)});update();},{passive:false});return canvas;
}
view=createView(fixture,options(),{canvasFactory,rendererFactory:params.has('fallback')?()=>{throw new Error('Forced visual fallback');}:undefined,onMode:({canvas,mode})=>{gestures?.reset();mount.replaceChildren(canvas);document.querySelector('#mode').textContent=mode==='2d'?'CANVAS / SKY MAP':'WEBGL / LOCAL SKY';mount.dataset.mode=mode;}});
gestures=createGestureController(view,{viewport});
function resize(){const r=mount.getBoundingClientRect();renderWidth=Math.round(r.width);renderHeight=Math.round(r.height);view.render(renderWidth,renderHeight);update();}
function update(){if(!view)return;const c=view.camera;document.querySelector('#camera').textContent=`YAW ${c.yaw_deg.toFixed(0)}°  /  PITCH ${c.pitch_deg.toFixed(0)}°  /  FOV ${c.fov_deg.toFixed(0)}°`;const p=projection(c,renderWidth,renderHeight);const s=view.state,visible=new Set(view.visibleBodyIds);document.querySelector('#positions').replaceChildren(...s.bodies.map(b=>{const pos={visible:visible.has(b.id)},el=document.createElement('div');el.className=`position ${pos.visible?'':'off'}`;const name=document.createElement('span');const symbol=document.createElement('b');symbol.textContent=glyphs[b.id]??'·';name.append(symbol,b.label);const detail=document.createElement('small');const lon=(b.longitude_deg+180)%360-180,reachable=view.mode==='2d'||projection({...c,yaw_deg:Math.max(-72,Math.min(72,-lon)),pitch_deg:Math.max(-52,Math.min(52,b.latitude_deg)),fov_deg:100},renderWidth,renderHeight).point(b.position).visible;detail.textContent=`${b.longitude_deg.toFixed(0)}° · ${pos.visible?'IN VIEW':reachable?(view.mode==='2d'?'ZOOM OUT TO LOCATE':'↗ ROTATE / ZOOM OUT'):'OUTSIDE CONTROLLED ARC'}`;el.append(name,detail);return el;}));}
for(const [id,action]of Object.entries({left:()=>view.orbitBy({delta_x_px:-40,delta_y_px:0,viewport_width:400,viewport_height:400}),right:()=>view.orbitBy({delta_x_px:40,delta_y_px:0,viewport_width:400,viewport_height:400}),minus:()=>view.zoomBy({delta:120}),plus:()=>view.zoomBy({delta:-120}),reset:()=>view.resetCamera()}))document.querySelector(`#${id}`).onclick=()=>{action();update();};
for(const [id,index]of [['a',0],['b',1]])document.querySelector(`#${id}`).onclick=()=>{moment=`moment_${index}`;gestures.reset();view.setOptions(options());document.querySelector('#a').setAttribute('aria-pressed',String(index===0));document.querySelector('#b').setAttribute('aria-pressed',String(index===1));update();};
new ResizeObserver(resize).observe(mount);resize();
// Explicit test/demo handle, not part of the library or its generic data contract.
globalThis.demo={view,fixture,gestures,resize,update,viewport};
