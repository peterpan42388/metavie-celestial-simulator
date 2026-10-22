// Illustrative world units only; no geographic observer input or real altitude.
export const observationFrame=Object.freeze({
 earth_radius:2.4,
 atmosphere_radius:2.43,
 camera_position:Object.freeze([0,2.85,0]),
 altitude:.45,
});
export function earthOccludes(position){
 const origin=observationFrame.camera_position,delta=position.map((v,i)=>v-origin[i]),length=Math.hypot(...delta);
 if(!length)return false;const direction=delta.map(v=>v/length),b=origin.reduce((n,v,i)=>n+v*direction[i],0),c=origin.reduce((n,v)=>n+v*v,0)-observationFrame.earth_radius**2,disc=b*b-c;
 if(disc<0)return false;const distance=-b-Math.sqrt(disc);return distance>0&&distance<length-1e-6;
}
