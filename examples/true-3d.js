import {createView} from '../src/view.js';
import {createGestureController} from '../src/gestures.js';
import {syntheticFixture} from '../src/fixtures.js';
import {glyphs,projection} from '../src/visuals.js';
const fixture=syntheticFixture('synthetic_geometry_001');
// Synthetic visual-composition fixture only. No real astronomical moment.
for(const [index,m]of fixture.moments.entries()){
 const coords=[[-20,18],[-8,8],[35,2],[-28,2],[27,18],[8,0],[22,10],[80,6],[160,-7],[230,10],[45,0],[225,0]];
 for(const [i,b]of m.bodies.entries()){b.longitude_deg=(coords[i][0]+index*8+360)%360;b.latitude_deg=coords[i][1];b.altitude_deg=i===2?-12:25;b.label=b.id.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
}
const selection={sun:'pending',moon:'discovered',mercury:'disabled',venus:'pending',mars:'pending',jupiter:'discovered',saturn:'pending'};
const params=new URLSearchParams(location.search),mount=document.querySelector('#mount');let view,gestures,renderWidth=1,renderHeight=1,moment='moment_0';
const options=()=>({moment_id:moment,selection,onSelect:e=>{document.querySelector('#selection').textContent=`${glyphs[e.id]??'·'} ${e.id} / ${e.state}`;},visuals:{label_padding:{top:64,bottom:56},quality:params.has('low')?'low_memory':'standard'}});
function viewport(){const r=mount.getBoundingClientRect();return {css_width:r.width,css_height:r.height,render_width:renderWidth,render_height:renderHeight};}
function canvasFactory(){const canvas=document.createElement('canvas');const point=e=>{const r=canvas.getBoundingClientRect();return {pointer_id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;try{canvas.setPointerCapture(e.pointerId);}catch{}gestures?.pointerDown(point(e));});
 canvas.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch'){gestures?.pointerMove(point(e));update();}else if(view){const p=point(e),v=viewport();const id=view.hoverAt(p.x/v.css_width*renderWidth,p.y/v.css_height*renderHeight);canvas.style.cursor=id?'pointer':'grab';}});
 canvas.addEventListener('pointerup',e=>{gestures?.pointerUp(point(e));update();});canvas.addEventListener('pointercancel',e=>gestures?.pointerCancel(point(e)));canvas.addEventListener('lostpointercapture',e=>gestures?.pointerCancel(point(e)));
 canvas.addEventListener('wheel',e=>{e.preventDefault();gestures.wheel({delta:e.deltaY*(e.deltaMode===1?16:1)});update();},{passive:false});return canvas;
}
view=createView(fixture,options(),{canvasFactory,require_webgl:true,rendererFactory:params.has('force_unavailable')?()=>{throw new Error('Forced WebGL unavailable');}:undefined,onMode:({canvas,mode,reason})=>{gestures?.reset();mount.dataset.mode=mode;document.querySelector('#mode').textContent=mode==='webgl'?'WebGL renderer':'Rendering unavailable';if(mode==='unavailable'){const panel=document.createElement('div');panel.className='unavailable';panel.setAttribute('role','alert');const title=document.createElement('h2');title.textContent='The renderer is unavailable';const copy=document.createElement('p');copy.textContent='This browser could not keep the scene running. The sky remains unavailable; no alternate view has been substituted.';panel.append(title,copy);mount.replaceChildren(panel);for(const button of document.querySelectorAll('.controls button'))button.disabled=true;mount.dataset.reason=reason;}else mount.replaceChildren(canvas);}});
gestures=createGestureController(view,{viewport});
function resize(){const r=mount.getBoundingClientRect();renderWidth=Math.round(r.width);renderHeight=Math.round(r.height);view.render(renderWidth,renderHeight);update();}
function update(){if(!view)return;const c=view.camera;document.querySelector('#camera').textContent=`YAW ${c.yaw_deg.toFixed(0)}°  /  PITCH ${c.pitch_deg.toFixed(0)}°  /  FOV ${c.fov_deg.toFixed(0)}°`;const p=projection(c,renderWidth,renderHeight);const s=view.state,visible=new Set(view.visibleBodyIds);document.querySelector('#positions').replaceChildren(...s.bodies.map(b=>{const projected=p.point(b.position),pos={visible:visible.has(b.id)},el=document.createElement('div');el.className=`position ${pos.visible?'':'off'}`;const name=document.createElement('span');const symbol=document.createElement('b');symbol.textContent=glyphs[b.id]??'·';name.append(symbol,b.label);const detail=document.createElement('small');detail.textContent=`${b.longitude_deg.toFixed(0)}° · ${view.mode==='unavailable'?'RENDERER UNAVAILABLE':projected.occluded?'BELOW EARTH LIMB':pos.visible?'IN VIEW':'↗ TURN TO LOCATE'}`;el.append(name,detail);return el;}));}
const orbit=(x,y)=>view.orbitBy({delta_x_px:x,delta_y_px:y,viewport_width:360,viewport_height:140});
for(const [id,action]of Object.entries({left:()=>orbit(-30,0),right:()=>orbit(30,0),up:()=>orbit(0,25),down:()=>orbit(0,-25),minus:()=>view.zoomBy({delta:180}),plus:()=>view.zoomBy({delta:-180}),reset:()=>view.resetCamera()}))document.querySelector(`#${id}`).onclick=()=>{action();update();};
for(const [id,index]of [['a',0],['b',1]])document.querySelector(`#${id}`).onclick=()=>{moment=`moment_${index}`;gestures.reset();view.setOptions(options());document.querySelector('#a').setAttribute('aria-pressed',String(index===0));document.querySelector('#b').setAttribute('aria-pressed',String(index===1));update();};
new ResizeObserver(resize).observe(mount);resize();
// Explicit test/demo handle, not part of the library or its generic data contract.
globalThis.demo={view,fixture,gestures,resize,update,viewport};
