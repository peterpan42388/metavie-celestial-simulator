// The host supplies a fresh or reusable canvas. No global feature sniffing.
export function probeWebGL(canvas){
 try{
  const context=canvas?.getContext?.('webgl2');
  if(!context||context.isContextLost?.())return {supported:false,mode:'unavailable',reason:'webgl-unavailable',detail:'webgl2-unavailable'};
  const version=context.getParameter(context.VERSION);
  if(typeof version!=='string'||!version.includes('WebGL 2'))return {supported:false,mode:'unavailable',reason:'webgl-unavailable',detail:'invalid-webgl2-context'};
  return {supported:true,mode:'webgl',reason:null,version};
 }catch{return {supported:false,mode:'unavailable',reason:'webgl-unavailable',detail:'context-creation-failed'};}
}
