'use strict';

const abelAcademicLabs = {
  gradient:['Descenso de gradiente','Cálculo multivariable'],
  production:['Optimización de producción','Investigación de operaciones'],
  matrix:['Operaciones por filas','Álgebra lineal'],
  statistics:['Regresión con tus datos','Estadística'],
  roots:['Newton y bisección','Métodos numéricos'],
};
const labNumber = number => Number.isFinite(number)?graphNumber(number).replace('.',','):'—';
const labMoney = new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:2});
const labButton = (action,label,style='') => '<button type="button" class="btn '+style+'" data-lab-action="'+action+'">'+label+'</button>';
const labRange = (name,label,min,max,step,value) => '<label class="lab-range"><span>'+label+
  ' <output data-value="'+name+'"></output></span><input type="range" name="'+name+'" min="'+min+'" max="'+max+
  '" step="'+step+'" value="'+value+'"></label>';
const labInput = (name,label,value,limits='') => '<label>'+label+'<input type="number" name="'+name+
  '" value="'+value+'" step="any" required '+limits+'></label>';
const labCanvas = (label,attrs='') => '<canvas width="760" height="365" role="img" aria-label="'+label+'" '+attrs+'></canvas>';
const labTable = (name,headers,rows,classes=()=> '') =>
  '<div class="lab-scroll"><table aria-label="'+name+'"><thead><tr>'+headers.map(value=>'<th scope="col">'+value+'</th>').join('')+
  '</tr></thead><tbody>'+rows.map((row,i)=>'<tr>'+row.map((value,j)=>'<td class="'+classes(i,j)+'">'+value+'</td>').join('')+
  '</tr>').join('')+'</tbody></table></div>';
const labMetric = (label,value) => '<div><span>'+label+'</span><strong>'+value+'</strong></div>';

function labPlaneAjch(canvas, [xmin,xmax], [ymin,ymax], [xLabel,yLabel]) {
  const ctx = canvas.getContext('2d');
  ctx.reset();
  const width = canvas.width, height = canvas.height;
  const bounds = {left:65,right:width-38,top:25,bottom:height-42};
  const x = v => bounds.left+(v-xmin)/(xmax-xmin)*(bounds.right-bounds.left);
  const y = v => bounds.bottom-(v-ymin)/(ymax-ymin)*(bounds.bottom-bounds.top);
  ctx.fillStyle='#f7fbfb';
  ctx.fillRect(0,0,width,height);
  ctx.font='13px "Segoe UI", sans-serif';
  ctx.lineWidth=1;
  ctx.fillStyle='#43566c';
  ctx.textAlign='center';
  for (const value of graphTicksAjch(xmin,xmax,7)) {
    traceGraphLineAjch(ctx,[x(value),bounds.top],[x(value),bounds.bottom],value===0?'#809aad':'#dce7ea');
    ctx.fillText(labNumber(value),x(value),bounds.bottom+20);
  }
  ctx.textAlign='right';
  for (const value of graphTicksAjch(ymin,ymax,6)) {
    traceGraphLineAjch(ctx,[bounds.left,y(value)],[bounds.right,y(value)],value===0?'#809aad':'#dce7ea');
    ctx.fillText(labNumber(value),bounds.left-8,y(value)+4);
  }
  ctx.fillText(yLabel,bounds.left,bounds.top-8);
  ctx.fillText(xLabel,width-8,height-8);
  ctx.beginPath();
  ctx.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
  ctx.clip();
  const path = points => {
    ctx.beginPath();
    ctx.moveTo(x(points[0][0]),y(points[0][1]));
    for (const [px,py] of points.slice(1)) ctx.lineTo(x(px),y(py));
  };
  return {
    line(points,color,stroke=2.6,dashed=false) {
      path(points);
      ctx.setLineDash(dashed?[7,5]:[]);
      ctx.lineWidth=stroke;
      ctx.strokeStyle=color;
      ctx.stroke();
      ctx.setLineDash([]);
    },
    area(points,color) {
      path(points);
      ctx.closePath();
      ctx.fillStyle=color;
      ctx.fill();
    },
    dot(px,py,color,radius=5) {
      ctx.beginPath();
      ctx.arc(x(px),y(py),radius,0,2*Math.PI);
      ctx.fillStyle=color;
      ctx.fill();
      ctx.strokeStyle='#fff';
      ctx.lineWidth=1.2;
      ctx.stroke();
    },
  };
}

const labGradientHeight = (x,y) => x*x+4*y*y;
const labGradientMesh = Array.from({length:29},(_,row)=>
  Array.from({length:29},(_,col)=>labGradientHeight(-4+col/3.5,-4+row/3.5)));
