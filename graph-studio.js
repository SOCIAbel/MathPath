'use strict';

const studioColors=['#6655c9','#197aaa','#c45948','#24825c','#b28124','#9a53ad','#388b8f','#bd6383'];
const studioViews={graph:['⌁','Graficación'],geometry:['△','Geometría'],surface:['◇','Gráficos 3D'],
  cas:['x=','CAS'],sheet:['▦','Hoja de cálculo'],probability:['∩','Probabilidad']};
const studioTools=[
  ['move','↖','Mover','Arrastra un punto o mueve el plano.'],
  ['point','A•','Punto','Toca el plano para crear un punto.'],
  ['line','╱','Recta','Elige dos puntos.'],
  ['segment','•─•','Segmento','Elige sus dos extremos.'],
  ['perpendicular','⊥','Perpendicular','Elige dos puntos de la recta y luego el punto de paso.'],
  ['parallel','∥','Paralela','Elige dos puntos de la recta y luego el punto de paso.'],
  ['polygon','△','Polígono','Marca sus vértices. Toca el primero o pulsa Terminar para cerrar.'],
  ['circle','◯','Circunferencia','Elige el centro y un punto de la circunferencia.'],
  ['angle','∠','Ángulo','Elige tres puntos. El segundo es el vértice.'],
  ['midpoint','•◦•','Punto medio','Elige los dos extremos.'],
  ['intersection','⋈','Intersección','Elige dos rectas, segmentos o circunferencias.'],
];
const studioEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studioClone=value=>JSON.parse(JSON.stringify(value));
const studioId=()=> 's'+crypto.randomUUID().replaceAll('-','');
const studioButton=(key,label,title=label)=>'<button type="button" class="studio-button" data-studio-action="'+key+
  '" title="'+studioEscape(title)+'" aria-label="'+studioEscape(title)+'">'+label+'</button>';
const studioNumber=(label,name,value,attrs='')=>'<label>'+label+'<input name="'+name+'" type="number" step="any" value="'+
  studioEscape(value)+'" '+attrs+' required></label>';

function studioMarkup(){
  return '<header class="studio-header"><div class="studio-brand"><strong id="plot-title">Graficador</strong>'+
    '<span data-plot-context hidden></span></div><div class="studio-header-actions">'+
    studioButton('undo','↶','Deshacer')+studioButton('redo','↷','Rehacer')+
    '<button type="button" class="studio-button" data-studio-action="menu" aria-label="Vistas y archivos" aria-expanded="false">☰</button>'+
    '<form method="dialog"><button type="submit" class="studio-button studio-close" aria-label="Cerrar graficador">×</button></form></div></header>'+
    '<nav class="studio-tools" aria-label="Herramientas de construcción">'+studioTools.map(([id,icon,name])=>
      '<button type="button" class="studio-tool" data-studio-tool="'+id+'" title="'+name+'" aria-label="'+name+
      '" aria-pressed="'+(id==='move')+'"><span aria-hidden="true">'+icon+'</span></button>').join('')+
    '<button type="button" class="studio-tool" data-studio-action="slider" aria-label="Deslizador" title="Deslizador"><span>a=2</span></button>'+
    '<span class="studio-toolbar-space"></span>'+
    studioButton('keyboard','⌨','Teclado matemático')+studioButton('settings','⚙','Opciones de la vista')+'</nav>'+
    '<div class="studio-menu" hidden aria-label="Vistas y exportación">'+Object.entries(studioViews).map(([id,[icon,name]])=>
      '<button type="button" data-studio-view="'+id+'"'+(id==='graph'?' data-plot-mode="2"':id==='surface'?' data-plot-mode="3"':'')+
      '><span aria-hidden="true">'+icon+'</span>'+name+'</button>').join('')+
    '<div class="studio-menu-divider"></div>'+studioButton('png','↓ Imagen PNG')+studioButton('export','↓ Construcción JSON')+
    studioButton('import','↑ Abrir construcción')+'<button type="button" class="studio-button" data-graph-notebook>Guardar en cuaderno</button></div>'+
    '<div class="studio-settings" hidden><strong>Vista</strong>'+
    ['grid','axes','equal','snap'].map((id,index)=>'<label><input type="checkbox" data-studio-option="'+id+'"'+
      (id!=='snap'?' checked':'')+'>'+['Cuadrícula','Ejes','Escala 1 a 1','Ajustar a la cuadrícula'][index]+'</label>').join('')+
    studioButton('clear','Borrar construcción')+'</div>'+
    '<div class="studio-body"><aside class="studio-sidebar">'+
    '<div class="studio-algebra"><div class="studio-sidebar-head"><strong data-studio-sidebar-title>Álgebra</strong>'+
      '<div class="studio-examples">'+studioButton('examples','Ejemplos')+'</div></div>'+
      '<div class="studio-example-list" hidden></div><div class="studio-objects"></div><div class="studio-sliders"></div>'+
      '<form class="studio-entry-form"><span aria-hidden="true">+</span><input id="studio-entry" aria-label="Entrada matemática" maxlength="220" '+
      'autocomplete="off" spellcheck="false" placeholder="Ej. y = a*x^2, A = (2, 3)"><button type="submit" aria-label="Añadir entrada">↵</button></form>'+
      '<div class="studio-input-error" role="status"></div>'+
      '<form class="studio-slider-form" hidden><h3>Deslizador</h3><label>Nombre<input name="name" maxlength="1" value="a" required></label>'+
      '<div class="studio-fields">'+studioNumber('Mínimo','min',-5)+studioNumber('Máximo','max',5)+
      studioNumber('Valor','value',2)+studioNumber('Paso','step',.1,'min=".001"')+'</div>'+
      '<button class="studio-primary" type="submit">Crear</button></form>'+
      '<details class="studio-value-table"><summary>Tabla de valores</summary><form class="studio-table-form"><div class="studio-fields">'+
      studioNumber('Desde','from',-2)+studioNumber('Hasta','to',2)+studioNumber('Paso','step',1,'min=".001"')+
      '</div><button type="submit" class="studio-primary">Calcular</button></form><div class="studio-table-results"></div>'+
      studioButton('csv','Descargar CSV')+'</details></div>'+
    '<section class="studio-cas-controls" hidden><h2>Cálculo simbólico</h2><form id="studio-cas-form">'+
      '<label>Operación<select name="operation"><option value="auto">Automática</option><option value="simplify">Simplificar</option><option value="equation">Resolver ecuación</option>'+
      '<option value="factor">Factorizar</option><option value="expand">Desarrollar</option><option value="derivative">Derivar</option>'+
      '<option value="integral">Integrar</option><option value="limit">Límite</option><option value="system">Sistema</option></select></label>'+
      '<label>Expresión<textarea name="problem" maxlength="450" rows="4" spellcheck="false" placeholder="Ej. x^2 + 2*x + 1" required></textarea></label>'+
      '<div class="studio-fields"><label>Variable<select name="variable"><option>x</option><option>y</option><option>t</option></select></label>'+
      '<label>Parámetro<input name="argument" maxlength="100" placeholder="Opcional"></label></div>'+
      '<button type="submit" class="studio-primary">Calcular</button></form></section>'+
    '<section class="studio-sheet-controls" hidden><h2>Hoja de cálculo</h2><p>A1:C10 · Fórmulas con =</p>'+
      '<form class="studio-sheet-form"><div class="studio-sheet-grid"></div><button type="submit" class="studio-primary">Calcular y graficar</button></form>'+
      '<p class="studio-sheet-hint">Ej. =A1*2 o =SUM(A1:A5)</p><div class="studio-sheet-error" role="status"></div>'+
      studioButton('sheetCsv','Descargar CSV')+'</section>'+
    '<section class="studio-prob-controls" hidden><h2>Probabilidad</h2><form class="studio-prob-form">'+
      '<label>Distribución<select name="distribution"><option value="normal">Normal</option><option value="binomial">Binomial</option></select></label>'+
      '<div data-prob-normal class="studio-fields">'+studioNumber('Media μ','mean',0)+studioNumber('Desviación σ','sd',1,'min=".001"')+'</div>'+
      '<div data-prob-binomial class="studio-fields" hidden>'+studioNumber('Ensayos n','n',10,'min="1" max="150" step="1"')+
      studioNumber('Probabilidad p','p',.5,'min="0" max="1"')+'</div>'+
      '<div class="studio-fields">'+studioNumber('Desde','lower',-1)+studioNumber('Hasta','upper',1)+'</div>'+
      '<button type="submit" class="studio-primary">Calcular</button></form><output class="studio-prob-result"></output></section>'+
    '</aside><section class="studio-main"><div class="studio-view-heading"><strong data-studio-view-title>Graficación</strong>'+
      '<div class="studio-view-actions">'+studioButton('home','⌂','Restablecer vista')+studioButton('fit','⊡','Ajustar construcción')+
      '<button type="button" class="studio-button" data-plot-zoom="in" aria-label="Acercar">+</button>'+
      '<button type="button" class="studio-button" data-plot-zoom="out" aria-label="Alejar">−</button></div></div>'+
      '<div class="studio-canvas-wrap"><canvas class="studio-canvas" tabindex="0" aria-label="Plano cartesiano interactivo"></canvas>'+
      '<div class="studio-tool-hint"><span data-plot-instructions></span>'+studioButton('finish','Terminar')+'</div></div>'+
      '<section class="studio-cas-results" hidden aria-label="Resultados de cálculo simbólico"><div class="studio-cas-empty">Escribe una expresión para calcular.</div></section>'+
      '<footer class="studio-status"><p data-plot-status role="status"></p><output data-plot-readout></output></footer></section></div>'+
    '<section class="studio-keyboard" hidden aria-label="Teclado matemático"><nav>'+
      ['123','f(x)','ABC'].map((label,index)=>'<button type="button" data-studio-keyboard="'+index+'" aria-pressed="'+(index===0)+'">'+label+'</button>').join('')+
      '</nav><div class="studio-keys"></div></section>'+
    '<input type="file" class="studio-file" accept=".json,application/json" hidden>'+
    '<form id="plot-controls" hidden><span data-plot-first-label></span><input name="curve0"><input name="curve1"><input name="curve2">'+
      '<input name="xmin" type="number"><input name="xmax" type="number"><input name="ymin" type="number"><input name="ymax" type="number"></form>';
}

