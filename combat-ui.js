// MathPath · Autor: Abel Josué Colquehuanca Humpiri
'use strict';

const abelCombatUI=(()=>{
  const colors={
    slash:['#fff4a8','#f1ae40','#a95a25'],double:['#e6fcff','#67d5f5','#347fc6'],
    vault:['#e8fff4','#6ee6ba','#29947b'],wave:['#fff0ff','#b899ff','#6953d1'],
    slam:['#ffddaa','#cd925a','#72544e'],rush:['#fff0bd','#f2c463','#bc6b39'],
    flurry:['#fff2da','#ffca88','#c7754d'],pierce:['#f1edff','#a899ed','#63578f'],
    bolt:['#f7e8ff','#c599ff','#8652c5'],frost:['#f1fdff','#93e8ff','#4c96c8'],
    ember:['#fff3a3','#ffb24b','#e65f3b'],drain:['#efffb0','#a4e98c','#4d9a77'],
  };
  const families={
    stone:['golem','oak-boar','obsidian-ram','wind-badger','bell-gargoyle'],
    crystal:['beetle','amethyst-bat','quartz-crab','geode-slug','crystal-mole'],
    ice:['yeti','blizzard-wolf','ice-walrus','polar-hare'],
    fire:['lizard','ash-phoenix','caldera-ape','dawn-dragon'],
    woodland:['mushroom','frog','scarecrow','moss-turtle','miller-fox','thorn-stag','moss-witch',
      'canopy-spider','swamp-caiman','miller-puppet','oak-hornet'],
    sand:['sphinx','solar-scorpion','temple-cobra','dunes-vulture'],
    metal:['armor','copper-owl','crest-griffin'],
  };
  const familyColors={
    stone:['#ffedbd','#c7a077','#795a4f'],crystal:colors.bolt,ice:colors.frost,fire:colors.ember,
    woodland:colors.drain,sand:['#fff5b1','#eac36c','#a47439'],
    metal:['#fff9d5','#d0c6ec','#7989b4'],
  };
  const weaponColors={
    steel:['#fffdf0','#c6d9e7','#6a849c'],rune:colors.wave,twin:['#fff1b9','#e3ae61','#a56b3d'],
    frost:colors.frost,fire:colors.ember,storm:['#efffff','#79f0fa','#348fc2'],stone:colors.slam,bow:colors.drain,
  };
  const rangedKinds=new Set(['wave','bolt','frost','ember','drain','arrow','volley','arrow-rain','lightning','blizzard','firestorm']);
  let cleanup=()=>{};
  const hearts=value=>value+' '+(value===1?'corazón':'corazones');
  const shortNames={slash:'Golpe',double:'Doble',vault:'Salto',wave:'Magia',
    slam:'Roca',rush:'Salto',flurry:'Ráfaga',pierce:'Punta',bolt:'Rayo',frost:'Hielo',ember:'Fuego',drain:'Magia'};
  const heartIcons=value=>'<span class="combat-heart-icons" aria-hidden="true"><span>−</span>'+
    (value>4?'<i>♥</i><b>×'+value+'</b>':Array.from({length:value},()=>'<i>♥</i>').join(''))+'</span>';
  const boltIcon='<i class="combat-bolt"></i>';

  function preview(kind,rival,side='hero',weapon='wood',item='starter-sword',equipment={}){
    return '<span class="combat-preview preview-'+kind+' preview-side-'+side+'" data-weapon="'+weapon+'" aria-hidden="true">'+
      '<span class="preview-knight">'+abelHeroRig.render({pose:'attack',weapon:equipment.sword||item,
        armor:equipment.armor||null,shield:equipment.shield||null,label:'Tu caballero'})+'</span>'+
      '<img class="preview-rival" src="arena/'+rival+'-attack.webp" alt="">'+
      '<i class="preview-swing"></i><i class="preview-swing swing-two"></i>'+
      '<i class="preview-orb"></i>'+
      '<img class="preview-shield" src="recursos/aldea/quick-shield.webp" alt=""></span>';
  }

  function weaponPreview(style,guide,equipment={}){
    const profile=guide.weapons[style];
    return preview(profile.moves.slash.animation,'golem','hero',style,profile.item,{...equipment,sword:profile.item});
  }

  function attackIcon(id,form,style,profile,equipment){
    const jump=id==='vault';
    return '<span class="combat-preview combat-attack-icon move-'+id+' preview-'+form.animation+' preview-side-hero" data-weapon="'+style+'" aria-hidden="true">'+
      '<i class="attack-icon-shadow"></i><span class="preview-knight">'+
      abelHeroRig.render({pose:jump||id==='wave'?'ready':'attack',weapon:equipment.sword||profile.item,
        armor:equipment.armor||null,shield:equipment.shield||null,label:'Tu caballero'})+'</span>'+
      (jump?'<svg class="attack-jump-arrow" viewBox="0 0 24 32" fill="none"><path d="M7 27V16Q7 7 17 6M12 2l6 4-5 6"/></svg>':'')+
      '<i class="preview-swing"></i><i class="preview-swing swing-two"></i><i class="preview-orb"></i></span>';
  }

  function heroStatus(guide,battle){
    const charge=Array.from({length:guide.maxEnergy},(_,index)=>
      '<span class="'+(index<battle.energy?'filled':'empty')+'">'+boltIcon+'</span>').join('');
    return '<div class="combat-energy" role="meter" aria-label="Energía" aria-valuemin="0" aria-valuemax="'+
      guide.maxEnergy+'" aria-valuenow="'+battle.energy+'"><span class="sr-only">Energía '+
      battle.energy+' de '+guide.maxEnergy+'</span><span class="combat-charge" aria-hidden="true">'+charge+'</span></div>';
  }

  function heroDefense(battle){
    if(!(battle.heroGuard||battle.shielded||battle.ward))return '';
    const amount=(battle.heroGuard||0)+(battle.ward||0);
    const description=battle.shielded?'Escudo activo':'Protección para bloquear '+hearts(amount)+' de daño.';
    return '<div class="combat-defense" role="img" aria-label="'+description+'">'+
      '<img src="recursos/aldea/quick-shield.webp" alt="">'+
      (amount?'<b aria-hidden="true">'+amount+'</b>':'')+'</div>';
  }

  function comboMeter(battle){
    const info=battle.comboStatus||battle;
    const every=info.comboEvery||3,progress=info.comboProgress||0;
    const activated=Boolean(battle.event==='hit'&&battle.impact?.combo);
    const hits=activated?battle.impact.comboHits:(info.comboHitsNext||Math.min(4,(info.comboStage||0)+2));
    const remaining=activated?every:every-progress;
    const sword='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 16L17 3h4v4L10 19M5 13l7 7M7 17l-4 4m1-1 2 2"/></svg>';
    return '<div class="combat-combo'+(activated?' is-burst':'')+'" role="meter" aria-label="Combo: '+
      (activated?'activado, '+hits+' golpes':progress+' de '+every+' aciertos seguidos. Faltan '+remaining)+'" aria-valuemin="0" aria-valuemax="'+every+'" aria-valuenow="'+(activated?every:progress)+'">'+
      '<span class="combat-combo-label">Combo</span><span class="combat-combo-slots" aria-hidden="true">'+
      Array.from({length:every},(_,i)=>'<i class="'+(activated||i<progress?'charged':'')+'">'+sword+'</i>').join('')+
      '</span><span class="combat-combo-prize" aria-hidden="true">'+sword+'<b>×'+hits+'</b></span>'+
      '<span class="sr-only">'+(activated?'¡Combo!':'Acierta seguido para dar varios golpes. Un error o el tiempo agotado corta el combo.')+'</span></div>';
  }

  function heroMoves(guide,battle,boss,tactic,escape){
    const {energy,heroMove,event}=battle;
    const style=battle.weaponStyle||'wood', profile=guide.weapons[style];
    const attacks=Object.entries(guide.heroAttacks).map(([id,move])=>{
      const cost=move.cost, unavailable=energy<cost;
      const power=1+(battle.heroPower||0)+move.bonus;
      const form=profile.moves[id];
      const benefit=id==='slash'?'+1 energía':id==='vault'?'Protege 1 corazón':
        id==='double'?'Dos golpes seguidos':'Ataque a distancia';
      const requirement=unavailable?'Necesitas '+cost+' de energía':cost?cost+' de energía':'Sin gasto';
      const costIcons='<span class="combat-cost '+(cost?'spends':'gains')+'" aria-hidden="true"><b>'+
        (cost?'−':'+')+'</b>'+Array.from({length:cost||1},()=>boltIcon).join('')+'</span>';
      const description=form.name+'. Hasta '+hearts(power)+' de daño. '+benefit+'. '+requirement;
      return '<button type="button" class="combat-move'+(unavailable?' is-exhausted':'')+'" data-combat-move="'+id+'" aria-pressed="'+(heroMove===id)+
        '"'+(event||tactic||unavailable?' disabled':'')+' title="'+escape(description)+'" aria-label="'+escape(description)+
        '"><span class="combat-selection-mark" aria-hidden="true">✓</span>'+
        attackIcon(id,form,style,profile,battle.equipped||{})+costIcons+
        (unavailable?'<span class="combat-empty-lock" aria-hidden="true"><svg viewBox="0 0 16 18" fill="none"><path d="M4 8V5a4 4 0 0 1 8 0v3"/><rect x="2" y="8" width="12" height="9" rx="2"/></svg></span>':'')+'</button>';
    }).join('');
    return '<section class="combat-controls" aria-label="Elige tu ataque. Se usa al acertar."'+
      ' data-controls-state="'+(tactic?'barrier':event?'resolved':'choose')+'">'+
      comboMeter(battle)+'<div class="combat-moves">'+attacks+'</div>'+
      (tactic?'<span class="combat-barrier-lock" role="img" aria-label="Rompe la barrera del rival para atacar.">🔒</span>':'')+
      '</section>';
  }

  function rivalMoves(rival,threat,escape,equipment={}){
    const techniques=rival.attacks.map(move=>{
      const prepared=threat.id?threat.id===move.id:threat.name===move.name;
      const description=move.name+'. Hasta '+hearts(prepared?threat.damage:move.damage)+' de daño.'+(prepared?' Preparado.':'');
      return '<li'+(prepared?' class="is-prepared" aria-current="step"':'')+' aria-label="'+escape(description)+'">'+
        preview(move.kind,rival.id,'enemy','wood','starter-sword',equipment)+
        '<span><strong>'+shortNames[move.kind]+'</strong>'+heartIcons(prepared?threat.damage:move.damage)+'</span></li>';
    }).join('');
    return '<details class="combat-repertoire combat-forecast"><summary aria-label="'+escape('Ver los cuatro ataques del rival. Preparado '+threat.name+
      '. Hasta '+hearts(threat.damage)+' de daño si fallas o se acaba el tiempo.')+'">'+
      '<span class="combat-warning" aria-hidden="true">!</span>'+preview(threat.kind,rival.id,'enemy','wood','starter-sword',equipment)+heartIcons(threat.damage)+
      '<span class="combat-more" aria-hidden="true">⌄</span></summary>'+
      '<ol aria-label="Ataques de '+escape(rival.name)+'">'+techniques+'</ol>'+
      '</details>';
  }

  function keyframes(kind,side,width,height){
    const aliases={arrow:'bolt',volley:'bolt','arrow-rain':'bolt',lightning:'bolt',blizzard:'frost',
      firestorm:'ember',quake:'slam','blade-storm':'flurry'};
    kind=aliases[kind]||kind;
    const direction=side==='hero'?1:-1;
    const travel=width*.54*direction, lift=Math.min(90,height*.28);
    const frame=(offset,x=0,y=0,rotation=0,scale=1)=>({offset,
      transform:'translate('+x+'px,'+y+'px) rotate('+rotation+'deg) scale('+scale+')'});
    switch(kind){
      case 'double':case 'flurry':
        return [frame(0),frame(.12,-travel*.06,0,-8*direction),
          frame(.32,travel*.95,0,8*direction),frame(.38,travel*.95,0,8*direction),
          frame(.47,travel*.78,0,-12*direction),frame(.58,travel,0,11*direction),
          frame(.65,travel,0,11*direction),frame(.9),frame(1)];
      case 'vault':case 'rush':
        return [frame(0),frame(.12,0,4,-12*direction,.95),
          frame(.3,travel*.5,-lift,-13*direction),frame(.45,travel,-lift*.18,13*direction),
          frame(.53,travel,0,6*direction,1.04),frame(.65,travel*.82,-lift*.2),
          frame(.9),frame(1)];
      case 'slam':
        return [frame(0),frame(.15,0,5,0,.94),frame(.33,travel*.3,-lift*.55,-8*direction,1.06),
          frame(.48,travel*.4,5,7*direction,1.04),frame(.53,travel*.4,5,7*direction,1.04),
          frame(.72,travel*.2),frame(.94),frame(1)];
      case 'wave':case 'bolt':case 'frost':case 'ember':case 'drain':
        return [frame(0),frame(.15,-travel*.05,0,-8*direction),
          frame(.28,travel*.04,-lift*.12,6*direction,1.04),
          frame(.65,travel*.04,-lift*.12,4*direction,1.04),frame(.87),frame(1)];
      case 'pierce':
        return [frame(0),frame(.18,-travel*.06,0,-12*direction,.94),
          frame(.39,travel*1.07,0,10*direction),frame(.46,travel*1.07,0,10*direction),
          frame(.58,travel*.82),frame(.9),frame(1)];
      default:
        return [frame(0),frame(.16,-travel*.06,0,-12*direction),
          frame(.38,travel,0,10*direction),frame(.46,travel,0,10*direction),
          frame(.68,travel*.65,0,-4*direction),frame(.9),frame(1)];
    }
  }

  function drawEffects(canvas,kind,side,progress,impact,family,weapon='wood'){
    const ctx=canvas.getContext('2d');
    const width=canvas.width,height=canvas.height;
    ctx.clearRect(0,0,width,height);
    if(progress<=0||progress>=1)return;
    const direction=side==='hero'?1:-1;
    const source=width*(side==='hero'?.25:.75), target=width*(side==='hero'?.81:.19);
    const ground=height*.85, centerY=height*.63;
    const [light,main,dark]=side==='enemy'?familyColors[family]||colors[kind]:
      weaponColors[weapon]||colors[kind]||colors.slash;
    const mix=(a,b,t)=>a+(b-a)*t;
    const unit=(start,end)=>clampGraph((progress-start)/(end-start),0,1);
    const spark=(x,y,size,color,alpha=1)=>{
      ctx.globalAlpha=alpha;
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x),Math.round(y),size,size);
      ctx.globalAlpha=1;
    };
    const burst=(x,y,when,count=18,spread=36)=>{
      const p=unit(when,when+.25);
      if(!p||p===1)return;
      for(let index=0;index<count;index++){
        const angle=index*2.39996;
        const distance=(.4+index%4*.19)*spread*p;
        spark(x+Math.cos(angle)*distance,y+Math.sin(angle)*distance+14*p*p,
          index%3+2,index%3===0?light:main,1-p);
      }
    };
    const arc=(x,y,when,reverse=false,radius=30)=>{
      const p=unit(when,when+.2);
      if(!p||p===1)return;
      const start=(reverse?-.8:2.2)+p*1.1;
      ctx.save();
      ctx.translate(x,y);
      ctx.scale(direction,reverse?-1:1);
      for(let layer=0;layer<3;layer++){
        ctx.beginPath();
        for(let index=0;index<=13;index++){
          const angle=start+index/13*2.5;
          const r=radius-layer*3;
          const px=Math.cos(angle)*r,py=Math.sin(angle)*r;
          if(index===0)ctx.moveTo(px,py);
          else ctx.lineTo(px,py);
        }
        ctx.strokeStyle=[dark,main,light][layer];
        ctx.globalAlpha=Math.sin(p*Math.PI);
        ctx.lineWidth=8-layer*2.5;
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha=1;
      burst(x,y,when+.055,14,31);
    };
    const ring=(x,y,when)=>{
      const p=unit(when,when+.35);
      if(!p||p===1)return;
      ctx.strokeStyle=main;
      ctx.globalAlpha=(1-p)*.85;
      ctx.lineWidth=3*(1-p)+1;
      ctx.beginPath();
      ctx.ellipse(x,y,12+width*.31*p,4+height*.075*p,0,0,2*Math.PI);
      ctx.stroke();
      ctx.globalAlpha=1;
    };
    const trail=(x,y,p,color,count=17)=>{
      for(let index=0;index<count;index++){
        const seed=index*1.7;
        const distance=index*3.5;
        spark(x-distance*direction,y+Math.sin(seed+progress*6)*(3+index*.3),
          2+index%3,color,(1-index/count)*Math.sin(p*Math.PI));
      }
    };
    switch(kind){
      case 'arrow':case 'volley':case 'arrow-rain':{
        const count=kind==='arrow'?1:kind==='volley'?2:5;
        for(let index=0;index<count;index++){
          const p=unit(.18+index*.055,.66+index*.045);
          if(!p||p===1)continue;
          const x=mix(source,target,p);
          const y=centerY+(index-(count-1)/2)*9-Math.sin(p*Math.PI)*(kind==='arrow-rain'?40:6);
          ctx.save();
          ctx.translate(x,y);
          ctx.scale(direction,1);
          ctx.rotate(kind==='arrow-rain'?(p-.5)*.8:0);
          ctx.strokeStyle='#d8bd78';
          ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(6,0);ctx.stroke();
          ctx.fillStyle=light;
          ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(4,-4);ctx.lineTo(4,4);ctx.closePath();ctx.fill();
          ctx.strokeStyle=main;
          ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-25,-5);ctx.moveTo(-18,0);ctx.lineTo(-25,5);ctx.stroke();
          ctx.restore();
          trail(x,y,p,main,9);
          burst(target,centerY+(index-(count-1)/2)*9,.62+index*.03,9,23);
        }
        break;
      }
      case 'lightning':{
        const p=unit(.28,.76);
        if(!p||p===1)break;
        ctx.save();
        ctx.globalAlpha=Math.sin(p*Math.PI);
        ctx.beginPath();ctx.moveTo(source,centerY-8);
        for(let index=1;index<=11;index++){
          ctx.lineTo(mix(source,target,index/11),centerY+(index===11?0:Math.sin(index*4.7)*21));
        }
        ctx.lineJoin='miter';ctx.strokeStyle=main;ctx.lineWidth=7;ctx.shadowColor=main;ctx.shadowBlur=12;ctx.stroke();
        ctx.strokeStyle=light;ctx.lineWidth=2;ctx.stroke();ctx.restore();
        burst(target,centerY,.47,30,49);
        break;
      }
      case 'blizzard':
        for(let index=0;index<35;index++){
          const p=unit(.15+index%6*.023,.7+index%4*.035);
          if(!p||p===1)continue;
          const x=mix(source,target,p),y=centerY+Math.sin(index*2.39)*(10+53*p);
          spark(x,y,3+index%3,index%2?main:light,Math.sin(p*Math.PI));
        }
        ring(target,ground,.58);burst(target,centerY,.62,38,55);
        break;
      case 'firestorm':
        for(let index=0;index<26;index++){
          const p=unit(.17+index%5*.025,.71+index%3*.04);
          if(!p||p===1)continue;
          const x=mix(source,target,p), y=centerY+Math.sin(index*2.6)*(5+p*38);
          spark(x,y,4+index%5,index%3?main:light,Math.sin(p*Math.PI));
          trail(x,y,p,dark,4);
        }
        burst(target,centerY,.6,36,57);ring(target,ground,.64);
        break;
      case 'quake':
        for(let index=0;index<3;index++)ring(mix(source,target,.4+index*.3),ground,.3+index*.14);
        for(let index=0;index<18;index++){
          const p=unit(.4,.88);
          if(!p||p===1)continue;
          spark(target+(index-9)*9*p,ground-Math.sin(p*Math.PI)*(20+index%5*10),
            index%4+3,index%2?main:dark,1-p*.7);
        }
        burst(target,centerY,.56,30,55);
        break;
      case 'blade-storm':
        for(let index=0;index<3;index++){
          arc(target,centerY,.2+index*.18,index%2===1,31+index*5);
          const p=unit(.2+index*.12,.62+index*.1);
          if(p>0&&p<1){
            const x=mix(source,target,p),y=centerY-24*Math.sin(p*Math.PI)+index*8;
            ctx.save();ctx.translate(x,y);ctx.rotate(p*12+index);ctx.fillStyle=light;
            ctx.fillRect(-2,-13,4,22);ctx.fillStyle=dark;ctx.fillRect(-5,7,10,3);ctx.restore();
          }
        }
        break;
      case 'double':case 'flurry':
        arc(target,centerY,.28,false,35);
        arc(target,centerY+6,.51,true,39);
        if(kind==='flurry'&&impact.hits>2)arc(target+5*direction,centerY-7,.66,false,27);
        break;
      case 'vault':
        ring(target,ground,.46);
        arc(target,centerY,.43,true,41);
        for(let index=0;index<12;index++){
          const p=unit(.25,.55);
          const x=mix(source,target,p)-index*4*direction;
          spark(x,centerY-60*Math.sin(p*Math.PI)+index*2,2,light,(1-index/12)*Math.sin(p*Math.PI));
        }
        break;
      case 'wave':{
        const p=unit(.24,.72), x=mix(source,target,p);
        if(p>0&&p<1){
          for(let index=0;index<3;index++)arc(x-index*10*direction,centerY,.24+index*.04,false,26+index*6);
          trail(x,centerY,p,main);
          ctx.save();
          ctx.translate(x,centerY);
          ctx.scale(direction,1);
          ctx.beginPath();
          ctx.moveTo(-4,-29);
          ctx.quadraticCurveTo(32,0,-4,29);
          ctx.quadraticCurveTo(12,0,-4,-29);
          ctx.fillStyle=light;
          ctx.shadowColor=main;
          ctx.shadowBlur=13;
          ctx.fill();
          ctx.restore();
        }
        burst(target,centerY,.65,32,49);
        break;
      }
      case 'slam':
        ring(target,ground,.45);
        for(let index=0;index<13;index++){
          const p=unit(.45,.83);
          if(!p||p===1)continue;
          const x=target+(index-6)*8*p;
          const y=ground-Math.sin(p*Math.PI)*(14+index%4*11);
          spark(x,y,3+index%4,index%2?dark:main,1-p*.6);
        }
        burst(target,centerY,.49,25,49);
        break;
      case 'rush':case 'pierce':{
        const p=unit(.25,.55), x=mix(source,target,p);
        if(p>0&&p<1){
          for(let index=0;index<7;index++){
            const y=centerY-24+index*8;
            ctx.strokeStyle=index%2?light:main;
            ctx.lineWidth=2;
            ctx.beginPath();
            ctx.moveTo(x-direction*(20+index%3*13),y);
            ctx.lineTo(x+direction*8,y);
            ctx.stroke();
          }
        }
        arc(target,centerY,.4,kind==='rush',kind==='rush'?36:26);
        if(kind==='pierce'){
          const p=unit(.36,.64);
          if(p>0&&p<1){
            ctx.fillStyle=light;
            ctx.globalAlpha=1-p;
            ctx.beginPath();
            ctx.moveTo(target+direction*27,centerY);
            ctx.lineTo(target-direction*70,centerY-4);
            ctx.lineTo(target-direction*70,centerY+4);
            ctx.fill();
            ctx.globalAlpha=1;
          }
        }
        break;
      }
      case 'frost':
        for(let index=0;index<22;index++){
          const start=.2+index%5*.025, p=unit(start,.71+index%3*.025);
          if(!p||p===1)continue;
          const x=mix(source,target,p), y=centerY+Math.sin(index*2.4)*(5+36*p);
          ctx.save();
          ctx.translate(x,y);
          ctx.rotate(index*.4+progress);
          ctx.fillStyle=index%2?main:light;
          ctx.globalAlpha=Math.sin(p*Math.PI);
          ctx.fillRect(-2,-6,4,12);
          ctx.fillRect(-6,-2,12,4);
          ctx.restore();
        }
        burst(target,centerY,.64,30,47);
        ring(target,ground,.67);
        break;
      case 'bolt':case 'ember':case 'drain':{
        const p=unit(.2,.68);
        if(p>0&&p<1){
          const x=mix(source,target,p), y=centerY-(kind==='bolt'?Math.sin(p*Math.PI)*25:0);
          trail(x,y,p,dark,23);
          const radius=kind==='ember'?11:8;
          spark(x-radius/2,y-radius/2,radius,main);
          spark(x-2,y-2,5,light);
          if(kind==='bolt'&&['stone','crystal','woodland'].includes(family)){
            ctx.save();
            ctx.translate(x,y);
            ctx.rotate(progress*(family==='woodland'?8:4));
            ctx.beginPath();
            const points=family==='crystal'?[[0,-15],[8,0],[0,15],[-8,0]]:
              family==='woodland'?[[-11,-3],[-5,-11],[9,-7],[10,7],[-4,11]]:
                [[-9,-8],[3,-12],[12,-2],[8,11],[-8,9],[-12,0]];
            for(const [index,[px,py]] of points.entries()){
              if(index===0)ctx.moveTo(px,py);
              else ctx.lineTo(px,py);
            }
            ctx.closePath();
            ctx.fillStyle=main;
            ctx.strokeStyle=dark;
            ctx.lineWidth=2;
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle=light;
            ctx.fillRect(-4,-6,4,3);
            ctx.restore();
          }
          for(let index=0;index<10;index++){
            const angle=index*.63+progress*10;
            spark(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,2,main,.8);
          }
        }
        burst(target,centerY,.6,28,42);
        if(kind==='drain'&&impact.healed){
          const heal=unit(.68,.96);
          if(heal>0&&heal<1){
            for(let index=0;index<7;index++){
              const x=mix(target,source,heal);
              spark(x-index*3*direction,centerY+Math.sin(index+heal*6)*9,3,light,1-index/8);
            }
          }
        }
        break;
      }
      case 'break':
        ring(target,centerY+25,.2);
        burst(target,centerY,.15,38,65);
        break;
      default:
        arc(target,centerY,.32);
        break;
    }
    if(impact.blocked){
      const p=unit(.4,.82);
      if(p>0&&p<1){
        ctx.globalAlpha=Math.sin(Math.PI*p)*.85;
        ctx.strokeStyle='#a2ffe5';
        ctx.fillStyle='#51baaa44';
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(target-19,centerY-27);
        ctx.lineTo(target+19,centerY-27);
        ctx.lineTo(target+16,centerY+12);
        ctx.lineTo(target,centerY+26);
        ctx.lineTo(target-16,centerY+12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha=1;
      }
    }
  }

  function bind(arena,battle){
    cleanup();
    if(!arena)return;
    const event=arena.dataset.combatEvent;
    if(!event)return;
    const hero=event==='hit'||event==='break';
    const kind=event==='break'?'break':hero?battle.impact.animation||battle.impact.move||battle.heroMove:battle.threat.kind;
    const side=hero?'hero':'enemy';
    const comboHits=hero&&battle.impact?.combo?Math.max(2,Math.min(4,battle.impact.comboHits||2)):0;
    const actor=arena.querySelector('.arena-character.'+(hero?'knight':'enemy'));
    const defender=arena.querySelector('.arena-character.'+(hero?'enemy':'knight'));
    const width=arena.clientWidth,height=arena.clientHeight;
    const family=Object.keys(families).find(key=>families[key].includes(arena.dataset.arenaRival));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration=reduced?220:comboHits?1100+comboHits*200:kind==='double'||kind==='flurry'?1460:kind==='wave'?1520:1280;
    const animations=[];
    const animate=(element,frames,options)=>{
      if(element)animations.push(element.animate(frames,{duration,fill:'none',...options}));
    };
    const buttons=[...arena.closest('.arena-page').querySelectorAll('.lesson-actions > button')];
    const locked=buttons.filter(button=>!button.disabled);
    locked.forEach(button=>{button.disabled=true;});
    arena.classList.add('combat-playing');
    const impactTime=rangedKinds.has(kind) ? .62 : .4;
    const comboTimes=comboHits?Array.from({length:comboHits},(_,i)=>.26+i*(.45/(comboHits-1))):[];
    if(!reduced&&kind!=='break'){
      let movement=keyframes(kind,side,width,height);
      if(comboHits){
        const distance=width*.54*(hero?1:-1),ranged=rangedKinds.has(kind);
        movement=[{offset:0,transform:'none'},{offset:.14,transform:'translateX('+(-distance*.06)+'px) rotate(-6deg)'}];
        for(const [i,time] of comboTimes.entries()){
          movement.push({offset:time-.055,transform:'translate('+distance*(ranged?.04:.76)+'px,'+(i%2?-8:0)+'px) rotate(-7deg)'},
            {offset:time,transform:'translate('+distance*(ranged?.08:.98)+'px,'+(i%2?-4:0)+'px) rotate(8deg)'});
        }
        movement.push({offset:.9,transform:'none'},{offset:1,transform:'none'});
      }
      animate(actor,movement,{easing:'linear'});
      const readyFrames=comboHits?[
        {opacity:1,offset:0},{opacity:1,offset:.14},
        ...comboTimes.flatMap(time=>[{opacity:1,offset:time-.065},{opacity:0,offset:time-.035},{opacity:0,offset:time+.025},{opacity:1,offset:time+.055}]),
        {opacity:1,offset:1},
      ]:[
        {opacity:1,offset:0},{opacity:1,offset:.18},{opacity:0,offset:.24},
        {opacity:0,offset:.72},{opacity:1,offset:.81},{opacity:1,offset:1},
      ];
      animate(actor.querySelector('.arena-ready'),readyFrames);
      animate(actor.querySelector('.arena-attack'),readyFrames.map(frame=>({...frame,opacity:1-frame.opacity})));
      const direction=hero?1:-1;
      const recoil=comboHits?[
        {transform:'none',filter:'none',offset:0},
        ...comboTimes.flatMap(time=>[
          {transform:'none',filter:'none',offset:time},
          {transform:'translateX('+direction*10+'px) rotate('+direction*5+'deg)',filter:'brightness(1.6)',offset:time+.025},
          {transform:'none',filter:'none',offset:time+.07},
        ]),{transform:'none',filter:'none',offset:1},
      ]:[
        {transform:'none',filter:'none',offset:0},{transform:'none',filter:'none',offset:impactTime},
        {transform:'translateX('+direction*12+'px) rotate('+direction*7+'deg)',filter:'brightness(1.8)',offset:impactTime+.04},
        {transform:'none',filter:'none',offset:impactTime+.16},{transform:'none',filter:'none',offset:1},
      ];
      animate(defender,recoil);
      animate(arena.querySelector('.arena-world'),[
        {transform:'none',offset:0},{transform:'none',offset:impactTime},
        {transform:'translateX(-3px)',offset:impactTime+.025},
        {transform:'translateX(3px)',offset:impactTime+.05},
        {transform:'none',offset:impactTime+.1},{transform:'none',offset:1},
      ]);
    }
    animate(arena.querySelector('.arena-strike'),[
      {opacity:0,transform:'translateY(8px) scale(.6)',offset:0},
      {opacity:0,transform:'translateY(8px) scale(.6)',offset:impactTime},
      {opacity:1,transform:'translateY(0) scale(1.1)',offset:impactTime+.1},
      {opacity:0,transform:'translateY(-25px) scale(.9)',offset:1},
    ]);
    const canvas=arena.querySelector('.combat-effects');
    canvas.width=560;
    canvas.height=Math.round(560*height/width);
    const started=performance.now();
    let frame;
    const release=()=>{
      locked.forEach(button=>{button.disabled=false;});
      arena.classList.remove('combat-playing');
    };
    const paint=now=>{
      if(!arena.isConnected)return;
      const progress=Math.min(1,(now-started)/duration);
      let effectProgress=reduced?.6:progress;
      if(comboHits&&!reduced){
        // Replay the equipped weapon effect once per blow, in sync with each recoil.
        const time=comboTimes.reduce((closest,value)=>Math.abs(value-progress)<Math.abs(closest-progress)?value:closest,comboTimes[0]);
        effectProgress=Math.max(0,Math.min(1,.4+(progress-time)*5.5));
        if(rangedKinds.has(kind))effectProgress=Math.max(0,Math.min(1,.62+(progress-time)*5.5));
      }
      drawEffects(canvas,kind,side,effectProgress,battle.impact,family,battle.impact.weapon||battle.weaponStyle);
      if(progress<1)frame=requestAnimationFrame(paint);
      else{
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
        release();
      }
    };
    frame=requestAnimationFrame(paint);
    cleanup=()=>{
      cancelAnimationFrame(frame);
      animations.forEach(animation=>animation.cancel());
      release();
      cleanup=()=>{};
    };
  }

  function stop(){cleanup();}
  return {heroMoves,heroStatus,heroDefense,rivalMoves,weaponPreview,comboMeter,bind,stop};
})();