const defaultStats = 'Horas de estudio,Calificación\n1,9\n2,11\n3,13\n4,14\n5,16\n6,17\n7,11';

function sampleRowsAjch(raw) {
  const lines=raw.trim().split(/\r?\n/).filter(line=>line.trim());
  if (lines.length>121) throw new Error('Pega hasta 120 pares de datos.');
  const split=line=>line.includes('\t')?line.split('\t'):
    line.includes(';')?line.split(';'):line.includes(',')?line.split(','):line.trim().split(/\s+/);
  const parse=value=>{
    const normalized=value.trim().replace(',','.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)?Number(normalized):NaN;
  };
  const titles=split(lines[0]||'');
  const hasHeader=titles.length===2&&titles.every(value=>/\p{L}/u.test(value)&&!Number.isFinite(parse(value)));
  const pairs=lines.slice(Number(hasHeader)).map((line,index)=>{
    const values=split(line).map(parse);
    if(values.length!==2||values.some(value=>!Number.isFinite(value)||Math.abs(value)>1e9))
      throw new Error('Revisa la fila '+(index+1+Number(hasHeader))+'. Usa dos números por fila.');
    return values;
  });
  if(pairs.length<2||pairs.length>120)throw new Error('Pega de 2 a 120 pares de datos.');
  return {pairs,labels:hasHeader?titles.map(value=>value.trim().slice(0,45)):['x','y']};
}

function labRegressionAjch(pairs) {
  if (pairs.length<2) return null;
  const average=axis=>pairs.reduce((sum,point)=>sum+point[axis],0)/pairs.length;
  const x=average(0), y=average(1);
  const variance=pairs.reduce((sum,point)=>sum+(point[0]-x)**2,0);
  if (!variance) return null;
  const slope=pairs.reduce((sum,[a,b])=>sum+(a-x)*(b-y),0)/variance;
  const intercept=y-slope*x;
  const total=pairs.reduce((sum,[,value])=>sum+(value-y)**2,0);
  const error=pairs.reduce((sum,[a,b])=>sum+(b-(slope*a+intercept))**2,0);
  return {slope,intercept,r2:total?Math.max(0,1-error/total):NaN,predict:value=>slope*value+intercept};
}

class AbelAcademicLab {
  constructor(call,esc) {
    this.call=call;
    this.esc=esc;
    this.reset();
  }

  reset() {
    this.active='gradient';
    this.inputs={};
    this.trail=[];
    this.matrix=null;
    this.matrixUndo=[];
    this.matrixRaw='2, 1, 5\n4, 3, 11';
    this.matrixAction='add';
    this.matrixPending=false;
    this.matrixRequest=0;
    this.sample=sampleRowsAjch(defaultStats);
    this.statsRaw=defaultStats;
    this.excluded=new Set();
    this.gradientView={bounds:[-4,4,-4,4],data:{mesh:labGradientMesh,zRange:[0,80],hasValues:true},
      yaw:-.63,pitch:.55,zoom:1};
    this.rootSteps=null;
    this.rootMessage='';
  }

  open(key) {
    if (Object.hasOwn(abelAcademicLabs,key)) this.active=key;
  }

  get title() {return abelAcademicLabs[this.active][0];}

  render() {
    const tabs=Object.entries(abelAcademicLabs).map(([key,[title,course]])=>
      '<button type="button" class="lab-tab" data-open-lab="'+key+'" aria-pressed="'+(key===this.active)+
      '"><strong>'+title+'</strong><small>'+course+'</small></button>').join('');
    return '<div class="academic-page"><div class="subnav"><button type="button" class="btn ghost" data-action="back-university">← Universitario</button></div>'+
      '<header class="academic-heading"><h1>Laboratorios universitarios</h1><p>Prueba los métodos y observa cómo cambian los resultados.</p></header>'+
      '<nav class="lab-tabs" aria-label="Laboratorios">'+tabs+'</nav>'+
      '<section class="lab-card" data-lab="'+this.active+'" aria-labelledby="lab-title"><header><h2 id="lab-title">'+this.title+'</h2></header>'+
      this[this.active+'Markup']()+'</section></div>';
  }

  bind(root) {
    this.root=root;
    for(const input of root.querySelectorAll('[name]')){
      if(input.type!=='checkbox'&&Object.hasOwn(this.inputs,input.name))input.value=this.inputs[input.name];
    }
    root.addEventListener('input',event=>{
      const input=event.target;
      if (!input.name||input.type==='checkbox')return;
      this.inputs[input.name]=input.value;
      if(this.active==='gradient'){
        if(input.name!=='gradientRate')this.trail=[];
        this.gradientUpdate();
      }else if(this.active==='matrix'){
        if(input.name==='matrixText')this.matrixRaw=input.value;
        if(input.name==='rowAction')this.matrixAction=input.value;
        this.matrixControls();
      }else if(this.active==='roots'){
        this.rootSteps=null;
        this.rootsUpdate();
      }else if(input.name==='statRaw')this.statsRaw=input.value;
      else this[this.active+'Update']();
    });
    root.addEventListener('change',event=>{
      const index=event.target.dataset.exclude;
      if(index!==undefined){
        if(event.target.checked)this.excluded.add(Number(index));
        else this.excluded.delete(Number(index));
        this.statisticsUpdate();
      }
    });
    root.addEventListener('click',event=>{
      const action=event.target.closest('[data-lab-action]')?.dataset.labAction;
      if(action)this[action]();
    });
    if(this.active==='gradient')this.bindOrbit();
    if(this.active==='matrix'&&!this.matrix&&!this.matrixPending)this.loadMatrix();
    this[this.active+'Update']();
  }

  query(selector){return this.root.querySelector(selector);}
  number(name){
    const input=this.query('[name="'+name+'"]');
    return input.validity.valid?input.valueAsNumber:NaN;
  }
  output(name,content){this.query('[data-lab-output="'+name+'"]').innerHTML=content;}
  message(content){this.query('[data-lab-message]').textContent=content;}
  fieldValue(name,text){this.query('[data-value="'+name+'"]').value=text;}

  gradientMarkup(){
    return '<div class="lab-columns"><aside class="lab-controls"><p class="lab-formula">z = x² + 4y²</p>'+
      labRange('gradientX','x inicial',-3.5,3.5,.25,2.5)+labRange('gradientY','y inicial',-3.5,3.5,.25,1.75)+
      labRange('gradientRate','Tamaño del paso (α)',.02,.5,.01,.12)+
      '<p class="lab-help">Cada paso resta α veces el gradiente. Prueba α = 0,25 y observa la coordenada y.</p>'+
      '<div class="row">'+labButton('stepGradient','Dar un paso','primary')+labButton('resetGradient','Reiniciar')+'</div>'+
      '<p class="lab-alert" data-lab-message role="status"></p></aside><div class="lab-view">'+
      labCanvas('Superficie de z = x² + 4y² y trayectoria del descenso','tabindex="0" data-orbit')+
      '<p class="lab-legend"><span class="legend-gold"></span> Trayectoria · Arrastra o usa las flechas para girar.</p>'+
      '<div data-lab-output="trail"></div></div></div>';
  }

  bindOrbit(){
    const canvas=this.query('[data-orbit]');
    let pointer;
    const rotate=(dx,dy)=>{
      this.gradientView.yaw+=dx*.012;
      this.gradientView.pitch=clampGraph(this.gradientView.pitch+dy*.01,.14,1.44);
      this.drawGradient();
    };
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      pointer=[event.clientX,event.clientY];
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove',event=>{
      if(!pointer)return;
      rotate(event.clientX-pointer[0],event.clientY-pointer[1]);
      pointer=[event.clientX,event.clientY];
    });
    canvas.addEventListener('lostpointercapture',()=>{pointer=null;});
    canvas.addEventListener('keydown',event=>{
      const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];
      if(!delta)return;
      event.preventDefault();
      rotate(...delta);
    });
  }

  drawGradient(){
    const canvas=this.query('canvas'), ctx=canvas.getContext('2d');
    ctx.fillStyle='#f7fbfb';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font='15px "Segoe UI", sans-serif';
    ctx.lineWidth=1;
    drawSurfacePlotAjch(ctx,canvas.width,canvas.height,this.gradientView,this.trail);
  }

  gradientUpdate(){
    const x=this.number('gradientX'), y=this.number('gradientY');
    const alpha=this.number('gradientRate');
    if(!this.trail.length)this.trail=[[x,y,labGradientHeight(x,y)]];
    this.fieldValue('gradientX',labNumber(x));
    this.fieldValue('gradientY',labNumber(y));
    this.fieldValue('gradientRate',labNumber(alpha));
    const [lastX,lastY]=this.trail.at(-1);
    const outside=Math.abs(lastX)>4||Math.abs(lastY)>4;
    const finished=Math.hypot(lastX,lastY)<1e-6;
    this.query('[data-lab-action="stepGradient"]').disabled=outside||finished||this.trail.length>=25;
    this.message(outside?'La trayectoria salió del dominio visible. Reinicia con un paso menor.':
      finished?'Llegaste al mínimo numérico (0, 0).':this.trail.length>=25?'Se mostraron 24 iteraciones. Reinicia para probar otros valores.':'');
    this.drawGradient();
    const rows=this.trail.map(([a,b,z],index)=>[index,labNumber(a),labNumber(b),labNumber(z)]);
    this.output('trail',labTable('Iteraciones del gradiente',['Paso','x','y','z'],rows.reverse()));
  }

  stepGradient(){
    const [x,y]=this.trail.at(-1), alpha=this.number('gradientRate');
    const nextX=x*(1-2*alpha), nextY=y*(1-8*alpha);
    this.trail.push([nextX,nextY,labGradientHeight(nextX,nextY)]);
    this.gradientUpdate();
  }

  resetGradient(){this.trail=[];this.gradientUpdate();}

  productionMarkup(){
    return '<div class="lab-columns"><aside class="lab-controls"><p>Un lote de polos usa 2 m de tela y 1 hora. Un lote de casacas usa 1 m y 2 horas. El modelo admite lotes fraccionarios.</p>'+
      labRange('productionCloth','Tela disponible (m)',5,100,1,30)+labRange('productionHours','Horas disponibles',5,100,1,24)+
      labRange('productionA','Ganancia por lote de polos',1,100,1,35)+labRange('productionB','Ganancia por lote de casacas',1,100,1,30)+
      '<p class="lab-formula">2x + y ≤ tela<br>x + 2y ≤ horas</p></aside><div class="lab-view">'+
      '<div class="lab-metrics" data-lab-output="production" role="status"></div>'+
      labCanvas('Región de planes factibles y vértices de máxima ganancia')+
      '<p class="lab-legend"><span class="legend-green"></span> Planes factibles <span class="legend-gold"></span> Máxima ganancia</p>'+
      '<div data-lab-output="vertices"></div></div></div>';
  }

  productionUpdate(){
    const names=['productionCloth','productionHours','productionA','productionB'];
    const [cloth,hours,a,b]=names.map(name=>this.number(name));
    names.forEach((name,index)=>this.fieldValue(name,index<2?this.number(name):labMoney.format(this.number(name))));
    const crossing=[(2*cloth-hours)/3,(2*hours-cloth)/3];
    const feasible=[[0,0],[Math.min(cloth/2,hours),0]];
    if(crossing.every(value=>value>0))feasible.push(crossing);
    feasible.push([0,Math.min(cloth,hours/2)]);
    const profit=([x,y])=>a*x+b*y;
    const maximum=Math.max(...feasible.map(profit));
    const best=feasible.filter(point=>Math.abs(profit(point)-maximum)<1e-8);
    this.output('production',labMetric('Ganancia máxima',labMoney.format(maximum))+
      (best.length>1?labMetric('Planes óptimos','Todo el segmento dorado'):
        labMetric('Lotes de polos',labNumber(best[0][0]))+labMetric('Lotes de casacas',labNumber(best[0][1]))));
    const span=1.16*Math.max(cloth,hours);
    const plane=labPlaneAjch(this.query('canvas'),[-span*.027,span],[-span*.027,span],['Lotes de polos','Casacas']);
    plane.area(feasible,'#82c6ad83');
    plane.line([[0,cloth],[cloth/2,0]],'#416d9e');
    plane.line([[0,hours/2],[hours,0]],'#8a65a2');
    if(best.length>1)plane.line(best,'#b4740b',4);
    feasible.forEach(([x,y])=>plane.dot(x,y,best.some(point=>point[0]===x&&point[1]===y)?'#bd7d16':'#257668',6));
    this.output('vertices',labTable('Ganancias en los vértices',['Polos','Casacas','Ganancia'],
      feasible.map(point=>point.map(labNumber).concat(labMoney.format(profit(point))))));
  }

  matrixMarkup(){
    return '<div class="lab-columns"><aside class="lab-controls">'+
      '<label>Matriz aumentada<textarea name="matrixText" maxlength="1200" rows="4" spellcheck="false">'+this.esc(this.matrixRaw)+'</textarea></label>'+
      '<p class="lab-help">Escribe una fila por línea, con comas para separar valores. La última columna guarda los términos independientes.</p>'+
      labButton('loadMatrix','Cargar matriz')+
      '<fieldset class="lab-controls" data-row-controls><legend>Operación elemental</legend>'+
      '<label>Operación<select name="rowAction"><option value="add">Sumar a una fila el múltiplo de otra</option>'+
      '<option value="scale">Multiplicar una fila</option><option value="swap">Intercambiar filas</option></select></label>'+
      '<div class="fields"><label>Fila destino<select name="rowTarget"></select></label>'+
      '<label data-row-source>Otra fila<select name="rowSource"></select></label></div>'+
      '<label data-row-factor>Factor<input name="rowFactor" value="-2" maxlength="35" spellcheck="false"></label>'+
      labButton('changeMatrix','Aplicar operación','primary')+'</fieldset>'+
      '<p class="lab-alert" data-lab-message role="status"></p></aside>'+
      '<div class="lab-view matrix-view"><p class="lab-formula" data-lab-output="operation" role="status"></p>'+
      '<div data-lab-output="matrix"></div><p data-lab-output="resolution"></p>'+
      labButton('undoMatrix','Deshacer último paso')+'</div></div>';
  }

  matrixControls(){
    this.query('[data-row-source]').hidden=this.matrixAction==='scale';
    this.query('[data-row-factor]').hidden=this.matrixAction==='swap';
    const controls=this.query('[data-row-controls]');
    controls.disabled=!this.matrix||this.matrixPending;
    this.query('[data-lab-action="loadMatrix"]').disabled=this.matrixPending;
    this.query('[data-lab-action="undoMatrix"]').disabled=!this.matrixUndo.length||this.matrixPending;
    for(const name of ['rowTarget','rowSource']){
      const select=this.query('[name="'+name+'"]'), count=this.matrix?.rows.length||0;
      if(select.options.length!==count){
        select.innerHTML=Array.from({length:count},(_,index)=>'<option value="'+index+'">F'+(index+1)+'</option>').join('');
        select.selectedIndex=Math.min(count-1,Number(this.inputs[name]??(name==='rowTarget'?1:0)));
      }
    }
  }

  matrixUpdate(){
    this.query('[name="rowAction"]').value=this.matrixAction;
    this.matrixControls();
    const rows=this.matrix?.rows;
    if(!rows){this.output('operation','Carga una matriz para empezar.');this.output('matrix','');return;}
    const previous=this.matrixUndo.at(-1)?.rows;
    this.output('operation',this.esc(this.matrix.label));
    this.output('matrix',labTable('Matriz actual',['Fila',...rows[0].slice(1).map((_,index)=>'x'+(index+1)),'Término independiente'],
      rows.map((row,index)=>['F'+(index+1),...row.map(this.esc)]),(i,j)=>{
        if(j===rows[i].length)return 'matrix-divider'+(previous&&previous[i][j-1]!==rows[i][j-1]?' matrix-changed':'');
        return previous&&(j?previous[i][j-1]!==rows[i][j-1]:this.matrix.changed.includes(i))?'matrix-changed':'';
      }));
    const solution=this.matrix.resolution;
    const text=solution?.type==='unique'?'Solución · '+solution.values.map((value,index)=>'x'+(index+1)+' = '+this.esc(value)).join(', '):
      solution?.type==='none'?'El sistema es incompatible.':solution?.type==='free'?'Hay variables libres y el sistema tiene infinitas soluciones.':
        'Reduce las filas hasta dejar un pivote unitario y ceros en el resto de cada columna pivote.';
    this.output('resolution',text);
  }

  async matrixRequestAction(args,label){
    if(this.matrixPending)return;
    const request=++this.matrixRequest;
    this.matrixPending=true;
    this.matrixControls();
    this.message('');
    try{
      const result=await this.call('matrixStep',args);
      if(request!==this.matrixRequest)return;
      if(args.action==='load')this.matrixUndo=[];
      else this.matrixUndo.push(this.matrix);
      this.matrix={...result,label};
    }catch(error){
      if(request===this.matrixRequest&&this.root.isConnected&&this.active==='matrix')
        this.message(String(error.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,''));
    }finally{
      if(request===this.matrixRequest){
        this.matrixPending=false;
        if(this.root.isConnected&&this.active==='matrix')this.matrixUpdate();
      }
    }
  }

  loadMatrix(){return this.matrixRequestAction({action:'load',matrix:this.matrixRaw},'Matriz aumentada inicial');}

  changeMatrix(){
    const action=this.matrixAction, target=Number(this.query('[name="rowTarget"]').value);
    const source=Number(this.query('[name="rowSource"]').value);
    const factor=this.query('[name="rowFactor"]').value.trim();
    const row='F'+(target+1), other='F'+(source+1);
    const label=action==='swap'?row+' ↔ '+other:action==='scale'?row+' ← ('+factor+') '+row:
      row+' ← '+row+' + ('+factor+') '+other;
    return this.matrixRequestAction({action,matrix:this.matrix.rows,target,source,factor},label);
  }

  undoMatrix(){
    this.matrix=this.matrixUndo.pop();
    this.message('');
    this.matrixUpdate();
  }

  statisticsMarkup(){
    return '<div class="lab-columns"><aside class="lab-controls"><label>Tus datos<textarea name="statRaw" maxlength="12000" rows="9" spellcheck="false">'+this.esc(this.statsRaw)+'</textarea></label>'+
      '<p class="lab-help">Una fila por par X, Y. Si usas coma decimal, separa las columnas con punto y coma o tabulación. Puedes pegar los encabezados.</p>'+
      labButton('loadStats','Cargar datos','primary')+labInput('predictX','Valor de X para predecir',6,'min="-1000000000" max="1000000000"')+
      '<p class="lab-alert" data-lab-message role="status"></p>'+
      '<details class="lab-points"><summary>Excluir puntos del ajuste</summary><div data-lab-output="points"></div></details></aside>'+
      '<div class="lab-view"><div class="lab-metrics" data-lab-output="stats" role="status"></div>'+
      labCanvas('Dispersión de los datos y ajuste lineal')+
      '<p class="lab-legend"><span class="legend-green"></span> Puntos incluidos <span class="legend-gray"></span> Excluidos <span class="legend-blue"></span> Recta ajustada</p></div></div>';
  }

  loadStats(){
    try{
      this.sample=sampleRowsAjch(this.statsRaw);
      this.excluded.clear();
      this.renderPointOptions();
      this.statisticsUpdate();
    }catch(error){this.message(error.message);}
  }

  renderPointOptions(){
    this.output('points',this.sample.pairs.map(([x,y],index)=>'<label class="lab-check"><input type="checkbox" data-exclude="'+index+'"'+
      (this.excluded.has(index)?' checked':'')+'> Punto '+(index+1)+' · ('+labNumber(x)+'; '+labNumber(y)+')</label>').join(''));
  }

  statisticsUpdate(){
    if(!this.query('[data-exclude]'))this.renderPointOptions();
    const {pairs,labels}=this.sample, x=this.number('predictX');
    const fit=labRegressionAjch(pairs.filter((_,index)=>!this.excluded.has(index)));
    const full=labRegressionAjch(pairs);
    this.message(fit?'':'Para ajustar la recta, incluye al menos dos puntos con valores X distintos.');
    const model=fit?'ŷ = '+labNumber(fit.slope)+'x '+(fit.intercept<0?'− ':'+ ')+labNumber(Math.abs(fit.intercept)):'—';
    this.output('stats',labMetric('Recta ajustada',model)+labMetric('R²',fit?labNumber(fit.r2):'—')+
      labMetric('Predicción',fit?labNumber(fit.predict(x)):'—')+labMetric('Con todos los puntos',full?labNumber(full.predict(x)):'—'));
    const bounds=axis=>{
      const values=pairs.map(point=>point[axis]);
      const min=Math.min(...values), max=Math.max(...values);
      const pad=(max-min)*.13||Math.max(1,Math.abs(min)*.03);
      return [min-pad,max+pad];
    };
    const domain=bounds(0), range=bounds(1);
    const plane=labPlaneAjch(this.query('canvas'),domain,range,labels);
    if(fit)plane.line(domain.map(value=>[value,fit.predict(value)]),'#2769a1',3);
    for(const [index,[a,b]] of pairs.entries())plane.dot(a,b,this.excluded.has(index)?'#8899a7':'#167869');
    if(fit&&x>=domain[0]&&x<=domain[1])plane.dot(x,fit.predict(x),'#b77814',7);
  }

  rootsMarkup(){
    return '<div class="lab-columns"><aside class="lab-controls"><p class="lab-formula">f(x) = x³ − c</p>'+
      labInput('rootConstant','Constante c',2,'min="-125" max="125"')+labInput('rootStart','Punto inicial de Newton',1,'min="-10" max="10"')+
      '<div class="fields">'+labInput('rootLeft','Borde a',0,'min="-10" max="10"')+
      labInput('rootRight','Borde b',2,'min="-10" max="10"')+'</div>'+
      '<p class="lab-help">Newton sigue la tangente. Bisección reduce el intervalo que encierra una raíz.</p>'+
      '<div class="row">'+labButton('stepRoots','Dar un paso','primary')+labButton('resetRoots','Reiniciar')+'</div>'+
      '<p class="lab-alert" data-lab-message role="status"></p></aside><div class="lab-view">'+
      labCanvas('Función cúbica, tangente de Newton e intervalo de bisección')+
      '<p class="lab-legend"><span class="legend-blue"></span> Función <span class="legend-gold"></span> Newton <span class="legend-green"></span> Bisección</p>'+
      '<div data-lab-output="roots"></div></div></div>';
  }

  rootsUpdate(){
    const values=['rootConstant','rootStart','rootLeft','rootRight'].map(name=>this.number(name));
    const [c,x0,a,b]=values, valid=values.every(Number.isFinite), f=x=>x*x*x-c;
    const bracket=valid&&a<b&&f(a)*f(b)<=0;
    const initialBisect=bracket?(f(a)===0?a:f(b)===0?b:(a+b)/2):null;
    if(!this.rootSteps){
      this.rootSteps=valid?[{x:x0,bisect:initialBisect,a,b}]:[];
      this.rootMessage='';
    }
    const current=this.rootSteps.at(-1);
    const ready=valid&&this.rootSteps.length<26&&current&&
      (current.x!==null&&Math.abs(f(current.x))>1e-9||current.bisect!==null&&Math.abs(f(current.bisect))>1e-9);
    this.query('[data-lab-action="stepRoots"]').disabled=!ready;
    this.message(!valid?'Completa los valores en los rangos indicados.':
      [!bracket?'Bisección requiere a < b y signos opuestos en los extremos, salvo que un extremo sea la raíz.':'',
        this.rootMessage,this.rootSteps.length>=26?'Se mostraron 25 iteraciones.':''].filter(Boolean).join(' '));
    const canvas=this.query('canvas');
    if(!valid){
      canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
      this.output('roots','');
      return;
    }
    this.output('roots',labTable('Convergencia de los métodos',['Paso','Newton x','|f(x)|','Bisección x','|f(x)|'],
      this.rootSteps.map(({x,bisect},index)=>[index,x===null?'—':labNumber(x),x===null?'—':labNumber(Math.abs(f(x))),
        bisect===null?'—':labNumber(bisect),bisect===null?'—':labNumber(Math.abs(f(bisect)))]).reverse()));
    const points=[Math.cbrt(c),x0,a,b];
    if(current?.x!==null&&Math.abs(current?.x)<30)points.push(current.x);
    const left=Math.min(...points)-.6, right=Math.max(...points)+.6;
    const low=-Math.max(2,Math.abs(f(left)))*1.1, high=Math.max(2,Math.abs(f(right)))*1.1;
    const plane=labPlaneAjch(canvas,[left,right],[low,high],['x','f(x)']);
    plane.line(Array.from({length:101},(_,index)=>{const x=left+(right-left)*index/100;return [x,f(x)];}),'#2769a1');
    if(current?.x!==null&&Math.abs(current?.x)<30){
      const {x}=current, slope=3*x*x;
      plane.line([left,right].map(value=>[value,f(x)+slope*(value-x)]),'#b87c0e',2,true);
      plane.dot(x,f(x),'#b87c0e');
    }
    if(current?.bisect!==null&&current){
      plane.line([[current.a,0],[current.b,0]],'#278371',5);
      plane.dot(current.bisect,0,'#278371',6);
    }
  }

  stepRoots(){
    const previous=this.rootSteps.at(-1), c=this.number('rootConstant');
    const f=x=>x*x*x-c;
    let {x,bisect,a,b}=previous;
    if(x!==null&&Math.abs(f(x))>1e-9){
      const derivative=3*x*x;
      const estimate=derivative>1e-12?x-f(x)/derivative:NaN;
      if(!Number.isFinite(estimate)||Math.abs(estimate)>1e8){
        this.rootMessage='Newton se detuvo. Prueba otro punto inicial.';
        x=null;
      }else x=estimate;
    }
    if(bisect!==null&&Math.abs(f(bisect))>1e-9){
      if(f(a)*f(bisect)<=0)b=bisect;
      else a=bisect;
      bisect=(a+b)/2;
    }
    this.rootSteps.push({x,bisect,a,b});
    this.rootsUpdate();
  }

  resetRoots(){this.rootSteps=null;this.rootsUpdate();}

  financeMarkup(){
    return '<div class="lab-finance"><section><h3>Cuotas y amortización</h3>'+
      '<div class="lab-columns"><aside class="lab-controls">'+labInput('loanPrincipal','Préstamo en soles',12000,'min="1" max="100000000"')+
      labRange('loanRate','Tasa mensual',0,5,.1,1.5)+labRange('loanTerm','Meses',1,120,1,12)+
      '<p class="lab-help">Calcula una cuota fija mensual. Cada mes baja el saldo sobre el que se calculan los intereses.</p></aside>'+
      '<div class="lab-view"><div class="lab-metrics" data-lab-output="loan" role="status"></div><div data-lab-output="payments"></div></div></div></section>'+
      '<section><h3>VAN y TIR de un proyecto</h3><div class="lab-columns"><aside class="lab-controls">'+
      labInput('projectInitial','Inversión inicial en soles',8000,'min="1" max="100000000"')+
      '<label>Ingresos netos anuales en soles<textarea name="projectFlows" rows="3" maxlength="240">2600, 3200, 3800, 2900</textarea></label>'+
      '<p class="lab-help">Separa los montos con comas y usa punto decimal. La TIR se calcula para una inversión inicial seguida de flujos no negativos.</p>'+
      labRange('projectRate','Tasa anual de descuento',0,45,.5,12)+'</aside><div class="lab-view">'+
      '<div class="lab-metrics" data-lab-output="project" role="status"></div>'+
      labCanvas('Valor actual neto según la tasa anual de descuento')+
      '<p class="lab-legend"><span class="legend-blue"></span> VAN según la tasa <span class="legend-gold"></span> VAN a la tasa seleccionada</p>'+
      '<p class="lab-alert" data-lab-message role="status"></p></div></div></section></div>';
  }

  financeUpdate(){
    const principal=this.number('loanPrincipal'), term=this.number('loanTerm'), rate=this.number('loanRate')/100;
    this.fieldValue('loanRate',labNumber(100*rate)+' %');
    this.fieldValue('loanTerm',term);
    if(Number.isFinite(principal)){
      const payment=rate?principal*rate/-Math.expm1(-term*Math.log1p(rate)):principal/term;
      let balance=principal, interestTotal=0;
      const rows=Array.from({length:term},(_,index)=>{
        const interest=balance*rate, capital=index===term-1?balance:payment-interest;
        interestTotal+=interest;
        balance-=capital;
        return [index+1,...[interest,capital,balance].map(value=>labMoney.format(value))];
      });
      this.output('loan',labMetric('Cuota mensual',labMoney.format(payment))+
        labMetric('Interés total',labMoney.format(interestTotal))+labMetric('Total pagado',labMoney.format(principal+interestTotal)));
      this.output('payments',labTable('Amortización mensual',['Mes','Interés','Capital pagado','Saldo'],rows));
    }else{
      this.output('loan','Indica un préstamo entre S/ 1 y S/ 100 000 000.');
      this.output('payments','');
    }
    const initial=this.number('projectInitial'), discount=this.number('projectRate')/100;
    this.fieldValue('projectRate',labNumber(100*discount)+' %');
    const flows=this.query('[name="projectFlows"]').value.trim().split(/[,;\n]/).map(value=>{
      const raw=value.trim();
      return raw?Number(raw):NaN;
    });
    const canvas=this.query('canvas');
    if(!Number.isFinite(initial)||flows.length>24||flows.some(value=>!Number.isFinite(value)||Math.abs(value)>1e8)){
      this.message('Indica una inversión inicial positiva y entre 1 y 24 flujos numéricos.');
      this.output('project','');
      canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
      return;
    }
    const npv=rate=>flows.reduce((total,value,index)=>total+value/(1+rate)**(index+1),-initial);
    const value=npv(discount);
    let irr=null;
    if(flows.every(value=>value>=0)&&flows.some(value=>value>0)){
      let low=-.99999999, high=1e9;
      if(npv(low)>=0&&npv(high)<=0){
        for(let index=0;index<90;index++){
          const middle=(low+high)/2;
          if(npv(middle)>0)low=middle;
          else high=middle;
        }
        irr=(low+high)/2;
      }
    }
    this.output('project',labMetric('Valor actual neto',labMoney.format(value))+
      labMetric('Tasa interna de retorno',irr===null?'—':labNumber(100*irr)+' %'));
    this.message(irr===null?'Para obtener una TIR, usa flujos no negativos con al menos uno positivo.':'');
    const max=Math.max(.45,Math.min(1.5,irr??0)*1.15);
    const points=Array.from({length:101},(_,index)=>{const r=max*index/100;return [r*100,npv(r)];});
    const ys=points.map(point=>point[1]);
    const low=Math.min(0,...ys), high=Math.max(0,...ys), pad=Math.max(1,(high-low)*.12);
    const plane=labPlaneAjch(canvas,[0,max*100],[low-pad,high+pad],['Tasa (%)','VAN']);
    plane.line(points,'#2769a1',3);
    plane.dot(discount*100,value,'#b47711',6);
  }
}
