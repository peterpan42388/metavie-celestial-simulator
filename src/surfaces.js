// Original illustrative surface synthesis. No sampled imagery or astronomy data.
export const surfaceIds=['sun','moon','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'];
const palettes={sun:[[255,119,26],[255,215,94]],moon:[[71,80,93],[187,190,188]],mercury:[[76,68,65],[184,164,141]],venus:[[151,99,51],[238,213,152]],earth:[[11,48,95],[32,108,153]],mars:[[111,41,28],[222,127,70]],jupiter:[[140,90,63],[238,217,184]],saturn:[[150,123,76],[233,213,164]],uranus:[[46,126,140],[166,223,220]],neptune:[[22,48,133],[79,132,224]],pluto:[[103,78,68],[216,192,164]]};
const clamp=n=>Math.min(1,Math.max(0,n));
function noise(x,y,seed){let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+seed*982451653)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
const cache=new Map();
export function surfacePixels(id,width=512){
 id=surfaceIds.includes(id)?id:'moon';const key=`${id}:${width}`;if(cache.has(key))return cache.get(key);
 const height=width/2,pixels=new Uint8Array(width*height*4),seed=Math.max(0,surfaceIds.indexOf(id))+1,[a,b]=palettes[id]??palettes.moon;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,grain=noise(Math.floor(u*200),Math.floor(v*100),seed);
  let t=.4+.25*Math.sin(v*60+Math.sin(u*22)*.8)+grain*.22;
  if(['moon','mercury','pluto'].includes(id)){
   t=.48+grain*.2;
   for(let k=0;k<24;k++){const cx=noise(k,2,seed),cy=.12+noise(k,3,seed)*.76,r=.014+noise(k,4,seed)*.07,dx=Math.min(Math.abs(u-cx),1-Math.abs(u-cx)),d=Math.hypot(dx,(v-cy)*.8)/r;if(d<1)t-=.27*(1-d);if(d>.85&&d<1.12)t+=.16;}
  }
  if(id==='sun')t=.45+.17*Math.sin(u*95+Math.cos(v*120))+grain*.35;
  if(id==='mars')t=.48+.22*Math.sin(u*18+Math.sin(v*15)*3)+grain*.22;
  if(['uranus','neptune'].includes(id))t=.45+.18*Math.sin(v*45+Math.cos(u*10))+.09*grain;
  let rgb=a.map((c,i)=>c+(b[i]-c)*clamp(t));
  if(id==='jupiter'){const d=Math.hypot((u-.68)*1.8,(v-.64)*4);if(d<.17)rgb=[177+grain*35,92+grain*25,65];}
  if(id==='earth'){
   const land=Math.sin(u*24+Math.sin(v*19)*2)+Math.cos(u*17-v*21)+Math.sin(u*11+v*35)*.5;
   if(land>.6&&Math.abs(v-.5)<.38)rgb=[36+grain*36,92+grain*54,63+grain*30];
   const clouds=Math.sin(u*35+v*16+Math.sin(v*35)*2)+Math.cos(u*49-v*11);if(clouds>1.25)rgb=rgb.map(c=>c*.35+170);
   if(v<.07||v>.93)rgb=[205,223,225];
  }
  const index=(y*width+x)*4;for(let k=0;k<3;k++)pixels[index+k]=Math.round(rgb[k]);pixels[index+3]=255;
 }
 const result={width,height,pixels};cache.set(key,result);return result;
}
