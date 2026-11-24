'use strict';

const studentLounge=(()=>{
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const image=(file,cls='',size=100)=>'<img class="'+cls+'" src="'+file+'" alt="" width="'+size+'" height="'+size+'" draggable="false">';
  const item=id=>'recursos/aldea/'+id+'.webp';
  const medal=id=>'recursos/logros/'+id+'.webp';
  const button=(action,label,cls='',extra='')=>'<button type="button" class="btn '+cls+'" data-fun="'+action+'" '+extra+'>'+label+'</button>';
  const bar=(value,total,label)=>'<div class="fun-bar" role="progressbar" aria-label="'+label+'" aria-valuenow="'+Math.min(100,Math.round(value/total*100))+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+Math.min(100,value/total*100)+'%"></span></div>';
  function hero(title,subtitle,kicker,art){
    return '<header class="lounge-hero"><div><p class="lounge-kicker">'+kicker+'</p><h1>'+title+'</h1><p>'+subtitle+'</p></div><div class="lounge-hero-art" aria-hidden="true">'+art+'</div></header>';
  }
  function games(summary){
    const modes=[
      ['daily','castillo','Reto diario','Un reto, un tesoro. ¡Vuelve cada día!','castle','recursos/cofres/raro.webp',summary.dailyDone?'✓ Listo por hoy':'★ Premio doble','Jugar'],
      ['survival','bosque','Supervivencia','Acierta y sigue en pie.','forest','arena/mushroom.webp','♥ ♥ ♥ · 30 s','Jugar'],
      ['dungeon','cristal','Mazmorra','Dale otra oportunidad a tus errores.','cavern','recursos/logros/llave.webp','Piso '+summary.dungeonFloor,'Entrar'],
      ['graph','nieve','Reto gráfico','Mueve la curva hasta alcanzar los puntos.','snow','recursos/logros/rayo.webp','Nivel '+summary.graphLevel,'Probar'],
      ['duel','arena','Duelo','Dos jugadores. Una misma aventura.','desert','arena/knight.webp','⚔ 2 jugadores','Jugar juntos'],
    ];
    return '<div class="fun-page lounge lounge-games">'+hero('¿Qué aventura toca hoy?','Elige un reto y pon a prueba tu ingenio.','TU TABLERO DE AVENTURAS',
      image('arena/knight.webp','lounge-hero-knight',170)+image('recursos/cofres/epico.webp','lounge-hero-chest',110))+
      '<div class="lounge-trail"><span>🔥 <b>'+summary.streak+'</b> '+(summary.streak===1?'día de racha':'días de racha')+'</span><span>⚡ Récord: <b>'+summary.survivalBest+'</b></span><span>✦ Elige, juega y aprende</span></div>'+
      '<section class="fun-tiles lounge-mode-grid" aria-label="Elige un modo de juego">'+modes.map(([id,tone,title,text,scene,art,stat,cta])=>
      '<button type="button" class="fun-tile lounge-mode mode-'+id+'" data-fun="game:'+id+'" style="--mode-scene:url(\'arena/'+scene+'.webp\')">'+
      '<span class="lounge-mode-art" aria-hidden="true">'+image(art,'',140)+(id==='duel'?image('arena/frog.webp','mode-duel-rival',120):'')+'<i class="lounge-mode-spark">✦</i></span>'+
      '<span class="lounge-mode-body"><em>'+stat+'</em><strong>'+title+'</strong><span>'+text+'</span><b class="lounge-mode-cta">'+cta+' <i aria-hidden="true">→</i></b></span></button>').join('')+'</section></div>';
  }
  function week(days){
    const practiced=new Set(days);
    return '<div class="lounge-week" aria-label="Práctica en los últimos siete días">'+Array.from({length:7},(_,i)=>{
      const date=new Date();date.setDate(date.getDate()-6+i);
      const values=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).map(part=>[part.type,part.value]));
      const key=[values.year,values.month,values.day].join('-'),on=practiced.has(key);
      return '<span class="'+(on?'on':'')+(i===6?' today':'')+'" title="'+key+(on?' · Practicaste':' · Sin práctica')+'"><small>'+new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',weekday:'narrow'}).format(date)+'</small><b aria-hidden="true">'+(on?'✓':'·')+'</b></span>';
    }).join('')+'</div>';
  }
  function trophies(summary,guide,tab,body){
    const tabs=[['logros','estrella','Logros',Object.keys(summary.achievements).length+'/'+guide.achievements.length],
      ['cofres','llave','Cofres',summary.chests.length],['habilidades','espada','Habilidades',summary.skillPoints+' puntos'],['avatar','corona','Mi héroe','Personalizar']];
    return '<div class="fun-page lounge lounge-trophies">'+hero('Tu sala de tesoros','Cada paso cuenta. Mira todo lo que has conseguido.','LOGROS Y RECOMPENSAS',
      image('recursos/cofres/epico.webp','lounge-treasure-hero',170)+image(medal('corona'),'lounge-hero-medal',90))+
      '<section class="fun-profile-card lounge-profile"><div class="lounge-level"><span class="lounge-level-seal">'+image(medal('estrella'),'',80)+'<b>'+summary.level+'</b></span><div><small>Tu nivel</small><strong>Caballero '+summary.level+'</strong>'+
      bar(summary.xp-summary.levelFloor,summary.levelNext-summary.levelFloor,'Experiencia del jugador')+'<small>'+Math.max(0,summary.levelNext-summary.xp)+' XP para el nivel '+(summary.level+1)+'</small></div></div>'+
      '<div class="lounge-streak">'+image(medal('llama'),'',62)+'<div><strong>'+summary.streak+' '+(summary.streak===1?'día':'días')+'</strong><small>Tu racha · mejor: '+summary.bestStreak+'</small></div></div>'+
      '<div class="lounge-week-block"><strong>Tu semana</strong>'+week(summary.days)+'</div></section>'+
      '<nav class="fun-tabs lounge-reward-tabs" role="tablist" aria-label="Tus recompensas">'+tabs.map(([id,icon,title,count])=>
      '<button type="button" role="tab" data-fun="tab:'+id+'" aria-selected="'+(tab===id)+'">'+image(medal(icon),'',44)+'<span><b>'+title+'</b><small>'+count+'</small></span></button>').join('')+'</nav>'+
      '<section class="lounge-reward-room reward-'+tab+'">'+body+'</section></div>';
  }
  const lootFiles={coins:'coin-stack',wood:'wood-logs',ore:'iron-ore',fiber:'fiber-bundle',gem:'purple-crystal',scale:'dragon-scale'};
  function chests(summary,reveal,resources){
    const revealHtml=reveal?'<section class="fun-reveal lounge-loot" role="status"><p class="lounge-kicker">COFRE '+esc(reveal.rarity.toUpperCase())+'</p>'+
      image('recursos/cofres/'+reveal.rarity.normalize('NFD').replace(/\p{M}/gu,'')+'.webp','fun-chest-art',132)+'<h2>¡Mira tu botín!</h2>'+
      '<ul>'+Object.entries(reveal.loot).map(([key,value])=>'<li>'+image(item(lootFiles[key]||'coin-pouch'),'',44)+'<b>+'+value+'</b><span>'+esc(resources[key]||key)+'</span></li>').join('')+
      (reveal.potions?'<li>'+image(item('healing-potion'),'',44)+'<b>+'+reveal.potions+'</b><span>Poción</span></li>':'')+'</ul>'+
      reveal.prizes.map(prize=>'<p class="prize">✦ '+esc(prize.name)+'</p>').join('')+button('chest-ok','¡Genial!','primary')+'</section>':'';
    if(!summary.chests.length)return revealHtml+'<div class="lounge-empty-treasure">'+image('recursos/cofres/comun.webp','',160)+'<h2>Tu próximo tesoro te espera</h2><p>Gana un nivel, un reto diario o un duelo de jefe.</p>'+button('page:games','Ir a los retos →','primary')+'</div>';
    return revealHtml+'<div class="lounge-room-heading"><div><h2>Tesoros por abrir</h2><p>Elige un cofre y descubre lo que hay dentro.</p></div><span>'+summary.chests.length+' '+(summary.chests.length===1?'cofre':'cofres')+'</span></div>'+
      '<div class="fun-chests-grid lounge-chest-grid">'+summary.chests.map((chest,index)=>'<button type="button" class="fun-chest fun-chest-'+chest.rarity+' lounge-chest" data-fun="chest:'+index+'">'+
      '<small class="lounge-rarity">'+esc(chest.rarity)+'</small><span class="lounge-chest-pedestal">'+image('recursos/cofres/'+chest.rarity.normalize('NFD').replace(/\p{M}/gu,'')+'.webp','fun-chest-art',176)+'</span>'+
      '<strong>Cofre '+esc(chest.rarity)+'</strong><small>'+esc(chest.source)+'</small><b class="lounge-mode-cta">Abrir cofre <i aria-hidden="true">✦</i></b></button>').join('')+'</div>';
  }
  const petPlaces={draco:'forest',buho:'castle',slime:'bridge'};
  const petShort={draco:'Tu pequeño dragón',buho:'Tu amigo sabio',slime:'Pura alegría'};
  function pet(summary,guide,petSvg,village){
    const current=summary.pet;
    if(!current){
      return '<div class="fun-page lounge lounge-pets">'+hero('Un amigo para tu aventura','Elige a tu compañero. Crecerá mientras aprendes.','EL REFUGIO DE COMPAÑEROS',
        image('recursos/mascotas/draco-1.webp','lounge-hero-pet',150)+image('recursos/mascotas/slime-1.webp','lounge-hero-small-pet',100))+
        '<form class="form lounge-adoption" data-fun-form="adopt"><div class="fun-adopt-grid">'+Object.entries(guide.pets).map(([id,entry])=>
        '<label class="fun-adopt lounge-pet-choice pet-'+id+'" style="--pet-place:url(\'arena/'+petPlaces[id]+'.webp\')"><input type="radio" name="species" value="'+id+'"'+(id==='draco'?' checked':'')+'>'+
        '<span class="lounge-choice-check" aria-hidden="true">✓</span><span class="lounge-pet-habitat">'+petSvg({species:id,stage:1,hat:'ninguno'},210)+'</span><strong>'+esc(entry.name)+'</strong>'+
        '<small>'+petShort[id]+'</small><span class="lounge-pet-pick">Elegir <b aria-hidden="true">♡</b></span></label>').join('')+'</div>'+
        '<div class="lounge-adopt-bar"><label>¿Cómo se llamará?<input name="name" maxlength="24" placeholder="Ej. Chispa" autocomplete="off"></label><button class="btn primary">¡Ven conmigo! →</button></div>'+
        '<p class="lounge-adoption-note">'+image(item('hint-scroll'),'',30)+'Al nivel 3, tu mascota te regala una pista en cada duelo.</p></form></div>';
    }
    const stages=['Huevo','Cría','Joven','Adulto','Legendario'];
    const powers=[['hint-scroll','Una pista gratis',3],['quick-shield','Un bloqueo extra',7],['rune-sword','Forma adulta',10],['purple-crystal','Forma legendaria',15]];
    const team='<section class="lounge-pet-team" aria-label="Mis compañeros"><header><h2>Mis compañeros</h2>'+
      '<p>Cada uno guarda su propio nivel. Solo el que te acompaña gana experiencia.</p></header><div class="lounge-team-grid">'+
      Object.entries(guide.pets).map(([id,entry])=>{
        const own=(summary.pets||[]).find(friend=>friend.species===id);
        return own?'<button type="button" class="lounge-team-pet'+(own.active?' active':'')+'" data-fun="pet-switch:'+id+'" aria-pressed="'+own.active+'">'+
          petSvg(own,96)+'<strong>'+esc(own.name)+'</strong><small>'+(own.active?'✓ Te acompaña · nivel '+own.level:'Nivel '+own.level+' · Elegir')+'</small></button>':
          '<button type="button" class="lounge-team-pet adopt" data-fun="pet-adopt:'+id+'">'+petSvg({species:id,stage:0,hat:'ninguno'},96)+
          '<strong>'+esc(entry.name)+'</strong><small>♡ Adoptar · empieza como huevo</small></button>';
      }).join('')+'</div></section>';
    return '<div class="fun-page lounge lounge-pets has-pet">'+hero(esc(current.name),esc(guide.pets[current.species].name)+' · '+esc(current.stageName),'TU COMPAÑERO · NIVEL '+current.level,
      image(medal('estrella'),'lounge-hero-medal',110))+team+
      '<div class="fun-pet-layout lounge-pet-layout"><section class="fun-pet-stage lounge-pet-home"><div class="lounge-pet-scene" style="--pet-place:url(\'arena/'+petPlaces[current.species]+'.webp\')"><span class="lounge-pet-level">Nivel '+current.level+'</span>'+
      '<div class="fun-pet-big">'+petSvg(current,300)+'</div><span class="lounge-pet-plinth"></span></div><div class="lounge-pet-care"><strong>Un poquito más y crecerá</strong>'+
      bar(current.xp-current.floor,current.next-current.floor,'Experiencia de la mascota')+'<small>'+Math.max(0,current.next-current.xp)+' XP para el nivel '+(current.level+1)+'</small>'+
      button('feed',image(item('healing-potion'),'',32)+'Dar de comer <small>5 monedas</small>','primary lounge-feed')+'</div></section>'+
      '<div><section class="lounge-pet-powers"><h2>Lo que hace por ti</h2><ul class="fun-perks">'+powers.map(([art,title,lvl])=>'<li class="'+(current.level>=lvl?'on':'')+'">'+
      image(item(art),'',48)+'<div><strong>'+title+'</strong><small>'+(current.level>=lvl?'✓ Ya lo tienes':'Se consigue al nivel '+lvl)+'</small></div></li>').join('')+'</ul></section>'+
      '<section class="panel fun-panel lounge-accessories"><header><h2>Ponle tu estilo</h2></header><div class="panel-body"><div class="fun-hats">'+Object.entries(guide.hats).map(([id,name])=>{
        const owned=summary.unlocked.hat.includes(id);
        return '<button type="button" class="fun-hat" data-fun="hat:'+id+'" aria-pressed="'+(current.hat===id)+'"'+(owned?'':' disabled')+'>'+petSvg({...current,hat:id},64)+'<small>'+esc(name)+(owned?'':' 🔒')+'</small></button>';
      }).join('')+'</div></div></section></div></div>'+
      '<section class="lounge-evolution"><h2>Así va creciendo</h2><ol>'+stages.map((name,index)=>'<li class="'+(index===current.stage?'current':index<current.stage?'passed':'future')+'">'+
      petSvg({species:current.species,stage:index,hat:'ninguno'},82)+'<strong>'+name+'</strong>'+(index===current.stage?'<small>Estás aquí</small>':'')+'</li>').join('')+'</ol></section>'+
      '<details class="details lounge-pet-edit"><summary>Cambiar el nombre de '+esc(current.name)+'</summary><form class="form" data-fun-form="adopt">'+
      '<input type="hidden" name="species" value="'+current.species+'"><label>Nombre<input name="name" maxlength="24" value="'+esc(current.name)+'"></label><button class="btn small primary">Guardar</button></form></details></div>';
  }
  function cards(cards,level,tabs){
    const school=cards.filter(item=>item.level<3),owned=school.filter(item=>item.owned).length;
    const chosen=school.filter(item=>item.level===level);
    return '<div class="fun-page lounge lounge-collection">'+hero('Tu colección de fórmulas','Domina un tema y consigue su carta. Tócala para descubrirla.','EL ÁLBUM DE TU AVENTURA',image(medal('carta'),'lounge-hero-medal',130))+
      '<nav class="fun-tabs lounge-collection-tabs" role="tablist" aria-label="Nivel de las fórmulas">'+tabs+'</nav>'+
      '<div class="lounge-collection-progress"><div><strong>'+owned+' <small>/ '+school.length+' cartas</small></strong><p>Tu colección de Primaria y Secundaria</p></div>'+bar(owned,school.length,'Colección escolar')+'</div>'+
      '<div class="fun-cards">'+chosen.map(card=>card.owned?'<article class="fun-card fun-card-'+card.level+'" tabindex="0" aria-label="'+esc(card.name)+'. Enfoca o toca para ver la fórmula."><div class="fun-card-inner"><div class="fun-card-front"><small>'+esc(card.rarity)+'</small><strong>'+esc(card.name)+'</strong>'+
      '<span class="fun-card-emblem" aria-hidden="true">'+image(medal(card.level===1?'estrella':'rayo'),'',70)+'</span><small>'+esc(card.area||'')+'</small></div><div class="fun-card-back"><small>Fórmula</small><p>'+esc(card.formula)+'</p></div></div></article>':
      '<article class="fun-card locked"><div class="fun-card-inner"><div class="fun-card-front"><span class="fun-card-emblem" aria-hidden="true">🔒</span><strong>'+esc(card.name)+'</strong><small>'+card.progress+' de 2 estrellas</small></div></div></article>').join('')+'</div></div>';
  }
  return {games,trophies,chests,pet,cards};
})();
