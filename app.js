(() => {
  const api=window.mathpath, view=document.querySelector('#content'), nav=document.querySelector('#navigation');
  const notice=document.querySelector('#notice'), examWindow=document.querySelector('#exam-window');
  const lessonVideo=new LessonVideoPlayer(document.querySelector('#lesson-video'));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const call=(name,args)=>api.call(name,args);
  const graphWorkspace=new GraphWorkspace(document.querySelector('#graph-window'),call);
  const academicLab=new AcademicLab(call,esc);
  const date=value=>value?new Intl.DateTimeFormat('es-PE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Lima'}).format(new Date(value)):'—';
  const percent=(n,total)=>total?Math.round(100*n/total):0;
  const btn=(key,label,style='')=>'<button class="btn '+style+'" type="button" data-action="'+key+'">'+label+'</button>';
  const villageEntry=()=>'<button class="btn village-link village-entry" type="button" data-action="open-village" aria-label="Mi aldea: abrir mochila y taller">'+
    '<span class="village-entry-scene" aria-hidden="true"><img src="recursos/aldea/aldea-panorama.webp" width="1600" height="260" alt="" decoding="async"></span>'+
    '<span class="village-entry-caption"><img src="recursos/aldea/anvil.webp" width="40" height="40" alt="" aria-hidden="true">'+
    '<strong>Mi aldea</strong><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span></button>';
  const link=(page,label,style='')=>'<button class="btn '+style+'" type="button" data-page="'+page+'">'+label+'</button>';
  const row=body=>'<div class="row">'+body+'</div>';
  const details=(title,body)=>'<details class="details"><summary>'+title+'</summary>'+body+'</details>';
  const heading=(title,description)=>'<div class="page-heading"><h1>'+title+'</h1>'+(description?'<p class="muted">'+description+'</p>':'')+'</div>';
  const panel=(title,body)=>'<section class="panel"><header><h2>'+title+'</h2></header><div class="panel-body">'+body+'</div></section>';
  const section=body=>'<div class="section">'+body+'</div>';
  const grid=(body,columns='two')=>'<div class="grid '+columns+'">'+body+'</div>';
  const meter=value=>'<div class="meter" role="progressbar" aria-label="Avance" aria-valuenow="'+value+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+value+'%"></span></div>';
  const option=(v,label,selected)=>'<option value="'+esc(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+esc(label)+'</option>';
  const select=(name,label,items,chosen)=>'<label>'+label+'<select name="'+name+'">'+items.map(([v,text])=>option(v,text,chosen)).join('')+'</select></label>';
  const field=(label,name,value='',attributes='')=>'<label>'+label+'<input name="'+name+'" value="'+esc(value)+'" '+attributes+'></label>';
  const area=(label,name,value='',attributes='')=>'<label>'+label+'<textarea name="'+name+'" '+attributes+'>'+esc(value)+'</textarea></label>';
  const difficulties=[['auto','Automática'],['fácil','Fácil'],['intermedio','Intermedia'],['avanzado','Avanzada']];
  const examDefaults=()=>({scope:'general',scopeId:'',minutes:'8',count:'5',difficulty:'auto',query:'',level:'',topics:new Set()});
  const menus=[['Ruta',[['dashboard','Inicio','⌂'],['learn','Niveles','▤'],['progress','Mi progreso','◔']]],
    ['Juego',[['games','Retos','ϟ'],['trophies','Logros','♛'],['pet','Mascota','❦']]],
    ['Herramientas',[['practice','Práctica libre','✎'],['solver','Solucionador','∑'],['graph','Graficador','⌁'],['cards','Fórmulas','∑'],['teacher','Profesor','◇'],
      ['exams','Evaluaciones','✓']]]];
  const titles={...Object.fromEntries(menus.flatMap(([,items])=>items.map(([id,title])=>[id,title]))),
    labs:'Laboratorios universitarios',notebook:'Cuaderno universitario',settings:'Mi perfil'};
  const presets=[
    ['Ecuación','2×x + 3 = 9','auto',''],['Límite','(x^2 - 1) ÷ (x - 1)','limit','1'],
    ['Derivada','x^3 + 2×x','derivative',''],['Integral','5×x^3 + 6','integral',''],
    ['Matriz','det([[2, 3], [1, 4]])','matrix',''],
    ['Sistema','x+y=8; x-y=2','system','']
  ];
  const emptySolver=(variable='x')=>({problem:'',operation:'auto',argument:'',variable});
  const preset=index=>{const [,problem,operation,argument]=presets[index];return {problem,operation,argument,variable:'x'};};
  let state=null,page='dashboard',busy=false,level=1,unit=1,lesson=null,lessonSolution=null,solution=null,solved=[];
  let universityQuery='';
  let book=null,bookUnit=1,bookDraft=null,graphContext=null;
  let villageView='bag',villageCategory='sword',villageItem='iron-sword',villageCrafted='';
  let solver=emptySolver(),teacher=null,teacherStep=0,stepCheck=null,stepsDraft='',ai={},teacherDraft={topic:'',question:''};
  let teacherSearch='',teacherLevel=0,teacherUnit=0,teacherCatalogScroll=0;
  let practice=null,grade=null,hint=null,practiceTopic='',practiceDifficulty='auto';
  let mission=false,battle=null,duelAnswer='',duelEffect='',duelRetryAt=0,tacticPosition=0,progressStage=0;
  let exam=null,examReview=null,examOptions=examDefaults(),noteTopic='',noteText='',lessonEdit=null;
  let previewTimer,previewNumber=0;
  const topic=id=>state.topics.find(item=>item.id===id)||
    {id,name:'Tema retirado',goal:'',level:3,unit:1,area:'',mastered:false,missing:[],stars:0};
  const normalizeSearch=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
  const lessonButton=(id,label,style='')=>'<button class="btn '+style+'" type="button" data-lesson="'+id+'">'+label+'</button>';
  const graphButton=(spec,label,style='small')=>'<button class="btn '+style+'" type="button" data-graph="'+
    (spec?esc(JSON.stringify(spec)):'')+'">'+label+'</button>';
  const openLabButton=(lab,label,style='')=>'<button class="btn '+style+'" type="button" data-open-lab="'+lab+'">'+label+'</button>';
  const form=(id,body,label)=>'<form class="form" id="'+id+'">'+body+'<button class="btn primary">'+label+'</button></form>';
  const notation=value=>String(value??'').replaceAll('**','^').replaceAll('*',' × ').replace(/\s*\/\s*/g,' ÷ ')
    .replace(/(\S)·(?=\S)/g,'$1 × ').replace(/(^|[ (])-(?=[0-9a-z(])/g,'$1−').replace(/\s+-\s+/g,' − ')
    .replace(/\bpi\b/g,'π').replace(/\bsqrt\(/g,'√(').replace(/\^(-?\d+)/g,(_,digits)=>
      [...digits].map(digit=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[digit]||'⁻').join('')).replace(/ {2,}/g,' ');
  const mathText=value=>esc(notation(value));
  const safeMath=(markup,fallback)=>markup&&markup.startsWith('<math ')?markup:'<span>'+mathText(fallback)+'</span>';
  const parameter=op=>({limit:'Punto del límite',continuity:'Punto de continuidad',function:'Punto de evaluación',integral:'Límites (vacío para primitiva)',
    gradient:'Variables del gradiente',trig_equation:'Intervalo [a,b)'})[op]||'Parámetro opcional';
  const calculatorArguments={limit:'Ej. 1',continuity:'Ej. 0',function:'Ej. 2',integral:'Ej. 0, 2',
    gradient:'Ej. x, y',trig_equation:'Ej. 0, 2*pi'};

  function say(text,error=false){notice.textContent=text;notice.classList.toggle('error',error);}
  function errorText(error){return String(error.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,'');}
  function headerContext(){
    const contentLevel=page==='learn'?(lesson?.level??level):
      page==='practice'?topic(practice?.topic||practiceTopic)?.level:
      page==='teacher'?(topic(teacher?.grounding?.topic)?.level??teacherLevel):
      page==='progress'?(state.levels.find(item=>item.id===progressStage)||state.levels[state.currentLevel-1])?.id:
      page==='cards'?funUI.getCardLevel():['labs','notebook'].includes(page)?3:null;
    return {page,contentLevel};
  }
  function renderNav(){
    const active=(page==='practice'&&mission)||['village','labs','notebook'].includes(page)?'learn':page;
    const open=new Set([...nav.querySelectorAll('details[open]')].map(item=>item.dataset.group));
    nav.innerHTML=menus.filter(([group])=>group!=='Juego'||headerContext().contentLevel!==3).map(([group,items])=>'<details data-group="'+group+'"'+(!nav.childElementCount||open.has(group)||items.some(([id])=>id===active)?' open':'')+
      '><summary>'+group+'</summary>'+items.map(([id,title,glyph])=>'<button class="nav-button" type="button" data-page="'+id+'"'+
      (active===id?' aria-current="page"':'')+'><span aria-hidden="true">'+glyph+'</span>'+title+'</button>').join('')+'</details>').join('');
    document.querySelector('#breadcrumb').textContent='MathPath / '+(page==='village'?'Aldea':titles[page==='practice'&&mission?'missions':page]||'Misiones');
    document.querySelector('#profile-name').textContent=state.profile.name;
    document.querySelector('#profile-mode').textContent=state.demo?'DEMO · Datos de ejemplo':'Perfil local';
    document.querySelector('#profile-initial').textContent=state.profile.name.slice(0,1).toUpperCase();
    const demo=document.querySelector('#toggle-demo');
    demo.textContent=state.demo?'Salir de DEMO':'Probar DEMO';
    demo.classList.toggle('tag',state.demo);
    demo.classList.toggle('demo',state.demo);
  }

  function dashboard(){
    const suggested=topic(state.recommended);
    const stars=state.topics.filter(item=>item.level<3).reduce((total,item)=>total+item.stars,0);
    return '<div class="home-page">'+
      heading('Elige tu nivel','Selecciona un nivel para ver sus grados o cursos.')+stageCards()+
      (suggested?'<section class="continue-card"><div><small>'+esc(state.levels[suggested.level-1].title)+' · '+
        esc(state.levels[suggested.level-1].units[suggested.unit-1])+'</small><h2>'+esc(suggested.name)+'</h2></div>'+
        lessonButton(suggested.id,state.attempts?'Continuar →':'Empezar →','primary')+'</section>':'')+
      (stars?'<div class="home-progress"><span>★ '+stars+(stars===1?' estrella':' estrellas')+'</span>'+
        link('progress','Ver mi progreso','small ghost')+'</div>':'')+'</div>';
  }
  const stageArt=[
    '<path d="M32 7l7 14 16 2-12 11 3 16-14-8-14 8 3-16L9 23l16-2z"/><path d="M51 8v10m-5-5h10M10 43v10m-5-5h10"/>',
    '<path d="M19 50v-9m25 9v-9M13 38l19-28 19 28-13-3H26z"/><circle cx="32" cy="29" r="5"/><path d="M28 46l4 9 4-9"/>',
    '<path d="M8 49h48M14 54V9m6 31 11-12 8 5 15-18m-8 0h8v8"/><circle cx="31" cy="28" r="3"/>'
  ];
  function stageCards(destination='level'){
    return '<div class="stage-grid">'+state.levels.map(item=>'<button type="button" class="stage-card stage-'+item.id+
      '" data-'+destination+'="'+item.id+'"><span class="stage-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none">'+stageArt[item.id-1]+
      '</svg></span><strong>'+esc(item.title)+'</strong><span class="stage-caption">'+esc(item.description)+
      '<span aria-hidden="true">→</span></span>'+
      (destination==='teacher-level'?'<small class="teacher-stage-count">'+item.total+' temas</small>':'')+'</button>').join('')+'</div>';
  }
  const stageTitle=item=>state.levels[item.level-1];
  const unitTopics=(stage,grade)=>state.topics.filter(item=>item.level===stage&&item.unit===grade);
  const adventureLocations=[
    ['forest','Bosque de los faroles','leaves','Sigue los faroles para encontrar la salida entre los árboles.'],
    ['cavern','Cueva de cristal','crystals','Los cristales iluminan un camino que desciende bajo la montaña.'],
    ['snow','Paso nevado','snow','Cruza el paso de piedra antes de que la nieve borre el sendero.'],
    ['castle','Patio de la fortaleza','sparks','Las banderas adornan el patio. El rival custodia el portón.'],
    ['desert','Templo de arena','dust','Atravesaste las dunas. Una escalinata lleva a la entrada del templo.'],
    ['marsh','Pantano de la niebla','mist','La pasarela de madera es el único camino visible entre la niebla.'],
    ['volcano','Fortaleza de lava','embers','Sigue la calzada de roca negra hasta la puerta de la fortaleza.'],
    ['mill','Valle de los molinos','wind','Los molinos marcan la ruta por el valle. Sigue el camino del viento.']
  ];
  function missionWorld(item){
    const guide=state.adventureGuide;
    const group=guide.groups[item?.id]??0;
    const {id:enemy,name:rival,move,guard}=guide.rivals[group];
    if(group===0)return {group,location:'bridge',name:'El puente del bosque',effect:'river',enemy,rival,move,guard,variant:0,
      story:'El castillo espera al otro lado del valle. Cruza el puente para comenzar el viaje.'};
    const count=adventureLocations.length;
    const variant=Math.floor((group-1)/count);
    const slot=(group-1)%count;
    const [location,name,effect,story]=adventureLocations[slot];
    return {group,location,name,effect,enemy,rival,move,guard,variant,story};
  }
  function worldBackground(world){
    return '--world-image:url(arena/'+world.location+'.webp);--world-hue:'+([0,-12,15,25][world.variant%4])+'deg';
  }
  function arenaScenery(world){
    const phase=Math.floor(performance.now());
    const particles=Array.from({length:16},(_,index)=>'<i style="--particle-x:'+((index*37+7)%101)+'%;--particle-y:'+
      ((index*43+9)%100)+'%;--particle-delay:-'+(index*870)+'ms;--particle-duration:'+(4200+(index%6)*760)+
      'ms;--particle-size:'+(3+index%4*2)+'px"></i>').join('');
    return '<div class="arena-world scene-'+world.location+' effect-'+world.effect+'" aria-hidden="true" style="'+
      worldBackground(world)+';--scene-phase:-'+phase+'ms"><div class="arena-landscape"></div>'+
      '<div class="arena-atmosphere"></div><div class="arena-particles">'+particles+'</div></div>';
  }
  const adventurePack=()=>state.adventure||{wins:[],hints:0,shields:0};
  // Story: every school grade is a chapter that ends with its boss.
  const gradeBoss=(stage,grade)=>(state.gradeBosses||[]).find(boss=>boss.level===stage&&boss.unit===grade);
  const gradeBossById=id=>(state.gradeBosses||[]).find(boss=>boss.id===id);
  const previousBoss=(stage,grade)=>gradeBoss(stage,grade-1);
  const gradeLocked=(stage,grade)=>Boolean(gradeBoss(stage,grade)&&!gradeBoss(stage,grade).unlocked);
  const bossArena=boss=>({location:boss.location,name:boss.title,effect:boss.effect,enemy:boss.enemy,variant:0,story:boss.intro});
  const worldBoss=id=>state.funGuide?.bosses?.[id];
  const adventureTarget=()=>gradeBossById(battle.target)||worldBoss(battle.target)||topic(battle.target);
  const adventureButton=(id,label,style='primary')=>'<button type="button" class="btn '+style+'" data-adventure="'+esc(id)+'">'+label+'</button>';
  const starLine=score=>'<span class="stars" aria-label="'+score+' de 2 estrellas">'+
    '<span aria-hidden="true">'+('★'.repeat(score))+'</span><span class="unearned" aria-hidden="true">'+('☆'.repeat(2-score))+'</span></span>';
  const routeSymbols={cleared:'✓',active:'▶',open:'▷',locked:'<span class="route-lock"></span>'};
  function routeNode(item,next){
    const locked=gradeLocked(item.level,item.unit)||(!item.mastered&&item.missing.length);
    const status=locked?'locked':item.mastered?'cleared':item.id===next?'active':'open';
    const descriptions={cleared:'Completada',locked:'Bloqueada. Vista previa',active:'Siguiente',open:'Disponible'};
    const coinClass='route-coin '+status;
    const action=' type="button" data-lesson="'+esc(item.id)+'" aria-label="'+esc(item.name+' · '+descriptions[status])+'"'+
      (status==='active'?' aria-current="step"':'');
    const face='<span aria-hidden="true">'+routeSymbols[status]+'</span>'+
      (status==='active'&&item.stars?'<span class="route-star" aria-hidden="true">★</span>':'');
    const label='<strong>'+esc(item.name)+'</strong>'+(item.area?'<small>'+esc(item.area)+'</small>':'');
    return '<li class="route-stop"><button class="route-mission"'+action+'><span class="'+coinClass+
      '" aria-hidden="true">'+face+'</span><span class="route-mission-label">'+label+'</span></button></li>';
  }
  function biomeArt(world){
    return '<div class="biome-landscape" aria-hidden="true"></div>'+
      '<img class="biome-rival" src="arena/'+world.enemy+'.webp" width="204" height="142" alt="" decoding="async">';
  }
  function routeBiomes(items,next){
    const biomes=[];
    for(const item of items){
      const world=missionWorld(item);
      if(biomes.at(-1)?.world.group!==world.group)biomes.push({world,stops:[],members:[]});
      biomes.at(-1).stops.push(routeNode(item,next));
      biomes.at(-1).members.push(item);
    }
    const crown=(world,members)=>{
      const boss=worldBoss('jefe-mundo-'+world.group);
      if(!boss)return '';
      const ready=members.every(item=>item.mastered),won=adventurePack().wins.includes(boss.id);
      return '<div class="fun-world-boss'+(ready?' ready':'')+(won?' won':'')+'"><span aria-hidden="true">👑</span><div><strong>'+esc(boss.name)+'</strong><small>'+
        (won?'¡Derrotado! Puedes repetir el duelo.':ready?'Jefe opcional · cofre épico':'Completa las misiones de este mundo')+'</small></div>'+
        (ready?adventureButton(boss.id,won?'Repetir':'Desafiar →','small'+(won?'':' primary')):'')+'</div>';
    };
    return biomes.map(({world,stops,members})=>'<li class="route-biome" data-route-world="'+world.location+
      '" style="'+worldBackground(world)+'">'+biomeArt(world)+
      '<header class="biome-heading"><h3>'+esc(world.name)+'</h3><p>'+esc(world.rival)+'</p>'+
      '<small class="biome-attack">'+esc(world.move)+(world.guard?' · Barrera matemática':'')+'</small></header>'+
      '<ol class="biome-missions">'+stops.join('')+'</ol>'+crown(world,members)+'</li>').join('');
  }
  function gradeBossCard(boss){
    const arena=bossArena(boss);
    const detail=boss.won?(boss.final?'¡Historia completada!':'¡Jefe vencido! El siguiente capítulo está abierto.'):boss.ready?
      'Responde rápido: el jefe da menos tiempo y tiene mucha más vida. Mezcla '+boss.questions+' temas del grado.':
      'Completa las '+boss.missions+' misiones del grado para abrir este duelo.';
    return '<section class="route-biome route-boss story-boss'+(boss.final?' story-final':'')+'" aria-labelledby="final-boss-name" tabindex="-1" style="'+
      worldBackground(arena)+'">'+biomeArt(arena)+'<header class="biome-heading"><p>'+(boss.final?'Jefe final de la historia':'Jefe final del grado')+
      '</p><h3 id="final-boss-name">'+esc(boss.name)+'</h3><p>♥ '+boss.health+' corazones · '+esc(boss.title)+'</p></header>'+
      '<div class="boss-route-actions"><p>'+detail+'</p>'+
      (boss.ready&&boss.unlocked?adventureButton(boss.id,boss.won?'Repetir el duelo':'Desafiar a '+esc(boss.name)+' →'):'')+'</div></section>';
  }
  function learningPath(chosen,items,cleared){
    const boss=gradeBoss(level,unit);
    const next=items.find(item=>!item.mastered&&!item.missing.length)?.id;
    const regularFinished=cleared===items.length;
    const finished=regularFinished&&(!boss||boss.won)&&!gradeLocked(level,unit);
    const canAdvance=unit<chosen.units.length||level<state.levels.length;
    const cup='<span class="route-cup'+(finished?' earned':'')+'" aria-hidden="true">🏆</span>';
    return '<section class="route-field" aria-label="Camino de aprendizaje">'+
      '<ol class="route-path route-biomes">'+routeBiomes(items,next)+'</ol>'+
      (boss?gradeBossCard(boss):'')+
      '<div class="route-finish'+(finished?' earned':'')+'">'+cup+
      '<strong>'+(finished?'¡Grado superado!':'Trofeo del grado')+'</strong>'+
      (finished&&canAdvance?btn('advance-path',unit<chosen.units.length?'Siguiente grado →':'Siguiente nivel →','small primary'):'')+
      '</div></section>';
  }
  function schoolAdventure(chosen,items,cleared,tabs){
    const pack=adventurePack();
    const boss=gradeBoss(level,unit);
    const challenge=Boolean(boss&&boss.ready&&!boss.won&&!gradeLocked(level,unit));
    const locked=gradeLocked(level,unit);
    const previous=previousBoss(level,unit);
    const next=items.find(item=>!pack.wins.includes(item.id)&&!item.missing.length);
    const world=challenge?bossArena(boss):missionWorld(next||items.at(-1));
    const chapter=boss?'<p class="story-chapter">📖 '+esc(boss.story)+' · '+esc(boss.chapter)+'</p>'+
      (boss.won&&boss.final?'<div class="story-ending"><strong>🏆 Final de la historia</strong><p>'+esc(boss.victory)+'</p></div>':
        '<p class="story-intro">'+esc(boss.intro)+'</p>'):'';
    const intro=chapter+(locked?'<p>Vence a '+esc(previous?.name||'')+' para empezar este capítulo.</p>'+
      btn('boss-map','Ver el jefe anterior','primary'):challenge?
      '<p class="chapter-location">'+esc(boss.name)+' te espera en '+esc(boss.title)+'.</p>'+adventureButton(boss.id,'Jugar el duelo final →'):
      '<p>'+esc(world.story)+'</p><p class="chapter-location">Próximo duelo con '+esc(world.rival)+'</p>'+
      (next?adventureButton(next.id,'Jugar: '+esc(next.name)):''));
    return '<div class="adventure"><div class="subnav village-map-nav">'+btn('all-levels','← Niveles','ghost')+
      villageEntry()+'</div>'+
      '<header class="adventure-chapter" style="'+worldBackground(world)+'"><div><p>'+esc(chosen.title)+' · '+esc(chosen.units[unit-1])+'</p><h1>'+esc(world.name)+'</h1>'+
      intro+'</div></header>'+
      '<div class="adventure-grades">'+tabs+'</div>'+
      '<div class="adventure-map-heading"><div><h2>Mapa de la aventura</h2><p>'+cleared+' de '+items.length+
      ' misiones completadas</p></div><div class="adventure-supplies" aria-label="Ayudas disponibles">'+
      '<span>Caballero · nivel '+(pack.wins.length+1)+'</span><span>● '+state.village.stock.coins+' monedas</span>'+
      '<span>✦ '+pack.hints+' '+(pack.hints===1?'pista':'pistas')+'</span><span>⬟ '+pack.shields+' '+(pack.shields===1?'escudo':'escudos')+'</span></div></div>'+
      learningPath(chosen,items,cleared)+'</div>';
  }
  function universityResults(chosen){
    const terms=normalizeSearch(universityQuery).split(/\s+/).filter(Boolean);
    const search=terms.length>0;
    const items=search?state.topics.filter(item=>item.level===3&&terms.every(term=>
      normalizeSearch(item.name+' '+chosen.units[item.unit-1]).includes(term))):unitTopics(3,unit);
    const heading=search?'Resultados de búsqueda':chosen.units[unit-1];
    const count=items.length+(items.length===1?' tema':' temas');
    const credited=items.filter(item=>item.mastered).length;
    const courseLab='';
    return '<header class="university-results-head"><div><h2>'+esc(heading)+'</h2><p role="status">'+count+
      (search?'':' · '+credited+' '+(credited===1?'acreditado':'acreditados'))+'</p></div>'+courseLab+'</header>'+
      (items.length?'<div class="university-topic-grid">'+items.map(item=>'<button class="university-topic" type="button" data-lesson="'+
        esc(item.id)+'"><span><strong>'+esc(item.name)+'</strong>'+
        (search?'<small>'+esc(chosen.units[item.unit-1])+'</small>':'')+
        (item.mastered?'<small class="university-credit">Acreditado</small>':item.stars?'<small>En práctica</small>':'')+
        '</span><span class="university-open" aria-hidden="true">→</span></button>').join('')+'</div>':
        '<p class="university-empty">Prueba con otro nombre de tema o curso.</p>');
  }
  function universityPage(chosen){
    const courses=chosen.units.map((name,index)=>{
      const count=unitTopics(3,index+1).length;
      return '<button class="university-course" type="button" data-unit="'+(index+1)+'" aria-pressed="'+(unit===index+1)+
        '"><span>'+esc(name)+'</span><small>'+count+'</small></button>';
    }).join('');
    return '<div class="university-page"><div class="subnav">'+btn('all-levels','← Niveles','ghost')+'</div>'+
      '<header class="university-heading"><div><h1>Matemáticas universitarias</h1><p>'+chosen.total+
      ' temas en '+chosen.units.length+' cursos · Ciencias e ingeniería</p></div>'+
      graphButton(null,'Abrir graficador 2D y 3D','primary')+'</header>'+
      '<nav class="university-tools" aria-label="Herramientas universitarias">'+
      '<button class="university-tool" type="button" data-fun="formulas:all"><strong>Formulario universitario</strong><small>Consulta fórmulas por curso y por tema.</small><span aria-hidden="true">→</span></button>'+
      '<button class="university-tool" type="button" data-open-lab="gradient"><strong>Laboratorios interactivos</strong><small>Experimenta con modelos, gráficos y datos.</small><span aria-hidden="true">→</span></button>'+
      '<button class="university-tool" type="button" data-action="open-notebook"><strong>Cuaderno por curso</strong><small>Guarda apuntes, ejercicios y gráficas.</small><span aria-hidden="true">→</span></button>'+
      '<button class="university-tool" type="button" data-action="procedure-exam"><strong>Evaluación por procedimiento</strong><small>Recibe puntaje por tus pasos y por el resultado.</small><span aria-hidden="true">→</span></button></nav>'+
      '<div class="university-layout"><nav class="university-courses" aria-label="Cursos universitarios"><h2>Cursos</h2>'+
      courses+'</nav><section class="university-catalog" aria-label="Catálogo de temas">'+
      '<label class="university-search">Buscar tema o curso<input id="university-search" type="search" value="'+
      esc(universityQuery)+'" placeholder="Ej. Bayes, planos o Newton" autocomplete="off"></label>'+
      '<div id="university-results">'+universityResults(chosen)+'</div></section></div></div>';
  }
  const notebookKinds={note:'Apunte',exercise:'Ejercicio',graph:'Gráfica'};
  function notebookContent({kind,payload}){
    if(kind==='exercise')return (payload.question?'<p>'+esc(payload.question)+'</p>':'')+
      (payload.problem?'<pre>'+esc(payload.problem)+'</pre>':'')+
      (payload.result?'<p><strong>Resultado</strong> '+mathText(payload.result)+'</p>':'');
    if(kind==='graph')return '<pre>'+esc(payload.expressions.join('\n'))+'</pre>'+
      (payload.image?'<img src="'+esc(payload.image)+'" alt="Vista guardada de la gráfica '+payload.mode+'D" loading="lazy">':'');
    return '';
  }
  function notebookPage(){
    const selected=bookDraft;
    const cards=book.entries.map(entry=>'<article class="book-entry"><small>'+notebookKinds[entry.kind]+' · '+date(entry.updated)+
      '</small><h3>'+esc(entry.title)+'</h3>'+notebookContent(entry)+
      (entry.body?'<p class="book-body">'+esc(entry.body)+'</p>':'')+
      '<div class="row"><button class="btn small" type="button" data-book-edit="'+esc(entry.id)+'">Editar</button>'+
      (entry.kind==='graph'?'<button class="btn small" type="button" data-book-graph="'+esc(entry.id)+'">Abrir en graficador →</button>':'')+'</div></article>').join('');
    const title=selected?.id?'Editar '+notebookKinds[selected.kind].toLowerCase():
      selected?.kind==='graph'?'Guardar gráfica':selected?.kind==='exercise'?'Guardar ejercicio':'Nuevo apunte';
    const editor=selected?'<section class="lab-card book-editor" aria-label="'+title+'"><header><h2>'+title+'</h2></header>'+
      '<form class="form" id="book-entry-form">'+field('Título','title',selected.title,'maxlength="100" required')+
      (selected.kind!=='note'?'<div class="book-attachment">'+notebookContent(selected)+'</div>':'')+
      area('Apuntes','body',selected.body,'rows="6" maxlength="2400"'+(selected.kind==='note'?' required':''))+
      '<div class="row"><button class="btn primary" type="submit">Guardar entrada</button>'+btn('book-cancel','Cancelar')+'</div>'+
      (selected.id?'<details class="book-delete"><summary>Eliminar entrada</summary>'+btn('book-remove','Confirmar eliminación','small')+'</details>':'')+
      '</form></section>':'';
    return '<div class="academic-page"><div class="subnav">'+btn('back-university','← Universitario','ghost')+'</div>'+
      '<header class="academic-heading"><h1>Cuaderno universitario</h1></header>'+
      '<div class="book-controls">'+select('bookCourse','Curso',state.levels[2].units.map((name,index)=>[index+1,name]),bookUnit)+
      '<div class="row">'+btn('book-new','Nuevo apunte','primary')+
      '<button class="btn" type="button" data-action="book-pdf"'+(cards?'':' disabled')+'>Exportar PDF</button></div></div>'+
      '<div class="book-layout'+(editor?' editing':'')+'">'+editor+'<section class="book-entries" aria-label="Entradas de '+esc(book.course)+'">'+
      (cards||'<p class="book-empty">Aún no hay entradas en este curso.</p>')+'</section></div></div>';
  }
  async function openNotebook(course,draft=null){
    const prior=bookUnit;
    book=await call('notebook',{action:'list',unit:course});
    bookUnit=course;
    bookDraft=draft;
    page='notebook';
    if(course!==prior||draft)window.scrollTo(0,0);
    if(draft)requestAnimationFrame(()=>view.querySelector('#book-entry-form [name="title"]')?.focus({preventScroll:true}));
  }
  async function attachExercise(source){
    const item=source==='lesson'?lesson.example:practice;
    const subject=topic(source==='lesson'?lesson.id:practice.topic);
    if(subject.level!==3)return;
    const result=source==='lesson'?lessonSolution:grade?.solution;
    await openNotebook(subject.unit,{kind:'exercise',title:subject.name,body:'',
      payload:{question:item.question,problem:item.expression||item.problem,result:result?.result}});
  }
  function learning(){
    const chosen=state.levels.find(item=>item.id===level);
    if(!chosen)return heading('Elige tu nivel','')+stageCards();
    if(level===3)return universityPage(chosen);
    const items=unitTopics(level,unit);
    const cleared=items.filter(item=>item.mastered).length;
    const tabs='<div class="grade-tabs" aria-label="Grados">'+chosen.units.map((title,index)=>
      '<button class="btn" type="button" data-unit="'+(index+1)+'" aria-pressed="'+(unit===index+1)+'">'+esc(title)+'</button>').join('')+'</div>';
    return schoolAdventure(chosen,items,cleared,tabs);
  }
  function solutionStep(item,index){
    const expression=item.expression?.split('  →  ');
    return '<li class="study-step" value="'+(index+1)+'"><span aria-hidden="true">'+(index+1)+'</span><div><strong>'+esc(item.rule)+'</strong>'+
      '<p>'+mathText(item.explanation)+'</p>'+(item.formula?
      '<div class="step-math">'+safeMath(item.formula,item.expression)+'</div>':expression?.length>1?
      '<div class="math-change"><span>'+mathText(expression[0])+ '</span><b aria-hidden="true">→</b><span>'+
      mathText(expression[1])+'</span></div>':item.expression?'<div class="step-math">'+mathText(item.expression)+'</div>':'')+'</div></li>';
  }
  function limitVisual(info){
    if(!info)return '';
    const [left,right]=info.samples;
    const start=info.slope>0?94:25,end=info.slope>0?25:94;
    return '<figure class="limit-visual"><figcaption>Desde ambos lados se acerca a '+mathText(info.y)+'</figcaption>'+
      '<svg viewBox="0 0 340 130" aria-hidden="true"><path class="limit-gridline" d="M18 60H322M170 12V109"/>'+
      '<path class="limit-left" d="M35 '+start+'L170 60"/><path class="limit-right" d="M170 60L305 '+end+'"/>'+
      '<circle class="limit-left" cx="75" cy="'+(start+(60-start)*40/135)+'" r="4"/>'+
      '<circle class="limit-right" cx="265" cy="'+(60+(end-60)*95/135)+'" r="4"/>'+
      '<circle class="limit-hole" cx="170" cy="60" r="6"/><text x="170" y="125" text-anchor="middle">x = '+mathText(info.x)+'</text></svg>'+
      '<div class="limit-values"><span><small>Izquierda</small><b>'+mathText(left.x)+' → '+mathText(left.y)+'</b></span>'+
      '<span><small>Límite</small><b>'+mathText(info.y)+'</b></span>'+
      '<span><small>Derecha</small><b>'+mathText(right.x)+' → '+mathText(right.y)+'</b></span></div></figure>';
  }
  function finalAnswer(result){
    const simpleEquation=result.kind==='Ecuación'&&/^\{[^,{}]+\}$/.test(result.result);
    const answer=simpleEquation?mathText((result.data?.Variable||'x')+' = '+result.result.slice(1,-1)):safeMath(result.formula,result.result);
    return '<div class="final-answer"><span>Respuesta</span><div>'+answer+
      (result.formula&&result.suffix?esc(result.suffix):'')+'</div></div>';
  }
  function procedure(result,showAnswer=true,fallback=''){
    const steps=result.steps.length?'<ol class="procedure">'+result.steps.map(solutionStep).join('')+'</ol>':
      '<p>'+mathText(fallback||result.explanation)+'</p>';
    return steps+limitVisual(result.approach)+(showAnswer?finalAnswer(result):'');
  }
  function solutionHtml(result,calculator=false){
    if(!result)return '<div class="calc-empty"><span aria-hidden="true">=</span><p>Escribe una expresión y pulsa <strong>Resolver</strong>.</p></div>';
    const data=Object.entries(result.data||{});
    const single=calculator&&result.kind==='Ecuación'&&/^\{[^,{}]+\}$/.test(result.result);
    const answer=single?mathText((result.data?.Variable||'x')+' = '+result.result.slice(1,-1)):safeMath(result.formula,result.result);
    return '<div class="row spread"><span class="tag">'+esc(result.kind)+'</span><span class="tag '+(result.verified?'ok':'lock')+'">'+
      (result.verified?'Comprobación disponible':'Cálculo simbólico')+'</span></div><div class="math-answer formula">'+answer+
      (result.formula&&result.suffix?esc(result.suffix):'')+'</div><p>'+mathText(result.explanation)+'</p>'+
      (data.length?'<p class="muted">'+data.map(([label,value])=>esc(label)+' · '+esc(value)).join(' · ')+'</p>':'')+
      (result.steps.length?(calculator?'<h3 class="calc-steps-heading">Procedimiento</h3>':'')+procedure(result,false):
        '<p class="muted">El cálculo no tiene una secuencia didáctica disponible.</p>')+
      '<div class="verification"><strong>Comprobación</strong><p>'+esc(result.verification)+'</p></div>';
  }
  function exerciseVisual(visual){
    if(!visual)return '';
    const [kind,a,b]=visual;
    const stars=count=>'<span aria-hidden="true">'+Array.from({length:count},()=>'<span>★</span>').join('')+'</span>';
    if(kind==='stars')return '<div class="count-visual" role="img" aria-label="'+a+' estrellas">'+stars(a)+'</div>';
    if(kind==='groups'||kind==='sharing'){
      const dots=count=>'<span class="math-dots" aria-hidden="true">'+Array.from({length:count},()=>'<i></i>').join('')+'</span>';
      const sharing=kind==='sharing';
      return '<div class="math-groups" role="img" aria-label="'+(sharing?a+' fichas para repartir entre '+b+' grupos':a+' grupos de '+b+' fichas')+'">'+
        (sharing?'<div class="sharing-total"><strong>'+a+' fichas</strong>'+dots(a)+'</div>':'')+
        '<div class="math-baskets">'+Array.from({length:sharing?b:a},()=>'<span>'+(sharing?'?':dots(b))+'</span>').join('')+'</div></div>';
    }
    if(kind==='pictogram')return '<div class="pictogram"><div><b>A</b><div role="img" aria-label="'+a+' votos">'+stars(a)+'</div></div>'+
      '<div><b>B</b><div role="img" aria-label="'+b+' votos">'+stars(b)+'</div></div></div>';
    if(kind==='bars')return '<div class="vote-bars">'+[a,b].map((count,index)=>'<div><b>'+['A','B'][index]+
      '</b><div class="vote-blocks" role="img" aria-label="'+count+' votos">'+Array.from({length:count},()=>'<span></span>').join('')+
      '</div><b>'+count+'</b></div>').join('')+'</div>';
    if(kind==='polygon'){
      const points=Array.from({length:a},(_,i)=>{const angle=2*Math.PI*i/a-Math.PI/2;return (64+45*Math.cos(angle))+','+(57+45*Math.sin(angle));});
      return '<svg class="polygon" role="img" aria-label="Polígono de '+a+' lados" viewBox="0 0 128 114"><polygon points="'+points.join(' ')+'"/></svg>';
    }
    return '';
  }
  function exerciseText(item,example=false,allowGraph=true){
    const visible=item.showExpression!==false;
    const readable=item.expression??item.problem;
    const formulaVisible=(visible||example&&!item.visual)&&(item.problemFormula||readable);
    const argumentInFormula=item.problemFormula&&(item.operation==='integral'||item.operation==='limit');
    return (item.question?'<p class="question">'+mathText(item.question)+'</p>':'')+exerciseVisual(item.visual)+
      (formulaVisible?'<div class="formula exercise-formula">'+safeMath(item.problemFormula,readable)+'</div>':'')+
      (visible&&item.argument&&!argumentInFormula?'<small>'+parameter(item.operation)+' · '+mathText(item.argument)+'</small>':'')+
      (allowGraph&&item.graph?'<div class="exercise-graph">'+graphButton(item.graph,'Explorar gráfico '+item.graph.mode+'D →')+'</div>':'');
  }
  function lessonPage(){
    const item=topic(lesson.id), school=item.level<3, locked=!item.mastered&&item.missing.length;
    const rule=lesson.custom?.formula||lesson.formula;
    const theory=panel('Cómo se hace','<p>'+mathText(lesson.custom?.theory||lesson.theory)+'</p>'+
      (rule?'<div class="formula">'+mathText(rule)+'</div>':'')+
      (lesson.note?details('Mi apunte','<p>'+esc(lesson.note)+'</p>'):''));
    const actions=gradeLocked(item.level,item.unit)?row('<small>Vence a '+esc(previousBoss(item.level,item.unit)?.name||'')+
      ' para jugar este duelo.</small>'+btn('boss-map','Ver el jefe anterior','small')):
      locked?'<small>Completa la misión anterior para jugar.</small>'+
      lessonButton(item.missing[0],esc(topic(item.missing[0]).name)+' →','small'):
      row(btn(school?'start-mission':'lesson-practice',school?(adventurePack().wins.includes(item.id)?'Repetir duelo':'Jugar duelo →'):'Practicar →','primary')+
        (school?'<small>Rival con '+state.adventureGuide.rivals[state.adventureGuide.groups[item.id]].hearts+' corazones</small>':btn('lesson-guided','Con pista')));
    const example=panel('Ejemplo resuelto',exerciseText(lesson.example,true)+procedure(lessonSolution,true,lesson.theory)+
      (school?'':details('Comprobación','<p>'+mathText(lessonSolution.verification)+'</p>')+
        '<button class="btn small" type="button" data-note-exercise="lesson">Guardar ejemplo en cuaderno</button>'));
    return '<div class="study-width'+(school?'':' university-lesson')+'"><div class="subnav">'+btn('back-learn','← '+(school?'Misiones':'Catálogo'),'ghost')+
      (school?starLine(item.stars):'')+'</div>'+heading(esc(lesson.name),[stageTitle(item).title,stageTitle(item).units[item.unit-1],item.area].filter(Boolean).map(esc).join(' · '))+
      '<div class="study-stack">'+theory+example+videoCard(item.id)+'<div class="lesson-actions">'+actions+'</div>'+
      (school?'':details('Herramientas del tema',row(btn('example-to-solver','Abrir en el solucionador','small')+
        btn('lesson-exam','Evaluar curso','small'))))+'</div></div>';
  }

  function calculatorKeyboard(){
    const keys=[
      ['sin','sin','wrap','Seno'],['cos','cos','wrap','Coseno'],['tan','tan','wrap','Tangente'],
      ['ln','ln','wrap','Logaritmo natural'],['√','sqrt','wrap','Raíz cuadrada'],['x²','^2','insert','Elevar al cuadrado'],
      ['(','('],[')',')'],['x','x'],['π','π'],['xⁿ','^','insert','Potencia'],['⌫','erase','edit','Borrar un carácter'],
      ['7','7'],['8','8'],['9','9'],['÷','÷','insert','Dividir'],['d/dx','derivative','mode','Derivada'],['∫','integral','mode','Integral'],
      ['4','4'],['5','5'],['6','6'],['×','×','insert','Multiplicar'],['[','['],[']',']'],
      ['1','1'],['2','2'],['3','3'],['−','−','insert','Restar'],[',',','],[';',';'],
      ['0','0'],['.','.'],['=','=','insert','Igual en la expresión'],['+','+','insert','Sumar'],['AC','clear','edit','Limpiar expresión']
    ];
    return '<div class="calc-keys" role="group" aria-label="Teclado científico">'+keys.map(([label,value,type='insert',name=label])=>
      '<button type="button" class="btn calc-key'+(/^[0-9.]$/.test(label)?' digit':'')+(value==='clear'?' clear':'')+
      '" data-calc-key="'+type+'" data-calc-value="'+esc(value)+'" aria-label="'+esc(name)+'">'+esc(label)+'</button>').join('')+'</div>';
  }
  function solverPage(){
    const editor='<form id="solver-form" class="calc-console">'+
      '<div class="calc-modes">'+select('operation','Operación',Object.entries(state.operations),solver.operation)+
      select('variable','Variable',['x','t','y','z','a','b','c','n'].map(v=>[v,v]),solver.variable)+
      '<label class="calc-argument"'+(calculatorArguments[solver.operation]?'':' hidden')+'><span id="parameter-label">'+parameter(solver.operation)+
      '</span><input name="argument" maxlength="100" value="'+esc(solver.argument)+'" placeholder="'+esc(calculatorArguments[solver.operation])+'"></label></div>'+
      '<div class="calc-screen">'+area('Expresión','problem',solver.problem,'maxlength="600" rows="2" required spellcheck="false" placeholder="Ej. 2×x + 3 = 9"')+
      '<div id="math-preview" aria-label="Vista previa"></div></div>'+calculatorKeyboard()+
      '<div class="calc-submit"><button type="submit" class="btn primary" aria-keyshortcuts="Control+Enter">Resolver <span aria-hidden="true">↵</span></button>'+
      '<kbd>Ctrl + Enter</kbd></div></form>';
    const history=solved.length?'<div class="history">'+solved.map(item=>'<details><summary>'+esc(item.solution.problem)+' <small>'+date(item.date)+'</small></summary><p>'+
      esc(item.solution.result)+'</p><button class="btn small" data-solved="'+item.id+'">Ver solución</button></details>').join('')+'</div>':
      '<p class="muted">Tus problemas resueltos aparecerán aquí.</p>';
    return '<div class="calculator-workspace">'+heading('Solucionador matemático','')+
      '<div class="calc-examples" aria-label="Ejemplos"><span>Ejemplos</span>'+presets.map(([label],index)=>
        '<button type="button" class="btn small" data-preset="'+index+'">'+label+'</button>').join('')+'</div>'+
      '<div class="solver-grid">'+editor+
      '<section class="panel calc-result-panel" aria-labelledby="calc-result-title"><header><h2 id="calc-result-title">Resultado</h2></header>'+
      '<div class="panel-body" id="solver-result" tabindex="-1" aria-live="polite">'+solutionHtml(solution,true)+'</div></section></div>'+
      '<div class="calc-bottom">'+details('Historial de cálculos',history)+
      details('Cómo escribir una operación','<p class="muted">Escribe los decimales con punto, como 2.5. Separa las ecuaciones de un sistema con punto y coma, como x+y=8; x−y=2.</p>')+'</div></div>';
  }

  function teacherCatalog(stage){
    const filters=['Todos los temas',...stage.units].map((unitName,index)=>
      '<button type="button" class="btn small" data-teacher-unit="'+index+'" aria-pressed="'+(teacherUnit===index)+'">'+esc(unitName)+'</button>').join('');
    return '<section class="teacher-catalog stage-'+stage.id+'" aria-label="Temas de '+esc(stage.title)+'">'+
      '<header class="teacher-catalog-header"><label for="teacher-topic-search">Buscar en '+esc(stage.title.toLowerCase())+'</label>'+
      '<input id="teacher-topic-search" type="search" autocomplete="off" placeholder="Buscar por tema o '+(stage.id<3?'grado':'curso')+'" value="'+esc(teacherSearch)+'">'+
      '<div class="teacher-unit-filters" role="group" aria-label="Filtrar por '+(stage.id<3?'grado':'curso')+'">'+filters+'</div></header>'+
      '<p class="teacher-topic-count" role="status"></p>'+
      '<div class="teacher-topic-results" role="group" aria-label="Temas del catálogo"></div></section>';
  }
  function filterTeacherTopics(){
    const catalog=view.querySelector('.teacher-catalog');
    if(!catalog)return;
    const stage=state.levels.find(item=>item.id===teacherLevel);
    const terms=normalizeSearch(teacherSearch).split(/\s+/).filter(Boolean);
    let total=0;
    const groups=stage.units.map((name,index)=>{
      const number=index+1;
      if(teacherUnit&&teacherUnit!==number)return '';
      const items=unitTopics(stage.id,number).filter(item=>{
        const searchable=normalizeSearch([item.name,item.area,name].join(' '));
        return terms.every(term=>searchable.includes(term));
      });
      if(!items.length)return '';
      total+=items.length;
      return '<section class="teacher-topic-group"><h2>'+esc(name)+'</h2><div class="teacher-topic-list">'+items.map(item=>
        '<button type="button" class="teacher-catalog-topic" data-teacher-topic="'+esc(item.id)+'"><span><strong>'+esc(item.name)+'</strong>'+
        (item.area?'<small>'+esc(item.area)+'</small>':'')+'</span><span aria-hidden="true">→</span></button>').join('')+'</div></section>';
    }).join('');
    catalog.querySelector('.teacher-topic-count').textContent=total+(total===1?' tema':' temas');
    catalog.querySelector('.teacher-topic-results').innerHTML=groups||'<p class="teacher-empty muted">No se encontraron temas con ese filtro.</p>';
  }
  function teacherPage(){
    const result=teacher?.grounding;
    const stage=state.levels.find(item=>item.id===teacherLevel);
    const check=stepCheck?'<ol class="step-report">'+stepCheck.checks.map(item=>'<li class="'+(item.ok?'passed':'review')+'"><strong>'+
      (item.ok?'✓':'↻')+' Línea '+item.line+'</strong><b>'+mathText(item.input)+'</b><p>'+esc(item.message)+'</p></li>').join('')+
      '</ol>'+details('Ver cómo se resuelve',procedure(stepCheck.solution)):'';
    const checker='<details class="study-disclosure"'+(stepsDraft||stepCheck?' open':'')+'><summary>Revisar mis pasos</summary>'+
      '<div class="toolrow">'+btn('sample-steps','Cargar ejemplo','small')+'</div>'+
      form('steps-form',area('Escribe una operación por línea','lines',stepsDraft,'maxlength="1200" rows="4" required placeholder="2 × x + 3 = 9&#10;2 × x = 6&#10;x = 3"'),'Comprobar pasos')+check+'</details>';
    if(!stage)return '<div class="teacher-page teacher-entry">'+heading('Profesor','Elige un nivel para ver sus lecciones y videos.')+
      stageCards('teacher-level')+checker+'</div>';
    const ask='<form id="teacher-form" class="form">'+select('topic','Tema',[['','Detectar por nombre'],
      ...state.topics.filter(item=>item.level===stage.id).map(item=>[item.id,item.name])],teacherDraft.topic)+
      area('Pregunta','question',teacherDraft.question,'maxlength="500" rows="2" placeholder="Escribe tu duda"')+
      row('<button class="btn primary" name="mode" value="local">Ver explicación</button>'+
      (ai.enabled?'<button class="btn" name="mode" value="online">Pedir pista con IA</button>':''))+'</form>';
    const inLesson=result&&!result.clarify;
    const back=inLesson?btn('teacher-topics','← Volver a los temas','ghost'):btn('teacher-levels','← Niveles de Profesor','ghost');
    const header=inLesson?'<div class="teacher-lesson-path">Profesor / '+esc(stage.title)+'</div>':
      '<header class="teacher-level-heading stage-'+stage.id+'"><div><h1>'+esc(stage.title)+'</h1><p>'+esc(stage.description)+'</p></div>'+
      '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">'+stageArt[stage.id-1]+'</svg></header>';
    return '<div class="teacher-page"><div class="teacher-back">'+back+'</div>'+header+
      (inLesson?teacherExample(result):teacherCatalog(stage))+
      (result?.clarify?'<p class="input-error" role="alert">'+esc(result.message)+'</p>':'')+
      '<details class="study-disclosure"'+(result?.clarify?' open':'')+'><summary>Hacer una pregunta</summary>'+ask+'</details>'+checker+'</div>';
  }
  const videos={
    conteo:['YN5UmySnGpw','Aprende a contar del 1 al 10','Smile and Learn'],
    suma:['w1QjcBfzAZ8','Cálculo mental con sumas, restas y más','Smile and Learn'],
    multiplicar:['w1QjcBfzAZ8','Cálculo mental con las cuatro operaciones','Smile and Learn'],
    dividir:['w1QjcBfzAZ8','Cálculo mental con las cuatro operaciones','Smile and Learn'],
    fracciones:['JNBkPD96WbU','Operaciones con fracciones','Smile and Learn'],
    lineales:['4AixPIIV05E','Cómo resolver una ecuación de primer grado','Matemáticas profe Alex'],
    factor:['a8CUEopWCN0','Métodos de factorización','Matemáticas profe Alex'],
    limites:['h9lEAU5-CSg','Límites por factorización','Matemáticas profe Alex']
  };
  function youtubeLesson([id,title,author]){
    return '<button type="button" class="study-video" data-video="'+esc(id)+
      '" aria-label="'+esc('Ver '+title+' en YouTube')+'"><span class="video-icon" aria-hidden="true">▶</span><span><strong>'+
      esc(title)+'</strong><small>'+esc(author?author+' · YouTube':'Lección en YouTube')+' ↗</small></span></button>';
  }
  function videoCard(topicId){
    const info=topic(topicId);
    if(!info)return '';
    const video=videos[topicId];
    const extra=youtubeLessons[topicId];
    const guided='<button type="button" class="study-video study-video-local" data-lesson-video="'+esc(info.id)+
      '"><span class="video-icon" aria-hidden="true">▶</span><span><strong>Reproducir minilección</strong>'+
      '<small>Teoría y ejemplo paso a paso</small></span></button>';
    if(video||extra)return '<div class="study-videos">'+guided+(video?youtubeLesson(video):'')+
      (extra?youtubeLesson(extra):'')+'</div>';
    return '<div class="study-videos">'+guided+'<button type="button" class="btn small ghost" data-search-video="'+
      esc(info.id)+'">Buscar videos en YouTube ↗</button></div>';
  }
  function searchTopicVideos(id){
    const item=topic(id);
    if(!item)return;
    const stage=stageTitle(item);
    const names={
      resta1:'restas con dibujos quitar y contar', igualdad1:'igualdades con sumas número faltante',
      equilibrio3:'igualdades con balanza número desconocido',equilibrio6:'ecuación con balanza y fichas',
      lados:'contar los lados de polígonos',figuras:'área del rectángulo',
      masa:'conversiones unidades de masa',ap_deriv:'aplicación de derivadas velocidad instantánea',
      ap_int:'aplicaciones de integrales definidas acumulación',
    };
    const query=[names[id]||item.name,'matemáticas',stage.title,stage.units[item.unit-1]].join(' ');
    void call('searchVideos',{query}).catch(error=>say(errorText(error),true));
  }
  function lessonVideoFrames(content){
    const {name,theory,formula,example,solution}=content;
    const concept=theory||solution.explanation;
    return [
      {title:'La idea', narration:name+'. '+concept, body:'<p>'+mathText(concept)+'</p>'+
        (formula?'<div class="study-rule">'+mathText(formula)+'</div>':'')},
      {title:'Veamos un ejemplo', narration:example.question||'Veamos el ejemplo en pantalla.',body:exerciseText(example,true)},
      ...solution.steps.map((step,index)=>({title:'Paso '+(index+1), narration:step.rule+'. '+step.explanation,
        body:'<ol class="procedure">'+solutionStep(step,index)+'</ol>'})),
      {title:'Resultado', narration:'Resultado. '+solution.explanation,
        body:(!solution.steps.length?'<p>'+mathText(solution.explanation)+'</p>':'')+finalAnswer(solution)}
    ];
  }
  function playTopicVideo(id){
    const info=topic(id);
    if(!info)return;
    void lessonVideo.open(info.name,async()=>{
      const content=teacher?.grounding?.topic===id?teacher.grounding:await call('teacher',{topic:id});
      return lessonVideoFrames(content);
    });
  }
  function teacherExample(result){
    const {solution,example}=result;
    const step=solution.steps[teacherStep];
    const last=teacherStep>=solution.steps.length-1;
    const controls=solution.steps.length>1?'<div class="step-controls">'+
      '<button type="button" class="btn small" data-action="teacher-prev"'+(teacherStep===0?' disabled':'')+'>← Atrás</button>'+
      '<span>Paso '+(teacherStep+1)+' de '+solution.steps.length+'</span>'+
      '<button type="button" class="btn small primary" data-action="teacher-next"'+(last?' disabled':'')+'>Siguiente →</button></div>':'';
    const topicInfo=topic(result.topic);
    const practiceLink=topicInfo&&(topicInfo.mastered||!topicInfo.missing.length)?
      btn('teacher-practice','Probar un ejercicio →','small primary'):topicInfo?
      lessonButton(topicInfo.id,'Abrir lección →','small'):btn('teacher-to-solver','Abrir en el solucionador','small');
    return '<section class="teacher-lesson"><h1>'+esc(result.name)+'</h1><div class="teacher-grid"><div class="teacher-side">'+
      '<article class="study-theory"><h3>La idea</h3><p>'+mathText(result.theory||solution.explanation)+'</p>'+
      (result.formula?'<div class="study-rule">'+mathText(result.formula)+'</div>':'')+'</article>'+videoCard(result.topic)+
      (teacher.choice!==undefined?'<div class="verification"><strong>Pista</strong><p>'+mathText(result.hints[teacher.choice].text)+'</p></div>':'')+
      '</div>'+panel('Ejemplo guiado','<div class="guided-example">'+
      exerciseText(example,true)+
      (step?'<ol class="procedure" aria-live="polite">'+solutionStep(step,teacherStep)+'</ol>':'')+controls+
      (last?limitVisual(solution.approach)+finalAnswer(solution):'')+'<div class="lesson-actions">'+practiceLink+'</div></div>')+
      '</div></section>';
  }

  function practiceTopicField(available){
    const selected=available.find(item=>item.id===practiceTopic);
    return '<div class="practice-topic-search"><label for="practice-topic-query">Tema</label>'+
      '<div class="practice-topic-field"><span class="practice-search-icon" aria-hidden="true"></span>'+
      '<input id="practice-topic-query" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" '+
      'aria-controls="practice-topic-options" autocomplete="off" spellcheck="false" placeholder="Busca un tema o nivel" value="'+
      esc(selected?.name)+'"'+(available.length?'':' disabled')+'>'+
      '<input type="hidden" name="topic" value="'+esc(selected?.id)+'"></div>'+
      '<div class="practice-topic-popup" hidden><ul id="practice-topic-options" role="listbox" aria-label="Temas disponibles">'+
      available.map((item,index)=>{
        const stage=stageTitle(item);
        return '<li id="practice-topic-option-'+index+'" role="option" aria-selected="false" data-topic-id="'+esc(item.id)+'">'+
          '<strong>'+esc(item.name)+'</strong><small>'+esc(stage.title+' · '+stage.units[item.unit-1])+'</small></li>';
      }).join('')+'</ul><p class="practice-topic-empty" hidden>No hay temas disponibles que coincidan con tu búsqueda.</p></div>'+
      '<span class="sr-only" role="status"></span></div>';
  }

  function bindPracticeTopicSearch(){
    const form=view.querySelector('#practice-config');
    const input=form.querySelector('#practice-topic-query');
    const choice=form.elements.topic;
    const generate=form.querySelector('[type=submit]');
    const popup=form.querySelector('.practice-topic-popup');
    const list=popup.querySelector('[role=listbox]');
    const empty=popup.querySelector('.practice-topic-empty');
    const status=form.querySelector('[role=status]');
    const normalize=normalizeSearch;
    const options=[...list.children].map(element=>({
      element,
      id:element.dataset.topicId,
      name:element.firstElementChild.textContent,
      search:normalize([...element.children].map(child=>child.textContent).join(' '))
    }));
    let visible=[],active=null;

    function activate(option){
      active?.element.setAttribute('aria-selected','false');
      active=option;
      if(active){
        active.element.setAttribute('aria-selected','true');
        input.setAttribute('aria-activedescendant',active.element.id);
      } else input.removeAttribute('aria-activedescendant');
    }
    function show(){
      const terms=choice.value?[]:normalize(input.value).split(/\s+/).filter(Boolean);
      visible=options.filter(option=>{
        const matches=terms.every(term=>option.search.includes(term));
        option.element.hidden=!matches;
        return matches;
      });
      popup.hidden=false;
      list.hidden=!visible.length;
      empty.hidden=Boolean(visible.length);
      input.setAttribute('aria-expanded','true');
      activate(visible.find(option=>option.id===choice.value)||visible[0]);
      active?.element.scrollIntoView({block:'nearest'});
      status.textContent=visible.length===1?'1 tema disponible':visible.length+' temas disponibles';
    }
    function close(){
      popup.hidden=true;
      input.setAttribute('aria-expanded','false');
      activate(null);
      status.textContent='';
    }
    function selectTopic(option){
      choice.value=option?.id||'';
      practiceTopic=choice.value;
      input.value=option?.name||'';
      generate.disabled=!choice.value;
      close();
      funUI.refreshHeader();
    }

    input.addEventListener('focus',()=>{
      if(choice.value)input.select();
      show();
    });
    input.addEventListener('click',()=>{if(popup.hidden)show();});
    input.addEventListener('blur',close);
    input.addEventListener('input',()=>{
      choice.value='';
      generate.disabled=true;
      show();
    });
    input.addEventListener('keydown',event=>{
      if(event.isComposing)return;
      switch(event.key){
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault();
          if(popup.hidden){show();break;}
          const index=visible.indexOf(active)+(event.key==='ArrowDown'?1:-1);
          activate(visible[Math.max(0,Math.min(visible.length-1,index))]);
          active?.element.scrollIntoView({block:'nearest'});
          break;
        }
        case 'Enter':
          if(popup.hidden)break;
          event.preventDefault();
          if(active)selectTopic(active);
          break;
        case 'Escape':
          if(popup.hidden&&choice.value)break;
          event.preventDefault();
          selectTopic(options.find(option=>option.id===practiceTopic));
          break;
      }
    });
    list.addEventListener('mousedown',event=>{
      if(event.target.closest('[role=option]'))event.preventDefault();
    });
    list.addEventListener('click',event=>{
      const element=event.target.closest('[role=option]');
      if(element)selectTopic(visible.find(option=>option.element===element));
    });
  }

  function practicePage(){
    if(mission&&practice)return missionPage();
    const available=state.topics.filter(item=>item.mastered||!item.missing.length);
    if(!available.some(item=>item.id===practiceTopic)){
      practiceTopic=(available.find(item=>item.id===state.recommended)||available[0])?.id||'';
    }
    const settings='<form id="practice-config" class="controls">'+practiceTopicField(available)+
      select('difficulty','Dificultad',difficulties,practiceDifficulty)+'<button class="btn primary" type="submit"'+
      (practiceTopic?'':' disabled')+'>Generar ejercicio</button>'+btn('retry','Repetir un fallado')+'</form>';
    const solved=grade&&!grade.invalid;
    const task=practice?panel(esc(topic(practice.topic).name),exerciseText(practice)+
      (solved?'':practiceInput(false))+(topic(practice.topic).level===3?
        '<div class="exercise-graph"><button class="btn small" type="button" data-note-exercise="practice">Guardar ejercicio en cuaderno</button></div>':'')):
      '<div class="practice-empty"><span aria-hidden="true">✎</span><p>Elige un tema y genera tu primer ejercicio.</p></div>';
    const result=solved?panel('Así se resuelve','<div class="practice-verdict '+(grade.correct?'correct':'review')+'" role="status">'+
      '<span aria-hidden="true">'+(grade.correct?'✓':'↻')+'</span><div><strong>'+
      (grade.correct?'¡Bien hecho!':'Vamos paso a paso')+'</strong><p>Tu respuesta · '+mathText(grade.feedback.answer)+'</p></div></div>'+
      procedure(grade.solution,true,topic(practice.topic).goal)+
      '<div class="lesson-actions">'+btn('next-exercise',grade.correct?'Siguiente ejercicio →':'Probar otro →','primary')+
      '<button type="button" class="btn" data-teacher-topic="'+practice.topic+'">Ver teoría y ejemplo</button></div>'):'';
    return heading('Práctica libre','')+settings+'<div class="practice-board">'+task+result+'</div>';
  }
  function practiceInput(withChoices){
    const response=withChoices&&practice.choices?'<div class="choice-grid" role="group" aria-label="Elige tu respuesta">'+practice.choices.map(choice=>
      '<button class="btn" type="button" data-choice="'+choice+'">'+choice+'</button>').join('')+'</div>':
      form('practice-answer',field('Tu respuesta','answer',withChoices?duelAnswer:grade?.feedback?.answer,'maxlength="450" required autocomplete="off"'),'Comprobar');
    return section(response+(withChoices?'':row(btn('hint','Ver pista','small ghost')))+
      (grade?.invalid?'<p class="input-error" role="alert">'+esc(grade.feedback.message)+'</p>':'')+
      (hint?'<div class="verification"><p>'+mathText(hint.explanation)+'</p></div>':''));
  }
  function fighter(name,lives,total,style,shielded=false,extra=''){
    const hearts='<span aria-hidden="true">'+(total>8?'<b>♥</b><strong class="combat-health-count">'+lives+'<small> / '+total+'</small></strong>':Array.from({length:total},(_,index)=>
      '<b'+(index>=lives?' class="empty"':'')+'>♥</b>').join(''))+'</span>';
    return '<div class="arena-fighter '+style+'"><strong>'+name+'</strong>'+
      '<div class="combat-health" aria-hidden="true"><i style="width:'+100*lives/total+'%"></i></div>'+
      '<div class="arena-hearts" role="group" aria-label="'+lives+' de '+total+' corazones">'+hearts+'</div>'+
      (shielded?'<span class="sr-only">Escudo activo</span>':'')+extra+'</div>';
  }
  function duelSprite(name,lives,weapon=null,equipment={}){
    const gear={weapon:equipment.sword||weapon?.item||'starter-sword',armor:equipment.armor||null,
      shield:equipment.shield||null,label:'Tu caballero'};
    const poses=name==='knight'?'<span class="arena-ready">'+heroRig.render({...gear,pose:'ready'})+'</span>'+
      '<span class="arena-attack">'+heroRig.render({...gear,pose:'attack'})+'</span>':
      '<img class="arena-ready" src="arena/'+name+'.webp" alt="">'+
      '<img class="arena-attack" src="arena/'+name+'-attack.webp" alt="">';
    return '<div class="arena-character '+(name==='knight'?'knight':'enemy '+name)+(lives?'':' defeated')+'" aria-hidden="true">'+
      poses+'</div>';
  }
  const heartCount=count=>count+' '+(count===1?'corazón':'corazones');
  function tacticQuestion(tactic){
    if(tactic?.kind!=='fraction')return exerciseText(practice);
    const [numerator,denominator]=practice.problem.split('/');
    return '<p class="question">Marca esta fracción en la recta para romper la barrera.</p>'+
      '<div class="formula exercise-formula"><math><mfrac><mn>'+esc(numerator)+'</mn><mn>'+esc(denominator)+'</mn></mfrac></math></div>';
  }
  function missionPage(){
    const item=adventureTarget(), subject=topic(practice.topic), stage=stageTitle(item);
    const chapterBoss=gradeBossById(item.id),firstBoss=Boolean(chapterBoss),crowned=Boolean(worldBoss(item.id));
    const boss=firstBoss||crowned;
    const world=chapterBoss?bossArena(chapterBoss):missionWorld(item);
    const {hero,heroTotal,rival,rivalTotal,event,shielded,reward,inventory,timedOut,threat,impact,loot,village,ward,streak,equipped}=battle;
    const foe={...state.adventureGuide.rivals[state.adventureGuide.groups[item.id]],...(crowned||chapterBoss?{name:item.name}:{})};
    const weapon=state.adventureGuide.weapons[battle.weaponStyle||'wood'];
    const heroAttack=weapon.moves[impact.move||battle.heroMove];
    const tactic=practice.tactic;
    const items=unitTopics(item.level,item.unit);
    const next=items.find(entry=>!inventory.wins.includes(entry.id)&&!entry.missing.length&&entry.id!==item.id);
    const missionsFinished=items.every(entry=>entry.mastered);
    const cleared=rival===0,lost=hero===0;
    const verdict=cleared?(boss?'¡Venciste al '+esc(item.name)+'!':'¡Venciste al guardián!'):
      timedOut?'¡Se acabó el tiempo!':lost?(boss?esc(item.name)+' ganó el duelo':'El guardián ganó el duelo'):
      {hit:'¡Acertaste! '+heroAttack.name+'.',hurt:threat.name,blocked:'¡Detuviste el ataque!',
        break:'¡Rompiste la barrera!'}[event];
    const hurt=impact.damage?'Perdiste '+heartCount(impact.damage)+'. ':'';
    const guard=impact.blocked?'Tu defensa absorbió '+heartCount(impact.blocked)+'. ':'';
    const heal=impact.healed?'El rival recuperó un corazón.':'';
    const aftermath=event==='hit'&&!cleared&&impact.damage?'Quitaste '+heartCount(impact.damage)+' al rival.'+
      (impact.resisted?' Resistió el primer ataque. ¡Acierta de nuevo!':'')+
      (impact.guard?' Tu salto te dejó un punto de protección.':''):
      event==='hurt'||event==='blocked'?hurt+guard+heal:
      event==='break'?'El próximo acierto vuelve a dañar al rival.':'';
    const rewards=(cleared&&chapterBoss?'<p class="story-victory">📖 '+esc(chapterBoss.victory)+'</p>':'')+
      (reward?'<p>¡Nivel '+(inventory.wins.length+1)+'!</p>':'')+
      (Object.keys(loot).length?'<div class="adventure-loot" aria-label="Botín del duelo">'+adventureUI.lootMarkup(loot)+'</div>':'');
    const verdictBlock=event?'<div class="mission-feedback '+(grade.correct?'correct':'review')+'" role="status"><strong>'+
      esc(verdict)+'</strong>'+(aftermath?'<p>'+esc(aftermath.trim())+'</p>':'')+rewards+'</div>':'';
    let action;
    if(!cleared)action=lost?btn('restart-duel','Volver a intentar','primary'):btn('next-exercise','Siguiente reto →','primary');
    else if(chapterBoss)action=chapterBoss.final?btn('mission-map','Ver el final de la historia →','primary'):
      btn('next-grade','Empezar el capítulo '+(item.unit+1)+' →','primary');
    else if(gradeBoss(item.level,item.unit)&&missionsFinished&&!gradeBoss(item.level,item.unit).won)
      action=adventureButton(gradeBoss(item.level,item.unit).id,'Desafiar a '+esc(gradeBoss(item.level,item.unit).name)+' →');
    else if(next)action=lessonButton(next.id,'Siguiente misión →','primary');
    else if(missionsFinished&&item.unit<stage.units.length)action=btn('next-grade','Siguiente capítulo →','primary');
    else action=btn('mission-map','Volver al mapa','primary');
    const steps=event?procedure(grade.solution,true,tactic?.hint||(lesson?.id===subject.id?lesson.theory:subject.goal)):'';
    const help='<div class="arena-help" aria-label="Ayudas de la aventura">'+
      '<button type="button" class="btn small" data-action="adventure-hint"'+(!inventory.hints||hint?' disabled':'')+
      '>✦ Pista <span>'+inventory.hints+'</span></button>'+
      '<button type="button" class="btn small" data-action="adventure-shield"'+(!inventory.shields||shielded?' disabled':'')+
      '>⬟ '+(shielded?'Escudo activo':'Usar escudo')+' <span>'+inventory.shields+'</span></button>'+
      '<button type="button" class="btn small" data-action="adventure-potion"'+
      (!village.potions||hero===heroTotal||battle.usedPotion?' disabled':'')+'>♥ Poción <span>'+village.potions+'</span></button></div>';
    const special=tactic?adventureUI.tacticMarkup(tactic,tacticPosition)+
      (hint?'<div class="verification"><p>'+mathText(hint.explanation)+'</p></div>':''):practiceInput(true);
    const result=verdictBlock+(event?details(grade.correct?'Ver procedimiento':'Ver cómo se resuelve',steps)+
      '<div class="lesson-actions">'+action+((cleared||lost)?villageEntry():'')+'</div>':special+help);
    const itemsEquipped=Object.values(equipped).map(id=>'<span>'+esc(state.adventureGuide.items[id].name)+'</span>');
    if(ward)itemsEquipped.push('<span>⬟ Bloqueo restante '+ward+'</span>');
    if(streak>=2)itemsEquipped.push('<span>⚔ Racha de '+streak+'</span>');
    const aura=tactic&&!event?'<div class="arena-barrier" aria-hidden="true"></div>':'';
    const strike=duelEffect?'<div class="arena-strike" aria-hidden="true">'+
      (impact.damage?'−'+impact.damage:event==='blocked'?'⬟':'✦')+'</div>':'';
    const technique=duelEffect?(event==='hit'?impact.name||heroAttack.name:event==='break'?'¡Barrera rota!':threat.name):'';
    const strategies=combatUI.heroMoves(state.adventureGuide,battle,false,tactic,esc);
    const enemyPlan=combatUI.rivalMoves(foe,threat,esc,equipped||{});
    return '<div class="adventure arena-page"><div class="subnav">'+btn('mission-map','← Mapa','ghost')+
      '<span>'+esc(stage.title)+' · '+esc(stage.units[item.unit-1])+'</span></div>'+
      '<h1>'+esc(item.name)+'</h1><p class="arena-location">'+esc(world.name)+(chapterBoss?' · '+esc(chapterBoss.chapter):crowned?' · 👑 Jefe del mundo':'')+
      '</p><div class="combat-stage"><div class="arena combat-arena'+(boss?' arena-boss':'')+(crowned?' fun-crowned':'')+(duelEffect?' arena-'+duelEffect:'')+
      '" data-weapon="'+(battle.weaponStyle||'wood')+'" data-combat-event="'+duelEffect+'" data-hero-move="'+(impact.move||battle.heroMove)+
      '" data-arena-world="'+world.location+'" data-arena-rival="'+world.enemy+'" data-attack="'+threat.kind+'">'+arenaScenery(world)+
      fighter('Tu caballero',hero,heroTotal,'hero',shielded,combatUI.heroStatus(state.adventureGuide,battle))+
      (event?'':'<div class="arena-clock"><span>Tiempo</span><output role="timer" aria-live="off" aria-label="Tiempo restante"></output></div>')+
      fighter(esc(boss?item.name:world.rival),rival,rivalTotal,'guardian')+duelSprite('knight',hero,weapon,equipped||{})+duelSprite(world.enemy,rival)+
      enemyPlan+combatUI.heroDefense(battle)+aura+'<canvas class="combat-effects" aria-hidden="true"></canvas>'+strike+
      (technique?'<div class="combat-action-name" aria-hidden="true">'+esc(technique)+'</div>':'')+
      '</div>'+strategies+'</div>'+
      (itemsEquipped.length?'<div class="arena-gear" aria-label="Equipo y racha">'+itemsEquipped.join('')+'</div>':'')+
      (boss?'<p class="combat-boss-rule">Supera todos los temas para vencer.</p>':'')+
      panel(tactic?'Barrera del rival':boss?esc(subject.name):'Reto del guardián',tacticQuestion(tactic)+result)+'</div>';
  }
  const examScore=item=>item.maxPoints?item.points:item.score;
  const examMaximum=item=>item.maxPoints||item.total;
  const examScoreText=item=>examScore(item)+' / '+examMaximum(item)+(item.maxPoints?' pts':'');
  function workReview(procedure){
    if(!procedure)return '';
    return '<div class="exam-work-review"><strong>Procedimiento · '+procedure.points+' / 1 punto</strong>'+
      (procedure.checks.length?'<ol>'+procedure.checks.map(check=>'<li class="'+(check.ok?'work-valid':'work-error')+'">'+
        '<code>'+esc(check.input)+'</code><small>'+(check.ok?'':'Revisa el paso '+check.line+' · ')+
        esc(check.message)+'</small></li>').join('')+'</ol>':'<p>Sin pasos escritos.</p>')+'</div>';
  }
  // Graded exam sheet: the grade over 20 in red, each answer marked by hand and its full solution beside it.
  function reviewHtml(result){
    const seen={};
    result.items.forEach((item,index)=>{
      seen[item.topic]??={correct:0,total:0};
      seen[item.topic].total++;
      seen[item.topic].correct+=Number(result.review[index].correct);
    });
    const score=examScore(result),maximum=examMaximum(result);
    const grade=maximum?Math.round(20*score/maximum):0;
    const stamp=grade>=18?['¡Excelente!','excellent']:grade>=14?['¡Muy bien!','good']:grade>=11?['Aprobado','pass']:['A reforzar','retry'];
    const weak=Object.entries(seen).filter(([,data])=>data.correct<data.total).map(([id])=>topic(id).name);
    const strong=Object.entries(seen).filter(([,data])=>data.correct===data.total).map(([id])=>topic(id).name);
    const comment=weak.length?'Repasa: '+weak.join(', ')+'.'+(strong.length?' ¡Bien en '+strong.join(', ')+'!':''):'¡Todo correcto! Sigue así.';
    const questions=result.items.map((item,index)=>{
      const check=result.review[index];
      const points=Number(check.correct)+(check.procedure?check.procedure.points:0);
      const worth=check.procedure?2:1;
      const written=check.answer??check.feedback?.answer;
      const correction=check.correct?'':'<span class="paper-correction">'+safeMath(check.solution.formula,check.solution.result)+'</span>';
      return '<article class="paper-question'+(check.correct?' is-right':' is-wrong')+'">'+
        '<div class="paper-left"><header><span class="paper-number">'+(index+1)+'.</span><small>'+esc(topic(item.topic).name)+'</small>'+
        '<span class="paper-points" aria-label="'+points+' de '+worth+' puntos">'+points+'/'+worth+'</span></header>'+
        exerciseText(item,false,false)+
        '<div class="paper-answer"><span class="paper-mark" aria-label="'+(check.correct?'Correcta':'Incorrecta')+'">'+(check.correct?'✓':'✗')+'</span>'+
        '<span class="paper-label">Tu respuesta:</span><span class="paper-ink'+(written?'':' empty')+'">'+(written?mathText(written):'(en blanco)')+'</span>'+
        correction+'</div>'+(check.correct?'':'<p class="paper-note">'+esc(check.feedback.message)+'</p>')+workReview(check.procedure)+'</div>'+
        '<aside class="paper-solution" aria-label="Resolución de la pregunta '+(index+1)+'"><strong>Resolución</strong>'+
        procedure(check.solution,true,topic(item.topic).goal)+'</aside></article>';
    }).join('');
    return '<div class="exam-paper"><header class="paper-head"><div class="paper-data">'+
      '<p><b>Alumno:</b> <span class="paper-ink">'+esc(state.profile.name)+'</span></p>'+
      '<p><b>Evaluación:</b> '+esc(result.title)+'</p><p><b>Fecha:</b> '+date(result.finished)+'</p>'+
      '<p><b>Correctas:</b> '+result.score+' de '+result.total+(result.procedure?' · procedimiento incluido':'')+'</p></div>'+
      '<div class="paper-grade grade-'+stamp[1]+'" aria-label="Nota '+grade+' de 20"><b>'+grade+'</b><small>/20</small></div>'+
      '<span class="paper-stamp stamp-'+stamp[1]+'">'+stamp[0]+'</span></header>'+
      '<div class="paper-body">'+questions+'</div>'+
      '<footer class="paper-comment"><span>Comentario:</span> '+esc(comment)+'</footer></div>';
  }
  function scopeField(){
    if(examOptions.scope==='procedure')return select('scopeId','Curso',
      [['','Todos los cursos disponibles'],...(state.procedureCourses||[]).map(number=>[number,state.levels[2].units[number-1]])],examOptions.scopeId);
    if(examOptions.scope==='level')return select('scopeId','Nivel',state.levels.map(item=>[item.id,item.title]),examOptions.scopeId||state.currentLevel);
    if(examOptions.scope==='unit'){
      const units=state.levels.flatMap(item=>item.units.map((name,index)=>[unitTopics(item.id,index+1)[0].id,item.title+' · '+name]));
      const selected=topic(examOptions.scopeId);
      return select('scopeId','Grado o curso',units,selected?unitTopics(selected.level,selected.unit)[0].id:'');
    }
    return '';
  }
  const procedureHelp='Ganas un punto por un paso intermedio válido y otro por la respuesta correcta. Escribe una expresión o ecuación por línea.';
  function examTopicPicker(){
    return '<section class="exam-topic-picker"'+(examOptions.scope==='topics'?'':' hidden')+' aria-label="Selección de temas">'+
      '<h3>Selecciona los temas</h3><p class="muted">Cada tema marcado tendrá al menos una pregunta.</p>'+
      '<div class="fields">'+field('Buscar tema','topicQuery',examOptions.query,'type="search" placeholder="Ej. fracciones" autocomplete="off"')+
      select('topicLevel','Filtrar por nivel',[['','Todos los niveles'],...state.levels.map(item=>[item.id,item.title])],examOptions.level)+'</div>'+
      '<p class="exam-topic-count" role="status"></p><div class="exam-topic-chips"></div>'+
      '<div class="exam-topic-results" role="group" aria-label="Temas habilitados"></div></section>';
  }
  function syncExamTopicSelection(form){
    const picker=form.querySelector('.exam-topic-picker');
    const scoped=examOptions.scope==='topics';
    const total=examOptions.topics.size;
    const submit=form.querySelector('[type="submit"]');
    const count=form.elements.count;
    picker.hidden=!scoped;
    submit.disabled=scoped&&!total;
    count.min=String(scoped?Math.max(3,total):3);
    if(count.value&&Number(count.value)<Number(count.min))count.value=examOptions.count=count.min;
    if(!scoped)return;
    picker.querySelector('.exam-topic-count').textContent=total?(total+' de 12 temas seleccionados'):'Marca uno o más temas habilitados.';
    picker.querySelector('.exam-topic-chips').innerHTML=[...examOptions.topics].map(id=>
      '<button type="button" class="btn small" data-remove-exam-topic="'+esc(id)+'" aria-label="'+esc('Quitar '+topic(id).name)+'">'+
      esc(topic(id).name)+' <span aria-hidden="true">×</span></button>').join('');
    picker.querySelectorAll('[data-exam-topic]').forEach(input=>{
      input.checked=examOptions.topics.has(input.dataset.examTopic);
      input.disabled=!input.checked&&total>=12;
    });
  }
  function renderExamTopicResults(form){
    const terms=normalizeSearch(examOptions.query).split(/\s+/).filter(Boolean);
    const matching=state.topics.filter(item=>{
      if((!item.mastered&&item.missing.length)||(examOptions.level&&String(item.level)!==examOptions.level))return false;
      const stage=stageTitle(item);
      const searchable=normalizeSearch([item.name,stage.title,stage.units[item.unit-1]].join(' '));
      return terms.every(term=>searchable.includes(term));
    });
    form.querySelector('.exam-topic-results').innerHTML=matching.length?matching.map(item=>{
      const stage=stageTitle(item);
      return '<label class="exam-topic-option"><input type="checkbox" data-exam-topic="'+esc(item.id)+'"><span><strong>'+
        esc(item.name)+'</strong><small>'+esc(stage.title)+' · '+esc(stage.units[item.unit-1])+'</small></span></label>';
    }).join(''):'<p class="muted">No hay temas habilitados para este filtro.</p>';
    syncExamTopicSelection(form);
  }
  function examsPage(){
    const config=exam?'<p>'+esc(exam.title)+' · '+exam.total+' preguntas</p>'+btn('resume-exam','Continuar evaluación','primary'):
      '<form id="exam-config" class="form"><div class="fields">'+
      select('scope','Alcance',[['general','Evaluación general'],['topics','Por temas'],['level','Por nivel'],['unit','Por grado o curso'],
        ['procedure','Universitaria por procedimiento']],examOptions.scope)+
      '<div id="exam-scope-field">'+scopeField()+'</div></div>'+examTopicPicker()+
      '<p class="exam-rubric" id="exam-setup-rubric"'+(examOptions.scope==='procedure'?'':' hidden')+'>'+procedureHelp+'</p>'+
      '<div class="fields">'+field('Duración (minutos)','minutes',examOptions.minutes,'type="number" min="1" max="60" required')+
      field('Preguntas','count',examOptions.count,'type="number" min="3" max="12" required')+
      select('difficulty','Dificultad',difficulties,examOptions.difficulty)+'</div>'+
      '<button type="submit" class="btn primary">Comenzar evaluación</button></form>';
    const history=state.exams.length?'<ul class="activity">'+state.exams.map(item=>'<li><div><strong>'+esc(item.title)+'</strong><small>'+
      examScoreText(item)+' · '+date(item.finished)+'</small></div><button class="btn small" data-exam-review="'+item.id+'">Ver</button></li>').join('')+'</ul>':
      '<p class="muted">Todavía no hay evaluaciones terminadas.</p>';
    return heading('Evaluaciones','Resuelve preguntas aleatorias de temas habilitados y recibe la corrección al entregar.')+
      grid(panel('Nueva evaluación',config)+panel('Historial',history))+(examReview?
        '<div class="section" id="exam-review">'+panel('Resultado · '+esc(examReview.title),reviewHtml(examReview))+'</div>':'');
  }
  const ratio=(part,total)=>total?100*part/total:0;
  const progressRing=(amount,center)=>'<div class="progress-ring" aria-hidden="true" style="--amount:'+amount+'%"><div>'+center+'</div></div>';
  function progressSummary(){
    if(headerContext().contentLevel===3&&state.universityProgress){
      const stats=state.universityProgress;
      return '<div class="progress-overview university-overview"><article class="progress-summary progress-completion">'+
        progressRing(ratio(stats.mastered,stats.total),'<strong>'+stats.mastered+'</strong><small>de '+stats.total+'</small>')+
        '<div><h2>Dominio universitario</h2><small>Temas comprendidos</small></div></article>'+
        '<article class="progress-summary progress-accuracy"><div><h2>Precisión</h2><strong class="university-accuracy">'+
        (stats.accuracy===null?'—':stats.accuracy+' %')+'</strong><p>'+stats.correct+' aciertos de '+stats.attempts+' intentos</p>'+
        '<small>'+(stats.recentAttempts?'Últimos '+stats.recentAttempts+' intentos: '+stats.recentAccuracy+' %':'Resuelve ejercicios para medir tu avance.')+
        '</small></div></article></div>';
    }
    const accuracy=state.accuracy===null?'—':state.accuracy+' %';
    const suggested=topic(state.recommended);
    const total='<article class="progress-summary progress-completion" aria-label="'+state.mastered+' de '+state.total+' temas completados">'+
      progressRing(ratio(state.mastered,state.total),'<strong>'+state.mastered+'</strong><small>de '+state.total+'</small>')+
      '<div><h2>Temas completados</h2><span class="sr-only">'+state.mastered+' de '+state.total+'</span>'+
      (suggested?lessonButton(suggested.id,state.attempts?'Continuar →':'Empezar →','small'):'')+'</div></article>';
    const result='<article class="progress-summary progress-accuracy'+(state.attempts?'':' progress-empty')+'" aria-label="Precisión'+
      (state.attempts?' del '+accuracy:' sin intentos')+'">'+progressRing(ratio(state.correct,state.attempts),'<strong>'+accuracy+'</strong>')+
      '<div><h2>Precisión</h2>'+(state.attempts?
        '<ul class="progress-key"><li><i class="key-good"></i><strong>'+state.correct+'</strong> aciertos</li>'+
        '<li><i class="key-review"></i><strong>'+(state.attempts-state.correct)+'</strong> fallos</li></ul>':
        '<small>Sin intentos</small>')+'</div></article>';
    return '<div class="progress-overview">'+total+result+'</div>';
  }
  function progressLevels(){
    const selected=state.levels.find(item=>item.id===progressStage)||state.levels[state.currentLevel-1];
    const stages=state.levels.map(item=>'<button type="button" class="progress-stage stage-'+item.id+'" data-progress-stage="'+item.id+
      '" aria-pressed="'+(selected.id===item.id)+'"><span class="progress-stage-icon" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none">'+
      stageArt[item.id-1]+'</svg></span><span class="progress-stage-data"><span><strong>'+esc(item.title)+'</strong><small>'+
      item.mastered+' / '+item.total+'</small></span><span class="progress-track" aria-hidden="true"><i style="width:'+
      ratio(item.mastered,item.total)+'%"></i></span></span><span aria-hidden="true">›</span></button>').join('');
    const units=selected.units.map((name,index)=>{
      const items=unitTopics(selected.id,index+1);
      const completed=items.filter(item=>item.mastered).length;
      const segments=items.map(item=>'<i class="'+(item.mastered?'done':item.stars?'started':'')+'"></i>').join('');
      return '<button type="button" class="progress-unit" data-level="'+selected.id+'" data-route-unit="'+(index+1)+'" aria-label="'+
        esc('Abrir '+name+' · '+completed+' de '+items.length+' temas completados')+'"><span><strong>'+esc(name)+'</strong><small>'+
        completed+' / '+items.length+'</small></span><span class="progress-segments" aria-hidden="true">'+segments+'</span></button>';
    }).join('');
    return '<div class="progress-levels">'+panel('Avance por nivel','<div class="progress-stages">'+stages+'</div>')+
      '<div class="progress-units stage-'+selected.id+'">'+panel(esc(selected.title)+' · '+(selected.id<3?'Grados':'Cursos'),
        '<div class="progress-unit-grid">'+units+'</div><ul class="progress-key unit-key"><li><i class="key-done"></i> Completado</li>'+
        '<li><i class="key-started"></i> En curso</li><li><i class="key-pending"></i> Pendiente</li></ul>')+'</div></div>';
  }
  const examDate=new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',timeZone:'America/Lima'});
  function progressExams(){
    if(!state.exams.length)return '<section class="progress-exam-empty"><div><h2>Evaluaciones</h2>'+
      '<small>Aún no hay resultados</small></div>'+link('exams','Ir a evaluaciones →','small')+'</section>';
    const results=state.exams.slice(0,8).reverse().map(exam=>{
      const score=percent(examScore(exam),examMaximum(exam));
      const label=examDate.format(new Date(exam.finished));
      return '<button type="button" class="progress-exam" data-exam-review="'+esc(exam.id)+'" aria-label="'+
        esc(exam.title+' · '+date(exam.finished)+' · '+examScoreText(exam))+'"><strong>'+score+
        '%</strong><span class="exam-bar" aria-hidden="true"><i style="height:'+ratio(examScore(exam),examMaximum(exam))+'%"></i></span><small>'+
        esc(label)+'</small></button>';
    }).join('');
    return panel('Últimas evaluaciones','<div class="progress-exams">'+results+'</div>');
  }
  function progress(){
    const minutes=Math.floor(state.profile.study_seconds/60);
    return '<div class="progress-page"><header class="progress-heading"><h1>Mi progreso</h1>'+
      '<span class="progress-time"><i aria-hidden="true"></i>'+minutes+' min de estudio</span></header>'+
      progressSummary()+progressLevels()+(headerContext().contentLevel===3?universityProgressDetails():'')+progressExams()+'</div>';
  }
  function universityProgressDetails(){
    const stats=state.universityProgress;
    if(!stats)return '';
    const topicList=(items,empty)=>items.length?'<ul class="university-study-list">'+items.map(item=>'<li>'+lessonButton(item.id,esc(item.name),'ghost')+
      '<span>'+item.recentAccuracy+' %<small>'+item.recentAttempts+' intentos recientes</small></span></li>').join('')+'</ul>':'<p class="muted">'+empty+'</p>';
    const courses=stats.courses.map(course=>'<tr><th scope="row">'+esc(course.name)+'</th><td>'+course.mastered+' / '+course.total+'</td><td>'+
      (course.accuracy===null?'—':course.accuracy+' %')+'</td><td>'+course.needsReview+'</td></tr>').join('');
    return '<section class="university-study" aria-label="Orientación académica"><div class="grid two">'+
      panel('Tus fortalezas',topicList(stats.strengths,'Aún faltan intentos para identificar tus fortalezas.'))+
      panel('Para reforzar',topicList(stats.needsPractice,'Todavía no hay temas con resultados que necesiten repaso.'))+'</div>'+
      '<p class="muted university-study-note">Las recomendaciones usan tus últimos '+stats.recentWindow+' intentos por tema. Un tema se refuerza cuando la precisión reciente baja del 70 %.</p>'+
      panel('Rendimiento por curso','<div class="university-study-table"><table><thead><tr><th scope="col">Curso</th><th scope="col">Dominados</th>'+
        '<th scope="col">Precisión</th><th scope="col">Por reforzar</th></tr></thead><tbody>'+courses+'</tbody></table></div>')+'</section>';
  }
  function settings(){
    const profile=state.profile;
    const basics=form('settings-form','<div class="fields">'+field('Nombre','name',profile.name,'maxlength="65" required')+
      select('preference','Explicación',[['guiado','Guiada'],['directo','Directa']],profile.preference)+select('difficulty','Dificultad predeterminada',difficulties,profile.difficulty)+
      select('variable','Variable predeterminada',['x','t','y','z'].map(v=>[v,v]),profile.variable)+'</div>','Guardar perfil');
    const configuration=form('ai-form','<label class="check-label"><input name="enabled" type="checkbox" '+(ai.enabled?'checked':'')+'> Activar IA para priorizar pistas</label>'+
      field('Endpoint compatible con Chat Completions','endpoint',ai.endpoint,'type="url" placeholder="https://proveedor.example/v1/chat/completions"')+
      field('Modelo','model',ai.model,'maxlength="120"')+field('Clave de API','key','','type="password" autocomplete="new-password" '+(ai.enabled?'placeholder="Deja vacío para conservar la clave"':'')),
      'Guardar configuración de IA');
    const notes=form('note-form',select('id','Lección',[['','Selecciona un tema'],...state.topics.map(item=>[item.id,item.name])],noteTopic)+
      area('Apunte personal','note',noteText,'rows="3" maxlength="1500"'),'Guardar apunte')+
      (lessonEdit?section(form('lesson-edit-form','<input type="hidden" name="id" value="'+esc(noteTopic)+'">'+
        area('Explicación personalizada','theory',lessonEdit.theory,'rows="3" maxlength="1500" required')+
        field('Fórmula personalizada','formula',lessonEdit.formula,'maxlength="300"'),'Guardar contenido local')+
        (lessonEdit.hasCustom?section(btn('reset-lesson','Quitar contenido personalizado','small')):'')):'');
    return heading('Configuración','Personaliza tu perfil y administra tus datos locales.')+
      grid(panel('Perfil y motor',basics+section('<p class="muted">Motor local SymPy · Fórmulas MathML</p>'))+panel('IA opcional',configuration)+
      panel('Copias de seguridad','<p class="muted">Guarda o restaura tu progreso, prácticas e historial.</p>'+section(row(btn('backup','Crear respaldo')+btn('restore','Restaurar respaldo'))))+
      panel('Contenido de las lecciones',notes));
  }

  const renders={dashboard,learn:()=>lesson?lessonPage():learning(),solver:solverPage,teacher:teacherPage,practice:practicePage,
    village:()=>adventureUI.villagePage(state.adventureGuide,state.village,adventurePack(),villageView,esc,btn,
      {category:villageCategory,selected:villageItem,crafted:villageCrafted}),
    labs:()=>academicLab.render(),notebook:notebookPage,exams:examsPage,progress,settings,
    ...Object.fromEntries([...funUI.pages].map(name=>[name,()=>funUI.render(name)]))};
  function render(){
    combatUI.stop();
    renderNav();
    view.innerHTML=renders[page]();
    if(page==='solver')queuePreview();
    if(page==='practice'&&!mission)bindPracticeTopicSearch();
    if(page==='teacher')filterTeacherTopics();
    if(page==='labs')academicLab.bind(view.querySelector('[data-lab]'));
    const examForm=view.querySelector('#exam-config');
    if(examForm&&examOptions.scope==='topics')renderExamTopicResults(examForm);
    funUI.afterRender(page,view,{battle:page==='practice'&&mission?battle:null,effect:duelEffect,lesson:page==='learn'?lesson:null,
      level:page==='practice'&&practice?topic(practice.topic)?.level:null,variable:page==='practice'&&practice?practice.variable:null});
    duelEffect='';
    villageCrafted='';
    if(page==='practice'&&mission){
      if(practice.tactic)adventureUI.updateTactic(view.querySelector('#duel-tactic'),practice.tactic);
      combatUI.bind(view.querySelector('.arena'),battle);
      tickDuel();
    }
  }
  async function refresh(){
    state=await call('status');
    for(const [id,boss] of Object.entries(state.funGuide?.bosses||{}))state.adventureGuide.groups[id]=boss.group;
    // Grade bosses join the roster so the duel screen and its attack previews can find them.
    for(const [id,rival] of Object.entries(state.gradeRivals||{})){
      state.adventureGuide.groups[id]=state.adventureGuide.rivals.length;
      state.adventureGuide.rivals.push(rival);
    }
  }
  async function run(task){
    if(!api||busy||examFinishing)return;
    busy=true;say('');view.setAttribute('aria-busy','true');
    try{await task();}
    catch(error){console.error(error);say(errorText(error),true);}
    finally{busy=false;view.setAttribute('aria-busy','false');if(state){render();void funUI.sync();}}
  }
  async function openPage(target){
    if(!renders[target])return;
    const previousLevel=headerContext().contentLevel;
    if(target==='progress'&&[1,2,3].includes(previousLevel))progressStage=previousLevel;
    funUI.leave();
    if(funUI.pages.has(target))await funUI.open(target);
    page=target;
    if(target==='learn'){lesson=null;level=0;universityQuery='';}
    if(target==='practice'&&mission){
      mission=false;battle=null;practice=null;grade=null;hint=null;duelAnswer='';
    }
    if(target==='solver')solved=await call('solved');
    if(target==='exams'){exam=await call('activeExam');await refresh();}
    if(target==='teacher')selectTeacherLevel(0);
    if(target==='teacher'||target==='settings')ai=await call('getAi');
    window.scrollTo(0,0);
  }
  function selectTeacherLevel(value){
    teacherLevel=value;teacherUnit=0;teacherSearch='';teacherCatalogScroll=0;teacher=null;
    teacherDraft={topic:'',question:''};
  }
  async function showTeacher(id){
    const grounding=await call('teacher',{topic:id});
    const item=topic(grounding.topic);
    if(item&&item.level!==teacherLevel)selectTeacherLevel(item.level);
    teacher={grounding};
    teacherStep=0;teacherDraft={topic:'',question:''};
  }
  function focusTeacherView(selector,scroll=0,fallback=selector){
    requestAnimationFrame(()=>{
      window.scrollTo(0,scroll);
      (view.querySelector(selector)||view.querySelector(fallback))?.focus({preventScroll:true});
    });
  }
  function focusTeacherStep(action){
    requestAnimationFrame(()=>{
      const controls=document.querySelector('.step-controls');
      (controls?.querySelector('[data-action="'+action+'"]:enabled')||controls?.querySelector('button:enabled'))?.focus({preventScroll:true});
    });
  }
  async function openLesson(id){
    lesson=await call('lesson',{id});
    level=lesson.level;unit=lesson.unit;practiceTopic=id;page='learn';
    lessonSolution=await call('example',lesson.example);
    window.scrollTo(0,0);
  }
  async function newPractice(id,difficulty,guided=false){
    practice=await call('practice',{topic:id,difficulty,guided});
    practiceTopic=practice.topic;practiceDifficulty=difficulty;grade=null;
    hint=guided?await call('hint',{id:practice.id}):null;
    mission=false;battle=null;page='practice';window.scrollTo(0,0);
  }
  async function playAdventure(action,id=battle?.target,answer,move){
    const previousPage=page;
    const previousBattle=battle;
    battle=await call('adventure',{action,topic:id,turn:practice?.id,answer,move});
    if(previousBattle?.exercise.id!==battle.exercise.id){
      duelAnswer='';duelRetryAt=0;tacticPosition=0;
    }
    const resolved=battle.event&&(previousBattle?.exercise.id!==battle.exercise.id||!previousBattle.event);
    if(resolved){
      duelEffect=battle.event;
      funUI.duel(battle);
    }
    practice=battle.exercise;grade=battle.grade;hint=battle.hint;mission=true;page='practice';
    if(resolved)await refresh();
    else {
      state.adventure=battle.inventory;
      state.village=battle.village;
    }
    if(previousPage!=='practice')window.scrollTo(0,0);
    if(action==='move')requestAnimationFrame(()=>view.querySelector('[data-combat-move="'+battle.heroMove+'"]')?.focus({preventScroll:true}));
    if(['answer','start','restart','next','timeout','hint','shield','potion'].includes(action)){
      requestAnimationFrame(()=>{
        const selector=battle?.event?'.arena-page .lesson-actions button':
          '.arena-page [name=answer], .arena-page [data-choice], #duel-tactic [name=position]';
        view.querySelector(selector)?.focus({preventScroll:true});
      });
    }
  }
  function tickDuel(){
    if(page!=='practice'||!mission||!battle||battle.event)return;
    const remaining=Math.max(0,battle.deadline-Date.now()/1000);
    const clock=view.querySelector('.arena-clock');
    if(clock){
      const seconds=Math.ceil(remaining);
      clock.querySelector('output').textContent=seconds+' s';
      clock.classList.toggle('is-low',seconds<=10);
      clock.style.setProperty('--remaining',100*remaining/battle.turnSeconds+'%');
    }
    if(remaining===0&&!busy&&Date.now()>=duelRetryAt){
      duelRetryAt=Date.now()+1800;
      void run(()=>playAdventure('timeout'));
    }
  }
  async function checkPractice(answer){
    if(mission)return playAdventure('answer',battle.target,answer);
    const prior=topic(practice.topic).mastered;
    grade=await call('grade',{id:practice.id,answer});await refresh();
    if(!grade.invalid)funAudio.play(grade.correct?'correct':'wrong');
    if(!mission&&!prior&&topic(practice.topic).mastered)say('Tema dominado.');
  }
  async function showExam(){
    if(!exam)return;
    document.querySelector('#exam-title').textContent=exam.title;
    const rubric=document.querySelector('#exam-rubric');
    rubric.hidden=!exam.procedure;
    rubric.textContent=exam.procedure?procedureHelp+' Se revisan hasta ocho pasos, hasta el primer error.':'';
    document.querySelector('#exam-questions').innerHTML=exam.items.map((item,index)=>
      '<article class="exam-item"><h3>Pregunta '+(index+1)+' · '+esc(topic(item.topic).name)+'</h3>'+exerciseText(item,false,false)+
      (exam.procedure?area('Procedimiento','work-'+item.id,exam.procedureDrafts?.[item.id],
        'maxlength="750" rows="3" placeholder="Escribe un paso por línea" spellcheck="false"'):'')+
      field('Respuesta',item.id,exam.drafts?.[item.id],'maxlength="450"')+'</article>').join('')+
      '<p class="dialog-error" id="exam-error" role="status"></p>';
    if(!examWindow.open)examWindow.showModal();
    tickExam();
  }
  let examFinishing=false;
  async function finishExam(){
    if(!exam||examFinishing)return;
    examFinishing=true;
    view.setAttribute('aria-busy','true');
    try{
      const answers={},work={};
      if(examWindow.open){
        for(const [name,value] of new FormData(document.querySelector('#active-exam-form'))){
          if(name.startsWith('work-'))work[name.slice(5)]=value;
          else answers[name]=value;
        }
      }
      examReview=await call('examSubmit',{id:exam.id,answers,work});
      await refresh();
      if(examWindow.open)examWindow.close();
      exam=null;page='exams';say('Evaluación calificada.');render();
    }catch(error){
      const element=document.querySelector('#exam-error');
      if(examWindow.open&&element)element.textContent=errorText(error);
      else say(errorText(error),true);
    }finally{examFinishing=false;view.setAttribute('aria-busy',String(busy));}
  }
  function tickExam(){
    if(!exam)return;
    const seconds=Math.max(0,Math.ceil(exam.deadline-Date.now()/1000));
    document.querySelector('#exam-time').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    if(!seconds)void finishExam();
  }
  function queuePreview(){
    clearTimeout(previewTimer);
    const editor=document.querySelector('#solver-form');
    if(!editor)return;
    const preview=editor.querySelector('#math-preview');
    const request=Object.fromEntries(new FormData(editor));
    const number=++previewNumber;
    if(!request.problem.trim()){
      preview.textContent='';
      return;
    }
    previewTimer=setTimeout(async()=>{
      try{
        const result=await call('preview',request);
        if(page==='solver'&&number===previewNumber&&editor.isConnected)preview.innerHTML=result.formula;
      }catch{
        if(editor.isConnected&&number===previewNumber)preview.textContent='';
      }
    },260);
  }
  function updateCalculator(input){
    if(solver[input.name]===input.value)return;
    const editor=input.form;
    solver[input.name]=input.value;
    if(input.name==='operation'){
      const argument=editor.elements.argument;
      argument.value=solver.argument='';
      argument.closest('label').hidden=!calculatorArguments[input.value];
      argument.placeholder=calculatorArguments[input.value]||'';
      editor.querySelector('#parameter-label').textContent=parameter(input.value);
    }
    if(solution){
      solution=null;
      view.querySelector('#solver-result').innerHTML=solutionHtml(null,true);
    }
    queuePreview();
  }
  function pressCalculatorKey(button){
    const editor=button.form;
    const input=editor.elements.problem;
    const type=button.dataset.calcKey;
    const value=button.dataset.calcValue;
    if(type==='mode'){
      editor.elements.operation.value=value;
      updateCalculator(editor.elements.operation);
    }else{
      let {selectionStart:start,selectionEnd:end}=input;
      let inserted=value;
      if(type==='edit'){
        inserted='';
        if(value==='clear'){start=0;end=input.value.length;}
        else if(start===end)start=Math.max(0,start-1);
      }
      if(type==='wrap')inserted=value+'('+input.value.slice(start,end)+')';
      if(input.value.length-end+start+inserted.length<=input.maxLength){
        input.setRangeText(inserted,start,end,'end');
        if(type==='wrap'&&start===end)input.setSelectionRange(input.selectionEnd-1,input.selectionEnd-1);
        updateCalculator(input);
      }
    }
    input.focus({preventScroll:true});
  }
  function resetProfileViews(){
    lesson=null;practice=null;grade=null;hint=null;mission=false;battle=null;duelAnswer='';duelRetryAt=0;stepCheck=null;exam=null;examReview=null;
    solution=null;solved=[];noteTopic='';noteText='';lessonEdit=null;practiceTopic='';solver=emptySolver(state.profile.variable);
    selectTeacherLevel(0);
    academicLab.reset();graphWorkspace.resetWorkspace();book=null;bookUnit=1;bookDraft=null;graphContext=null;
    examOptions=examDefaults();
    level=0;unit=1;progressStage=0;teacherStep=0;stepsDraft='';universityQuery='';villageView='bag';villageCategory='sword';villageItem='iron-sword';page='dashboard';
  }

  document.addEventListener('click',event=>{
    const line=event.target.closest('.tactic-number-line');
    if(line&&!busy){
      const input=line.closest('form').elements.position;
      const rect=line.getBoundingClientRect();
      const fraction=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      input.valueAsNumber=Math.round(fraction*Number(input.max));
      input.dispatchEvent(new Event('input',{bubbles:true}));
      return;
    }
    const button=event.target.closest('button');
    if(!button||!state||!api)return;
    if(button.dataset.fun)return void run(()=>funUI.action(button.dataset.fun));
    if(button.dataset.calcKey){if(!busy)pressCalculatorKey(button);return;}
    if(button.dataset.combatMove)return void run(()=>playAdventure('move',battle.target,undefined,button.dataset.combatMove));
    if(button.dataset.page==='graph'||button.dataset.graph!==undefined){
      if(!busy){
        const spec=button.dataset.graph?JSON.parse(button.dataset.graph):null;
        const course=page==='learn'&&lesson?topic(lesson.id):
          page==='practice'&&practice&&!mission?topic(practice.topic):null;
        graphContext={unit:course?.level===3?course.unit:page==='learn'&&level===3?unit:bookUnit};
        graphWorkspace.open(spec);
      }
      return;
    }
    if(button.dataset.graphNotebook!==undefined)return void run(async()=>{
      const payload=graphWorkspace.capture();
      if(!payload){graphWorkspace.setStatus('Grafica una expresión válida antes de guardarla.',true);return;}
      const entry=graphContext?.entry;
      await openNotebook(graphContext?.unit||bookUnit,{kind:'graph',payload,id:entry?.id,
        title:entry?.title||payload.title||payload.expressions.join(', ').slice(0,100),body:entry?.body||''});
      graphWorkspace.dialog.close();
    });
    if(button.dataset.openLab)return void run(async()=>{
      const wasLab=page==='labs';
      academicLab.open(button.dataset.openLab);page='labs';
      if(wasLab)requestAnimationFrame(()=>view.querySelector('.lab-tab[aria-pressed="true"]')?.focus({preventScroll:true}));
      else window.scrollTo(0,0);
    });
    if(button.dataset.noteExercise)return void run(()=>attachExercise(button.dataset.noteExercise));
    if(button.dataset.bookEdit)return void run(async()=>{
      bookDraft={...book.entries.find(entry=>entry.id===button.dataset.bookEdit)};
      requestAnimationFrame(()=>view.querySelector('#book-entry-form [name="title"]')?.focus());
    });
    if(button.dataset.bookGraph){
      const entry=book?.entries.find(item=>item.id===button.dataset.bookGraph);
      if(entry&&!busy){graphContext={unit:entry.unit,entry};graphWorkspace.open(entry.payload);}
      return;
    }
    if(button.dataset.page)return void run(()=>openPage(button.dataset.page));
    if(button.dataset.level)return void run(async()=>{
      level=Number(button.dataset.level);unit=Number(button.dataset.routeUnit||1);lesson=null;universityQuery='';page='learn';window.scrollTo(0,0);
    });
    if(button.dataset.progressStage)return void run(async()=>{
      progressStage=Number(button.dataset.progressStage);
      requestAnimationFrame(()=>document.querySelector('[data-progress-stage][aria-pressed=true]')?.focus({preventScroll:true}));
    });
    if(button.dataset.unit)return void run(async()=>{
      unit=Number(button.dataset.unit);universityQuery='';
      if(level===3)requestAnimationFrame(()=>view.querySelector('.university-course[aria-pressed=true]')?.focus({preventScroll:true}));
    });
    if(button.dataset.lesson)return void run(()=>openLesson(button.dataset.lesson));
    if(button.dataset.adventure)return void run(()=>playAdventure(
      adventurePack().wins.includes(button.dataset.adventure)?'restart':'start',button.dataset.adventure));
    if(button.dataset.villageView&&page==='village')return void run(async()=>{
      villageView=button.dataset.villageView;
      requestAnimationFrame(()=>view.querySelector('.village-view-button[aria-pressed="true"]')?.focus({preventScroll:true}));
    });
    if(button.dataset.villageCategory&&page==='village')return void run(async()=>{
      villageCategory=button.dataset.villageCategory;
      const candidates=Object.entries(state.adventureGuide.items).filter(([,item])=>item.slot===villageCategory);
      if(!candidates.some(([id])=>id===villageItem))villageItem=candidates[0][0];
      requestAnimationFrame(()=>view.querySelector('[data-village-category="'+villageCategory+'"]')?.focus({preventScroll:true}));
    });
    if(button.dataset.villageSelect&&page==='village')return void run(async()=>{
      villageItem=button.dataset.villageSelect;
      requestAnimationFrame(()=>{
        view.querySelector('[data-village-select="'+villageItem+'"]')?.focus({preventScroll:true});
        if(innerWidth<640)view.querySelector('.forge-recipe')?.scrollIntoView({block:'nearest',
          behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      });
    });
    if(button.dataset.villageItem&&page==='village')return void run(async()=>{
      const {villageItem:item,villageOperation:action}=button.dataset;
      state.village=await call('village',{action,item});
      if(item==='healing-potion'){
        villageCrafted=item;say('✓ Poción');
      }else{
        villageCrafted=action==='craft'?item:'';
        say('✓ '+state.adventureGuide.items[item].name);
        requestAnimationFrame(()=>{
          const slot=view.querySelector(villageView==='shop'?'.forge-create':'[data-equipped-item="'+CSS.escape(item)+'"]');
          slot?.focus({preventScroll:true});
          slot?.scrollIntoView({block:'nearest'});
        });
      }
    });
    if(button.dataset.teacherLevel)return void run(async()=>{
      selectTeacherLevel(Number(button.dataset.teacherLevel));
      focusTeacherView('#teacher-topic-search');
    });
    if(button.dataset.teacherUnit!==undefined){
      if(busy)return;
      teacherUnit=Number(button.dataset.teacherUnit);
      view.querySelectorAll('[data-teacher-unit]').forEach(unitButton=>
        unitButton.setAttribute('aria-pressed',String(unitButton===button)));
      filterTeacherTopics();
      return;
    }
    if(button.dataset.teacherTopic)return void run(async()=>{
      if(page!=='teacher')ai=await call('getAi');
      teacherCatalogScroll=page==='teacher'?window.scrollY:0;
      await showTeacher(button.dataset.teacherTopic);
      page='teacher';
      focusTeacherView('[data-action="teacher-topics"]');
    });
    if(button.dataset.video)return void call('openVideo',{id:button.dataset.video}).catch(error=>say(errorText(error),true));
    if(button.dataset.lessonVideo){playTopicVideo(button.dataset.lessonVideo);return;}
    if(button.dataset.searchVideo){searchTopicVideos(button.dataset.searchVideo);return;}
    if(button.dataset.removeExamTopic){
      if(busy)return;
      const form=button.form;
      examOptions.topics.delete(button.dataset.removeExamTopic);
      syncExamTopicSelection(form);
      form.elements.topicQuery.focus({preventScroll:true});
      return;
    }
    if(button.dataset.choice!==undefined)return void run(()=>checkPractice(button.dataset.choice));
    if(button.dataset.preset!==undefined)return void run(async()=>{solver=preset(Number(button.dataset.preset));solution=null;});
    if(button.dataset.solved)return void run(async()=>{
      const item=solved.find(entry=>entry.id===button.dataset.solved);solver={...item.request};solution=item.solution;window.scrollTo(0,0);
    });
    if(button.dataset.examReview)return void run(async()=>{
      const id=button.dataset.examReview;
      if(page==='progress')await openPage('exams');
      examReview=await call('examReview',{id});
      requestAnimationFrame(()=>document.querySelector('#exam-review')?.scrollIntoView({block:'start'}));
    });
    if(button.id==='toggle-demo')return void run(async()=>{state=await call('demo',{enabled:!state.demo});resetProfileViews();});
    const actions={
      'teacher-topics':async()=>{
        const id=teacher?.grounding?.topic;
        teacher=null;
        const selector=id?'[data-teacher-topic="'+CSS.escape(id)+'"]':'#teacher-topic-search';
        focusTeacherView(selector,teacherCatalogScroll,'#teacher-topic-search');
      },
      'teacher-levels':async()=>{
        const prior=teacherLevel;
        selectTeacherLevel(0);
        focusTeacherView('[data-teacher-level="'+prior+'"]');
      },
      'back-learn':async()=>{lesson=null;},
      'back-university':async()=>{level=3;lesson=null;page='learn';window.scrollTo(0,0);},
      'open-notebook':()=>openNotebook(unit),
      'book-new':async()=>{
        bookDraft={kind:'note',title:'',body:'',payload:{}};
        requestAnimationFrame(()=>view.querySelector('#book-entry-form [name="title"]')?.focus());
      },
      'book-cancel':async()=>{bookDraft=null;},
      'book-remove':async()=>{
        await call('notebook',{action:'remove',id:bookDraft.id});
        await openNotebook(bookUnit);say('Entrada eliminada.');
      },
      'book-pdf':async()=>{
        const result=await call('notebookPdf',{unit:bookUnit});
        if(!result.canceled)say('PDF guardado · '+result.name);
      },
      'procedure-exam':async()=>{
        examOptions.scope='procedure';
        examOptions.scopeId=state.procedureCourses.includes(unit)?String(unit):'';
        await openPage('exams');
      },
      'all-levels':()=>openPage('learn'),
      'open-village':async()=>{
        if(page==='practice'&&mission){
          const item=adventureTarget();
          level=item.level;unit=item.unit;
        }
        lesson=null;villageView='bag';page='village';window.scrollTo(0,0);
      },
      'village-back':async()=>{lesson=null;page='learn';window.scrollTo(0,0);},
      'mission-map':async()=>{const item=adventureTarget();level=item.level;unit=item.unit;lesson=null;page='learn';window.scrollTo(0,0);},
      'next-grade':async()=>{const item=adventureTarget();level=item.level;unit=item.unit+1;lesson=null;page='learn';window.scrollTo(0,0);},
      'boss-map':async()=>{
        if(lesson){level=lesson.level;unit=lesson.unit;}
        if(gradeLocked(level,unit))unit=Math.max(1,unit-1);
        lesson=null;page='learn';
        requestAnimationFrame(()=>{
          const entrance=view.querySelector('.route-boss');
          entrance?.scrollIntoView({block:'center'});
          entrance?.focus({preventScroll:true});
        });
      },
      'advance-path':async()=>{
        if(unit<state.levels[level-1].units.length)unit++;
        else{level++;unit=1;}
        window.scrollTo(0,0);
      },
      'start-mission':()=>playAdventure(adventurePack().wins.includes(lesson.id)?'restart':'start',lesson.id),
      'restart-duel':()=>playAdventure('restart'),
      'adventure-hint':()=>playAdventure('hint'),
      'adventure-shield':()=>playAdventure('shield'),
      'adventure-potion':()=>playAdventure('potion'),
      'adventure-pet-hint':()=>playAdventure('pet-hint'),
      'lesson-guided':()=>newPractice(lesson.id,'auto',true),
      'lesson-practice':()=>newPractice(lesson.id,'auto'),
      'lesson-exam':async()=>{examOptions.scope='unit';examOptions.scopeId=lesson.id;await openPage('exams');},
      'example-to-solver':async()=>{solver={...lesson.example};solution=null;await openPage('solver');},
      'teacher-practice':()=>newPractice(teacher.grounding.topic,'auto',true),
      'teacher-prev':async()=>{teacherStep=Math.max(0,teacherStep-1);focusTeacherStep('teacher-prev');},
      'teacher-next':async()=>{teacherStep=Math.min(teacher.grounding.solution.steps.length-1,teacherStep+1);focusTeacherStep('teacher-next');},
      'sample-steps':async()=>{
        stepsDraft='2 × x + 3 = 9\n2 × x = 6\nx = 3';
        stepCheck=await call('validateSteps',{lines:stepsDraft,variable:'x'});
        requestAnimationFrame(()=>document.querySelector('#steps-form textarea')?.focus({preventScroll:true}));
      },
      'teacher-to-solver':async()=>{solver={...teacher.grounding.example};solution=teacher.grounding.solution;await openPage('solver');},
      retry:async()=>{practice=await call('retry');practiceTopic=practice.topic;grade=null;hint=null;},
      hint:async()=>{hint=await call('hint',{id:practice.id});},
      'next-exercise':()=>mission?playAdventure('next'):newPractice(practice.topic,grade?.correct?practiceDifficulty:'fácil'),
      'resume-exam':showExam,
      'reset-lesson':async()=>{
        await call('editLesson',{id:noteTopic,reset:true});
        lessonEdit={theory:'',formula:'',hasCustom:false};
        say('Contenido personalizado retirado.');
      },
      backup:async()=>{const result=await call('backup');if(!result.canceled)say('Respaldo guardado: '+result.name);},
      restore:async()=>{const result=await call('restore');if(!result.canceled){state=result.state;resetProfileViews();say('Respaldo restaurado.');}}
    };
    const command=actions[button.dataset.action];
    if(command)void run(command);
  });

  view.addEventListener('input',event=>{
    if(event.target.id==='university-search'){
      universityQuery=event.target.value;
      view.querySelector('#university-results').innerHTML=universityResults(state.levels[2]);
      return;
    }
    const input=event.target;
    if(input.id==='teacher-topic-search'){teacherSearch=input.value;filterTeacherTopics();}
    if(mission&&input.form?.id==='duel-tactic'){
      tacticPosition=Number(input.value);
      adventureUI.updateTactic(input.form,practice.tactic);
    }
    if(mission&&input.form?.id==='practice-answer')duelAnswer=input.value;
    if(input.form?.id==='solver-form')updateCalculator(input);
    if(input.form?.id==='exam-config'){
      if(input.name==='topicQuery'){examOptions.query=input.value;renderExamTopicResults(input.form);}
      if(input.name==='minutes'||input.name==='count')examOptions[input.name]=input.value;
    }
    if(input.form?.id==='teacher-form')teacherDraft[input.name]=input.value;
    if(input.form?.id==='steps-form')stepsDraft=input.value;
    if(input.form?.id==='note-form'&&input.name==='note')noteText=input.value;
    if(input.form?.id==='lesson-edit-form'&&input.name!=='id')lessonEdit[input.name]=input.value;
    if(input.form?.id==='book-entry-form')bookDraft[input.name]=input.value;
  });
  view.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='bookCourse')void run(()=>openNotebook(Number(input.value),bookDraft&&!bookDraft.id?bookDraft:null));
    if(input.form?.id==='exam-config'){
      const form=input.form;
      if(input.name==='scope'){
        examOptions.scope=input.value;examOptions.scopeId='';
        form.querySelector('#exam-scope-field').innerHTML=scopeField();
        form.querySelector('#exam-setup-rubric').hidden=input.value!=='procedure';
        if(input.value==='topics')renderExamTopicResults(form);
        else syncExamTopicSelection(form);
      }
      if(input.name==='scopeId'||input.name==='difficulty')examOptions[input.name]=input.value;
      if(input.name==='topicLevel'){examOptions.level=input.value;renderExamTopicResults(form);}
      if(input.dataset.examTopic){
        if(input.checked&&examOptions.topics.size<12)examOptions.topics.add(input.dataset.examTopic);
        if(!input.checked)examOptions.topics.delete(input.dataset.examTopic);
        syncExamTopicSelection(form);
      }
    }
    if(input.form?.id==='note-form'&&input.name==='id')void run(async()=>{
      noteTopic=input.value;
      const content=noteTopic?await call('lesson',{id:noteTopic}):null;
      noteText=content?.note||'';
      lessonEdit=content?{...(content.custom||{theory:'',formula:''}),hasCustom:Boolean(content.custom)}:null;
    });
  });
  view.addEventListener('keydown',event=>{
    if(event.target.name==='topicQuery'&&event.key==='Enter'&&!event.isComposing){
      event.preventDefault();
      event.target.form.querySelector('[data-exam-topic]:enabled')?.focus();
    }
    if(event.target.id==='teacher-topic-search'&&event.key==='Enter'&&!event.isComposing){
      event.preventDefault();
      view.querySelector('.teacher-topic-results button')?.click();
    }
    const editor=event.target.closest('#solver-form');
    if(editor&&event.ctrlKey&&event.key==='Enter'&&!event.isComposing){
      event.preventDefault();
      editor.requestSubmit();
    }
  });
  view.addEventListener('submit',event=>{
    event.preventDefault();
    const formNode=event.target,fields=Object.fromEntries(new FormData(formNode)),submitter=event.submitter;
    void run(async()=>{
      if(formNode.dataset.funForm)return funUI.submit(formNode.dataset.funForm,fields,submitter);
      switch(formNode.id){
        case 'solver-form':
          solver=fields;solution=await call('solve',fields);solved=await call('solved');
          requestAnimationFrame(()=>view.querySelector('#solver-result')?.focus({preventScroll:true}));
          break;
        case 'teacher-form': {
          if(!teacher?.grounding?.solution)teacherCatalogScroll=window.scrollY;
          const response=submitter?.value==='online'?await call('teacherOnline',fields):{grounding:await call('teacher',fields)};
          const item=topic(response.grounding?.topic);
          if(item&&item.level!==teacherLevel)selectTeacherLevel(item.level);
          teacher=response;
          teacherDraft=fields;
          teacherStep=0;
          if(teacher.grounding?.clarify){
            requestAnimationFrame(()=>view.querySelector('#teacher-form [name=question]')?.focus());
          }else focusTeacherView('[data-action="teacher-topics"]');
          break;
        }
        case 'steps-form':
          stepsDraft=fields.lines;
          stepCheck=await call('validateSteps',{lines:fields.lines,variable:state.profile.variable});break;
        case 'practice-config':
          if(fields.topic)await newPractice(fields.topic,fields.difficulty);
          break;
        case 'practice-answer':
          await checkPractice(fields.answer);break;
        case 'duel-tactic':
          await checkPractice(adventureUI.tacticAnswer(practice.tactic,fields.position));break;
        case 'exam-config': {
          const {scope,scopeId,minutes,count,difficulty}=fields;
          const options={scope,scopeId,minutes,count,difficulty};
          Object.assign(examOptions,options);
          exam=await call('examStart',{...options,topics:[...examOptions.topics]});
          examReview=null;await showExam();break;
        }
        case 'settings-form':
          await call('settings',fields);await refresh();solver.variable=state.profile.variable;say('Perfil guardado.');break;
        case 'ai-form':
          ai=await call('setAi',{...fields,enabled:fields.enabled==='on'});
          say(ai.enabled?'IA configurada. Puedes usarla desde Profesor inteligente.':'IA desactivada.');break;
        case 'book-entry-form':
          await call('notebook',{...bookDraft,...fields,action:'save',unit:bookUnit});
          await openNotebook(bookUnit);say('Entrada guardada.');
          break;
        case 'note-form':
          noteText=(await call('note',fields)).note;say('Apunte guardado.');break;
        case 'lesson-edit-form':
          lessonEdit={...(await call('editLesson',fields)).custom,hasCustom:true};say('Contenido local guardado.');break;
      }
    });
  });
  document.querySelector('#active-exam-form').addEventListener('submit',event=>{event.preventDefault();void finishExam();});
  const draftTimers=new Map();
  document.querySelector('#active-exam-form').addEventListener('input',event=>{
    if(!exam||!event.target.name)return;
    const {name,value}=event.target,id=exam.id;
    const isWork=name.startsWith('work-');
    const exerciseId=isWork?name.slice(5):name;
    const draft=isWork?'procedureDrafts':'drafts';
    const pending=id+':'+name;
    exam[draft]={...exam[draft],[exerciseId]:value};
    clearTimeout(draftTimers.get(pending));
    draftTimers.set(pending,setTimeout(()=>{
      draftTimers.delete(pending);
      void call('examDraft',{id,exerciseId,[isWork?'work':'answer']:value}).catch(()=>{});
    },150));
  });
  setInterval(tickExam,250);
  setInterval(tickDuel,125);
  setInterval(()=>{
    if(api&&state&&document.hasFocus()&&!document.hidden&&['learn','practice','exams','teacher','solver','labs','notebook'].includes(page))void call('study',{seconds:15}).catch(()=>{});
  },15000);
  funUI.init({call,run,say,esc,exerciseText,getState:()=>state,getViewContext:headerContext,refresh,openPage,
    resetProfile:()=>{if(typeof resetProfileViews==='function')resetProfileViews();},
    solve:async problem=>{solver={...solver,problem,operation:'auto',argument:''};solution=await call('solve',solver);solved=await call('solved');page='solver';}});
  if(api)void run(async()=>{await refresh();solver.variable=state.profile.variable;funUI.ready();});
  else view.innerHTML=heading('MathPath','Abre la aplicación de escritorio con Abrir-MathPath.cmd para usar el motor y guardar el progreso.');
})();
