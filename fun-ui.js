// MathPath · Autor: Abel Josué Colquehuanca Humpiri
'use strict';

// Game layer UI: challenges, trophies, pet, cards, effects, themes and whiteboard.
const abelFunUI=(()=>{
  let ctx=null;
  const pages=new Set(['games','trophies','pet','cards']);
  let gamesView='hub',trophyTab='logros',cardLevel=1,chestReveal=null,explain=null;
  let game=null,timer=null,data={cards:[],profiles:[],missions:[]};
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state=()=>ctx.getState();
  const fun=()=>state().fun;
  const schoolContext=()=>{
    const context=ctx?.getViewContext?.()||{};
    const active=context.page==='cards'?cardLevel:context.contentLevel;
    return ['games','trophies','pet','village'].includes(context.page)||active===1||active===2;
  };
  const guide=()=>state().funGuide;
  const button=(action,label,style='',extra='')=>'<button type="button" class="btn '+style+'" data-fun="'+action+'"'+extra+'>'+label+'</button>';
  const percent=(value,total)=>total?Math.max(0,Math.min(100,Math.round(100*value/total))):0;
  const bar=(value,total,label='')=>'<div class="fun-bar" role="progressbar" aria-label="'+esc(label)+'" aria-valuenow="'+
    percent(value,total)+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+percent(value,total)+'%"></span></div>';

  // ---------------------------------------------------------------- art
  const petPalette={
    draco:['#62c370','#3e8f4d','#f7e6a6','#ff9a3c'],
    buho:['#b4835a','#7c5537','#f3dfc2','#f2b33d'],
    slime:['#74c8ff','#3b8fd6','#d9f2ff','#ff7eb6'],
  };
  function hatSvg(hat,y){
    const at='transform="translate(60 '+y+')"';
    switch(hat){
      case 'lazo':return '<g '+at+'><path d="M-4 0l-14-9v18zM4 0l14-9v18z" fill="#ff5d8f"/><circle r="4.5" fill="#d93a6c"/></g>';
      case 'mago':return '<g '+at+'><path d="M-17 2L0-34 17 2z" fill="#5b4bc4"/><ellipse cy="2" rx="22" ry="5" fill="#463a9e"/><circle cx="-3" cy="-14" r="2.4" fill="#ffe36b"/><circle cx="5" cy="-6" r="1.8" fill="#ffe36b"/></g>';
      case 'corona':return '<g '+at+'><path d="M-17 2l-3-20 10 9 10-15 10 15 10-9-3 20z" fill="#ffcc33" stroke="#c98a12" stroke-width="2"/><circle cx="0" cy="-6" r="3" fill="#e34a5c"/></g>';
      case 'pirata':return '<g '+at+'><path d="M-26 2q26-30 52 0q-26-8-52 0z" fill="#2c2c34"/><circle cy="-8" r="4" fill="#f4f4f4"/></g>';
      case 'casco':return '<g '+at+'><path d="M-19 3a19 17 0 0 1 38 0z" fill="#9aa7b4" stroke="#5e6b78" stroke-width="2"/><path d="M-18-4q-14-6-10-20q4 10 12 12zM18-4q14-6 10-20q-4 10-12 12z" fill="#f2ead6"/></g>';
      case 'birrete':return '<g '+at+'><path d="M-24-6L0-16 24-6 0 4z" fill="#222a36"/><rect x="-12" y="-4" width="24" height="9" fill="#222a36"/><path d="M20-6v14" stroke="#ffcc33" stroke-width="2"/><circle cx="20" cy="9" r="2.5" fill="#ffcc33"/></g>';
      case 'flor':return '<g transform="translate(78 '+(y+4)+')">'+[0,72,144,216,288].map(a=>'<ellipse rx="5" ry="8" fill="#ff9ec7" transform="rotate('+a+') translate(0 -7)"/>').join('')+'<circle r="4.5" fill="#ffd34d"/></g>';
      default:return '';
    }
  }
  // Optional pixel art: recursos/mascotas/<especie>-<etapa>.webp and recursos/cofres/<rareza>.webp.
  const art=new Set();
  function probeArt(){
    const files=[...['draco','buho','slime'].flatMap(species=>[0,1,2,3,4].map(stage=>'recursos/mascotas/'+species+'-'+stage+'.webp')),
      ...['comun','raro','epico'].map(rarity=>'recursos/cofres/'+rarity+'.webp')];
    for(const file of files){const image=new Image();image.onload=()=>art.add(file);image.src=file;}
  }
  const plain=text=>text.normalize('NFD').replace(/\p{M}/gu,'');
  function petSvg(pet,size=120){
    if(!pet)return '';
    const file='recursos/mascotas/'+pet.species+'-'+pet.stage+'.webp';
    if(art.has(file))return '<span class="fun-pet-art" style="width:'+size+'px;height:'+size+'px"><img src="'+file+'" alt="" width="'+size+'" height="'+size+'">'+
      (pet.hat&&pet.hat!=='ninguno'?'<svg viewBox="0 0 120 120" aria-hidden="true">'+hatSvg(pet.hat,22)+'</svg>':'')+'</span>';
    const [main,dark,belly,accent]=pet.stage>=4?['#ffd45c','#c9931a','#fff3c4','#ff7a3c']:petPalette[pet.species];
    const scale=[.62,.72,.86,1,1.06][pet.stage];
    let body='';
    if(pet.stage===0){
      body='<ellipse cx="60" cy="72" rx="28" ry="34" fill="'+belly+'" stroke="'+dark+'" stroke-width="3"/>'+
        '<circle cx="50" cy="62" r="6" fill="'+main+'"/><circle cx="70" cy="80" r="8" fill="'+main+'"/><circle cx="62" cy="52" r="4" fill="'+main+'"/>'+
        '<path d="M40 74l7-5 6 6 7-6 6 5 7-5 7 5" fill="none" stroke="'+dark+'" stroke-width="2.2" stroke-linejoin="round"/>'+
        '<circle cx="52" cy="70" r="2.6" fill="#1d2633"/><circle cx="68" cy="70" r="2.6" fill="#1d2633"/>';
      return '<svg class="fun-pet-svg" viewBox="0 0 120 120" width="'+size+'" height="'+size+'" aria-hidden="true">'+body+hatSvg(pet.hat,36)+'</svg>';
    }
    const eyes=(y,r=7)=>'<circle cx="49" cy="'+y+'" r="'+r+'" fill="#fff"/><circle cx="71" cy="'+y+'" r="'+r+'" fill="#fff"/>'+
      '<circle cx="50.5" cy="'+(y+1)+'" r="'+(r*.55)+'" fill="#1d2633"/><circle cx="72.5" cy="'+(y+1)+'" r="'+(r*.55)+'" fill="#1d2633"/>'+
      '<circle cx="52" cy="'+(y-1.5)+'" r="1.6" fill="#fff"/><circle cx="74" cy="'+(y-1.5)+'" r="1.6" fill="#fff"/>';
    const blush='<ellipse cx="41" cy="80" rx="5" ry="3" fill="#ff8fa3" opacity=".55"/><ellipse cx="79" cy="80" rx="5" ry="3" fill="#ff8fa3" opacity=".55"/>';
    if(pet.species==='draco'){
      const wing=pet.stage>=2?'<path d="M34 62q-26-14-24 14q10-6 22 2z" fill="'+accent+'" stroke="'+dark+'" stroke-width="2"/><path d="M86 62q26-14 24 14q-10-6-22 2z" fill="'+accent+'" stroke="'+dark+'" stroke-width="2"/>':
        '<path d="M36 66q-12-6-12 6q6-2 12 2z" fill="'+accent+'"/><path d="M84 66q12-6 12 6q-6-2-12 2z" fill="'+accent+'"/>';
      body=wing+'<path d="M84 88q22 4 22-10q-6 6-16 2" fill="'+main+'" stroke="'+dark+'" stroke-width="2"/>'+
        '<ellipse cx="60" cy="76" rx="27" ry="25" fill="'+main+'" stroke="'+dark+'" stroke-width="3"/>'+
        '<ellipse cx="60" cy="84" rx="16" ry="13" fill="'+belly+'"/>'+
        '<path d="M44 54l-4-14 11 9zM76 54l4-14-11 9z" fill="'+belly+'" stroke="'+dark+'" stroke-width="2"/>'+
        eyes(70)+blush+'<path d="M55 84q5 4 10 0" fill="none" stroke="#1d2633" stroke-width="2" stroke-linecap="round"/>'+
        (pet.stage>=3?'<path d="M60 52q4-10 0-16q8 6 4 16z" fill="'+accent+'"/>':'');
    }else if(pet.species==='buho'){
      body='<path d="M40 52l-6-14 14 8zM80 52l6-14-14 8z" fill="'+dark+'"/>'+
        '<ellipse cx="60" cy="76" rx="27" ry="27" fill="'+main+'" stroke="'+dark+'" stroke-width="3"/>'+
        '<ellipse cx="60" cy="88" rx="16" ry="13" fill="'+belly+'"/>'+
        '<path d="M60 92l-4-4m4 4 4-4m-4 4v4" stroke="'+dark+'" stroke-width="1.5" fill="none"/>'+
        '<circle cx="49" cy="70" r="11" fill="'+belly+'"/><circle cx="71" cy="70" r="11" fill="'+belly+'"/>'+eyes(70,8)+
        '<path d="M56 79l4 6 4-6z" fill="'+accent+'"/>'+
        (pet.stage>=2?'<path d="M33 74q-10 10 2 22l6-12zM87 74q10 10-2 22l-6-12z" fill="'+dark+'"/>':'')+
        (pet.stage>=3?'<rect x="44" y="64" width="32" height="2" fill="#1d2633" opacity=".6"/>':'');
    }else{
      body='<path d="M30 94q-4-46 30-52q34 6 30 52q-30 6-60 0z" fill="'+main+'" stroke="'+dark+'" stroke-width="3" opacity=".95"/>'+
        '<ellipse cx="46" cy="58" rx="7" ry="4" fill="#fff" opacity=".55" transform="rotate(-25 46 58)"/>'+
        eyes(74)+blush+'<path d="M53 86q7 6 14 0" fill="none" stroke="#1d2633" stroke-width="2.2" stroke-linecap="round"/>'+
        (pet.stage>=2?'<circle cx="90" cy="92" r="6" fill="'+main+'" stroke="'+dark+'" stroke-width="2"/>':'')+
        (pet.stage>=3?'<circle cx="28" cy="90" r="4" fill="'+main+'" stroke="'+dark+'" stroke-width="2"/>':'');
    }
    const aura=pet.stage>=4?'<circle cx="60" cy="72" r="46" fill="none" stroke="#ffd45c" stroke-width="2" stroke-dasharray="4 7" class="fun-aura"/>':'';
    return '<svg class="fun-pet-svg" viewBox="0 0 120 120" width="'+size+'" height="'+size+'" aria-hidden="true">'+aura+
      '<g transform="translate(60 100) scale('+scale+') translate(-60 -100)">'+body+hatSvg(pet.hat,pet.species==='slime'?44:48)+'</g></svg>';
  }
  const chestSvg=rarity=>{
    const file='recursos/cofres/'+plain(rarity)+'.webp';
    if(art.has(file))return '<img class="fun-chest-art" src="'+file+'" alt="" width="96" height="96">';
    const [wood,band]={común:['#b07a45','#7a5230'],raro:['#4f8fd6','#2c5d99'],épico:['#a55be0','#ffcc33']}[rarity]||['#b07a45','#7a5230'];
    return '<svg viewBox="0 0 80 64" width="80" height="64" aria-hidden="true"><rect x="8" y="26" width="64" height="32" rx="4" fill="'+wood+'" stroke="#2b2118" stroke-width="2.5"/>'+
      '<path class="fun-chest-lid" d="M8 28q0-20 32-20t32 20z" fill="'+wood+'" stroke="#2b2118" stroke-width="2.5"/>'+
      '<rect x="8" y="34" width="64" height="5" fill="'+band+'"/><rect x="34" y="30" width="12" height="14" rx="2" fill="#ffd45c" stroke="#2b2118" stroke-width="2"/></svg>';
  };

  // ---------------------------------------------------------------- effects
  let toastBox,confettiCanvas,board;
  function toast(item){
    if(!toastBox)return;
    const node=document.createElement('div');
    node.className='fun-toast fun-toast-'+(item.kind||'info');
    node.setAttribute('role','status');
    node.innerHTML='<span class="fun-toast-icon" aria-hidden="true">'+esc(item.icon||'✨')+'</span><div><strong>'+esc(item.title)+
      '</strong>'+(item.detail?'<p>'+esc(item.detail)+'</p>':'')+'</div>';
    toastBox.append(node);
    setTimeout(()=>node.classList.add('leaving'),4200);
    setTimeout(()=>node.remove(),4800);
  }
  const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function confetti(amount=160){
    if(!schoolContext()||reducedMotion()||!confettiCanvas)return;
    const canvas=confettiCanvas,g=canvas.getContext('2d');
    canvas.width=innerWidth;canvas.height=innerHeight;canvas.hidden=false;
    const colors=['#ffcc33','#ff5d8f','#4fd1a5','#5aa9ff','#b98cff','#ff8a3d'];
    const bits=Array.from({length:amount},()=>({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.35,
      vx:(Math.random()-.5)*14,vy:-Math.random()*13-4,size:5+Math.random()*6,spin:Math.random()*6,
      color:colors[Math.random()*colors.length|0]}));
    const start=performance.now();
    const frame=now=>{
      if(!schoolContext()){g.clearRect(0,0,canvas.width,canvas.height);canvas.hidden=true;return;}
      const t=now-start;
      g.clearRect(0,0,canvas.width,canvas.height);
      for(const bit of bits){
        bit.vy+=.32;bit.vx*=.99;bit.x+=bit.vx;bit.y+=bit.vy;bit.spin+=.2;
        g.save();g.translate(bit.x,bit.y);g.rotate(bit.spin);g.globalAlpha=Math.max(0,1-t/2600);
        g.fillStyle=bit.color;g.fillRect(-bit.size/2,-bit.size/4,bit.size,bit.size/2);g.restore();
      }
      if(t<2600)requestAnimationFrame(frame);else{g.clearRect(0,0,canvas.width,canvas.height);canvas.hidden=true;}
    };
    requestAnimationFrame(frame);
  }
  function coins(count=6){
    if(!schoolContext()||reducedMotion())return;
    const target=document.querySelector('.fun-level-badge')||document.querySelector('#fun-topbar');
    if(!target)return;
    const end=target.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const coin=document.createElement('span');
      coin.className='fun-flying-coin';coin.textContent='🪙';
      const x=innerWidth/2+(Math.random()-.5)*120,y=innerHeight/2+(Math.random()-.5)*80;
      coin.style.left=x+'px';coin.style.top=y+'px';
      document.body.append(coin);
      coin.animate([{transform:'translate(0,0) scale(1)',opacity:1},
        {transform:'translate('+(end.left-x)+'px,'+(end.top-y)+'px) scale(.5)',opacity:.3}],
        {duration:700+i*70,easing:'cubic-bezier(.5,-.3,.7,1)',fill:'forwards'}).onfinish=()=>coin.remove();
    }
    setTimeout(()=>abelFunAudio.play('coin'),500);
  }

  // ---------------------------------------------------------------- theme, topbar, sync
  function applyTheme(){
    const avatar=fun()?.avatar||{};
    const root=document.documentElement;
    root.dataset.accent=avatar.theme||'bosque';
    root.dataset.mode=avatar.dark?'dark':'light';
    root.style.setProperty('--knight-hue',(avatar.hue||0)+'deg');
  }
  const headerIcons={
    flame:'<path d="M12 3c1 5-4 5-2 9 1-2 3-2 4-5 3 3 5 6 4 9a6.3 6.3 0 0 1-12 0c-1-4 1-7 3-9-1 4 1 5 1 5"/>',
    star:'<path d="M12 3l2.8 5.7 6.3.9-4.5 4.4 1 6.2-5.6-3-5.6 3 1-6.2L3 9.6l6.2-.9z"/>',
    chest:'<path d="M3 11V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v3M3 11h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM7 4v7m10-7v7"/><rect x="10" y="9" width="4" height="6" rx="1"/>',
    sound:'<path d="M11 5L6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted:'<path d="M11 5L6 9H3v6h3l5 4zM16 9l5 6m0-6l-5 6"/>',
    music:'<path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',
    musicOff:'<path d="M9 18V5l11-2v13M9 9l11-2M3 3l18 18"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',
    moon:'<path d="M20.5 13.2A8.8 8.8 0 0 1 10.8 3.5a9 9 0 1 0 9.7 9.7z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    pen:'<path d="M15.5 4.5l4 4M4 20l4.5-1 12-12a2.8 2.8 0 0 0-4-4l-12 12zM13 20h8"/>'
  };
  const headerIcon=name=>'<svg class="header-icon icon-'+name+'" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+headerIcons[name]+'</svg>';
  function topbar(){
    const box=document.querySelector('#fun-topbar');
    if(!box)return;
    const context=ctx.getViewContext?.()||{};
    const activeLevel=context.page==='cards'?cardLevel:context.contentLevel;
    box.hidden=!(['games','trophies','pet','village'].includes(context.page)||activeLevel===1||activeLevel===2);
    const summary=fun();
    if(!summary)return;
    const xpInLevel=summary.xp-summary.levelFloor,xpNeeded=summary.levelNext-summary.levelFloor;
    box.innerHTML=
      '<button type="button" class="fun-chip fun-streak'+(summary.activeToday?' lit':'')+'" data-fun="page:trophies:logros" title="Racha diaria" aria-label="'+summary.streak+' días de racha">'+
        headerIcon('flame')+'<span>'+summary.streak+'</span></button>'+
      '<button type="button" class="fun-chip fun-level-badge" data-fun="page:trophies:habilidades" title="'+xpInLevel+' / '+xpNeeded+' XP" aria-label="Nivel '+summary.level+', '+xpInLevel+' de '+xpNeeded+' puntos de experiencia">'+
        headerIcon('star')+'<span>Nv '+summary.level+'</span>'+bar(xpInLevel,xpNeeded,'Experiencia')+'</button>'+
      (summary.chests.length?'<button type="button" class="fun-chip fun-chests" data-fun="page:trophies:cofres" title="Cofres por abrir" aria-label="'+summary.chests.length+' cofres por abrir">'+
        headerIcon('chest')+'<span>'+summary.chests.length+'</span></button>':'')+
      '<button type="button" class="fun-icon" data-fun="toggle-sound" aria-label="Sonido" aria-pressed="'+!abelFunAudio.muted+'" title="'+(abelFunAudio.muted?'Activar sonido':'Silenciar sonido')+'">'+headerIcon(abelFunAudio.muted?'muted':'sound')+'</button>'+
      '<button type="button" class="fun-icon" data-fun="toggle-music" aria-label="Música" aria-pressed="'+abelFunAudio.musicOn+'" title="'+(abelFunAudio.musicOn?'Desactivar música':'Activar música')+'">'+headerIcon(abelFunAudio.musicOn?'music':'musicOff')+'</button>'+
      '<button type="button" class="fun-icon" data-fun="toggle-dark" aria-label="Modo oscuro" aria-pressed="'+Boolean(summary.avatar.dark)+'" title="'+(summary.avatar.dark?'Activar modo claro':'Activar modo oscuro')+'">'+headerIcon(summary.avatar.dark?'sun':'moon')+'</button>'+
      '<button type="button" class="fun-icon" data-fun="board" aria-label="Abrir pizarra" title="Pizarra">'+headerIcon('pen')+'</button>';
  }
  async function sync(){
    if(!ctx||!state())return;
    try{
      const allowed=schoolContext();
      const response=await ctx.call('fun',{action:allowed?'pending':'summary'});
      const {events=[],summary}=allowed?response:{summary:response};
      const previous=fun();
      state().fun=summary;
      topbar();applyTheme();
      if(!schoolContext())return;
      let party=false;
      for(const item of events){
        toast(item);
        if(['achievement','level','boss','record'].includes(item.kind))party=true;
        abelFunAudio.play(item.kind==='level'?'levelup':item.kind==='achievement'?'achievement':'coin');
      }
      if(party)confetti();
      if(previous&&summary.xp>previous.xp&&!events.length)abelFunAudio.play('pop');
    }catch{}
  }

  // ---------------------------------------------------------------- duel hooks
  function duel(battle){
    const impact=battle.impact||{};
    if(battle.event==='hit')abelFunAudio.play(impact.crit?'crit':impact.combo?'combo':'hit');
    else if(battle.event==='hurt')abelFunAudio.play('hurt');
    else if(battle.event==='blocked')abelFunAudio.play('blocked');
    else if(battle.event==='break')abelFunAudio.play('hit');
    if(battle.rival===0){setTimeout(()=>{abelFunAudio.play('win');confetti();coins(8);},650);}
    else if(battle.hero===0)setTimeout(()=>abelFunAudio.play('lose'),650);
  }
  function afterRender(page,view,info){
    topbar();
    if(!schoolContext()){
      toastBox?.replaceChildren();
      if(confettiCanvas){confettiCanvas.hidden=true;confettiCanvas.getContext('2d').clearRect(0,0,confettiCanvas.width,confettiCanvas.height);}
      document.querySelectorAll('.fun-flying-coin').forEach(node=>node.remove());
    }
    const reference=page==='cards'&&cardLevel===3;
    document.body.dataset.reference=reference?'formulas':'';
    if(reference){abelFormulaLibrary.bind();document.querySelector('#breadcrumb').textContent='MathPath / Formulario universitario';}
    const summary=fun();
    // Show the selected title under the profile name.
    if(schoolContext()&&summary?.avatar?.title){
      const name=guide().achievements.find(item=>item.id===summary.avatar.title)?.name;
      if(name&&!state().demo)document.querySelector('#profile-mode').textContent='🏆 '+name;
    }
    const arena=view.querySelector('.combat-arena');
    if(arena&&info.battle){
      const battle=info.battle;
      const boss=arena.classList.contains('arena-boss');
      abelFunAudio.music(boss?'boss':arena.dataset.arenaWorld);
      if(summary?.pet){
        const companion=document.createElement('div');
        companion.className='fun-companion'+(info.effect==='hit'?' cheer':info.effect==='hurt'?' worried':'');
        companion.innerHTML=petSvg(summary.pet,92);
        companion.title=summary.pet.name;
        arena.append(companion);
      }
      if(info.effect==='hit'&&(battle.impact?.crit||battle.impact?.combo)){
        const banner=document.createElement('div');
        banner.className='fun-banner'+(battle.impact.crit?' crit':' combo');
        banner.textContent=battle.impact.combo?'¡COMBO ×'+(battle.impact.comboHits||2)+'!':battle.impact.crit?'¡CRÍTICO!':'';
        arena.append(banner);
      }
      if(boss&&battle.rivalTotal){
        const ratio=battle.rival/battle.rivalTotal;
        const phase=ratio<=1/3?3:ratio<=2/3?2:1;
        arena.dataset.funPhase=phase;
        if(phase>1&&battle.rival>0){
          const tag=document.createElement('div');
          tag.className='fun-phase-tag';tag.textContent=phase===3?'¡FASE FINAL! El jefe está furioso':'FASE 2';
          arena.append(tag);
        }
      }
      const help=view.querySelector('.arena-help');
      if(help&&battle.petHint&&!battle.event&&summary?.pet){
        help.insertAdjacentHTML('afterbegin','<button type="button" class="btn small fun-pet-hint" data-action="adventure-pet-hint">🐾 Pista de '+
          esc(summary.pet.name)+'</button>');
      }
    }else abelFunAudio.stopMusic();
    if(page==='village')villageTown(view);
    if(page==='learn'&&info.lesson)lessonExtras(view,info.lesson);
    const practiceForm=view.querySelector('#practice-answer');
    if(practiceForm&&info.level)practiceForm.dataset.level=info.level;
    if(practiceForm&&info.variable)practiceForm.dataset.variable=info.variable;
    if(typeof abelAnswerCapture!=='undefined')abelAnswerCapture.decorate(view);
    if(page==='solver'){
      const form=view.querySelector('#solver-form');
      if(form&&!form.querySelector('[data-fun="photo"]'))
        form.querySelector('.btn.primary')?.insertAdjacentHTML('afterend',' '+button('photo','📷 Desde una foto','',' title="Lee el ejercicio de una foto con la IA configurada"'));
    }
  }
  function villageTown(view){
    const wins=state().adventure?.wins?.length||0,owned=state().village?.owned?.length||0;
    const count=Math.min(12,1+Math.floor(wins/2)+owned);
    const roofs=['#c8553d','#3d7bc8','#7d4fc8','#2f9e6b','#d9a13b','#c83d7d'];
    const houses=Array.from({length:12},(_,i)=>{
      const built=i<count,x=12+i*64,h=34+(i*17)%26,roof=roofs[i%roofs.length];
      return '<g class="fun-house'+(built?' built':'')+'" style="--delay:'+(i*60)+'ms"><rect x="'+x+'" y="'+(110-h)+'" width="46" height="'+h+'" rx="3" fill="'+(built?'#f3e3c3':'none')+
        '" stroke="'+(built?'#6b4a2b':'#9aa8b3')+'" stroke-width="2" stroke-dasharray="'+(built?'0':'4 4')+'"/>'+
        '<path d="M'+(x-4)+' '+(110-h)+'L'+(x+23)+' '+(86-h)+'L'+(x+50)+' '+(110-h)+'z" fill="'+(built?roof:'none')+'" stroke="'+(built?'#4a2f1b':'#9aa8b3')+
        '" stroke-width="2" stroke-dasharray="'+(built?'0':'4 4')+'"/>'+(built?'<rect x="'+(x+18)+'" y="'+(94)+'" width="11" height="16" fill="#6b4a2b"/>'+
        '<rect x="'+(x+6)+'" y="'+(116-h)+'" width="9" height="8" fill="#9fd4ff"/><rect x="'+(x+31)+'" y="'+(116-h)+'" width="9" height="8" fill="#9fd4ff"/>':'')+'</g>';
    }).join('');
    const banner='<section class="fun-town" aria-label="Tu aldea tiene '+count+' construcciones"><div class="fun-town-head"><strong>🏘️ Tu aldea crece</strong>'+
      '<span>'+count+' de 12 construcciones · gana duelos y forja equipo para construir más</span></div>'+
      '<svg viewBox="0 0 780 120" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><rect y="110" width="780" height="10" fill="#7bb661"/>'+houses+'</svg></section>';
    const host=view.firstElementChild;
    if(host)host.insertAdjacentHTML('afterbegin',banner);
  }
  function lessonExtras(view,lesson){
    const target=view.querySelector('.lesson-actions')||view.querySelector('.page-heading');
    if(!target||view.querySelector('[data-fun="eli10"]'))return;
    target.insertAdjacentHTML('beforeend',' '+button('eli10:'+lesson.id,'🧒 Explícamelo fácil','small'));
    if(explain&&explain.topic===lesson.id){
      target.insertAdjacentHTML('afterend','<aside class="fun-explain" role="note"><strong>🧒 Explicado fácil'+(explain.source==='ia'?' · IA':'')+'</strong><p>'+
        esc(explain.text).replace(/\n/g,'<br>')+'</p>'+(explain.note?'<small>'+esc(explain.note)+'</small>':'')+'</aside>');
    }
  }

  // ---------------------------------------------------------------- shared exercise widgets
  function exerciseBlock(item,formId,feedback){
    const choices=item.choices&&!feedback?'<div class="choice-grid" role="group" aria-label="Elige tu respuesta">'+item.choices.map(choice=>
      '<button class="btn" type="button" data-fun="pick:'+formId+':'+esc(choice)+'">'+esc(choice)+'</button>').join('')+'</div>':'';
    const input=feedback?'':choices||'<form class="form fun-answer" data-fun-form="'+formId+'" data-level="'+(state().topics.find(entry=>entry.id===item.topic)?.level||'')+'" data-variable="'+esc(item.variable||'x')+'"><label>Tu respuesta<input name="answer" maxlength="300" required autocomplete="off" autofocus></label>'+
      '<button class="btn primary">Comprobar</button></form>';
    const result=feedback?'<div class="fun-feedback '+(feedback.correct?'ok':'bad')+'" role="status"><strong>'+(feedback.correct?'✅ ¡Correcto!':'❌ No era así')+
      '</strong>'+(feedback.correct?'':'<p>Respuesta: <b>'+esc(feedback.answer)+'</b></p>')+(feedback.message&&!feedback.correct?'<small>'+esc(feedback.message)+'</small>':'')+'</div>':'';
    return '<div class="fun-exercise">'+ctx.exerciseText(item)+input+result+'</div>';
  }
  const gradeView=grade=>grade?{correct:grade.correct,answer:grade.solution?.result,message:grade.feedback?.message,invalid:grade.invalid}:null;
  function stopTimer(){clearInterval(timer);timer=null;}
  function startTimer(seconds,onEnd){
    stopTimer();
    const deadline=Date.now()+seconds*1000;
    game.deadline=deadline;game.seconds=seconds;
    timer=setInterval(()=>{
      const left=Math.max(0,deadline-Date.now());
      const node=document.querySelector('.fun-timer');
      if(node){node.style.setProperty('--left',(100*left/(seconds*1000))+'%');node.querySelector('b').textContent=Math.ceil(left/1000)+' s';
        node.classList.toggle('low',left<6000);}
      if(left<=0){stopTimer();onEnd();}
    },200);
  }
  const timerMarkup=()=>'<div class="fun-timer"><b>'+(game.seconds||'')+' s</b><span></span></div>';
  const hearts=(value,total)=>'<span class="fun-hearts" aria-label="'+value+' de '+total+' vidas">'+
    Array.from({length:total},(_,i)=>'<b class="'+(i<value?'':'empty')+'">♥</b>').join('')+'</span>';

  // ---------------------------------------------------------------- pages
  function render(page){
    if(page==='games')return gamesPage();
    if(page==='trophies')return trophiesPage();
    if(page==='pet')return petPage();
    if(page==='cards')return cardsPage();
    return '';
  }
  const heading=(title,text,emoji)=>'<div class="fun-heading"><span class="fun-heading-emoji" aria-hidden="true">'+emoji+'</span><div><h1>'+title+'</h1><p>'+text+'</p></div></div>';

  function gamesPage(){
    if(gamesView==='hub')return abelStudentLounge.games(fun());
    const back=button('hub','← Retos','ghost');
    const views={daily:dailyView,survival:survivalView,dungeon:dungeonView,graph:graphView,duel:duelView};
    return '<div class="fun-page fun-game">'+'<div class="subnav">'+back+'</div>'+views[gamesView]()+'</div>';
  }

  function dailyView(){
    if(!game?.daily)return '<p>Cargando…</p>';
    const {exercise,done,topicName,grade}=game.daily;
    return heading('Reto del día',esc(topicName)+' · premio: +40 XP, 10 monedas y un cofre raro','📅')+
      '<section class="panel fun-panel"><div class="panel-body">'+(done?'<p class="fun-done">✅ ¡Ya completaste el reto de hoy! Vuelve mañana para mantener tu racha 🔥</p>':'')+
      exerciseBlock(exercise,'daily',gradeView(grade))+
      (grade&&!grade.correct&&!done?'<p class="muted">El reto de hoy ya fue respondido. Practica este tema y vuelve mañana.</p>':'')+'</div></section>';
  }
  // Grade picker shared by Survival and Dungeon: "mine" or a comma-separated list like "2-1,2-2".
  function gradePicker(scope,mineLabel){
    const mine=scope==='mine';
    const picked=new Set(scope.split(',').flatMap(part=>/^[12]$/.test(part)?
      Array.from({length:part==='1'?6:5},(_,index)=>part+'-'+(index+1)):[part]));
    const grades=(level,count,name)=>'<fieldset class="survival-level"><legend>'+name+'</legend><div class="survival-grades">'+
      Array.from({length:count},(_,index)=>{const value=level+'-'+(index+1);
        return '<label class="survival-grade"><input type="checkbox" name="g'+value+'"'+(picked.has(value)?' checked':'')+'><span>'+(index+1)+'.º</span></label>';}).join('')+
      '</div><button type="button" class="btn small ghost" data-survival-pick="'+level+'">Todo '+name+'</button></fieldset>';
    return '<fieldset class="survival-mode"><legend>¿De qué grados?</legend>'+
      '<label class="check-label"><input type="radio" name="mode" value="mine"'+(mine?' checked':'')+'> '+mineLabel+'</label>'+
      '<label class="check-label"><input type="radio" name="mode" value="grades"'+(mine?'':' checked')+'> Elegir grados (marca uno o varios)</label></fieldset>'+
      '<div class="survival-picker">'+grades(1,6,'Primaria')+grades(2,5,'Secundaria')+
      '<button type="button" class="btn small ghost" data-survival-pick="none">Limpiar</button></div>';
  }
  function pickedScope(fields){
    const grades=Object.keys(fields).filter(key=>/^g[12]-[0-9]$/.test(key)).map(key=>key.slice(1));
    if(fields.mode==='mine')return 'mine';
    if(!grades.length){ctx.say('Marca al menos un grado.',true);return null;}
    return grades.join(',');
  }
  function survivalView(){
    if(!game?.survival){
      const records=fun().survivalRecords||{};
      const best=Object.entries(records).filter(([,value])=>value).sort((a,b)=>b[1]-a[1]).slice(0,4);
      return heading('Supervivencia','Responde todo lo que puedas antes de perder tus 3 vidas.','💀')+
        '<section class="panel fun-panel"><div class="panel-body"><form class="form survival-setup" data-fun-form="survival-setup">'+
        gradePicker(survivalScope,'Mis temas (según mi avance)')+
        '<p class="muted">Cada acierto suma un punto y los retos se vuelven más difíciles cada 5 puntos. Hay un récord para cada combinación de grados.</p>'+
        (best.length?'<p class="survival-records">🏅 '+best.map(([,value])=>value+' pts').join(' · ')+'</p>':'')+
        '<button class="btn primary">Empezar partida</button></form></div></section>';
    }
    const run=game.survival;
    if(run.over)return heading('Fin de la partida',(run.record?'🏅 ¡Nuevo récord! ':'Récord: '+run.best+' · ')+esc(run.scopeLabel||''),'💀')+
      '<section class="panel fun-panel"><div class="panel-body fun-center"><p class="fun-big">'+run.score+' puntos</p><div class="row">'+
      button('survival-start','Jugar otra vez','primary')+button('survival-setup','Cambiar preguntas','ghost')+'</div></div></section>';
    return '<div class="fun-hud">'+hearts(run.lives,3)+'<span class="fun-score">Puntos: <b>'+run.score+'</b></span><span>Récord: '+run.best+'</span>'+
      '<span class="fun-scope">📚 '+esc(run.scopeLabel||'')+'</span></div>'+
      (run.feedback?'':timerMarkup())+'<section class="panel fun-panel"><div class="panel-body"><small>'+esc(run.topicName)+'</small>'+
      exerciseBlock(run.exercise,'survival',run.feedback)+(run.feedback?'<div class="row">'+button('survival-next','Siguiente →','primary')+button('survival-end','Terminar','ghost')+'</div>':'')+
      '</div></section>';
  }
  let dungeonScope='mine';
  function dungeonView(){
    const dungeon=game?.dungeon;
    if(!dungeon)return heading('Mazmorra de errores','Vuelve a enfrentar los ejercicios que fallaste. Cada error vencido es un piso.','🗝️')+
      '<section class="panel fun-panel"><div class="panel-body"><form class="form survival-setup" data-fun-form="dungeon-setup">'+
      gradePicker(dungeonScope,'Todos mis errores')+'<button class="btn primary">Entrar a la mazmorra</button></form></div></section>';
    const floors=Array.from({length:6},(_,i)=>{
      const number=dungeon.floor+6-i;
      return '<li class="'+(number===dungeon.floor+1?'current':number<=dungeon.floor?'done':'')+'">Piso '+number+'</li>';
    }).join('');
    const body=dungeon.exercise?'<small>'+esc(dungeon.topicName)+' · '+dungeon.remaining+' errores por vencer</small>'+exerciseBlock(dungeon.exercise,'dungeon',dungeon.feedback)+
      (dungeon.feedback?'<div class="row">'+button('dungeon-next',dungeon.feedback.correct?'Bajar al siguiente piso →':'Enfrentar otro error →','primary')+'</div>':''):
      '<p class="fun-done">🎉 ¡No tienes errores pendientes en '+esc(dungeon.scopeLabel||'estos grados')+'! Elige otros grados o vuelve cuando falles algún ejercicio.</p>'+
      '<div class="row">'+button('dungeon-setup','Elegir otros grados','ghost')+'</div>';
    return heading('Mazmorra de errores','Cada error que vences te hace bajar un piso. Pisos superados: '+dungeon.floor,'🗝️')+
      '<div class="fun-hud"><span class="fun-scope">📚 '+esc(dungeon.scopeLabel||'')+'</span></div>'+
      '<div class="fun-dungeon"><ol class="fun-tower" aria-hidden="true">'+floors+'</ol><section class="panel fun-panel"><div class="panel-body">'+body+'</div></section></div>';
  }

  // Graph challenge -----------------------------------------------------------
  let graphKinds=['line','parabola','abs'];
  const graphKindNames={line:'Rectas (y = mx + b)',parabola:'Parábolas (y = a(x − h)² + k)',abs:'Valor absoluto (y = a|x − h| + k)'};
  function graphLevel(level){
    const rng=(()=>{let seed=level*9301+49297;return()=>((seed=(seed*9301+49297)%233280)/233280);})();
    const pick=list=>list[Math.floor(rng()*list.length)];
    const kind=graphKinds[level%graphKinds.length];
    if(kind==='line'){
      const m=pick([-3,-2,-1,1,2,3,.5,-.5]),b=pick([-4,-3,-2,-1,0,1,2,3,4]);
      return {kind,label:'y = m·x + b',params:[['m',-4,4,.5,1],['b',-6,6,1,0]],target:{m,b},xs:[-2,3],f:(p,x)=>p.m*x+p.b};
    }
    if(kind==='parabola'){
      const a=pick([-1,1,2,-2,.5]),h=pick([-3,-2,-1,0,1,2,3]),k=pick([-4,-2,-1,0,1,2,4]);
      return {kind,label:'y = a·(x − h)² + k',params:[['a',-3,3,.5,1],['h',-5,5,1,0],['k',-6,6,1,0]],target:{a,h,k},xs:[h-2,h,h+1],f:(p,x)=>p.a*(x-p.h)**2+p.k};
    }
    const a=pick([1,-1,2,.5]),h=pick([-2,-1,0,1,2]),k=pick([-3,-1,0,2,3]);
    return {kind,label:'y = a·|x − h| + k',params:[['a',-3,3,.5,1],['h',-5,5,1,0],['k',-6,6,1,0]],target:{a,h,k},xs:[h-2,h,h+2],f:(p,x)=>p.a*Math.abs(x-p.h)+p.k};
  }
  function graphSvg(){
    const spec=game.graph.spec,values=game.graph.values;
    const size=320,unit=size/16,X=x=>size/2+x*unit,Y=y=>size/2-y*unit;
    let grid='';
    for(let i=-8;i<=8;i++)grid+='<line x1="'+X(i)+'" y1="0" x2="'+X(i)+'" y2="'+size+'" class="g"/><line x1="0" y1="'+Y(i)+'" x2="'+size+'" y2="'+Y(i)+'" class="g"/>';
    const points=[];
    for(let x=-8;x<=8;x+=.1){const y=spec.f(values,x);if(Math.abs(y)<20)points.push(X(x).toFixed(1)+','+Y(y).toFixed(1));}
    const targets=spec.xs.map(x=>{const y=spec.f(spec.target,x);const hit=Math.abs(spec.f(values,x)-y)<.26;
      return {x,y,hit};});
    game.graph.solved=targets.every(t=>t.hit);
    return '<svg class="fun-graph" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="Plano cartesiano con la curva y los puntos objetivo">'+grid+
      '<line x1="0" y1="'+Y(0)+'" x2="'+size+'" y2="'+Y(0)+'" class="axis"/><line x1="'+X(0)+'" y1="0" x2="'+X(0)+'" y2="'+size+'" class="axis"/>'+
      '<polyline points="'+points.join(' ')+'" class="curve"/>'+
      targets.map(t=>'<circle cx="'+X(t.x)+'" cy="'+Y(t.y)+'" r="8" class="target'+(t.hit?' hit':'')+'"><title>('+t.x+', '+t.y+')</title></circle>').join('')+'</svg>';
  }
  function graphView(){
    if(!game?.graphReady)return heading('Reto gráfico','Mueve los parámetros hasta que la curva pase por todos los círculos.','📈')+
      '<section class="panel fun-panel"><div class="panel-body"><form class="form survival-setup" data-fun-form="graph-setup">'+
      '<fieldset class="survival-mode"><legend>¿Con qué curvas quieres practicar?</legend>'+Object.entries(graphKindNames).map(([kind,name])=>
        '<label class="check-label"><input type="checkbox" name="k'+kind+'"'+(graphKinds.includes(kind)?' checked':'')+'> '+name+'</label>').join('')+
      '</fieldset><p class="muted">Las rectas son de 2.º de secundaria; las parábolas y el valor absoluto, de 4.º y 5.º.</p>'+
      '<button class="btn primary">Empezar</button></form></div></section>';
    const level=fun().graphLevel;
    if(!game?.graph||game.graph.level!==level){
      const spec=graphLevel(level);
      game={...game,graph:{level,spec,values:Object.fromEntries(spec.params.map(([name,,,,start])=>[name,start]))}};
    }
    const {spec,values}=game.graph;
    const sliders=spec.params.map(([name,min,max,step])=>'<label class="fun-slider">'+name+' = <output data-fun-out="'+name+'">'+values[name]+'</output>'+
      '<input type="range" data-fun-slider="'+name+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+values[name]+'"></label>').join('');
    const svg=graphSvg();
    return heading('Reto gráfico · nivel '+level,'Haz que la curva '+spec.label+' pase por todos los círculos.','📈')+
      '<div class="row">'+button('graph-setup','Cambiar tipo de curva','small ghost')+'</div>'+
      '<div class="fun-graph-wrap"><div class="fun-graph-box">'+svg+'</div><section class="panel fun-panel"><div class="panel-body">'+
      '<p class="fun-formula">'+esc(spec.label)+'</p>'+sliders+
      '<div class="fun-graph-status">'+(game.graph.solved?'<p class="fun-done">🎯 ¡La curva pasa por todos los puntos!</p>'+button('graph-win','Siguiente nivel →','primary'):
        '<p class="muted">Los círculos se vuelven verdes cuando la curva pasa por ellos.</p>')+'</div></div></section></div>';
  }
  function updateGraph(name,value){
    if(!game?.graph)return;
    game.graph.values[name]=Number(value);
    const box=document.querySelector('.fun-graph-box');
    if(box)box.innerHTML=graphSvg();
    const out=document.querySelector('[data-fun-out="'+name+'"]');if(out)out.textContent=value;
    const status=document.querySelector('.fun-graph-status');
    if(status){
      const was=status.dataset.solved==='1';
      status.dataset.solved=game.graph.solved?'1':'0';
      status.innerHTML=game.graph.solved?'<p class="fun-done">🎯 ¡La curva pasa por todos los puntos!</p>'+button('graph-win','Siguiente nivel →','primary'):
        '<p class="muted">Los círculos se vuelven verdes cuando la curva pasa por ellos.</p>';
      if(game.graph.solved&&!was)abelFunAudio.play('correct');
    }
  }

  // Two-player duel ----------------------------------------------------------
  function duelTopics(){
    return state().topics.filter(item=>!item.missing.length&&(item.level<3||item.mastered));
  }
  function duelView(){
    const duel=game?.duel;
    if(!duel||duel.setup){
      const topics=duelTopics();
      return heading('Duelo de 2 jugadores','Se turnan para responder. Cada acierto quita un corazón al rival.','⚔️')+
        '<section class="panel fun-panel"><div class="panel-body"><form class="form" data-fun-form="duel-setup"><div class="fields">'+
        '<label>Jugador 1<input name="a" maxlength="20" value="Jugador 1" required></label><label>Jugador 2<input name="b" maxlength="20" value="Jugador 2" required></label>'+
        '<label class="wide">Tema<select name="topic">'+topics.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.name)+' · '+esc(state().levels[item.level-1].title)+'</option>').join('')+'</select></label>'+
        '<label>Corazones<select name="hearts"><option>3</option><option selected>5</option><option>7</option></select></label></div>'+
        '<button class="btn primary">¡A pelear!</button></form></div></section>';
    }
    const [a,b]=duel.players;
    const fighter=(player,index)=>'<div class="fun-duelist'+(duel.turn===index&&!duel.winner?' active':'')+(player.hit?' hit':'')+'"><img src="arena/knight.webp" alt="" class="'+(index?'flip':'')+'">'+
      '<strong>'+esc(player.name)+'</strong>'+hearts(player.hearts,duel.max)+'</div>';
    if(duel.winner!==undefined){
      return heading('¡'+esc(duel.players[duel.winner].name)+' gana el duelo!','Buen combate. ¿Revancha?','🏆')+
        '<div class="fun-duel-arena">'+fighter(a,0)+'<span class="fun-vs">VS</span>'+fighter(b,1)+'</div>'+
        '<div class="row">'+button('duel-again','Revancha','primary')+button('duel-setup','Cambiar jugadores','ghost')+'</div>';
    }
    return '<div class="fun-duel-arena">'+fighter(a,0)+'<span class="fun-vs">VS</span>'+fighter(b,1)+'</div>'+
      '<p class="fun-turn">Turno de <b>'+esc(duel.players[duel.turn].name)+'</b></p>'+(duel.feedback?'':timerMarkup())+
      '<section class="panel fun-panel"><div class="panel-body">'+exerciseBlock(duel.question,'duel',duel.feedback)+
      (duel.feedback?button('duel-next','Turno de '+esc(duel.players[1-duel.turn].name)+' →','primary'):'')+'</div></section>';
  }

  // Trophies, chests, skills, avatar -----------------------------------------
  function trophiesPage(){
    const body={logros:achievementsTab,cofres:chestsTab,habilidades:skillsTab,avatar:avatarTab}[trophyTab]();
    return abelStudentLounge.trophies(fun(),guide(),trophyTab,body);
  }
  function achievementsTab(){
    const summary=fun(),counters=summary.counters;
    const done=Object.keys(summary.achievements).length,total=guide().achievements.length;
    return '<p class="muted">'+done+' de '+total+' logros conseguidos</p><div class="fun-achievements">'+guide().achievements.map(item=>{
      const got=summary.achievements[item.id];
      const value=Math.min(item.goal,counters[item.counter]||0);
      return '<article class="fun-achievement'+(got?' got':'')+'"><span class="fun-medal" aria-hidden="true">'+(got?'🏆':'🔒')+'</span><div><strong>'+esc(item.name)+'</strong><p>'+
        esc(item.description)+'</p>'+(got?'<small>Conseguido el '+esc(got)+'</small>':bar(value,item.goal,item.name)+'<small>'+value+' / '+item.goal+'</small>')+
        (item.unlock?'<small class="fun-unlock">🎁 '+esc(unlockName(item.unlock))+'</small>':'')+'</div></article>';
    }).join('')+'</div>';
  }
  const unlockName=unlock=>{const [kind,id]=unlock.split(':');return (kind==='theme'?'Tema ':'Accesorio ')+(kind==='theme'?guide().themes:guide().hats)[id];};
  function chestsTab(){return abelStudentLounge.chests(fun(),chestReveal,state().adventureGuide.resources);}
  function skillsTab(){
    const summary=fun();
    const skills=Object.entries(guide().skills).map(([id,skill])=>{
      const level=summary.skills[id]||0;
      return '<article class="fun-skill'+(level?' learned':'')+'"><div class="fun-skill-dots" aria-label="Nivel '+level+' de '+skill.max+'">'+
        Array.from({length:skill.max},(_,i)=>'<i class="'+(i<level?'on':'')+'"></i>').join('')+'</div><strong>'+esc(skill.name)+'</strong><p>'+esc(skill.description)+'</p>'+
        button('skill:'+id,level>=skill.max?'Al máximo':'Aprender (1 punto)','small'+(summary.skillPoints&&level<skill.max?' primary':''),
          (level>=skill.max||!summary.skillPoints)?' disabled':'')+'</article>';
    }).join('');
    return '<div class="fun-skill-head"><p>Puntos disponibles: <b>'+summary.skillPoints+'</b> · ganas 1 por cada nivel de jugador.</p>'+
      button('reset-skills','Reiniciar árbol (15 monedas)','small ghost')+'</div><div class="fun-skills">'+skills+'</div>';
  }
  function avatarTab(){
    const summary=fun(),avatar=summary.avatar;
    const themes=Object.entries(guide().themes).map(([id,name])=>{
      const open=summary.unlocked.theme.includes(id);
      return '<button type="button" class="fun-swatch fun-swatch-'+id+'" data-fun="theme:'+id+'" aria-pressed="'+(avatar.theme===id)+'"'+(open?'':' disabled')+'>'+
        '<i aria-hidden="true"></i>'+esc(name)+(open?'':' 🔒')+'</button>';
    }).join('');
    const titles=Object.keys(summary.achievements).map(id=>guide().achievements.find(item=>item.id===id)).filter(Boolean);
    return '<div class="fun-avatar-grid"><section class="panel fun-panel"><header><h2>Tu caballero</h2></header><div class="panel-body">'+
      '<div class="fun-knight-preview"><img src="arena/knight.webp" alt="Vista previa del caballero"></div>'+
      '<label class="fun-slider">Color de la armadura<input type="range" min="-180" max="180" step="10" value="'+(avatar.hue||0)+'" data-fun-hue></label>'+
      '<label>Título<select data-fun-title><option value="">Sin título</option>'+titles.map(item=>'<option value="'+item.id+'"'+(avatar.title===item.id?' selected':'')+'>'+esc(item.name)+'</option>').join('')+
      '</select></label><small class="muted">Gana logros para desbloquear títulos.</small></div></section>'+
      '<section class="panel fun-panel"><header><h2>Temas de color</h2></header><div class="panel-body"><div class="fun-swatches">'+themes+'</div>'+
      '<label class="check-label fun-check"><input type="checkbox" data-fun-dark'+(avatar.dark?' checked':'')+'> Modo oscuro</label>'+
      '<small class="muted">Desbloquea más temas con logros y cofres.</small></div></section></div>';
  }

  // Pet ------------------------------------------------------------------------
  function petPage(){return abelStudentLounge.pet(fun(),guide(),petSvg,state().village);}

  // Cards ----------------------------------------------------------------------
  function cardsPage(){
    const tabs=state().levels.map(level=>'<button type="button" role="tab" aria-selected="'+(cardLevel===level.id)+'" data-fun="cards-level:'+level.id+'">'+
      esc(level.id===3?'Universidad · Formulario':level.title)+'</button>').join('');
    if(cardLevel===3)return abelFormulaLibrary.render(tabs);
    return abelStudentLounge.cards(data.cards,cardLevel,tabs);
  }

  // Classroom ------------------------------------------------------------------
  // ---------------------------------------------------------------- loading & actions
  async function open(page){
    if(page==='cards'){
      if(ctx.getViewContext?.().contentLevel===3)cardLevel=3;
      data.cards=await ctx.call('fun',{action:'cards'});if(cardLevel===3)await abelFormulaLibrary.open();
    }
    if(page==='games'){gamesView='hub';stopTimer();game=null;}
    if(page==='trophies')chestReveal=null;
  }
  async function refreshSummary(summary){if(summary){state().fun=summary;topbar();applyTheme();}}
  async function openGame(kind){
    stopTimer();game={};gamesView=kind;
    if(kind==='daily')game.daily=await ctx.call('fun',{action:'daily'});
    if(kind==='dungeon')game.dungeon=null;
    if(kind==='duel')game.duel={setup:true};
    window.scrollTo(0,0);
  }
  let survivalScope='mine';
  async function survivalStep(step){
    const result=await ctx.call('fun',{action:'survival',step,scope:survivalScope});
    game.survival={...result,feedback:null};
    if(result.over){stopTimer();if(result.record)confetti();abelFunAudio.play(result.record?'win':'lose');return;}
    survivalTimer();
  }
  function survivalTimer(){
    startTimer(30,()=>ctx.run(async()=>{
      abelFunAudio.play('wrong');
      const next=await ctx.call('fun',{action:'survival',step:'timeout'});
      game.survival={...next,feedback:null};
      if(next.over){abelFunAudio.play('lose');stopTimer();return;}
      ctx.say('⏰ ¡Se acabó el tiempo! Perdiste una vida.');
      survivalTimer();
    }));
  }
  async function duelQuestion(){
    const duel=game.duel;
    duel.question=await ctx.call('fun',{action:'duelQuestion',topic:duel.topic});
    duel.feedback=null;duel.players.forEach(player=>{player.hit=false;});
    startTimer(25,()=>ctx.run(()=>answer('duel','')));
  }
  async function answer(form,value){
    if(form==='daily'){
      const grade=await ctx.call('grade',{id:game.daily.exercise.id,answer:value});
      if(grade.invalid){ctx.say(grade.feedback.message,true);return;}
      abelFunAudio.play(grade.correct?'correct':'wrong');
      game.daily=await ctx.call('fun',{action:'daily'});
      if(grade.correct)coins(6);
      await ctx.refresh();
      return;
    }
    if(form==='survival'){
      const run=game.survival;
      const grade=await ctx.call('grade',{id:run.exercise.id,answer:value});
      if(grade.invalid){ctx.say(grade.feedback.message,true);return;}
      stopTimer();
      abelFunAudio.play(grade.correct?'correct':'wrong');
      if(grade.correct){await survivalStep('next');ctx.say('✅ ¡Correcto! +1 punto');return;}
      run.lives-=1;run.feedback=gradeView(grade);
      if(run.lives<=0)await survivalStep('end');
      return;
    }
    if(form==='dungeon'){
      const dungeon=game.dungeon;
      const grade=await ctx.call('grade',{id:dungeon.exercise.id,answer:value});
      if(grade.invalid){ctx.say(grade.feedback.message,true);return;}
      abelFunAudio.play(grade.correct?'correct':'wrong');
      dungeon.feedback=gradeView(grade);
      if(grade.correct)dungeon.floor+=1;
      return;
    }
    if(form==='duel'){
      const duel=game.duel;
      stopTimer();
      const result=value===''?{correct:false,answer:'(tiempo agotado)',message:'Se acabó el tiempo.'}:await ctx.call('fun',{action:'duelCheck',id:duel.question.id,answer:value});
      if(result.invalid){ctx.say(result.message,true);startTimer(Math.max(5,Math.ceil((game.deadline-Date.now())/1000)),()=>ctx.run(()=>answer('duel','')));return;}
      duel.feedback=result;
      if(result.correct){
        const foe=duel.players[1-duel.turn];foe.hearts-=1;foe.hit=true;abelFunAudio.play('hit');
        if(foe.hearts<=0){duel.winner=duel.turn;abelFunAudio.play('win');confetti();await refreshSummary(await ctx.call('fun',{action:'duelEnd'}));}
      }else abelFunAudio.play('wrong');
      return;
    }
  }

  async function action(name){
    const [kind,arg,extra]=name.split(':');
    switch(kind){
      case 'page':trophyTab=extra||trophyTab;await ctx.openPage(arg);return;
      case 'toggle-sound':abelFunAudio.setMuted(!abelFunAudio.muted);if(!abelFunAudio.muted)abelFunAudio.play('correct');topbar();return;
      case 'toggle-music':abelFunAudio.setMusic(!abelFunAudio.musicOn);topbar();return;
      case 'toggle-dark':await refreshSummary(await ctx.call('fun',{action:'avatar',dark:!fun().avatar.dark}));return;
      case 'board':openBoard();return;
      case 'hub':stopTimer();game=null;gamesView='hub';return;
      case 'game':await openGame(arg);return;
      case 'pick':await answer(arg,name.split(':').slice(2).join(':'));return;
      case 'survival-start':game={};await survivalStep('start');return;
      case 'survival-setup':stopTimer();game={};return;
      case 'survival-next':await survivalStep('next');return;
      case 'survival-end':await survivalStep('end');return;
      case 'dungeon-next':game.dungeon=await ctx.call('fun',{action:'dungeon',scope:dungeonScope});return;
      case 'dungeon-setup':game.dungeon=null;return;
      case 'graph-win':abelFunAudio.play('levelup');confetti(90);await refreshSummary(await ctx.call('fun',{action:'graphWin'}));game.graph=null;return;
      case 'graph-setup':game={graphReady:false};return;
      case 'duel-next':game.duel.turn=1-game.duel.turn;await duelQuestion();return;
      case 'duel-again':{const duel=game.duel;duel.players.forEach(player=>{player.hearts=duel.max;player.hit=false;});delete duel.winner;duel.turn=0;await duelQuestion();return;}
      case 'duel-setup':stopTimer();game.duel={setup:true};return;
      case 'tab':trophyTab=arg;chestReveal=null;return;
      case 'chest':{
        abelFunAudio.play('chest');
        chestReveal=await ctx.call('fun',{action:'openChest',index:Number(arg)});
        await refreshSummary(chestReveal.summary);
        if(chestReveal.rarity==='épico'||chestReveal.prizes.length)confetti();
        coins(5);
        await ctx.refresh();
        return;
      }
      case 'chest-ok':chestReveal=null;return;
      case 'skill':await refreshSummary(await ctx.call('fun',{action:'skill',skill:arg}));abelFunAudio.play('levelup');return;
      case 'reset-skills':await refreshSummary(await ctx.call('fun',{action:'resetSkills'}));await ctx.refresh();ctx.say('Árbol reiniciado. Puedes repartir tus puntos de nuevo.');return;
      case 'theme':await refreshSummary(await ctx.call('fun',{action:'avatar',theme:arg}));return;
      case 'pet-switch':await refreshSummary(await ctx.call('fun',{action:'switchPet',species:arg}));abelFunAudio.play('pop');return;
      case 'pet-adopt':
        await refreshSummary(await ctx.call('fun',{action:'adopt',species:arg}));
        abelFunAudio.play('achievement');confetti(80);window.scrollTo(0,0);return;
      case 'feed':await refreshSummary(await ctx.call('fun',{action:'feed'}));abelFunAudio.play('pop');await ctx.refresh();return;
      case 'hat':await refreshSummary(await ctx.call('fun',{action:'dress',hat:arg}));abelFunAudio.play('pop');return;
      case 'cards-level':cardLevel=Number(arg);if(cardLevel===3)await abelFormulaLibrary.open();return;
      case 'formulas':cardLevel=3;await ctx.openPage('cards');if(arg&&arg!=='all')await abelFormulaLibrary.open(arg);return;
        data.profiles=await ctx.call('fun',{action:'deleteProfile',id:Number(arg)});ctx.say('Alumno borrado.');return;
      case 'eli10':explain={topic:arg,...await ctx.call('explainSimple',{topic:arg})};return;
      case 'photo':{
        const result=await ctx.call('photoProblem');
        if(result.canceled)return;
        ctx.say('Leí este ejercicio en la foto: '+result.problem+'. Revisa que esté bien escrito.');
        await ctx.solve(result.problem);return;
      }
    }
  }
  async function submit(form,fields){
    switch(form){
      case 'daily':case 'survival':case 'dungeon':case 'duel':await answer(form,fields.answer);return;
      case 'survival-setup':{
        const scope=pickedScope(fields);
        if(!scope)return;
        survivalScope=scope;game={};await survivalStep('start');return;
      }
      case 'dungeon-setup':{
        const scope=pickedScope(fields);
        if(!scope)return;
        dungeonScope=scope;game={dungeon:await ctx.call('fun',{action:'dungeon',scope})};return;
      }
      case 'graph-setup':{
        const kinds=['line','parabola','abs'].filter(kind=>fields['k'+kind]);
        if(!kinds.length){ctx.say('Marca al menos un tipo de curva.',true);return;}
        graphKinds=kinds;game={graph:null,graphReady:true};return;
      }
      case 'duel-setup':{
        const max=Number(fields.hearts)||5;
        game.duel={players:[{name:fields.a||'Jugador 1',hearts:max},{name:fields.b||'Jugador 2',hearts:max}],max,turn:0,topic:fields.topic};
        await duelQuestion();return;
      }
      case 'adopt':await refreshSummary(await ctx.call('fun',{action:'adopt',species:fields.species,name:fields.name}));abelFunAudio.play('achievement');confetti(80);return;
    }
  }

  // ---------------------------------------------------------------- whiteboard
  function createBoard(){
    board=document.createElement('dialog');
    board.className='fun-board';
    board.setAttribute('aria-label','Pizarra');
    board.innerHTML='<div class="fun-board-tools"><strong>Pizarra</strong>'+
      ['#1d2633','#d33f49','#2f7de1','#2a9d5c','#e8a13a'].map((color,i)=>'<button type="button" class="fun-pen'+(i?'':' active')+'" data-color="'+color+'" style="--pen:'+color+'" aria-label="Color"></button>').join('')+
      '<button type="button" class="btn small" data-board="eraser">Borrador</button><button type="button" class="btn small" data-board="clear">Limpiar</button>'+
      '<label class="fun-size">Grosor<input type="range" min="2" max="18" value="4" data-board-size></label>'+
      '<button type="button" class="btn small" data-board="close">Cerrar</button></div><div class="fun-board-paper"><canvas></canvas></div>';
    document.body.append(board);
    const canvas=board.querySelector('canvas'),g=canvas.getContext('2d');
    let color='#1d2633',size=4,eraser=false,drawing=false,last=null,fitted=false;
    const fit=()=>{
      const rect=board.querySelector('.fun-board-paper').getBoundingClientRect();
      const width=Math.round(rect.width),height=Math.round(rect.height);
      // Keep the original bitmap when the window or scan panel changes size.
      if(!width||!height)return;
      if(!fitted){canvas.width=width;canvas.height=height;fitted=true;}
      const ratio=Math.min(width/canvas.width,height/canvas.height);
      canvas.style.width=(canvas.width*ratio)+'px';canvas.style.height=(canvas.height*ratio)+'px';
    };
    const scale=()=>{const rect=canvas.getBoundingClientRect();return Math.min(rect.width/canvas.width,rect.height/canvas.height);};
    const point=event=>{const rect=canvas.getBoundingClientRect(),ratio=scale();return [(event.clientX-rect.left)/ratio,(event.clientY-rect.top)/ratio];};
    const brush=event=>{
      g.globalCompositeOperation=eraser?'destination-out':'source-over';g.strokeStyle=color;g.fillStyle=color;
      g.lineWidth=(eraser?size*4:size*(event.pressure&&event.pointerType==='pen'?event.pressure*2:1))/scale();g.lineCap='round';g.lineJoin='round';
    };
    canvas.addEventListener('pointerdown',event=>{
      last=point(event);if(last[0]<0||last[1]<0||last[0]>=canvas.width||last[1]>=canvas.height)return;
      drawing=true;canvas.setPointerCapture(event.pointerId);brush(event);
      g.beginPath();g.arc(...last,g.lineWidth/2,0,Math.PI*2);g.fill();
    });
    canvas.addEventListener('pointermove',event=>{
      if(!drawing)return;
      const next=point(event);
      brush(event);
      g.beginPath();g.moveTo(...last);g.lineTo(...next);g.stroke();last=next;
    });
    ['pointerup','pointercancel','pointerleave'].forEach(type=>canvas.addEventListener(type,()=>{drawing=false;}));
    board.addEventListener('click',event=>{
      const pen=event.target.closest('[data-color]');
      if(pen){color=pen.dataset.color;eraser=false;board.querySelectorAll('.fun-pen,[data-board=eraser]').forEach(node=>node.classList.remove('active'));pen.classList.add('active');}
      const command=event.target.closest('[data-board]')?.dataset.board;
      if(command==='eraser'){eraser=true;board.querySelectorAll('.fun-pen').forEach(node=>node.classList.remove('active'));event.target.closest('button').classList.add('active');}
      if(command==='clear')g.clearRect(0,0,canvas.width,canvas.height);
      if(command==='close')board.close();
    });
    board.querySelector('[data-board-size]').addEventListener('input',event=>{size=Number(event.target.value);});
    board.addEventListener('toggle',()=>{if(board.open)requestAnimationFrame(fit);});
    addEventListener('resize',()=>{if(board.open)fit();});
    new ResizeObserver(()=>{if(board.open)fit();}).observe(board.querySelector('.fun-board-paper'));
    board.fit=fit;
  }
  function openBoard(){
    if(!board.open){if(typeof abelAnswerCapture!=='undefined')abelAnswerCapture.prepareBoard(board);board.show();requestAnimationFrame(board.fit);}
    else board.close();
  }

  // ---------------------------------------------------------------- init
  function init(context){
    ctx=context;
    abelFormulaLibrary.init(context);
    toastBox=document.createElement('div');toastBox.className='fun-toasts';toastBox.setAttribute('aria-live','polite');document.body.append(toastBox);
    confettiCanvas=document.createElement('canvas');confettiCanvas.className='fun-confetti';confettiCanvas.hidden=true;confettiCanvas.setAttribute('aria-hidden','true');document.body.append(confettiCanvas);
    createBoard();
    // The profile card at the bottom of the sidebar opens the student's own settings (name and backups).
    const profile=document.querySelector('.sidebar .profile');
    if(profile){
      profile.setAttribute('role','button');profile.setAttribute('tabindex','0');profile.title='Tu perfil: nombre y copias de seguridad';
      const openProfile=()=>ctx.run(()=>ctx.openPage('settings'));
      profile.addEventListener('click',openProfile);
      profile.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openProfile();}});
    }
    // Survival: quick buttons check whole levels without re-rendering the page.
    document.addEventListener('click',event=>{
      const pick=event.target.closest('[data-survival-pick]');
      if(!pick)return;
      const form=pick.closest('form');
      const level=pick.dataset.survivalPick;
      form.querySelectorAll('.survival-grade input').forEach(box=>{
        if(level==='none')box.checked=false;
        else if(box.name.startsWith('g'+level+'-'))box.checked=true;
      });
      form.querySelector('[name=mode][value=grades]').checked=level!=='none';
    });
    document.addEventListener('change',event=>{
      if(event.target.matches('.survival-grade input')&&event.target.checked)
        event.target.form.querySelector('[name=mode][value=grades]').checked=true;
    });
    if(typeof abelAnswerCapture!=='undefined')abelAnswerCapture.init(ctx.call);
    probeArt();
    document.addEventListener('input',event=>{
      const slider=event.target.closest('[data-fun-slider]');
      if(slider)return updateGraph(slider.dataset.funSlider,slider.value);
      if(event.target.matches('[data-fun-hue]')){
        document.documentElement.style.setProperty('--knight-hue',event.target.value+'deg');
        clearTimeout(event.target.saveTimer);
        event.target.saveTimer=setTimeout(()=>ctx.call('fun',{action:'avatar',hue:Number(event.target.value)}).then(refreshSummary).catch(()=>{}),300);
      }
    });
    document.addEventListener('change',event=>{
      if(event.target.matches('[data-fun-title]'))ctx.run(async()=>refreshSummary(await ctx.call('fun',{action:'avatar',title:event.target.value})));
      if(event.target.matches('[data-fun-dark]'))ctx.run(async()=>refreshSummary(await ctx.call('fun',{action:'avatar',dark:event.target.checked})));
    });
    document.addEventListener('click',event=>{
      if(document.body.dataset.reference!=='formulas'&&event.target.closest('button:not([disabled])'))abelFunAudio.play('click');
    },true);
  }
  function ready(){topbar();applyTheme();welcome();}

  // First visit: name, level and grade, and a quick look at what the app offers.
  function welcome(){
    const data=state();
    if(!data||data.fun?.welcomed||data.attempts||data.demo||document.querySelector('.fun-welcome'))return;
    const box=document.createElement('div');
    box.className='fun-welcome';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','welcome-title');
    const grades=(level,count)=>Array.from({length:count},(_,index)=>'<label class="survival-grade"><input type="radio" name="grade" value="'+level+'-'+(index+1)+'"'+
      (level===1&&index===0?' checked':'')+'><span>'+(index+1)+'.º</span></label>').join('');
    box.innerHTML='<form class="fun-welcome-card" novalidate>'+
      '<section data-step="1"><span class="fun-welcome-emoji" aria-hidden="true">👋</span><h2 id="welcome-title">¡Hola! Bienvenido a MathPath</h2>'+
        '<p>Aquí aprendes matemáticas jugando: misiones, jefes, mascotas y retos.</p>'+
        '<label>¿Cómo te llamas?<input name="name" maxlength="40" autocomplete="off" placeholder="Escribe tu nombre"></label>'+
        '<div class="row"><button type="button" class="btn primary" data-welcome="2">Siguiente →</button></div></section>'+
      '<section data-step="2" hidden><span class="fun-welcome-emoji" aria-hidden="true">🎒</span><h2>¿En qué grado estás?</h2>'+
        '<p>Te llevamos directo a tu mapa. Siempre puedes cambiarlo en <b>Niveles</b>.</p>'+
        '<fieldset class="survival-level"><legend>Primaria</legend><div class="survival-grades">'+grades(1,6)+'</div></fieldset>'+
        '<fieldset class="survival-level"><legend>Secundaria</legend><div class="survival-grades">'+grades(2,5)+'</div></fieldset>'+
        '<div class="row"><button type="button" class="btn ghost" data-welcome="1">← Atrás</button><button type="button" class="btn primary" data-welcome="3">Siguiente →</button></div></section>'+
      '<section data-step="3" hidden><span class="fun-welcome-emoji" aria-hidden="true">🗺️</span><h2>Así funciona</h2><ul class="fun-welcome-tour">'+
        '<li><b>▤ Niveles</b>Tu mapa: cada misión es un duelo y cada grado termina con un jefe.</li>'+
        '<li><b>◇ Profesor</b>Te explica cada tema con ejemplos paso a paso y videos.</li>'+
        '<li><b>ϟ Retos</b>Reto del día, Supervivencia, Mazmorra y más.</li>'+
        '<li><b>❦ Mascota</b>Te acompaña y crece contigo.</li>'+
        '<li><b>🎤 Dictar</b>Si no quieres escribir, di tu respuesta en voz alta.</li></ul>'+
        '<div class="row"><button type="button" class="btn ghost" data-welcome="2">← Atrás</button><button type="submit" class="btn primary">¡Empezar la aventura!</button></div></section>'+
      '<button type="button" class="fun-welcome-skip" data-welcome="skip">Saltar</button></form>';
    document.body.append(box);
    const form=box.querySelector('form');
    const show=step=>{form.querySelectorAll('[data-step]').forEach(section=>{section.hidden=section.dataset.step!==String(step);});
      form.querySelector('[data-step="'+step+'"] input,[data-step="'+step+'"] button')?.focus();};
    const finish=async(skip)=>{
      const name=form.elements.name.value.trim();
      const [stage,grade]=(form.querySelector('[name=grade]:checked')?.value||'1-1').split('-').map(Number);
      box.remove();
      await ctx.run(async()=>{
        if(!skip&&name){const profile=state().profile;await ctx.call('settings',{...profile,name});}
        await refreshSummary(await ctx.call('fun',skip?{action:'welcome'}:{action:'welcome',level:stage,unit:grade}));
        await ctx.refresh();
        if(!skip)ctx.openGrade(stage,grade);
      });
      if(!skip){abelFunAudio.play('achievement');confetti(90);}
    };
    box.addEventListener('click',event=>{
      const target=event.target.closest('[data-welcome]');
      if(!target)return;
      if(target.dataset.welcome==='skip')return void finish(true);
      show(target.dataset.welcome);
    });
    form.addEventListener('submit',event=>{event.preventDefault();void finish(false);});
    form.addEventListener('keydown',event=>{
      if(event.key==='Enter'&&event.target.name==='name'){event.preventDefault();show(2);}
    });
    show(1);
  }
  return {init,ready,pages,render,open,action,submit,afterRender,sync,duel,confetti,toast,petSvg,refreshHeader:topbar,getCardLevel:()=>cardLevel,
    leave:()=>{stopTimer();}};
})();
