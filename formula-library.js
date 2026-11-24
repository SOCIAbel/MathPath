'use strict';

const formulaLibrary=(()=>{
  const catalog=universityFormulaData;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  const topics=new Map(catalog.topics.map(topic=>[topic.id,topic]));
  const formulas=new Map(catalog.formulas.map(formula=>[formula.id,formula]));
  const searchable=new Map(catalog.formulas.map(formula=>[formula.id,plain([
    formula.title,formula.latex,formula.conditions,formula.example,topics.get(formula.topic).name,
    catalog.courses.find(course=>course.id===formula.course).name].join(' '))]));
  let context,course=0,topic='',query='',favoritesOnly=false,favorites=new Set();

  function init(ctx){
    context=ctx;
    document.addEventListener('input',event=>{
      if(event.target.matches('[data-formula-search]')){query=event.target.value;paintResults();}
    });
    document.addEventListener('change',event=>{
      if(event.target.matches('[data-formula-topic]')){topic=event.target.value;paintResults();}
    });
    document.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button)return;
      if(button.dataset.formulaCourse!==undefined){
        course=Number(button.dataset.formulaCourse);topic='';paintFilters();paintResults();
      }else if(button.dataset.formulaFilter==='favorites'){
        favoritesOnly=!favoritesOnly;paintResults();
      }else if(button.dataset.formulaReset!==undefined){
        course=0;topic='';query='';favoritesOnly=false;
        const input=document.querySelector('[data-formula-search]');if(input)input.value='';
        paintFilters();paintResults();
      }else if(button.dataset.formulaFavorite){void toggleFavorite(button);}
      else if(button.dataset.formulaCopy){
        const formula=formulas.get(button.dataset.formulaCopy);
        if(formula)void copy(formula.latex,button,'Copiado');
      }else if(button.dataset.formulaReference){
        const reference=catalog.references[Number(button.dataset.formulaReference)];
        if(reference)void copy(reference.url,button,'Enlace copiado');
      }else if(button.dataset.formulaPrint!==undefined){window.print();}
    });
  }
  async function open(selection=''){
    query='';favoritesOnly=false;topic='';course=0;
    if(topics.has(selection)){topic=selection;course=topics.get(selection).course;}
    else if(catalog.courses.some(item=>String(item.id)===String(selection)))course=Number(selection);
    favorites=new Set(await context.call('fun',{action:'formulaFavorites'}));
  }
  function options(){
    return '<option value="">Todos los temas</option>'+catalog.topics.filter(item=>!course||item.course===course)
      .map(item=>'<option value="'+item.id+'"'+(item.id===topic?' selected':'')+'>'+escape(item.name)+'</option>').join('');
  }
  function render(tabs){
    return '<div class="formula-reference"><header class="formula-reference-heading"><div><p class="formula-eyebrow">BIBLIOTECA ACADÉMICA · UNIVERSIDAD</p>'+
      '<h1>Formulario universitario</h1><p>Encuentra la fórmula y revisa cuándo puedes usarla.</p></div>'+
      '<div class="formula-counts"><span><b>'+catalog.formulas.length+'</b> fórmulas</span><span><b>'+catalog.topics.length+'</b> temas</span><span><b>11</b> cursos</span></div></header>'+
      '<nav class="formula-level-tabs" role="tablist" aria-label="Colección y formulario">'+tabs+'</nav>'+
      '<section class="formula-search-bar"><label><span aria-hidden="true">⌕</span><span class="sr-only">Buscar una fórmula</span>'+
      '<input type="search" data-formula-search value="'+escape(query)+'" placeholder="Buscar logaritmos, integrales, límites, Bayes…" autocomplete="off"></label>'+
      '<button type="button" class="formula-favorites-filter" data-formula-filter="favorites" aria-pressed="'+favoritesOnly+'">☆ Mis favoritas <span data-formula-favorite-count>'+favorites.size+'</span></button>'+
      '<button type="button" class="formula-print" data-formula-print>Imprimir selección</button></section>'+
      '<div class="formula-reference-layout"><nav class="formula-courses" aria-label="Cursos del formulario">'+courseButtons()+'</nav>'+
      '<section class="formula-reference-main"><div class="formula-result-toolbar"><div><h2 data-formula-course-title>'+courseTitle()+'</h2><p data-formula-result-count role="status"></p></div>'+
      '<label><span class="sr-only">Filtrar por tema</span><select data-formula-topic>'+options()+'</select></label></div>'+
      '<div class="formula-results"></div><details class="formula-references"><summary>Bibliografía de consulta</summary><p>Notación real, salvo que se indique lo contrario. C es una constante de integración; las funciones trigonométricas usan radianes.</p>'+
      '<ul>'+catalog.references.map((reference,index)=>'<li><span>'+escape(reference.title)+'</span><button type="button" data-formula-reference="'+index+'">Copiar enlace</button></li>').join('')+
      '</ul></details></section></div><div class="formula-announcement sr-only" role="status"></div></div>';
  }
  function courseTitle(){return course?catalog.courses.find(item=>item.id===course).name:'Todos los cursos';}
  function courseButtons(){
    const button=(id,name,count)=>'<button type="button" data-formula-course="'+id+'" aria-pressed="'+(course===id)+'"><span>'+escape(name)+'</span><small>'+count+'</small></button>';
    return '<h2>Por curso</h2>'+button(0,'Todo el formulario',catalog.formulas.length)+catalog.courses.map(item=>
      button(item.id,item.name,catalog.formulas.filter(formula=>formula.course===item.id).length)).join('');
  }
  function paintFilters(){
    const root=document.querySelector('.formula-reference');if(!root)return;
    root.querySelector('.formula-courses').innerHTML=courseButtons();
    root.querySelector('[data-formula-topic]').innerHTML=options();
    root.querySelector('[data-formula-course-title]').textContent=courseTitle();
  }
  function paintResults(){
    const root=document.querySelector('.formula-reference');if(!root)return;
    const words=plain(query).trim().split(/\s+/).filter(Boolean);
    const found=catalog.formulas.filter(item=>(!course||item.course===course)&&(!topic||item.topic===topic)&&
      (!favoritesOnly||favorites.has(item.id))&&words.every(word=>searchable.get(item.id).includes(word)));
    root.querySelector('[data-formula-result-count]').textContent=found.length+' '+(found.length===1?'fórmula disponible':'fórmulas disponibles');
    const filter=root.querySelector('[data-formula-filter="favorites"]');
    filter.setAttribute('aria-pressed',String(favoritesOnly));
    root.querySelector('[data-formula-favorite-count]').textContent=favorites.size;
    const groups=new Map();
    for(const formula of found){if(!groups.has(formula.topic))groups.set(formula.topic,[]);groups.get(formula.topic).push(formula);}
    root.querySelector('.formula-results').innerHTML=found.length?[...groups].map(([identity,items])=>{
      const subject=topics.get(identity),courseName=catalog.courses.find(item=>item.id===subject.course).name;
      return '<section class="formula-topic-section" data-formula-group="'+identity+'"><header><div><small>'+escape(courseName)+'</small><h3>'+escape(subject.name)+'</h3></div>'+
        (subject.lesson?'<button type="button" class="formula-lesson" data-lesson="'+subject.lesson+'">Ver tema →</button>':'')+'</header><div class="formula-grid">'+items.map(card).join('')+'</div></section>';
    }).join(''):'<div class="formula-empty"><span aria-hidden="true">∑</span><h3>'+
      (favoritesOnly?'Aún no hay fórmulas favoritas en esta selección':'No encontramos esa fórmula')+'</h3><p>'+
      (favoritesOnly?'Pulsa la estrella de una fórmula para tenerla a mano.':'Prueba otra palabra o cambia el curso y el tema.')+
      '</p><button type="button" data-formula-reset>Ver todo el formulario</button></div>';
  }
  function card(item){
    const selected=favorites.has(item.id);
    return '<article class="formula-card" data-formula-id="'+item.id+'"><header><h4>'+escape(item.title)+'</h4><button type="button" data-formula-favorite="'+item.id+'" aria-pressed="'+selected+'" aria-label="'+
      (selected?'Quitar de favoritas: ':'Guardar en favoritas: ')+escape(item.title)+'">'+(selected?'★':'☆')+'</button></header>'+
      '<div class="formula-equation">'+item.mathml+'</div><p class="formula-conditions"><b>Condiciones</b> '+escape(item.conditions)+'</p>'+
      (item.example?'<details class="formula-example"><summary>Ver ejemplo</summary><p>'+escape(item.example)+'</p></details>':'')+
      '<footer><span>'+escape(topics.get(item.topic).name)+'</span><button type="button" data-formula-copy="'+item.id+'" title="Copiar la expresión en formato LaTeX">Copiar LaTeX</button></footer></article>';
  }
  async function toggleFavorite(button){
    const identity=button.dataset.formulaFavorite;
    if(!formulas.has(identity))return;
    button.disabled=true;
    try{
      favorites=new Set(await context.call('fun',{action:'formulaFavorites',identity,enabled:!favorites.has(identity)}));
      paintResults();
      document.querySelector('[data-formula-favorite="'+identity+'"]')?.focus({preventScroll:true});
    }catch(error){button.disabled=false;context.say(error.message,true);}
  }
  async function copy(text,button,label){
    try{
      try{await navigator.clipboard.writeText(text);}
      catch{
        const input=document.createElement('textarea');input.value=text;input.setAttribute('readonly','');
        input.style.cssText='position:fixed;opacity:0;inset:0;pointer-events:none';document.body.append(input);input.select();
        const copied=document.execCommand('copy');input.remove();if(!copied)throw Error('No se pudo copiar al portapapeles.');
      }
      const previous=button.textContent;button.textContent=label;
      const announcement=document.querySelector('.formula-announcement');if(announcement)announcement.textContent=label;
      setTimeout(()=>{if(button.isConnected)button.textContent=previous;},1400);
    }catch(error){context.say(error.message,true);}
  }
  function bind(){paintResults();}
  return {init,open,render,bind};
})();
