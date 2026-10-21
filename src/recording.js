import {camera,exact,finite} from './contracts.js';
import {syntheticFixture,assetLicences} from './fixtures.js';
import {state} from './state.js';
export function validateShot(s){
 exact(s,['schema_version','width','height','fps','duration_ms','source','moment_id','camera_keyframes','layers']);
 if(s.schema_version!=='cosmos_shot.v1'||!Number.isInteger(s.width)||!Number.isInteger(s.height)||s.width%2||s.height%2||!finite(s.width,2,3840)||!finite(s.height,2,3840)||!Number.isInteger(s.fps)||!finite(s.fps,1,60)||!finite(s.duration_ms,1,60000))throw new TypeError('Invalid shot');
 exact(s.source,['kind','id']);if(s.source.kind!=='synthetic_fixture')throw new TypeError('Synthetic fixtures only');syntheticFixture(s.source.id);
 if(!Array.isArray(s.camera_keyframes)||!s.camera_keyframes.length)throw new TypeError('Missing camera keyframes');let prev=-1;
 for(const k of s.camera_keyframes){exact(k,['frame','camera']);if(!Number.isInteger(k.frame)||k.frame<=prev)throw new TypeError('Invalid keyframe order');camera(k.camera);prev=k.frame;}
 if(s.camera_keyframes[0].frame!==0)throw new TypeError('First keyframe must be zero');
 exact(s.layers,['labels','ring']);if(Object.values(s.layers).some(v=>v!==false))throw new TypeError('Invalid layers');
 state(syntheticFixture(s.source.id),{moment_id:s.moment_id});return structuredClone(s);
}
export function renderAt(frameIndex,fps,shot){const s=validateShot(shot),count=Math.ceil(s.duration_ms/1000*s.fps);if(fps!==s.fps||!Number.isInteger(frameIndex)||frameIndex<0||frameIndex>=count)throw new RangeError('Invalid frame');
 let a=s.camera_keyframes[0],b=a;for(const k of s.camera_keyframes){if(k.frame<=frameIndex)a=k;else{b=k;break;}b=a;}const t=a===b?0:(frameIndex-a.frame)/(b.frame-a.frame);const cam=Object.fromEntries(Object.keys(camera(a.camera)).map(k=>[k,camera(a.camera)[k]+(camera(b.camera)[k]-camera(a.camera)[k])*t]));return state(syntheticFixture(s.source.id),{moment_id:s.moment_id,camera:cam});}
export async function provenance(shot,environment,hash){const s=validateShot(shot);return {schema_version:'cosmos_provenance.v1',simulator_release:'0.1.0',fixture_id:s.source.id,fixture_hash:await hash(JSON.stringify(syntheticFixture(s.source.id))),shot_hash:await hash(JSON.stringify(s)),assets:assetLicences,environment,render_settings:{width:s.width,height:s.height,fps:s.fps,frames:Math.ceil(s.duration_ms/1000*s.fps)}};}
export async function recordFrames(shot,sink){const s=validateShot(shot);for(let frame=0;frame<Math.ceil(s.duration_ms/1000*s.fps);frame++)await sink({frame,timestamp_us:Math.round(frame*1e6/s.fps),duration_us:Math.round(1e6/s.fps),state:renderAt(frame,s.fps,s)});}
