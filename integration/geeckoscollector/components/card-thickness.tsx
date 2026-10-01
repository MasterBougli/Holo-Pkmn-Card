import type { CSSProperties } from "react";

// Faces latérales de l'extrusion : 3 px entre z = -1,5 et z = +1,5.
// Les segments aux coins suivent le même rayon que les deux faces.
const radius=14;
const segments=8;
export function CardThickness() {
 return <div className="card-thickness" aria-hidden="true">
  {[-1.5,-1,-.5,0,.5,1,1.5].map(z=><span key={z} className="card-core-layer" style={{transform:"translateZ("+z+"px)"}}/>)}
  <span className="card-edge card-edge-top"/><span className="card-edge card-edge-bottom"/>
  <span className="card-edge card-edge-left"/><span className="card-edge card-edge-right"/>
  {[{x:0,y:0,start:180},{x:100,y:0,start:270},{x:100,y:100,start:0},{x:0,y:100,start:90}].flatMap(corner=>Array.from({length:segments},(_,i)=>{
   const angle=corner.start+(i+.5)*90/segments;
   const rad=angle*Math.PI/180;
   const inset=radius*Math.cos(Math.PI/4/segments);
   const dx=(corner.x? -radius:radius)+inset*Math.cos(rad);
   const dy=(corner.y? -radius:radius)+inset*Math.sin(rad);
   const style={left:"calc("+corner.x+"% + "+dx+"px)",top:"calc("+corner.y+"% + "+dy+"px)",width:(2*radius*Math.sin(Math.PI/4/segments)+.15)+"px",transform:"translate(-50%,-50%) rotateZ("+(angle+90)+"deg) rotateX(90deg)"} as CSSProperties;
   return <span key={corner.start+"-"+i} className="card-edge card-edge-corner" style={style}/>;
  }))}
 </div>;
}
