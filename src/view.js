import {createRenderer} from './scene.js';
import {drawFallback} from './fallback.js';
import {state} from './state.js';

// Canvas allocation/mounting stays with the host, including OffscreenCanvas hosts.
export function createView(data, options, {canvasFactory, onMode, rendererFactory=createRenderer}) {
  let currentOptions=options, canvas, renderer, fallback, mode, width=1, height=1, disposed=false;
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
  state(data,currentOptions);
  try{canvas=canvasFactory('webgl');renderer=rendererFactory(canvas,data,currentOptions);mode='webgl';canvas.addEventListener?.('webglcontextlost',lost);onMode?.({mode,canvas});}
  catch{switchToFallback('webgl2-unavailable');}
  return {
    render,
    reportFrameDuration(ms){if(Number.isFinite(ms)&&ms>33.34)switchToFallback('performance');},
    setOptions(next){state(data,next);currentOptions=next;if(mode==='webgl'){release();try{renderer=rendererFactory(canvas,data,next);canvas.addEventListener?.('webglcontextlost',lost);}catch{switchToFallback('render-failure');}}render(width,height);},
    selectAt(x,y){return mode==='2d'?fallback?.selectAt(x,y):false;},
    get mode(){return mode;},
    dispose(){release();disposed=true;}
  };
}
