import {createRenderer} from './scene.js';
import {drawFallback} from './fallback.js';
import {state} from './state.js';
import {camera as validateCamera} from './contracts.js';

// Canvas allocation/mounting stays with the host, including OffscreenCanvas hosts.
export function createView(data, options, {canvasFactory, onMode, rendererFactory=createRenderer}) {
  let currentOptions={...options,camera:validateCamera(options.camera)}, canvas, renderer, fallback, mode, width=1, height=1, disposed=false;
  const lost=event=>{event.preventDefault?.();switchToFallback('context-lost');};
  function release(){canvas?.removeEventListener?.('webglcontextlost',lost);renderer?.dispose();renderer=null;}
  function switchToFallback(reason){
    if(disposed||mode==='2d')return;
    release();canvas=canvasFactory('2d');mode='2d';onMode?.({mode,reason,canvas});render(width,height);
  }
  function render(w,h){
    if(disposed)throw new Error('View disposed');width=w;height=h;
    if(mode==='webgl'){
      try{renderer.render(w,h);}catch{switchToFallback('render-failure');}
    }else{
      canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');fallback=drawFallback(ctx,w,h,data,currentOptions);
    }
  }
  function update(next){state(data,next);currentOptions=next;if(mode==='webgl'){release();try{renderer=rendererFactory(canvas,data,next);canvas.addEventListener?.('webglcontextlost',lost);}catch{switchToFallback('render-failure');}}render(width,height);}
  function changeCamera(next){if(disposed)throw new Error('View disposed');const camera=validateCamera(next);currentOptions={...currentOptions,camera};if(mode==='webgl'&&renderer.setCamera){renderer.setCamera(camera);render(width,height);}else if(mode==='2d')render(width,height);else update(currentOptions);}
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  state(data,currentOptions);
  try{canvas=canvasFactory('webgl');renderer=rendererFactory(canvas,data,currentOptions);mode='webgl';canvas.addEventListener?.('webglcontextlost',lost);onMode?.({mode,canvas});}
  catch{switchToFallback('webgl2-unavailable');}
  return {
    render,
    reportFrameDuration(ms){if(Number.isFinite(ms)&&ms>33.34)switchToFallback('performance');},
    setOptions(next){if(disposed)throw new Error('View disposed');update({...next,camera:next.camera??currentOptions.camera});},
    orbitBy({delta_x_px,delta_y_px,viewport_width,viewport_height}){if(![delta_x_px,delta_y_px,viewport_width,viewport_height].every(Number.isFinite)||viewport_width<=0||viewport_height<=0)throw new TypeError('Invalid orbit delta');const c=currentOptions.camera;changeCamera({...c,yaw_deg:clamp(c.yaw_deg+delta_x_px/viewport_width*144,-72,72),pitch_deg:clamp(c.pitch_deg+delta_y_px/viewport_height*104,-52,52)});},
    zoomBy({delta}){if(!Number.isFinite(delta))throw new TypeError('Invalid zoom delta');changeCamera({...currentOptions.camera,fov_deg:clamp(currentOptions.camera.fov_deg*Math.exp(clamp(delta,-10000,10000)*.001),30,100)});},
    resetCamera(){changeCamera(validateCamera());},
    hoverAt(x,y){if(disposed)return null;const id=mode==='2d'?fallback?.hitAt(x,y):renderer.hitAt?.(x,y,width,height);const focus=id&&['pending','discovered'].includes(currentOptions.selection?.[id])?id:null;if((currentOptions.visuals?.focus_id??null)!==focus){currentOptions={...currentOptions,visuals:{...currentOptions.visuals,focus_id:focus}};if(mode==='webgl')renderer.setFocus?.(focus);render(width,height);}return focus;},
    get camera(){return {...currentOptions.camera};},
    get state(){return state(data,currentOptions);},
    selectAt(x,y){if(disposed||![x,y].every(Number.isFinite)||x<0||y<0||x>=width||y>=height)return false;return mode==='2d'?(fallback?.selectAt(x,y)??false):renderer.selectAt(x,y,width,height);},
    get mode(){return mode;},
    dispose(){release();disposed=true;}
  };
}