const LegacyGraphWorkspace=GraphWorkspace;
GraphWorkspace=class GraphStudio extends LegacyGraphWorkspace {
  constructor(dialog,call){
    dialog.innerHTML=studioMarkup();
    dialog.classList.add('graph-studio');
    super(dialog,call);
    this.ready=true;
    this.keyboardPage=0;
    this.casHistory=[];
    this.lastMathInput=dialog.querySelector('#studio-entry');
    this.sidebar=dialog.querySelector('.studio-sidebar');
    this.objectList=dialog.querySelector('.studio-objects');
    this.sliderList=dialog.querySelector('.studio-sliders');
    this.hint=dialog.querySelector('[data-plot-instructions]');
    this.menu=dialog.querySelector('.studio-menu');
    this.settings=dialog.querySelector('.studio-settings');
    this.canvas.addEventListener('pointerdown',event=>this.studioPointerDown(event),{capture:true});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      this.canvas.addEventListener(type,event=>this.studioPointerUp(event),{capture:true});
    dialog.addEventListener('submit',event=>this.formSubmit(event));
    dialog.addEventListener('input',event=>this.inputChanged(event));
    dialog.addEventListener('change',event=>this.fieldChanged(event));
    dialog.addEventListener('keydown',event=>this.keyboardControl(event));
    dialog.addEventListener('focusin',event=>{
      if(event.target.matches('#studio-entry,.studio-function-input,#studio-cas-form textarea,[data-sheet-cell]'))
        this.lastMathInput=event.target;
    });
    dialog.querySelector('.studio-keyboard').addEventListener('pointerdown',event=>{
      if(event.target.closest('button'))event.preventDefault();
    });
    dialog.addEventListener('close',()=>{this.editDrag=null;this.pending=[];});
    this.renderKeys();
    this.renderSheet();
  }

  resetWorkspace(){
    super.resetWorkspace();
    this.views[2].expressions=[];
    this.entries={2:[],3:[{id:studioId(),text:'x^2-y^2',visible:true,color:studioColors[0]}]};
    this.geometry=[];
    this.sliders=[];
    this.options={grid:true,axes:true,equal:true,snap:false};
    this.perspective='graph';
    this.tool='move';this.pending=[];this.selected=null;this.editDrag=null;
    this.history=[];this.future=[];this.table=null;
    this.cells=Array.from({length:10},()=>['','','']);
    this.probability={distribution:'normal',mean:0,sd:1,lower:-1,upper:1};
    this.probData=null;this.sheetData=null;this.casHistory=[];
  }

  query(selector){return this.dialog.querySelector(selector);}
  studioCall(action,args={}){return this.call('graph',{studio:{action,...args}});}
  get parameters(){return Object.fromEntries(this.sliders.map(item=>[item.name,item.value]));}
  snapshot(){
    return studioClone({version:1,perspective:this.perspective,entries:this.entries,geometry:this.geometry,
      sliders:this.sliders,bounds:{2:this.views[2].bounds,3:this.views[3].bounds},
      camera:[this.views[3].yaw,this.views[3].pitch,this.views[3].zoom],options:this.options,
      cells:this.cells,probability:this.probability});
  }
  remember(before=this.snapshot()){
    this.history.push(before);
    if(this.history.length>40)this.history.shift();
    this.future=[];
    this.syncHistory();
  }
  syncHistory(){
    if(!this.ready)return;
    this.query('[data-studio-action="undo"]').disabled=!this.history.length;
    this.query('[data-studio-action="redo"]').disabled=!this.future.length;
  }
  restore(state){
    this.perspective=state.perspective;
    this.mode=this.perspective==='surface'?3:2;
    this.entries=studioClone(state.entries);
    this.geometry=studioClone(state.geometry);
    this.sliders=studioClone(state.sliders);
    this.options={...state.options};
    this.cells=studioClone(state.cells);this.probability={...state.probability};
    for(const mode of [2,3]){
      this.views[mode]=this.newView(mode,this.entries[mode].map(entry=>entry.text),{
        bounds:state.bounds[mode],camera:state.camera});
    }
    this.pending=[];this.selected=null;this.tool='move';
    this.syncControls();
    this.renderSheet();
    this.syncProbabilityForm();
    this.refreshView();
  }
  async open(spec){
    if(!this.dialog.open)this.dialog.showModal();
    if(spec?.studio){
      try{
        const state=await this.studioCall('validate',{state:spec.studio});
        this.restore(state);
        this.active.title=spec.title||'';
        this.active.interval=spec.interval;
        this.syncControls();
      }catch(error){this.setStatus(this.error(error),true);}
    }else{
      if(spec){
        this.mode=spec.mode;
        this.perspective=spec.mode===3?'surface':'graph';
        this.views[this.mode]=this.newView(this.mode,spec.expressions,spec);
        this.entries[this.mode]=spec.expressions.map((text,index)=>({id:studioId(),text,visible:true,color:studioColors[index%studioColors.length]}));
        this.geometry=[];this.sliders=[];
      }
      this.syncControls();
      this.refreshView();
    }
    this.history=[];this.future=[];this.syncHistory();
    this.query('#studio-entry').focus({preventScroll:true});
  }
  error(error){return String(error.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,'');}

  syncControls(){
    if(!this.ready)return;
    this.dialog.dataset.perspective=this.perspective;
    this.readout.textContent='';
    const algebra=['graph','geometry','surface'].includes(this.perspective);
    this.query('.studio-algebra').hidden=!algebra;
    this.query('.studio-cas-controls').hidden=this.perspective!=='cas';
    this.query('.studio-sheet-controls').hidden=this.perspective!=='sheet';
    this.query('.studio-prob-controls').hidden=this.perspective!=='probability';
    this.query('.studio-cas-results').hidden=this.perspective!=='cas';
    this.query('.studio-canvas-wrap').hidden=this.perspective==='cas';
    this.query('.studio-view-actions').hidden=this.perspective==='cas'||this.perspective==='probability';
    this.query('[data-graph-notebook]').disabled=this.perspective==='cas';
    this.query('[data-studio-view-title]').textContent=studioViews[this.perspective][1];
    this.query('[data-studio-sidebar-title]').textContent=this.mode===3?'Superficie':'Álgebra';
    this.query('.studio-value-table').hidden=this.mode===3;
    const entry=this.query('#studio-entry');
    entry.placeholder=this.mode===3?'Ej. z = x^2 + y^2':'Ej. y = a*x^2, A = (2, 3)';
    this.query('[data-plot-context]').textContent=this.active.title;
    this.query('[data-plot-context]').hidden=!this.active.title;
    this.dialog.querySelectorAll('[data-studio-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.studioView===this.perspective)));
    this.dialog.querySelectorAll('[data-studio-option]').forEach(input=>{input.checked=this.options[input.dataset.studioOption];});
    this.renderObjects();this.renderSliders();this.syncTools();this.syncRanges();this.syncHistory();
    this.requestPaint();
  }
  syncTools(){
    const geometryEnabled=this.mode===2&&['graph','geometry'].includes(this.perspective);
    for(const button of this.dialog.querySelectorAll('[data-studio-tool]')){
      button.disabled=!geometryEnabled&&button.dataset.studioTool!=='move';
      button.setAttribute('aria-pressed',String(button.dataset.studioTool===this.tool));
    }
    this.query('[data-studio-action="slider"]').disabled=!['graph','geometry','surface'].includes(this.perspective);
    this.query('[data-studio-action="finish"]').hidden=this.tool!=='polygon'||this.pending.length<3;
    this.canvas.style.cursor=this.tool==='move'?'grab':'crosshair';
    const item=studioTools.find(([id])=>id===this.tool);
    this.hint.textContent=this.perspective==='surface'?'Arrastra para girar la superficie.':
      ['sheet','probability'].includes(this.perspective)?'':item[3];
  }
  renderObjects(){
    const focused=document.activeElement;
    const draft=focused?.matches('.studio-function-input')&&this.objectList.contains(focused)?
      {id:focused.dataset.entryEdit,value:focused.value,start:focused.selectionStart,end:focused.selectionEnd}:null;
    const cache=StudioGeometry.resolve(this.geometry);
    const functions=this.entries[this.mode].map(entry=>{
      const result=this.active.studioData?.find(result=>result.id===entry.id);
      return '<div class="studio-object'+(result?.error?' has-error':'')+'" data-entry-id="'+entry.id+'">'+
        '<button type="button" class="studio-visibility" style="--object-color:'+entry.color+'" data-studio-visible="'+entry.id+
        '" aria-pressed="'+entry.visible+'" aria-label="'+(entry.visible?'Ocultar':'Mostrar')+' '+studioEscape(entry.text)+'"></button>'+
        '<div><input class="studio-function-input" data-entry-edit="'+entry.id+'" aria-label="Editar función" maxlength="220" value="'+studioEscape(entry.text)+'" spellcheck="false">'+
        (result?.error?'<small role="status">'+studioEscape(result.error)+'</small>':'')+'</div>'+
        '<input type="color" value="'+entry.color+'" data-studio-color="'+entry.id+'" aria-label="Color de la función">'+
        '<button type="button" class="studio-remove" data-studio-remove="'+entry.id+'" aria-label="Eliminar función">×</button></div>';
    }).join('');
    const geometry=this.mode===2?this.geometry.map(item=>'<div class="studio-object studio-geometry-object'+
      (item.id===this.selected?' is-selected':'')+'" data-geometry-id="'+item.id+'">'+
      '<button type="button" class="studio-visibility" style="--object-color:'+item.color+'" data-studio-visible="'+item.id+
      '" aria-pressed="'+item.visible+'" aria-label="'+(item.visible?'Ocultar ':'Mostrar ')+studioEscape(item.label)+'"></button>'+
      '<button type="button" class="studio-object-select" data-studio-select="'+item.id+'"><strong>'+studioEscape(item.label)+'</strong>'+
      '<small>'+studioEscape(StudioGeometry.description(cache.get(item.id)))+'</small></button>'+
      '<input type="color" value="'+item.color+'" data-studio-color="'+item.id+'" aria-label="Color de '+studioEscape(item.label)+'">'+
      '<button type="button" class="studio-remove" data-studio-remove="'+item.id+'" aria-label="Eliminar '+studioEscape(item.label)+'">×</button></div>').join(''):'';
    this.objectList.innerHTML=functions+geometry;
    if(draft){
      const input=this.objectList.querySelector('[data-entry-edit="'+draft.id+'"]');
      if(input){input.value=draft.value;input.focus({preventScroll:true});input.setSelectionRange(draft.start,draft.end);this.lastMathInput=input;}
    }
  }
  renderSliders(){
    this.sliderList.innerHTML=this.sliders.map(slider=>'<div class="studio-slider"><header><strong>'+slider.name+
      ' = <output data-slider-value="'+slider.name+'">'+graphNumber(slider.value)+'</output></strong>'+
      '<button type="button" data-studio-slider-remove="'+slider.name+'" aria-label="Eliminar deslizador '+slider.name+'">×</button></header>'+
      '<input type="range" min="'+slider.min+'" max="'+slider.max+'" step="'+slider.step+'" value="'+slider.value+
      '" data-studio-slider="'+slider.name+'" aria-label="Deslizador '+slider.name+'">'+
      '<footer><span>'+slider.min+'</span><span>'+slider.max+'</span></footer></div>').join('');
  }
  async requestSamples(){
    clearTimeout(this.sampleTimer);
    if(!this.ready||!this.dialog.open)return;
    if(this.perspective==='probability')return this.calculateProbability();
    if(this.perspective==='sheet')return this.calculateSheet();
    if(this.perspective==='cas')return;
    const mode=this.mode,view=this.active,version=++view.version;
    const entries=studioClone(this.entries[mode]),parameters=this.parameters;
    this.setStatus(entries.length?'Graficando…':'');
    if(!entries.length){view.studioData=[];view.data=null;this.renderObjects();this.requestPaint();return;}
    try{
      const data=await this.studioCall('sample',{mode,entries,bounds:view.bounds,parameters,
        ...(this.table?{table:this.table.xs}:{})});
      if(this.active!==view||view.version!==version||this.mode!==mode)return;
      view.studioData=data.entries;
      view.data=mode===3?data.entries[0]:{
        paths:data.entries.flatMap(result=>result.paths||[]),
        hasValues:data.entries.some(result=>result.hasValues),
      };
      view.expressions=entries.map(entry=>entry.text);
      const bad=data.entries.find(entry=>entry.error);
      this.setStatus(bad?bad.error:'',Boolean(bad));
      this.renderObjects();
      this.renderTable(data.entries);
      this.requestPaint();
    }catch(error){
      if(this.active===view&&view.version===version){this.setStatus(this.error(error),true);this.requestPaint();}
    }
  }
  refreshView(){
    if(this.perspective==='cas'){this.renderCas();return;}
    this.requestSamples();this.requestPaint();
  }

  setStatus(message,error=false){
    super.setStatus(message,error);
    this.status.classList.toggle('studio-error',error);
  }
  setView(perspective){
    this.perspective=perspective;
    this.mode=perspective==='surface'?3:2;
    this.pending=[];this.selected=null;this.tool='move';
    this.setStatus('');
    this.menu.hidden=true;
    this.query('[data-studio-action="menu"]').setAttribute('aria-expanded','false');
    this.syncControls();this.syncProbabilityForm();this.refreshView();
  }
  click(event){
    const button=event.target.closest('button');
    if(!button||!this.ready)return;
    if(button.dataset.studioView){this.setView(button.dataset.studioView);return;}
    if(button.dataset.studioTool){
      this.tool=button.dataset.studioTool;this.pending=[];this.syncTools();this.requestPaint();this.canvas.focus();return;
    }
    if(button.dataset.plotZoom){this.zoom(button.dataset.plotZoom==='in'?1.25:.8);return;}
    if(button.dataset.studioVisible){
      const item=this.entries[this.mode].find(item=>item.id===button.dataset.studioVisible)||
        this.geometry.find(item=>item.id===button.dataset.studioVisible);
      if(item){
        this.remember();item.visible=!item.visible;this.renderObjects();
        if(this.table)this.renderTable(this.views[2].studioData||[]);
        this.requestPaint();
      }
      return;
    }
    if(button.dataset.studioRemove){
      this.remember();
      this.entries[this.mode]=this.entries[this.mode].filter(item=>item.id!==button.dataset.studioRemove);
      this.geometry=StudioGeometry.remove(this.geometry,button.dataset.studioRemove);
      this.selected=null;this.renderObjects();this.refreshView();return;
    }
    if(button.dataset.studioSelect){
      this.selected=button.dataset.studioSelect;this.tool='move';this.syncTools();this.renderObjects();this.requestPaint();this.canvas.focus();return;
    }
    if(button.dataset.studioSliderRemove){
      this.remember();this.sliders=this.sliders.filter(item=>item.name!==button.dataset.studioSliderRemove);
      this.renderSliders();this.requestSamples();return;
    }
    if(button.dataset.studioKeyboard!==undefined){this.keyboardPage=Number(button.dataset.studioKeyboard);this.renderKeys();return;}
    if(button.dataset.studioKey!==undefined){this.pressKey(button.dataset.studioKey);return;}
    if(button.dataset.studioExample){
      this.remember();
      const sample=JSON.parse(button.dataset.studioExample);
      this.entries[this.mode]=sample.map((text,index)=>({id:studioId(),text,visible:true,color:studioColors[index%studioColors.length]}));
      this.query('.studio-example-list').hidden=true;
      this.syncControls();this.requestSamples();return;
    }
    const action=button.dataset.studioAction;
    if(action==='menu'){this.menu.hidden=!this.menu.hidden;button.setAttribute('aria-expanded',String(!this.menu.hidden));}
    else if(action==='settings')this.settings.hidden=!this.settings.hidden;
    else if(action==='keyboard')this.query('.studio-keyboard').hidden=!this.query('.studio-keyboard').hidden;
    else if(action==='slider'){
      const form=this.query('.studio-slider-form');
      form.hidden=!form.hidden;
      if(!form.hidden){
        form.elements.name.value=['a','b','c','k','m','t'].find(name=>!this.sliders.some(slider=>slider.name===name))||'a';
        form.elements.name.focus();
      }
    }else if(action==='undo'||action==='redo'){
      const from=action==='undo'?this.history:this.future,into=action==='undo'?this.future:this.history;
      if(from.length){into.push(this.snapshot());const state=from.pop();this.restore(state);this.syncHistory();}
    }else if(action==='clear'){
      this.remember();this.entries[this.mode]=[];this.geometry=[];this.sliders=[];
      this.pending=[];this.selected=null;this.syncControls();this.requestSamples();
    }else if(action==='home')this.reset();
    else if(action==='fit')this.fitConstruction();
    else if(action==='finish')this.finishPolygon();
    else if(action==='examples')this.showExamples();
    else if(action==='png')this.downloadPng();
    else if(action==='export')this.download(JSON.stringify(this.snapshot(),null,2),'MathPath-construccion.json','application/json');
    else if(action==='import')this.query('.studio-file').click();
    else if(action==='csv')this.exportTable();
    else if(action==='sheetCsv')this.exportSheet();
  }
  async formSubmit(event){
    const form=event.target;
    if(form.method==='dialog'||form===this.form)return;
    event.preventDefault();
    this.query('.studio-input-error').textContent='';
    try{
      if(form.matches('.studio-entry-form')){
        await this.addEntry(form.querySelector('input').value);
        form.reset();form.querySelector('input').focus();
      }else if(form.matches('.studio-slider-form')){
        const values=Object.fromEntries(new FormData(form));
        this.addSlider(values.name,...['value','min','max','step'].map(name=>Number(values[name])));
        form.hidden=true;
      }else if(form.matches('.studio-table-form')){
        const values=Object.fromEntries(new FormData(form));
        const start=Number(values.from),end=Number(values.to),step=Number(values.step);
        if(!Number.isFinite(start)||!Number.isFinite(end)||step<=0||end<start||
          (end-start)/step>100||Math.max(Math.abs(start),Math.abs(end))>1e6)throw Error('Usa un rango de hasta 101 filas y un paso positivo.');
        const xs=Array.from({length:Math.floor((end-start)/step+1e-9)+1},(_,index)=>start+index*step);
        this.table={xs};this.requestSamples();
      }else if(form.id==='studio-cas-form')await this.calculateCas(Object.fromEntries(new FormData(form)));
      else if(form.matches('.studio-sheet-form'))await this.calculateSheet();
      else if(form.matches('.studio-prob-form')){
        const values=Object.fromEntries(new FormData(form));
        this.probability=values.distribution==='normal'?{
          distribution:'normal',...Object.fromEntries(['mean','sd','lower','upper'].map(key=>[key,Number(values[key])]))
        }:{distribution:'binomial',...Object.fromEntries(['n','p','lower','upper'].map(key=>[key,Number(values[key])]))};
        await this.calculateProbability();
      }
    }catch(error){this.setStatus(this.error(error),true);this.query('.studio-input-error').textContent=this.error(error);}
  }
  async addEntry(raw){
    const text=raw.trim();
    if(!text)return;
    if(this.mode===2){
      const point=/^([A-Z][A-Za-z0-9_]{0,12})\s*=\s*\((.+),(.+)\)$/.exec(text);
      if(point){
        const position=await this.studioCall('scalar',{expressions:[point[2],point[3]],parameters:this.parameters});
        const prior=this.geometry.find(item=>item.type==='point'&&item.label===point[1]);
        this.remember();
        if(prior)prior.position=position;
        else this.addGeometry('point',[],{label:point[1],position},false);
        this.renderObjects();this.requestPaint();return;
      }
    }
    const slider=/^([a-wA-D])\s*=\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/.exec(text);
    if(slider&&slider[1]!=='e'){
      const value=Number(slider[2]);
      this.addSlider(slider[1],value,Math.min(-5,value),Math.max(5,value),.1);return;
    }
    if(this.entries[this.mode].length>=(this.mode===3?1:10))throw Error(this.mode===3?'Edita la superficie actual o elimínala antes de añadir otra.':'Puedes añadir hasta diez funciones.');
    this.remember();
    this.entries[this.mode].push({id:studioId(),text,visible:true,color:studioColors[this.entries[this.mode].length%studioColors.length]});
    this.active.interval=null;this.renderObjects();this.requestSamples();
  }
  addSlider(name,value,min,max,step){
    if(!/^[a-wA-D]$/.test(name)||['e','E'].includes(name)||![value,min,max,step].every(Number.isFinite)||
      Math.max(Math.abs(min),Math.abs(max))>1000||min>=max||value<min||value>max||step<.001||step>1000)
      throw Error('Usa una letra libre y un rango válido entre −1000 y 1000.');
    const prior=this.sliders.find(item=>item.name===name);
    if(!prior&&this.sliders.length>=6)throw Error('Puedes usar hasta seis deslizadores.');
    this.remember();
    if(prior)Object.assign(prior,{value,min,max,step});else this.sliders.push({name,value,min,max,step});
    this.renderSliders();this.requestSamples();
  }
  inputChanged(event){
    const input=event.target;
    if(input.dataset.studioSlider){
      const slider=this.sliders.find(item=>item.name===input.dataset.studioSlider);
      if(!slider)return;
      if(!this.sliderBefore)this.sliderBefore=this.snapshot();
      slider.value=input.valueAsNumber;
      this.query('[data-slider-value="'+slider.name+'"]').value=graphNumber(slider.value);
      this.scheduleSamples();
    }
    if(input.dataset.sheetCell){
      const [row,col]=input.dataset.sheetCell.split(',').map(Number);
      this.cells[row][col]=input.value;
    }
  }
  async fieldChanged(event){
    const input=event.target;
    try{
      if(input.dataset.entryEdit){
        const entry=this.entries[this.mode].find(item=>item.id===input.dataset.entryEdit);
        if(entry&&entry.text!==input.value.trim()){
          this.remember();entry.text=input.value.trim();this.active.interval=null;this.requestSamples();
        }
      }
      if(input.dataset.studioOption){
        this.remember();this.options[input.dataset.studioOption]=input.checked;this.requestPaint();
      }
      if(input.dataset.studioColor){
        const item=this.entries[this.mode].find(item=>item.id===input.dataset.studioColor)||
          this.geometry.find(item=>item.id===input.dataset.studioColor);
        if(item){this.remember();item.color=input.value;this.renderObjects();this.requestPaint();}
      }
      if(input.dataset.studioSlider&&this.sliderBefore){
        this.remember(this.sliderBefore);this.sliderBefore=null;this.requestSamples();
      }
      if(input.name==='distribution'){
        this.probability=input.value==='normal'?{distribution:'normal',mean:0,sd:1,lower:-1,upper:1}:
          {distribution:'binomial',n:10,p:.5,lower:3,upper:7};
        this.syncProbabilityForm();
      }
      if(input.matches('.studio-file')&&input.files[0]){
        const file=input.files[0];
        if(file.size>17000)throw Error('Usa una construcción JSON de hasta 17 KB.');
        const state=await this.studioCall('validate',{state:JSON.parse(await file.text())});
        this.remember();this.restore(state);this.setStatus('Construcción abierta.');input.value='';
      }
    }catch(error){this.setStatus(this.error(error),true);}
  }
  submit(){
    // Preserve programmatic submissions from the original graph controls.
    this.remember();
    const texts=this.inputs.slice(0,this.mode===3?1:3).map(input=>input.value.trim()).filter(Boolean);
    this.entries[this.mode]=texts.map((text,index)=>({id:studioId(),text,visible:true,color:studioColors[index]}));
    const bounds=this.ranges.map(input=>input.valueAsNumber);
    if(this.validBounds(bounds))this.active.bounds=bounds;
    this.renderObjects();this.requestSamples();
  }
  showExamples(){
    const list=this.query('.studio-example-list');
    const examples=this.mode===3?graphExamples[3]:[
      ...graphExamples[2],['Circunferencia',['x^2+y^2=9']],['Funciones relacionadas',['f(x)=x^2','g(x)=f(x)-3']]];
    list.innerHTML=examples.map(([name,texts])=>'<button type="button" data-studio-example="'+
      studioEscape(JSON.stringify(texts))+'">'+name+'</button>').join('');
    list.hidden=!list.hidden;
  }
  addGeometry(type,refs,extras={},record=true){
    if(this.geometry.length>=40)throw Error('Puedes crear hasta 40 objetos geométricos.');
    if(record)this.remember();
    const point=StudioGeometry.pointKinds.has(type);
    let label=extras.label;
    if(!label){
      const used=new Set(this.geometry.map(item=>item.label));
      if(point)label='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(name=>!used.has(name))||'P'+(this.geometry.length+1);
      else label=({line:'r',segment:'s',circle:'c',polygon:'pol',angle:'α',parallel:'p',perpendicular:'t'})[type]+(this.geometry.filter(item=>item.type===type).length+1);
    }
    const item={id:studioId(),type,refs:[...refs],label,visible:true,color:point?'#3466ab':studioColors[this.geometry.length%studioColors.length],...extras};
    this.geometry.push(item);this.selected=item.id;
    return item;
  }
  project(point){
    const [xmin,xmax,ymin,ymax]=this.drawingBounds();
    const box=this.plotRect(this.canvas.clientWidth,this.canvas.clientHeight);
    return [box.left+(point[0]-xmin)/(xmax-xmin)*box.width,box.top+(ymax-point[1])/(ymax-ymin)*box.height];
  }
  unproject(pixel){
    const [xmin,xmax,ymin,ymax]=this.active.bounds;
    const box=this.plotRect(this.canvas.clientWidth,this.canvas.clientHeight);
    let point=[xmin+(pixel[0]-box.left)/box.width*(xmax-xmin),ymax-(pixel[1]-box.top)/box.height*(ymax-ymin)];
    if(this.options.snap)point=point.map(value=>Math.round(value*2)/2);
    return point.map(value=>Number(value.toPrecision(10)));
  }
  eventPixel(event){
    const box=this.canvas.getBoundingClientRect();
    return [event.clientX-box.left,event.clientY-box.top];
  }
  studioPointerDown(event){
    if(this.mode!==2||!['graph','geometry'].includes(this.perspective))return;
    if(event.button!==0)return;
    event.stopImmediatePropagation();
    this.canvas.focus({preventScroll:true});
    const pixel=this.eventPixel(event),cache=StudioGeometry.resolve(this.geometry);
    const hit=StudioGeometry.hit(this.geometry,cache,pixel,point=>this.project(point),this.tool==='intersection');
    if(this.tool==='move'){
      this.selected=hit?.id||null;
      if(hit?.type==='point')this.editDrag={id:event.pointerId,item:hit,before:this.snapshot()};
      else this.drag={id:event.pointerId,x:event.clientX,y:event.clientY};
      this.canvas.setPointerCapture(event.pointerId);
      this.renderObjects();this.requestPaint();return;
    }
    try{
      if(this.tool==='intersection'){
        if(!hit||!StudioGeometry.lineKinds.has(hit.type)&&hit.type!=='circle')return;
        if(this.pending.includes(hit.id))return;
        this.pending.push(hit.id);
        if(this.pending.length===2){
          const points=StudioGeometry.intersections(...this.pending.map(id=>cache.get(id)));
          if(!points.length){this.setStatus('Los objetos elegidos no tienen intersecciones aisladas.',true);this.pending=[];return;}
          this.remember();
          points.forEach((_,branch)=>this.addGeometry('intersection',this.pending,{branch},false));
          this.pending=[];
        }
      }else{
        const existing=hit&&StudioGeometry.pointKinds.has(hit.type)?hit:null;
        if(this.tool==='polygon'&&existing?.id===this.pending[0]&&this.pending.length>=3){this.finishPolygon();return;}
        const point=existing||this.addGeometry('point',[],{position:this.unproject(pixel)});
        if(this.tool==='point'){this.renderObjects();this.requestPaint();return;}
        if(this.pending.includes(point.id))return;
        this.pending.push(point.id);
        const needed=['perpendicular','parallel','angle'].includes(this.tool)?3:2;
        if(this.tool!=='polygon'&&this.pending.length===needed){
          this.addGeometry(this.tool,this.pending);this.pending=[];
        }
      }
      this.renderObjects();this.syncTools();this.requestPaint();
    }catch(error){this.setStatus(this.error(error),true);this.pending=[];}
  }
  movePointer(event){
    if(this.editDrag?.id===event.pointerId){
      const position=this.unproject(this.eventPixel(event));
      if(position.every(value=>Number.isFinite(value)&&Math.abs(value)<=1e6)){
        this.editDrag.item.position=position;
        this.readout.textContent='x = '+graphNumber(position[0])+'   ·   y = '+graphNumber(position[1]);
        this.renderObjects();this.requestPaint();
      }
      return;
    }
    if(this.perspective==='probability'||this.perspective==='sheet'||this.perspective==='cas')return;
    super.movePointer(event);
  }
  studioPointerUp(event){
    if(this.editDrag?.id!==event.pointerId)return;
    const {before}=this.editDrag;
    if(event.type==='pointercancel')this.geometry=before.geometry;
    else if(JSON.stringify(before.geometry)!==JSON.stringify(this.geometry))this.remember(before);
    this.editDrag=null;this.renderObjects();this.requestPaint();
  }
  finishPolygon(){
    if(this.pending.length<3)return;
    this.addGeometry('polygon',this.pending);this.pending=[];
    this.renderObjects();this.syncTools();this.requestPaint();
  }
  keyControl(event){
    if(this.perspective==='cas'||this.perspective==='probability'||this.perspective==='sheet')return;
    const item=this.geometry.find(item=>item.id===this.selected&&item.type==='point');
    const delta={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[event.key];
    if(item&&delta&&this.mode===2){
      event.preventDefault();this.remember();
      item.position=item.position.map((value,index)=>Number((value+delta[index]*(event.shiftKey?10:1)).toPrecision(10)));
      this.renderObjects();this.requestPaint();return;
    }
    super.keyControl(event);
  }
  keyboardControl(event){
    const editing=event.target.matches('input,textarea,select');
    if(!editing&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
      event.preventDefault();this.query('[data-studio-action="'+(event.shiftKey?'redo':'undo')+'"]').click();
    }
    if(event.key==='Escape'&&this.pending.length){event.preventDefault();event.stopPropagation();this.pending=[];this.syncTools();this.requestPaint();}
    if(!editing&&(event.key==='Delete'||event.key==='Backspace')&&this.selected){
      event.preventDefault();this.query('[data-studio-remove="'+this.selected+'"]')?.click();
    }
    if(event.key==='Enter'&&event.target.matches('.studio-function-input')){
      event.preventDefault();event.target.blur();this.canvas.focus();
    }
    if(!editing&&event.key==='Enter'&&this.tool==='polygon'){event.preventDefault();this.finishPolygon();}
  }
  plotRect(width,height){return {left:0,top:0,width:Math.max(1,width),height:Math.max(1,height)};}
  drawingBounds(){
    if(this.perspective==='probability'&&this.probData)return this.probData.bounds;
    if(this.perspective==='sheet'&&this.sheetBounds)return this.sheetBounds;
    return this.active.bounds;
  }
  adjustAspect(width,height){
    if(this.mode!==2||!this.options.equal||!['graph','geometry'].includes(this.perspective))return;
    const [xmin,xmax,ymin,ymax]=this.active.bounds,span=(xmax-xmin)*height/width,center=(ymin+ymax)/2;
    if(Math.abs(span-(ymax-ymin))<1e-7)return;
    const bounds=[xmin,xmax,center-span/2,center+span/2];
    if(!this.validBounds(bounds))return;
    this.active.bounds=bounds;this.syncRanges();
    if(this.active.studioData?.some(entry=>entry.implicit))this.scheduleSamples();
  }
  drawGrid(width,height){
    const ctx=this.ctx,[xmin,xmax,ymin,ymax]=this.drawingBounds();
    const x=value=>(value-xmin)/(xmax-xmin)*width,y=value=>(ymax-value)/(ymax-ymin)*height;
    const xs=graphTicks(xmin,xmax,Math.max(3,width/85)),ys=graphTicks(ymin,ymax,Math.max(3,height/65));
    if(this.options.grid){
      const minor=(low,high,major,vertical)=>{
        const step=major.length>1?(major[1]-major[0])/5:(high-low)/20;
        const count=Math.min(350,Math.ceil((high-low)/step)+1);
        ctx.lineWidth=1;ctx.strokeStyle='#eff0f4';
        for(let index=0;index<count;index++){
          const value=(Math.ceil(low/step)+index)*step;
          if(vertical)traceGraphLine(ctx,[x(value),0],[x(value),height],'#eff0f4');
          else traceGraphLine(ctx,[0,y(value)],[width,y(value)],'#eff0f4');
        }
      };
      minor(xmin,xmax,xs,true);minor(ymin,ymax,ys,false);
      ctx.lineWidth=1;
      xs.forEach(value=>traceGraphLine(ctx,[x(value),0],[x(value),height],'#dadde6'));
      ys.forEach(value=>traceGraphLine(ctx,[0,y(value)],[width,y(value)],'#dadde6'));
    }
    if(!this.options.axes)return;
    const axisX=x(0),axisY=y(0);
    ctx.lineWidth=1.1;
    if(axisX>=0&&axisX<=width)traceGraphLine(ctx,[axisX,0],[axisX,height],'#747c8f');
    if(axisY>=0&&axisY<=height)traceGraphLine(ctx,[0,axisY],[width,axisY],'#747c8f');
    ctx.fillStyle='#596073';ctx.font='12px "Segoe UI",sans-serif';ctx.textAlign='center';
    xs.filter(value=>Math.abs(value)>1e-10).forEach(value=>{
      if(x(value)>16&&x(value)<width-16)ctx.fillText(graphNumber(value),x(value),clampGraph(axisY+17,16,height-6));
    });
    ctx.textAlign='right';
    ys.filter(value=>Math.abs(value)>1e-10).forEach(value=>{
      if(y(value)>15&&y(value)<height-14)ctx.fillText(graphNumber(value),clampGraph(axisX-8,35,width-6),y(value)+4);
    });
    ctx.textAlign='left';ctx.fillText('x',width-14,clampGraph(axisY-9,16,height-8));
    ctx.fillText('y',clampGraph(axisX+8,8,width-15),15);
  }
  paint(){
    if(!this.ready)return;
    const width=this.canvas.clientWidth,height=this.canvas.clientHeight;
    if(!this.dialog.open||!width||!height)return;
    const ratio=Math.min(2,window.devicePixelRatio||1);
    if(this.canvas.width!==Math.round(width*ratio)||this.canvas.height!==Math.round(height*ratio)){
      this.canvas.width=Math.round(width*ratio);this.canvas.height=Math.round(height*ratio);
    }
    const ctx=this.ctx;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    ctx.font='12px "Segoe UI",sans-serif';ctx.lineWidth=1;
    if(this.mode===3){
      this.active.showGrid=this.options.grid;this.active.showAxes=this.options.axes;
      super.drawSurface(width,height);return;
    }
    this.adjustAspect(width,height);
    this.drawGrid(width,height);
    ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
    if(this.perspective==='probability')this.drawProbability();
    else if(this.perspective==='sheet')this.drawSheet();
    else{
      const results=this.active.studioData||[];
      if(this.active.interval&&results[0]?.paths){
        this.fillInterval(results.flatMap(result=>result.paths||[]),this.active.interval,
          value=>this.project([value,0])[0],value=>this.project([0,value])[1]);
      }
      this.entries[2].forEach(entry=>{
        if(!entry.visible)return;
        const result=results.find(result=>result.id===entry.id);
        ctx.strokeStyle=entry.color;ctx.lineWidth=2.4;ctx.beginPath();
        let started=false;
        for(const point of result?.paths?.[0]||[]){
          if(point[1]===null){started=false;continue;}
          const [x,y]=this.project(point);
          if(started)ctx.lineTo(x,clampGraph(y,-height*25,height*25));
          else {ctx.moveTo(x,clampGraph(y,-height*25,height*25));started=true;}
        }
        for(const [first,last] of result?.segments||[]){ctx.moveTo(...this.project(first));ctx.lineTo(...this.project(last));}
        ctx.stroke();
      });
      StudioGeometry.draw(ctx,this.geometry,StudioGeometry.resolve(this.geometry),point=>this.project(point),this.selected,this.pending);
    }
    ctx.restore();
  }
  fitConstruction(){
    if(this.mode===3){this.reset();return;}
    const points=[...StudioGeometry.resolve(this.geometry).values()].filter(Boolean).flatMap(value=>
      value.position?[value.position]:value.center?[[value.center[0]-value.radius,value.center[1]-value.radius],
        [value.center[0]+value.radius,value.center[1]+value.radius]]:value.points||[]);
    for(const entry of this.active.studioData||[]){
      for(const point of entry.paths?.[0]||[])if(point[1]!==null&&Math.abs(point[1])<=1e6)points.push(point);
    }
    if(!points.length){this.reset();return;}
    const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]);
    let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const xpad=Math.max(.5,(xmax-xmin)*.12),ypad=Math.max(.5,(ymax-ymin)*.12);
    xmin-=xpad;xmax+=xpad;ymin-=ypad;ymax+=ypad;
    if(this.options.equal){
      const span=Math.max(xmax-xmin,(ymax-ymin)*this.canvas.clientWidth/this.canvas.clientHeight);
      const center=(xmin+xmax)/2;xmin=center-span/2;xmax=center+span/2;
    }
    const bounds=[xmin,xmax,ymin,ymax];
    if(this.validBounds(bounds)){this.active.bounds=bounds;this.syncRanges();this.requestSamples();this.requestPaint();}
  }

  renderKeys(){
    const pages=[
      ['x','y','z','π','7','8','9','/','(',')','^2','sqrt(','4','5','6','*','a','b','^','e','1','2','3','-','<','>','abs(','.','0',',','=','+','←','→','⌫','↵'],
      ['sin(','cos(','tan(','sqrt(','log(','exp(','abs(','pi','asin(','acos(','atan(','^','(',')','/','*','x','y','a','b','0','1','⌫','↵'],
      ['a','b','c','k','m','n','t','x','y','z','A','B','C','D','E','F','1','2','3',',','(',')','=','↵'],
    ];
    const names={'/':'÷','*':'×','sqrt(':'√','^2':'x²','^':'xⁿ','abs(':'|x|','pi':'π'};
    this.query('.studio-keys').innerHTML=pages[this.keyboardPage].map(value=>
      '<button type="button" data-studio-key="'+studioEscape(value)+'" aria-label="'+
      studioEscape(value==='⌫'?'Borrar carácter':value==='↵'?'Introducir':value)+'">'+studioEscape(names[value]||value)+'</button>').join('');
    this.dialog.querySelectorAll('[data-studio-keyboard]').forEach(button=>
      button.setAttribute('aria-pressed',String(Number(button.dataset.studioKeyboard)===this.keyboardPage)));
  }
  pressKey(value){
    const input=this.lastMathInput?.isConnected?this.lastMathInput:this.query('#studio-entry');
    input.focus({preventScroll:true});
    const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
    if(value==='↵'){
      if(input.matches('.studio-function-input')){
        input.dispatchEvent(new Event('change',{bubbles:true}));this.canvas.focus();
      }else input.form?.requestSubmit();
      return;
    }
    if(value==='←'||value==='→'){
      const next=clampGraph(start+(value==='←'?-1:1),0,input.value.length);
      input.setSelectionRange(next,next);return;
    }
    if(value==='⌫'){
      input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');
    }else{
      input.setRangeText(value==='π'?'pi':value,start,end,'end');
    }
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  renderTable(results){
    if(!this.table)return;
    const entries=this.entries[2].filter(entry=>entry.visible);
    const headers=['x',...entries.map(entry=>entry.text)];
    const rows=this.table.xs.map((x,index)=>[x,...entries.map(entry=>results.find(result=>result.id===entry.id)?.values?.[index]??null)]);
    this.table.headers=headers;this.table.rows=rows;
    this.query('.studio-table-results').innerHTML='<table><thead><tr>'+headers.map(header=>'<th>'+studioEscape(header)+'</th>').join('')+
      '</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(value=>'<td>'+(value===null?'—':graphNumber(value))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  }
  async calculateCas(fields){
    if(this.casBusy)return;
    this.casBusy=true;
    const button=this.query('#studio-cas-form button[type="submit"]');
    button.disabled=true;this.setStatus('Calculando…');
    try{
      const result=await this.call('example',fields);
      this.casHistory.push({fields:{...fields},result});
      if(this.casHistory.length>20)this.casHistory.shift();
      this.renderCas();this.setStatus('');
    }finally{this.casBusy=false;button.disabled=false;}
  }
  renderCas(){
    this.query('.studio-cas-results').innerHTML=this.casHistory.length?
      this.casHistory.map(({fields,result},index)=>'<article class="studio-cas-row"><span class="studio-cas-number">'+(index+1)+
        '</span><div><code>'+studioEscape(fields.problem)+'</code><div class="studio-cas-answer">'+
        (result.formula?.startsWith('<math ')?result.formula:studioEscape(result.result))+
        (result.suffix?studioEscape(result.suffix):'')+'</div><p>'+studioEscape(result.explanation)+'</p>'+
        '<details><summary>Comprobación</summary><p>'+studioEscape(result.verification)+'</p></details></div></article>').join(''):
      '<div class="studio-cas-empty">Escribe una expresión para calcular.</div>';
  }
  renderSheet(){
    this.query('.studio-sheet-grid').innerHTML='<span class="sheet-corner"></span>'+['A','B','C'].map(col=>'<strong>'+col+'</strong>').join('')+
      this.cells.map((row,index)=>'<strong>'+(index+1)+'</strong>'+row.map((value,column)=>
        '<label><span class="sr-only">'+String.fromCharCode(65+column)+(index+1)+'</span>'+
        '<input data-sheet-cell="'+index+','+column+'" aria-label="'+String.fromCharCode(65+column)+(index+1)+
        '" value="'+studioEscape(value)+'" maxlength="100" spellcheck="false"><output data-sheet-result="'+index+','+column+'"></output></label>').join('')).join('');
  }
  async calculateSheet(){
    const request=JSON.stringify(this.cells),version=(this.sheetVersion||0)+1;
    this.sheetVersion=version;this.setStatus('Calculando hoja…');
    try{
      const data=await this.studioCall('sheet',{cells:this.cells});
      if(version!==this.sheetVersion||request!==JSON.stringify(this.cells))return;
      this.sheetData=data.rows;
      let errors=0;
      for(const [row,values] of data.rows.entries()){
        for(const [col,cell] of values.entries()){
          const output=this.query('[data-sheet-result="'+row+','+col+'"]');
          output.textContent=cell.error?'#ERROR':this.cells[row][col].startsWith('=')?graphNumber(cell.value):'';
          output.classList.toggle('is-error',Boolean(cell.error));
          output.title=cell.error||'';
          if(cell.error)errors++;
        }
      }
      this.sheetPoints=data.rows.filter(row=>!row[0].empty&&!row[1].empty&&!row[0].error&&!row[1].error)
        .map(row=>[row[0].value,row[1].value]);
      if(this.sheetPoints.length){
        const xs=this.sheetPoints.map(point=>point[0]),ys=this.sheetPoints.map(point=>point[1]);
        const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
        const padx=(xmax-xmin)*.15||1,pady=(ymax-ymin)*.15||1;
        this.sheetBounds=[xmin-padx,xmax+padx,ymin-pady,ymax+pady];
      }else this.sheetBounds=[-5,5,-5,5];
      this.query('.studio-sheet-error').textContent=errors?errors+' celdas por revisar.':'El gráfico usa A como x y B como y.';
      this.setStatus('');this.requestPaint();
    }catch(error){this.setStatus(this.error(error),true);}
  }
  drawSheet(){
    for(const point of this.sheetPoints||[]){
      const [x,y]=this.project(point);
      this.ctx.beginPath();this.ctx.arc(x,y,5,0,2*Math.PI);
      this.ctx.fillStyle=studioColors[0];this.ctx.fill();this.ctx.strokeStyle='#fff';this.ctx.lineWidth=1.3;this.ctx.stroke();
    }
  }
  syncProbabilityForm(){
    const form=this.query('.studio-prob-form'),normal=this.probability.distribution==='normal';
    form.elements.distribution.value=this.probability.distribution;
    this.query('[data-prob-normal]').hidden=!normal;
    this.query('[data-prob-binomial]').hidden=normal;
    this.query('[data-prob-normal]').querySelectorAll('input').forEach(input=>{input.disabled=!normal;});
    this.query('[data-prob-binomial]').querySelectorAll('input').forEach(input=>{input.disabled=normal;});
    for(const [name,value] of Object.entries(this.probability))form.elements[name].value=value;
    form.elements.n.step='1';
    for(const key of ['lower','upper'])form.elements[key].step=normal?'any':'1';
  }
  async calculateProbability(){
    const version=(this.probVersion||0)+1;
    this.probVersion=version;this.setStatus('Calculando probabilidad…');
    try{
      const result=await this.studioCall('probability',this.probability);
      if(version!==this.probVersion)return;
      this.probData=result;
      const [lower,upper]=result.selected;
      this.query('.studio-prob-result').textContent='P('+graphNumber(lower)+' ≤ X ≤ '+graphNumber(upper)+') = '+
        graphNumber(result.probability)+'   ·   '+graphNumber(result.probability*100)+' %';
      this.setStatus('');this.requestPaint();
    }catch(error){this.setStatus(this.error(error),true);}
  }
  drawProbability(){
    if(!this.probData)return;
    const {points,selected:[lower,upper],distribution}=this.probData,ctx=this.ctx;
    if(distribution==='binomial'){
      for(const [x,y] of points){
        const a=this.project([x-.4,0]),b=this.project([x+.4,y]);
        ctx.fillStyle=x>=lower&&x<=upper?'#7965df':'#d3d5df';
        ctx.fillRect(a[0],b[1],b[0]-a[0],a[1]-b[1]);
      }
      return;
    }
    const fill=points.filter(([x])=>x>=lower&&x<=upper);
    if(fill.length){
      ctx.beginPath();ctx.moveTo(...this.project([fill[0][0],0]));
      fill.forEach(point=>ctx.lineTo(...this.project(point)));
      ctx.lineTo(...this.project([fill.at(-1)[0],0]));ctx.closePath();ctx.fillStyle='#9a87eb66';ctx.fill();
    }
    ctx.beginPath();ctx.moveTo(...this.project(points[0]));
    points.slice(1).forEach(point=>ctx.lineTo(...this.project(point)));
    ctx.strokeStyle='#6655c9';ctx.lineWidth=2.8;ctx.stroke();
  }
  download(content,name,type){
    const blob=content instanceof Blob?content:new Blob([content],{type});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    this.menu.hidden=true;
    this.setStatus('Descarga iniciada · '+name);
  }
  downloadPng(){
    if(this.perspective==='cas'){this.setStatus('Elige una vista gráfica para descargar una imagen.',true);return;}
    this.paint();
    this.canvas.toBlob(blob=>{if(blob)this.download(blob,'MathPath-grafica.png','image/png');},'image/png');
  }
  csv(headers,rows){
    const field=value=>'"'+String(value??'').replaceAll('"','""')+'"';
    return '\uFEFF'+[headers,...rows].map(row=>row.map(field).join(',')).join('\r\n');
  }
  exportTable(){
    if(!this.table?.rows){this.setStatus('Calcula primero una tabla de valores.',true);return;}
    this.download(this.csv(this.table.headers,this.table.rows),'MathPath-valores.csv','text/csv;charset=utf-8');
  }
  exportSheet(){
    if(!this.sheetData){this.setStatus('Calcula primero las celdas.',true);return;}
    this.download(this.csv(['A','B','C'],this.sheetData.map(row=>row.map(cell=>cell.empty?'':cell.value??'#ERROR'))),
      'MathPath-hoja.csv','text/csv;charset=utf-8');
  }
  capture(){
    const valid=this.perspective==='probability'?Boolean(this.probData):this.perspective==='sheet'?Boolean(this.sheetPoints?.length):
      this.mode===3?this.active.data?.hasValues:
      this.entries[2].some(entry=>entry.visible&&this.active.studioData?.find(result=>result.id===entry.id)?.hasValues)||
        this.geometry.some(item=>item.visible&&StudioGeometry.resolve(this.geometry).get(item.id));
    if(!valid||this.perspective==='cas')return null;
    this.paint();
    const canvas=document.createElement('canvas'),scale=Math.min(1,480/this.canvas.width,320/this.canvas.height);
    canvas.width=Math.max(1,Math.round(this.canvas.width*scale));canvas.height=Math.max(1,Math.round(this.canvas.height*scale));
    canvas.getContext('2d').drawImage(this.canvas,0,0,canvas.width,canvas.height);
    const expressions=['graph','geometry','surface'].includes(this.perspective)?
      this.entries[this.mode].filter(entry=>entry.visible).map(entry=>entry.text):[];
    return {mode:this.mode,expressions,bounds:[...this.active.bounds],interval:this.active.interval,
      camera:[this.views[3].yaw,this.views[3].pitch,this.views[3].zoom],
      title:this.active.title||studioViews[this.perspective][1],image:canvas.toDataURL('image/jpeg',.8),studio:this.snapshot()};
  }
};
