// Host forwards local CSS-pixel coordinates; no event listeners or clock required.
export function createGestureController(view,{viewport,threshold_px=8}={}){
 if(typeof viewport!=='function'||!Number.isFinite(threshold_px)||threshold_px<8)throw new TypeError('Provide viewport and threshold >= 8 CSS px');
 const pointers=new Map();let blocked=false,pinchDistance=0;
 const distance=()=>{const [a,b]=[...pointers.values()];return b?Math.hypot(a.x-b.x,a.y-b.y):0;};
 const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.pointer_id!==undefined;
 return {
  pointerDown(p){if(!valid(p))return;pointers.set(p.pointer_id,{...p,start_x:p.x,start_y:p.y,last_x:p.x,last_y:p.y,moved:false});if(pointers.size>1){blocked=true;pinchDistance=distance();}},
  pointerMove(p){if(!valid(p))return;const prev=pointers.get(p.pointer_id);if(!prev)return;const moved=prev.moved||Math.hypot(p.x-prev.start_x,p.y-prev.start_y)>=threshold_px;pointers.set(p.pointer_id,{...prev,...p,moved});
   if(pointers.size>1){const d=distance();if(d>0&&pinchDistance>0)view.zoomBy({delta:-1000*Math.log(d/pinchDistance)});pinchDistance=d;return;}
   if(blocked)return;if(moved){const v=viewport();view.orbitBy({delta_x_px:p.x-(prev.moved?prev.x:prev.start_x),delta_y_px:p.y-(prev.moved?prev.y:prev.start_y),viewport_width:v.css_width,viewport_height:v.css_height});}
  },
  pointerUp(p){if(!valid(p))return false;const prev=pointers.get(p.pointer_id);if(!prev)return false;const moved=prev.moved||Math.hypot(p.x-prev.start_x,p.y-prev.start_y)>=threshold_px;const tap=!blocked&&!moved&&pointers.size===1;pointers.delete(p.pointer_id);if(pointers.size>=2)pinchDistance=distance();if(!pointers.size){blocked=false;pinchDistance=0;}if(!tap)return false;const v=viewport();return view.selectAt(p.x/v.css_width*v.render_width,p.y/v.css_height*v.render_height);},
  pointerCancel(p){pointers.delete(p.pointer_id);blocked=pointers.size>0;if(!pointers.size)pinchDistance=0;},
  wheel({delta}){if(!Number.isFinite(delta))return;view.zoomBy({delta});},
  reset(){pointers.clear();blocked=false;pinchDistance=0;}
 };
}
