'use strict';

const adventureUI=(()=>{
  const resourceArt={coins:'coin-stack',wood:'wood-logs',ore:'iron-ore',fiber:'fiber-bundle',gem:'purple-crystal',scale:'dragon-scale'};
  const labels={
    coins:['moneda','monedas'],wood:['madera','madera'],ore:['mineral','minerales'],
    fiber:['fibra','fibras'],gem:['cristal','cristales'],scale:['escama de dragón','escamas de dragón']
  };
  const atlas={
    'bronze-blades':[0,0],'frost-sword':[1,0],'ember-axe':[2,0],'storm-spear':[3,0],
    'stone-hammer':[0,1],'forest-bow':[1,1],'scout-cloak':[2,1],'ice-armor':[3,1],
    'ember-armor':[0,2],'royal-armor':[1,2],'crystal-shield':[2,2],'royal-shield':[3,2],
  };
  const shortNames={
    'iron-sword':'Hierro','rune-sword':'Rúnica','bronze-blades':'Gemelas','frost-sword':'Hielo',
    'ember-axe':'Fuego','storm-spear':'Rayo','stone-hammer':'Martillo','forest-bow':'Arco',
    'leather-armor':'Cuero','plated-armor':'Acero','scout-cloak':'Capa',
    'ice-armor':'Hielo','ember-armor':'Fuego','royal-armor':'Real',
    'oak-shield':'Roble','scale-shield':'Escamas','crystal-shield':'Cristal','royal-shield':'Real',
    'healing-potion':'Poción','starter-sword':'Madera',
  };
  const categoryArt={sword:'iron-sword',armor:'plated-armor',shield:'oak-shield',supply:'healing-potion'};
  const categoryNames={sword:'Armas',armor:'Armaduras',shield:'Escudos',supply:'Ayudas'};
  const material=(key,quantity)=>quantity+' '+labels[key][quantity===1?0:1];
  function itemArt(id,className=''){
    const tile=atlas[id];
    if(tile)return '<span class="village-art atlas-art '+className+'" style="--art-x:'+
      tile[0]*100/3+'%;--art-y:'+tile[1]*50+'%" aria-hidden="true"></span>';
    return '<img class="village-art '+className+'" src="recursos/aldea/'+id+'.webp" width="72" height="72" alt="">';
  }

  function lootMarkup(loot){
    return Object.entries(loot).map(([key,amount])=>'<span class="loot-'+key+'" aria-label="'+material(key,amount)+'">'+
      itemArt(resourceArt[key],'village-mini-icon')+'<b>+'+amount+'</b></span>').join('');
  }

  function stockStrip(guide,village,escape){
    return '<ul class="village-stock" aria-label="Tus materiales">'+Object.entries(guide.resources).map(([key,name])=>
      '<li class="village-stock-tile stock-'+key+(village.stock[key]?'':' is-empty')+'" data-stock="'+key+
      '" aria-label="'+escape(name+' '+village.stock[key])+'">'+itemArt(resourceArt[key])+
      '<strong>'+village.stock[key]+'</strong></li>').join('')+'</ul>';
  }

  function statIcons(item){
    const stats=[];
    if(item.power!==undefined)stats.push('<span aria-label="'+(1+item.power)+' de ataque">⚔ '+(1+item.power)+'</span>');
    if(item.combo)stats.push('<span aria-label="'+item.combo+' de daño extra en racha">⚔↗ '+item.combo+'</span>');
    if(item.hearts)stats.push('<span class="stat-heart" aria-label="'+item.hearts+' corazones extra">♥ +'+item.hearts+'</span>');
    if(item.armor)stats.push('<span aria-label="'+item.armor+' de armadura">'+itemArt('plated-armor')+' '+item.armor+'</span>');
    if(item.ward)stats.push('<span aria-label="'+item.ward+' de bloqueo">'+itemArt('quick-shield')+' '+item.ward+'</span>');
    if(item.heal)stats.push('<span class="stat-heart" aria-label="Recupera '+item.heal+' corazones">♥ +'+item.heal+'</span>');
    return '<div class="village-icon-stats">'+stats.join('')+'</div>';
  }

  function categories(selected){
    return '<nav class="village-categories" aria-label="Tipo de equipo">'+Object.keys(categoryArt).map(slot=>
      '<button type="button" data-village-category="'+slot+'" aria-pressed="'+(slot===selected)+'">'+
      itemArt(categoryArt[slot])+'<span>'+categoryNames[slot]+'</span></button>').join('')+'</nav>';
  }

  function gearSlot(slot,guide,village,escape){
    const id=village.equipped[slot], fallback=slot==='sword'?'starter-sword':categoryArt[slot];
    return '<div class="village-slot slot-'+slot+(id?' has-item':'')+'"'+(id?' data-equipped-item="'+escape(id)+'" tabindex="-1"':'')+'>'+
      '<span>'+guide.slots[slot]+'</span>'+itemArt(id||fallback)+
      (id||slot==='sword'?'<b aria-hidden="true">✓</b>':'<b aria-hidden="true">+</b>')+'</div>';
  }

  function knightMarkup(equipment,label='Tu caballero'){
    return heroRig.render({pose:'ready',weapon:equipment.sword||'starter-sword',
      armor:equipment.armor||null,shield:equipment.shield||null,label});
  }

  function backpack(guide,village,pack,escape,options){
    const category=options.category;
    const owned=village.owned.filter(id=>guide.items[id].slot===category);
    const gear=owned.map(id=>{
      const item=guide.items[id], wearing=village.equipped[category]===id;
      return '<button type="button" class="village-inventory-item'+(wearing?' is-equipped':'')+'" data-village-item="'+id+
        '" data-village-operation="equip" aria-label="'+escape((wearing?'En uso. ':'Usar ')+item.name)+'"'+
        (wearing?' disabled':'')+'>'+itemArt(id)+'<strong>'+shortNames[id]+'</strong>'+
        (wearing?'<b class="equipment-check" aria-hidden="true">✓</b>':'')+statIcons(item)+'</button>';
    }).join('');
    const aids=[['potions',village.potions,'healing-potion','Pociones'],['hints',pack.hints,'hint-scroll','Pistas'],
      ['shields',pack.shields,'quick-shield','Escudos']].map(([key,amount,art,name])=>
        '<div class="village-aid" data-stock="'+key+'" aria-label="'+name+' '+amount+'">'+itemArt(art)+'<strong>'+amount+'</strong></div>').join('');
    const inventory=category==='supply'?'<div class="village-aids">'+aids+'</div>':
      '<div class="village-inventory">'+(gear||'<div class="village-empty">'+itemArt(categoryArt[category])+
        '<span>Vacío</span><button type="button" class="btn" data-village-view="shop">Taller →</button></div>')+'</div>';
    return '<div class="village-room-content backpack-layout"><section class="village-paperdoll" aria-label="Tu caballero y su equipo">'+
      '<div class="village-hero-stats"><span class="stat-heart" aria-label="'+(3+village.bonuses.hearts)+' corazones">♥ '+
      (3+village.bonuses.hearts)+'</span><span aria-label="'+(1+village.bonuses.power)+' de ataque">⚔ '+
      (1+village.bonuses.power)+'</span>'+itemArt('quick-shield')+'<span>'+village.bonuses.ward+'</span></div>'+
      '<div class="village-knight">'+knightMarkup(village.equipped)+'</div>'+
      '<small class="village-equip-timing">Próximo duelo</small>'+
      '<div class="village-gear-slots">'+['sword','armor','shield'].map(slot=>gearSlot(slot,guide,village,escape)).join('')+'</div>'+
      '<div class="village-aids" aria-label="Tus ayudas">'+aids+'</div></section>'+
      '<section class="village-bag-panel" aria-label="Mochila">'+categories(category)+inventory+'</section></div>';
  }

  function costIcons(item,village,escape){
    return '<ul class="forge-costs" aria-label="Materiales necesarios">'+Object.entries(item.cost).map(([key,required])=>{
      const owned=village.stock[key], enough=owned>=required;
      return '<li class="'+(enough?'is-enough':'is-missing')+'" data-resource="'+key+'" aria-label="'+escape(material(key,required)+'. Tienes '+owned)+
        '">'+itemArt(resourceArt[key])+'<strong>'+owned+'<span>/'+required+'</span></strong>'+
        '<b aria-hidden="true">'+(enough?'✓':'!')+'</b></li>';
    }).join('')+'</ul>';
  }

  function recipePanel(id,guide,village,escape,crafted){
    const item=guide.items[id], owns=village.owned.includes(id), wearing=village.equipped[item.slot]===id;
    const missing=Object.entries(item.cost).some(([key,amount])=>village.stock[key]<amount);
    const style=Object.keys(guide.weapons).find(key=>guide.weapons[key].item===id);
    const previewEquipment={...village.equipped,[item.slot]:id};
    const preview=style?'<div class="forge-demo" aria-label="Así ataca esta arma">'+combatUI.weaponPreview(style,guide,village.equipped)+
      '</div>':item.slot==='armor'||item.slot==='shield'?'<div class="forge-equipment-preview">'+
      knightMarkup(previewEquipment,'Tu caballero con '+item.name)+'</div>':'<div class="forge-item-large">'+itemArt(id)+'</div>';
    const operation=owns?'equip':'craft';
    const label=wearing?'✓ En uso':owns?'Usar':missing?'Falta':'Crear';
    return '<section class="forge-recipe'+(crafted===id?' just-crafted':'')+'" aria-label="'+escape(item.name)+'">'+
      '<header><h2>'+shortNames[id]+'</h2>'+itemArt(categoryArt[item.slot])+'</header>'+preview+
      statIcons(item)+(owns?'':'<h3>Necesitas</h3>'+costIcons(item,village,escape))+
      '<button type="button" class="btn primary forge-create" data-village-item="'+id+'" data-village-operation="'+operation+
      '"'+(wearing||missing&&!owns?' disabled':'')+' aria-label="'+escape((wearing?'En uso. ':owns?'Usar ':'Crear ')+item.name)+'">'+
      itemArt(owns?'quick-shield':'anvil')+label+'</button>'+
      (crafted===id?'<span class="forge-success" role="status">✓ ¡Listo!</span>':'')+'</section>';
  }

  function workshop(guide,village,escape,options){
    const category=options.category;
    const recipes=Object.entries(guide.items).filter(([,item])=>item.slot===category);
    const selected=recipes.some(([id])=>id===options.selected)?options.selected:recipes[0][0];
    const cards=recipes.map(([id,item])=>{
      const owns=village.owned.includes(id), ready=Object.entries(item.cost).every(([key,amount])=>village.stock[key]>=amount);
      return '<button type="button" class="village-item'+(ready?' can-craft':'')+(owns?' is-owned':'')+
        '" data-village-select="'+id+'" data-village-recipe="'+id+'" aria-pressed="'+(id===selected)+
        '" aria-label="'+escape(item.name)+(owns?'. Ya la tienes.':ready?'. Puedes crearla.':'. Ver materiales.')+'">'+
        itemArt(id)+'<strong>'+shortNames[id]+'</strong>'+
        (owns?'<b class="equipment-check" aria-hidden="true">✓</b>':ready?'<b class="equipment-check" aria-hidden="true">+</b>':'')+'</button>';
    }).join('');
    return '<div class="village-room-content forge-layout"><section class="forge-catalog" aria-label="Objetos del taller">'+
      categories(category)+'<div class="village-items">'+cards+'</div></section>'+
      recipePanel(selected,guide,village,escape,options.crafted)+'</div>';
  }

  function villagePage(guide,village,pack,view,escape,button,options){
    const navigation=[['bag','Mochila','coin-pouch'],['shop','Taller','anvil']].map(([mode,label,art])=>
      '<button type="button" class="village-view-button" data-village-view="'+mode+'" aria-pressed="'+(view===mode)+'">'+
      itemArt(art)+label+'</button>').join('');
    const particles=Array.from({length:12},(_,index)=>'<i style="--spark-x:'+(73+(index*7)%24)+
      '%;--spark-delay:-'+index*370+'ms;--spark-duration:'+(1900+index%4*450)+'ms"></i>').join('');
    return '<div class="adventure village-page rpg-village" data-room="'+view+'">'+
      '<div class="village-room" aria-hidden="true"></div><div class="village-room-glow" aria-hidden="true"></div>'+
      '<div class="village-room-sparks" aria-hidden="true">'+particles+'</div>'+
      '<header class="village-game-header">'+button('village-back','← Mapa','ghost')+
      '<h1 class="sr-only">'+(view==='shop'?'Taller del herrero':'Mi mochila')+'</h1>'+
      '<nav class="village-views" aria-label="Mochila y taller">'+navigation+'</nav></header>'+
      stockStrip(guide,village,escape)+'<div class="village-scenic-gap" aria-hidden="true"></div>'+(view==='shop'?workshop(guide,village,escape,options):
        backpack(guide,village,pack,escape,options))+'</div>';
  }
  function tacticMarkup(spec,value){
    const slope=spec.kind==='slope';
    const html=slope?'<canvas width="420" height="208" aria-label="Plano con el rayo y la posición del espejo"></canvas>':
      '<div class="tactic-number-line" aria-hidden="true"><b></b>'+Array.from({length:spec.divisions+1},(_,index)=>
        '<i style="--mark:'+100*index/spec.divisions+'%"></i>').join('')+
      '<span>0</span><span>'+(spec.kind==='fraction'?1:spec.divisions)+'</span></div>';
    return '<form id="duel-tactic" class="duel-tactic'+(slope?' is-slope':'')+'">'+html+'<div class="tactic-controls"><label>'+
      (slope?'Pendiente del rayo':'Mover el marcador')+'<input type="range" name="position" min="'+(slope?-spec.run:0)+
      '" max="'+(slope?spec.run:spec.divisions)+'" step="1" value="'+value+'"></label>'+
      '<output aria-live="polite"></output></div>'+
      '<button type="submit" class="btn primary">'+(slope?'Lanzar rayo':'Romper barrera')+'</button></form>';
  }

  function tacticAnswer(spec,value){
    if(spec.kind==='fraction')return value+'/'+spec.divisions;
    if(spec.kind==='slope')return value+'/'+spec.run;
    return String(value);
  }

  function paintRay(canvas,spec,value){
    const ctx=canvas.getContext('2d');
    const {width,height}=canvas;
    const step=20, x=width/2-2*step, y=height/2;
    ctx.clearRect(0,0,width,height);
    ctx.lineWidth=1;
    ctx.strokeStyle='#ccdcd6';
    ctx.beginPath();
    for(let n=-4;n<=4;n++){
      ctx.moveTo(x-step,y-n*step);ctx.lineTo(x+6*step,y-n*step);
    }
    for(let n=-1;n<=6;n++){
      ctx.moveTo(x+n*step,y-4*step);ctx.lineTo(x+n*step,y+4*step);
    }
    ctx.stroke();
    ctx.strokeStyle='#557f74';
    ctx.beginPath();
    ctx.moveTo(x-step,y);ctx.lineTo(x+6*step,y);
    ctx.moveTo(x,y+4*step);ctx.lineTo(x,y-4*step);
    ctx.stroke();
    ctx.fillStyle='#274f45';
    ctx.font='13px Segoe UI,sans-serif';
    ctx.fillText('0',x-13,y+15);
    ctx.fillText('x',x+6*step+5,y+5);
    ctx.fillText('y',x-13,y-4*step-4);
    const targetX=x+spec.run*step, targetY=y-spec.rise*step;
    ctx.strokeStyle='#b9652a';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(x,y);ctx.lineTo(targetX,y-value*step);
    ctx.stroke();
    ctx.fillStyle='#1b7563';
    ctx.fillRect(targetX-6,targetY-6,12,12);
    ctx.fillText('Espejo',targetX+12,targetY+4);
  }

  function updateTactic(form,spec){
    if(!form)return;
    const value=Number(form.elements.position.value);
    const label=tacticAnswer(spec,value).replace('-', '−');
    form.querySelector('output').textContent=spec.kind==='slope'?'m = '+label:label;
    if(spec.kind==='slope')paintRay(form.querySelector('canvas'),spec,value);
    else form.querySelector('.tactic-number-line').style.setProperty('--position',100*value/spec.divisions+'%');
  }

  return {villagePage,lootMarkup,itemArt,tacticMarkup,tacticAnswer,updateTactic};
})();
