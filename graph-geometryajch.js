'use strict';

const AbelStudioGeometry=(()=>{
  const pointKinds=new Set(['point','midpoint','intersection']);
  const lineKinds=new Set(['line','segment','perpendicular','parallel']);
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  const distance=(a,b)=>Math.hypot(...sub(a,b));
  const along=(a,v,t)=>[a[0]+v[0]*t,a[1]+v[1]*t];

  function intersectionsAjch(first,second){
    if(!first||!second)return [];
    if(lineKinds.has(first.type)&&lineKinds.has(second.type)){
      const a=first.points[0],v=sub(first.points[1],a),b=second.points[0],w=sub(second.points[1],b);
      const determinant=cross(v,w);
      if(Math.abs(determinant)<1e-12)return [];
      const t=cross(sub(b,a),w)/determinant, u=cross(sub(b,a),v)/determinant;
      if(first.type==='segment'&&(t<0||t>1)||second.type==='segment'&&(u<0||u>1))return [];
      return [along(a,v,t)];
    }
    if(first.type==='circle'&&second.type==='circle'){
      const a=first.center,b=second.center,d=distance(a,b),r=first.radius,s=second.radius;
      if(d<1e-12||d>r+s+1e-10||d<Math.abs(r-s)-1e-10)return [];
      const t=(r*r-s*s+d*d)/(2*d),h=Math.sqrt(Math.max(0,r*r-t*t));
      const v=sub(b,a).map(value=>value/d),mid=along(a,v,t);
      const points=[along(mid,[-v[1],v[0]],h)];
      if(h>1e-10)points.push(along(mid,[-v[1],v[0]],-h));
      return points;
    }
    if(first.type==='circle')return intersectionsAjch(second,first);
    if(!lineKinds.has(first.type)||second.type!=='circle')return [];
    const a=first.points[0],v=sub(first.points[1],a),relative=sub(a,second.center);
    const A=dot(v,v),B=2*dot(relative,v),C=dot(relative,relative)-second.radius**2;
    if(A<1e-18)return [];
    const discriminant=B*B-4*A*C;
    if(discriminant< -1e-10)return [];
    const root=Math.sqrt(Math.max(0,discriminant));
    const ts=[(-B-root)/(2*A)];
    if(root>1e-10)ts.push((-B+root)/(2*A));
    return ts.filter(t=>first.type!=='segment'||t>=0&&t<=1).map(t=>along(a,v,t));
  }

  function resolveAjch(objects){
    const cache=new Map();
    const sources=new Map(objects.map(item=>[item.id,item]));
    const active=new Set();
    function get(id){
      if(cache.has(id))return cache.get(id);
      const item=sources.get(id);
      if(!item||active.has(id))return null;
      active.add(id);
      let result=null;
      const refs=(item.refs||[]).map(get);
      if(refs.every(Boolean)){
        const points=refs.map(ref=>ref.position);
        if(item.type==='point')result={...item,position:[...item.position]};
        else if(item.type==='intersection'){
          const points=intersectionsAjch(refs[0],refs[1]);
          if(points[item.branch||0])result={...item,position:points[item.branch||0]};
        }else if(points.every(point=>Array.isArray(point))){
          if(item.type==='midpoint'){
            result={...item,position:points[0].map((value,index)=>(value+points[1][index])/2)};
          }else if(item.type==='circle'){
            const radius=distance(points[0],points[1]);
            if(radius>1e-12)result={...item,center:points[0],radius,points};
          }else if(item.type==='polygon'){
            let twiceArea=0;
            for(let index=0;index<points.length;index++)twiceArea+=cross(points[index],points[(index+1)%points.length]);
            result={...item,points,area:Math.abs(twiceArea)/2};
          }else if(item.type==='angle'){
            const first=sub(points[0],points[1]),last=sub(points[2],points[1]);
            const denominator=Math.hypot(...first)*Math.hypot(...last);
            if(denominator>1e-12){
              const angle=Math.acos(clampGraph(dot(first,last)/denominator,-1,1));
              result={...item,points,angle,degrees:angle*180/Math.PI};
            }
          }else if(item.type==='perpendicular'||item.type==='parallel'){
            const v=sub(points[1],points[0]);
            if(Math.hypot(...v)>1e-12){
              const direction=item.type==='perpendicular'?[-v[1],v[0]]:v;
              result={...item,points:[points[2],along(points[2],direction,1)]};
            }
          }else if(lineKinds.has(item.type)&&distance(points[0],points[1])>1e-12){
            result={...item,points};
          }
        }
      }
      active.delete(id);
      cache.set(id,result);
      return result;
    }
    objects.forEach(item=>get(item.id));
    return cache;
  }

  function removeAjch(objects,id){
    const removed=new Set([id]);
    for(const item of objects){
      if((item.refs||[]).some(ref=>removed.has(ref)))removed.add(item.id);
    }
    return objects.filter(item=>!removed.has(item.id));
  }

  function pointDistanceAjch(point,a,b,segment=true){
    const v=sub(b,a),denominator=dot(v,v);
    if(denominator<1e-12)return distance(point,a);
    const t=dot(sub(point,a),v)/denominator;
    return distance(point,along(a,v,segment?clampGraph(t,0,1):t));
  }

  function hitAjch(objects,cache,pixel,project,shapesOnly=false){
    const visible=objects.filter(item=>item.visible!==false&&cache.get(item.id));
    if(!shapesOnly){
      const points=visible.filter(item=>pointKinds.has(item.type));
      const found=points.map(item=>[item,distance(pixel,project(cache.get(item.id).position))])
        .filter(([,value])=>value<=13).sort((a,b)=>a[1]-b[1])[0];
      if(found)return found[0];
    }
    for(const item of [...visible].reverse()){
      const value=cache.get(item.id);
      if(lineKinds.has(item.type)){
        if(pointDistanceAjch(pixel,...value.points.map(project),item.type==='segment')<=8)return item;
      }else if(item.type==='circle'){
        const center=project(value.center),edge=project([value.center[0]+value.radius,value.center[1]]);
        if(Math.abs(distance(pixel,center)-distance(center,edge))<=8)return item;
      }else if(item.type==='polygon'&&!shapesOnly){
        const points=value.points.map(project);
        if(points.some((point,index)=>pointDistanceAjch(pixel,point,points[(index+1)%points.length])<=8))return item;
      }
    }
    return null;
  }

  function drawAjch(ctx,objects,cache,project,selected,pending=[]){
    for(const item of objects){
      const value=cache.get(item.id);
      if(!value||item.visible===false||pointKinds.has(item.type))continue;
      ctx.save();
      ctx.strokeStyle=item.color;
      ctx.fillStyle=item.color+'20';
      ctx.lineWidth=item.id===selected?3.5:2;
      if(lineKinds.has(item.type)){
        const a=project(value.points[0]),v=sub(project(value.points[1]),a);
        const transform=ctx.getTransform(),limits=[ctx.canvas.width/transform.a,ctx.canvas.height/transform.d];
        let low=item.type==='segment'?0:-Infinity,high=item.type==='segment'?1:Infinity;
        for(let axis=0;axis<2;axis++){
          if(Math.abs(v[axis])<1e-12){
            if(a[axis]<0||a[axis]>limits[axis])high=-Infinity;
          }else{
            const first=-a[axis]/v[axis],last=(limits[axis]-a[axis])/v[axis];
            low=Math.max(low,Math.min(first,last));high=Math.min(high,Math.max(first,last));
          }
        }
        if(low<=high)traceGraphLineAjch(ctx,along(a,v,low),along(a,v,high),item.color);
      }else if(item.type==='circle'){
        const center=project(value.center),x=project([value.center[0]+value.radius,value.center[1]]);
        const y=project([value.center[0],value.center[1]+value.radius]);
        ctx.beginPath();ctx.ellipse(...center,Math.abs(x[0]-center[0]),Math.abs(y[1]-center[1]),0,0,2*Math.PI);ctx.stroke();
      }else if(item.type==='polygon'){
        const points=value.points.map(project);
        ctx.beginPath();ctx.moveTo(...points[0]);
        points.slice(1).forEach(point=>ctx.lineTo(...point));
        ctx.closePath();ctx.fill();ctx.stroke();
      }else if(item.type==='angle'){
        const [a,b,c]=value.points.map(project);
        const start=Math.atan2(a[1]-b[1],a[0]-b[0]),end=Math.atan2(c[1]-b[1],c[0]-b[0]);
        const delta=(end-start+3*Math.PI)%(2*Math.PI)-Math.PI;
        ctx.beginPath();ctx.moveTo(...b);ctx.arc(...b,28,start,start+delta,delta<0);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle=item.color;
        ctx.fillText(graphNumber(value.degrees)+'°',b[0]+Math.cos(start+delta/2)*43,b[1]+Math.sin(start+delta/2)*43);
      }
      ctx.restore();
    }
    for(const item of objects){
      const value=cache.get(item.id);
      if(!value||item.visible===false||!pointKinds.has(item.type))continue;
      const [x,y]=project(value.position);
      ctx.save();
      if(item.id===selected||pending.includes(item.id)){
        ctx.beginPath();ctx.arc(x,y,10,0,2*Math.PI);ctx.fillStyle=item.color+'2b';ctx.fill();
      }
      ctx.beginPath();ctx.arc(x,y,item.type==='point'?4.8:4,0,2*Math.PI);
      ctx.fillStyle=item.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.3;ctx.stroke();
      ctx.font='600 13px "Segoe UI",sans-serif';ctx.fillStyle=item.color;ctx.textAlign='left';
      ctx.fillText(item.label,x+8,y-9);
      ctx.restore();
    }
  }

  function descriptionAjch(value){
    if(!value)return 'No definido';
    if(value.position)return '('+value.position.map(graphNumber).join(', ')+')';
    if(value.type==='circle')return 'r = '+graphNumber(value.radius);
    if(value.type==='polygon')return 'Área = '+graphNumber(value.area);
    if(value.type==='angle')return graphNumber(value.degrees)+'°';
    if(value.points){
      const [a,b]=value.points,dx=b[0]-a[0],dy=b[1]-a[1];
      if(value.type==='segment')return 'Longitud = '+graphNumber(distance(a,b));
      if(Math.abs(dx)<1e-10)return 'x = '+graphNumber(a[0]);
      const slope=dy/dx,intercept=a[1]-slope*a[0];
      return 'y = '+graphNumber(slope)+'x '+(intercept<0?'− ':'+ ')+graphNumber(Math.abs(intercept));
    }
    return '';
  }
  return {resolve: resolveAjch,intersections: intersectionsAjch,remove: removeAjch,draw: drawAjch,hit: hitAjch,description: descriptionAjch,pointKinds,lineKinds};
})();
