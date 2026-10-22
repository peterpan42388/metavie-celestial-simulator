import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createScene} from '../src/scene.js';
import {createView} from '../src/view.js';
import {syntheticFixture} from '../src/fixtures.js';

const data=syntheticFixture('synthetic_geometry_001');
function pixel(core,id,w,h){
 core.camera.aspect=w/h;core.camera.updateProjectionMatrix();core.camera.updateMatrixWorld(true);
 const body=core.state.bodies.find(b=>b.id===id);
 const p=new Vector3(...body.position).project(core.camera);
 return [(p.x+1)*w/2,(1-p.y)*h/2];
}
test('actual raycast selects projected bodies across viewport, camera and discovery state',()=>{
 for(const [width,height] of [[800,600],[1080,1920]])for(const status of ['pending','discovered']){
  const events=[],core=createScene(data,{moment_id:'moment_0',camera:{yaw_deg:-10,pitch_deg:5,fov_deg:100},selection:{sun:status,moon:status},onSelect:e=>events.push(e)});
  for(const id of ['sun','moon']){assert.equal(core.selectAt(...pixel(core,id,width,height),width,height),true);assert.deepEqual(events.at(-1),{id,state:status});}
  assert.equal(core.selectAt(0,0,width,height),false);core.dispose();
 }
});
test('raycast refuses disabled bodies, invalid coordinates and offscreen bodies',()=>{
 const events=[],core=createScene(data,{moment_id:'moment_0',selection:{sun:'disabled'},onSelect:e=>events.push(e)});
 assert.equal(core.selectAt(...pixel(core,'sun',800,600),800,600),false);
 for(const point of [[NaN,0],[0,Infinity],[-1,2],[800,2],[2,600]])assert.equal(core.selectAt(...point,800,600),false);
 assert.equal(core.selectAt(0,0,0,600),false);assert.deepEqual(events,[]);core.dispose();
});
test('view forwards viewport picking, refreshes allowlist/moment and rejects after disposal',()=>{
 const events=[];let core;
 const opts={moment_id:'moment_0',selection:{sun:'pending'},onSelect:e=>events.push(e)};
 const view=createView(data,opts,{canvasFactory:()=>({}),rendererFactory:(_,d,o)=>{core=createScene(d,o);return {...core,render(){}};}});
 view.render(800,600);assert.equal(view.selectAt(...pixel(core,'sun',800,600)),true);
 view.setOptions({...opts,selection:{}});assert.equal(view.selectAt(...pixel(core,'sun',800,600)),false);
 view.setOptions({...opts,moment_id:'moment_1',camera:{yaw_deg:-45}});
 assert.equal(view.selectAt(...pixel(core,'sun',800,600)),true);assert.equal(events.length,2);
 view.dispose();assert.equal(view.selectAt(400,300),false);
});
test('axis markers and supplied ring ids participate in raycasts; horizon does not',()=>{
 const events=[],core=createScene(data,{moment_id:'moment_0',selection:{north_node:'discovered',sector:'pending'},ring:[{id:'sector',start_deg:5,width_deg:10,color:'#abcdef'}],onSelect:e=>events.push(e)});
 assert.equal(core.selectAt(...pixel(core,'north_node',1200,600),1200,600),true);
 core.camera.aspect=2;core.camera.updateProjectionMatrix();core.camera.updateMatrixWorld(true);
 const theta=10*Math.PI/180,p=new Vector3(12*Math.sin(theta),0,-12*Math.cos(theta)).project(core.camera);
 assert.equal(core.selectAt((p.x+1)*600,(1-p.y)*300,1200,600),true);
 assert.deepEqual(events.map(e=>e.id),['north_node','sector']);core.dispose();
});
test('a disabled foreground body blocks selection of an overlapping background body',()=>{
 const d=structuredClone(data);const b=d.moments[0].bodies[0];d.moments[0].bodies=[{...b,id:'foreground',distance_au:0},{...b,id:'background',distance_au:10}];
 const core=createScene(d,{moment_id:'moment_0',selection:{background:'pending'},onSelect:()=>assert.fail('occluded body selected')});
 assert.equal(core.selectAt(...pixel(core,'foreground',800,600),800,600),false);core.dispose();
});
