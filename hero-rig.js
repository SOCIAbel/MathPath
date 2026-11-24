'use strict';

// Equipment is attached in sprite coordinates, including the fingers in front of each grip.
const heroRig=(()=>{
  let serial=0;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const weapons={
    'starter-sword':{name:'Espada de madera'},
    'iron-sword':{name:'Espada de hierro',file:'iron-sword',size:72,grip:[18,54],scale:.9,ready:-15,attack:39},
    'rune-sword':{name:'Espada rúnica',file:'rune-sword',size:72,grip:[19,53],scale:.93,ready:-15,attack:39},
    'bronze-blades':{name:'Hojas gemelas',draw:'twin'},
    'frost-sword':{name:'Espada de hielo',tile:[1,0],size:362,grip:[94,282],scale:.18,ready:-15,attack:39},
    'ember-axe':{name:'Hacha de fuego',tile:[2,0],size:362,grip:[99,302],scale:.2,ready:0,attack:47},
    'storm-spear':{name:'Lanza del rayo',tile:[3,0],size:362,grip:[85,306],scale:.2,ready:-12,attack:42},
    'stone-hammer':{name:'Martillo de roca',tile:[0,1],size:362,grip:[86,309],scale:.19,ready:12,attack:55},
    'forest-bow':{name:'Arco del bosque',draw:'bow'},
  };
  const armors={
    'leather-armor':{name:'Armadura de cuero',kind:'leather',colors:['#241b20','#643c2c','#a87146','#e9c08a'],trim:'#d2a14f',accent:'#c28a4f'},
    'plated-armor':{name:'Cota reforzada',kind:'steel',colors:['#172236','#41536d','#98afc5','#edf7fa'],trim:'#a9bfce',accent:'#d5e4ef'},
    'scout-cloak':{name:'Capa del bosque',kind:'cloak',colors:['#142922','#2c563a','#719c4d','#d5dfaa'],trim:'#bdad5d',accent:'#91bc53'},
    'ice-armor':{name:'Armadura de hielo',kind:'ice',colors:['#122640','#275a8b','#61c4e8','#e2ffff'],trim:'#a9edff',accent:'#bafaff'},
    'ember-armor':{name:'Armadura de fuego',kind:'fire',colors:['#321d2a','#7d2933','#cc4738','#ffab5e'],trim:'#efb347',accent:'#ffdc7e'},
    'royal-armor':{name:'Armadura real',kind:'royal',colors:['#192641','#2f4788','#5474b8','#b5d7ff'],trim:'#eac462',accent:'#a5e9ff'},
  };
  const shields={
    'oak-shield':{name:'Escudo de roble',file:'oak-shield',size:72},
    'scale-shield':{name:'Escudo de escamas',file:'scale-shield',size:72},
    'crystal-shield':{name:'Escudo de cristal',tile:[2,2],size:362},
    'royal-shield':{name:'Escudo real',tile:[3,2],size:362},
  };
  const poses={
    ready:{file:'knight',hand:[134,84],left:[75,97],
      weaponCut:'M141 24H169V44L154 70V80L145 82L146 98H122V87L127 77L123 74V64H133Z',
      handClip:'M119 81L127 80L130 77L137 77L141 81L140 87L137 91L130 90L127 94L121 94Z',
      shieldCut:'M59 83L75 77L92 84L91 103L86 112L76 117L64 112L57 103V87Z',
      shieldBox:[53,73,43,46],
      armorClip:'M77 73L94 75L108 79L119 75L128 80L128 96L120 100L128 116L121 126L122 141H101L99 125L87 125L83 141H67L69 126L62 125L46 130L44 110L63 96L64 80Z',
      capeClip:'M63 82L77 89L70 114L62 127L43 131V110Z',
      badge:[106,92]},
    attack:{file:'knight-attack',hand:[130,76],left:[53,88],
      weaponCut:'M133 62L141 59L149 62L190 54L197 61V75L190 83H148L145 90L134 88Z',
      handClip:'M125 69L133 70L136 74L135 81L131 84L125 83L122 79L123 73Z',
      shieldCut:'M34 77L48 69L67 74L72 83L68 98L59 106L44 105L33 94Z',
      shieldBox:[29,64,46,46],
      armorClip:'M59 71L73 73L91 82L110 72L122 69L125 85L116 91L109 101L112 108L111 130L115 141H91L83 137L89 118L81 113L64 127L53 141H15L18 128L32 117L37 103L18 118L13 109L38 88L43 78Z',
      capeClip:'M44 86L62 94L62 111L45 119H27L13 119V105L25 96Z',
      badge:[85,97]},
  };
  function art(item){
    if(item.tile){
      const [x,y]=item.tile;
      return '<svg width="362" height="362" viewBox="'+x*362+' '+y*362+' 362 362" overflow="hidden"><image href="recursos/aldea/arsenal-atlas.png" width="1448" height="1086"/></svg>';
    }
    return '<image href="recursos/aldea/'+item.file+'.webp" width="'+item.size+'" height="'+item.size+'"/>';
  }
  const blade=()=>'<path d="M-3 7H3V-5H7V-9H3V-32L0-39L-3-32V-9H-7V-5H-3Z" fill="#b67f38" stroke="#38271d" stroke-width="1.4"/><path d="M0-33V-11H2V-30Z" fill="#ffe0a0"/><path d="M-5-7H5M-2 1H2" stroke="#f4c373" stroke-width="1.5"/>';
  function bow(pose){
    return '<g transform="rotate('+(pose==='attack'?0:15)+')">'+
      '<path d="M-12-29L-6-26L0-17L5-6V6L0 17L-6 26L-12 29" fill="none" stroke="#193629" stroke-width="6" stroke-linejoin="round"/>'+
      '<path d="M-12-29L-6-26L0-17L5-6V6L0 17L-6 26L-12 29" fill="none" stroke="#78a947" stroke-width="3" stroke-linejoin="round"/>'+
      '<path d="M-12-28L-16 0L-12 28" fill="none" stroke="#dac492" stroke-width="1"/>'+
      '<path d="M-18 0H37" stroke="#392f25" stroke-width="2.5"/><path d="M-18-1H36" stroke="#d2ab63" stroke-width="1"/>'+
      '<path d="M35-4L43 0L35 4Z" fill="#c2d8dc" stroke="#344955" stroke-width="1"/>'+
      '<path d="M-17-4L-10 0L-17 4L-21 3L-17 0L-21-3Z" fill="#72a64a"/>'+
      '<path d="M-5-21L2-25L1-18Z M-5 21L2 25L1 18Z" fill="#a5c94e"/>'+
      '<rect x="1" y="-5" width="6" height="10" rx="1" fill="#765537" stroke="#29362a" stroke-width="1"/></g>';
  }
  function held(profile,pose,bone){
    const origin='translate('+bone.hand.join(' ')+')';
    if(profile.draw==='bow')return '<g class="rig-held-weapon rig-bow" transform="'+origin+'">'+bow(pose)+'</g>';
    if(profile.draw==='twin')return '<g class="rig-held-weapon rig-twin" transform="'+origin+' rotate('+(pose==='attack'?82:33)+')">'+blade()+'</g>';
    return '<g class="rig-held-weapon" data-grip-x="'+bone.hand[0]+'" data-grip-y="'+bone.hand[1]+'" transform="'+origin+' rotate('+profile[pose]+') scale('+profile.scale+') translate('+(-profile.grip[0])+' '+(-profile.grip[1])+')">'+art(profile)+'</g>';
  }
  // Tailored pieces use the body's own joints. Inventory art is never pasted on the torso.
  function armorArt(suit,pose){
    const [ink,shadow,base,light]=suit.colors,trim=suit.trim,accent=suit.accent;
    const kind=suit.kind,attack=pose==='attack';
    const path=(d,fill,stroke=ink,width=1.5)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="miter"/>';
    const line=(d,color=light,width=1)=>path(d,'none',color,width);
    const rect=(x,y,w,h,fill)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'"/>';
    const metal=!['leather','cloak'].includes(kind);
    const shoulders=attack?[
      'M61 76L69 75L77 82L73 89L65 91L58 85Z',
      'M108 74L117 72L123 75L124 82L116 89L106 87L103 81Z',
    ]:[
      'M80 74L88 72L96 77L96 84L89 89L78 86L75 81Z',
      'M117 75L124 76L130 81L129 89L122 94L115 89L112 82Z',
    ];
    let back='';
    if(kind==='cloak'){
      back=attack?path('M66 76L77 80L72 97L63 111L49 118L34 116L21 124L17 119L23 109L32 107L32 100L44 94L50 83Z',shadow)+
        path('M64 79L68 84L60 102L48 111L32 111L25 117L30 108L42 100L49 88Z',base)+line('M54 90L47 104L36 108',light)+line('M42 113L49 109L53 112',trim):
        path('M81 74L91 80L89 97L83 113L73 123L62 119L51 126L46 121L49 106L59 95L65 82Z',shadow)+
        path('M76 80L80 88L74 108L65 116L52 120L55 108L64 97L67 87Z',base)+line('M70 90L64 108L56 115',light)+line('M62 117L68 112L72 115',trim);
    }else if(kind==='royal'){
      back=attack?path('M66 77L76 84L69 100L60 111L41 114L26 122L26 114L35 105L48 98L54 86Z','#263b77')+
        line('M29 117L43 109L56 108',trim,2):path('M80 75L91 82L84 105L75 119L61 122L51 119L57 103L65 91L67 82Z','#263b77')+
        line('M54 117L65 119L74 113',trim,2);
    }
    const chestTransform=attack?'translate(85 99) rotate(27)':'translate(104 96)';
    let chest='';
    if(kind==='leather'||kind==='cloak'){
      chest=path('M-10-13L-4-10L5-10L11-14L15-6L11 9L-12 9L-15-3Z',kind==='cloak'?'#704c32':base)+
        path('M-11-9L-5-6L-6 8L-12 8L-14-2Z',shadow)+
        path('M5-9L10-12L13-5L9 7H5Z',kind==='cloak'?'#a17b49':light)+
        line('M-3-8V7',ink,2)+line('M-6-5L0-2M-6 0L0 3M-6 5L0 8',trim)+
        path('M-11-11L10 3L8 7L-12-6Z','#55382a')+line('M-10-10L9 4',trim)+
        path('M0-1L4 1L2 5L-2 3Z',trim,ink,1);
    }else{
      chest=path('M-11-12L-4-10H4L11-14L15-6L13 5L4 12L-10 8L-15-3Z',base)+
        path('M-11-10L-6-7L-5 5L3 10L-10 6L-13-3Z',shadow)+
        path('M-3-8L4-7L10-11L12-5L9 2L3 6L0 2Z',light,light,.7)+
        path('M-12-11L-4-8H4L11-13L11-10L5-5H-4L-12-8Z',trim,ink,.8)+
        line('M0-5L1 7',base,1.2)+line('M-9 4L3 9L11 3',trim,1.5);
      if(kind==='ice'){
        chest+=path('M1-7L6-2L2 4L-2-1Z',accent,ink,1)+
          line('M3-3V5M-1 1L6 2M-1-1L5 5',light,1)+
          line('M-10-3L-7 0L-10 3M8-6L7-3L10-1',accent,1.3);
      }else if(kind==='fire'){
        chest+=path('M0 6L-5 0L-3-5L0-1L3-9L6-3L5 3Z',accent,ink,1)+
          path('M0 4L-1 0L2-3L3 1Z','#fff5ba','none',0)+
          line('M-10-4L-7-1L-8 3M9-6L7-2L9 0',trim,1.5);
      }else if(kind==='royal'){
        chest+=path('M0-5L3-2L1 0L4 1L2 3H0V6H-2V3H-4L-5 1L-2 0L-4-2Z',trim,ink,.8)+
          path('M0-8L2-6L0-4L-2-6Z',accent,ink,.7);
      }else{
        chest+=line('M-10-5L-7-3M6 4L10 0',light)+
          rect(-9,1,2,2,trim)+rect(9,-5,2,2,trim);
      }
    }
    // Independent tassets bend with the hip instead of stretching one breastplate over the legs.
    let skirt=path('M-12 8L12 8L16 19L6 23L1 18L-5 22L-15 17Z',shadow)+
      path('M-10 9H-2L-4 19L-12 16Z',base)+path('M2 9H10L13 17L6 20L2 16Z',base)+
      line('M-10 11L-11 15L-5 18M5 11L7 17L12 16',trim,1.5)+
      path('M-13 6L12 5L13 9L-12 11Z',kind==='leather'?'#4c3227':ink,ink,1)+
      path('M-1 5H6V11H-1Z',trim,ink,1)+rect(1,7,3,2,shadow);
    if(kind==='cloak')skirt=path('M-12 8L12 8L15 18L6 22L0 18L-6 22L-15 17Z','#68472f')+
      line('M-9 10L-10 16L-5 18M5 10L7 17L11 16','#bd9760',1.5)+
      path('M-12 6L12 5V9L-12 11Z','#402e24')+path('M-1 5H6V11H-1Z',trim,ink,1)+rect(1,7,3,2,shadow);
    const torso='<g class="rig-chest" transform="'+chestTransform+'">'+chest+skirt+'</g>';
    let arms=shoulders.map((shape,index)=>{
      let part=path(shape,kind==='cloak'?shadow:base);
      if(metal){
        const highlight=attack?(index?'M109 75L116 74L121 77L120 80L113 81L107 80Z':'M62 78L68 77L74 82L71 85L64 84Z'):
          (index?'M117 77L122 78L127 82L126 85L119 85L114 81Z':'M80 76L87 74L93 78L92 81L83 81L78 80Z');
        part+=path(highlight,light,trim,1);
        if(kind==='ice'){
          const spike=attack?(index?'M111 74L113 68L117 73L121 70L121 76Z':'M61 78L59 71L65 76L69 72L71 80Z'):
            (index?'M117 77L119 70L123 76L128 74L128 81Z':'M79 76L78 70L83 74L88 70L90 77Z');
          part+=path(spike,accent,ink,1);
        }
        if(kind==='fire')part+=attack?(index?line('M110 83L116 85L121 81',accent,2):line('M62 85L68 87L72 84',accent,2)):
          (index?line('M116 87L122 90L126 86',accent,2):line('M79 83L85 86L92 83',accent,2));
        if(kind==='royal')part+=attack?(index?path('M114 78L116 80L114 83L112 80Z',accent,ink,.8):''):
          path(index?'M120 81L122 83L120 86L118 83Z':'M85 78L87 80L85 83L83 80Z',accent,ink,.8);
      }else if(kind==='cloak'){
        part+=attack?(index?line('M108 76L116 75L121 78',trim,2):line('M61 78L68 77L73 82',trim,2)):
          (index?line('M116 78L122 79L127 83',trim,2):line('M79 77L86 75L93 79',trim,2));
      }else{
        part+=attack?(index?line('M109 76L115 75L120 77',light):line('M62 78L68 77L74 82',light)):
          (index?line('M117 78L122 79L127 83',light):line('M80 77L86 75L93 79',light));
      }
      return part;
    }).join('');
    // The sword arm's bracer ends before the gripping fingers in both poses.
    arms+=attack?path('M119 74L125 72L126 81L120 85L117 81Z',shadow)+line('M120 75L124 74V79',trim,1.5):
      path('M122 88L127 86L130 90L127 96L121 97L119 93Z',shadow)+line('M122 90L126 89L128 91',trim,1.5);
    const legs=attack?[
      {shape:'M46 118L56 113L63 118L59 125L50 130L42 128Z',shine:'M48 118L54 117L58 119L53 123L46 125Z',seam:'M43 127L50 129L55 126'},
      {shape:'M91 112L102 109L109 115L107 122L104 131L94 131L95 123L90 120Z',shine:'M94 114L101 112L106 116L104 119L95 119Z',seam:'M95 128L103 128'},
    ]:[
      {shape:'M83 114L93 113L99 118L95 124L92 132L82 132L84 124L79 120Z',shine:'M84 116L91 115L96 119L93 122L83 120Z',seam:'M83 129L92 129'},
      {shape:'M109 114L118 114L123 119L120 124L121 133L110 133L108 124L105 120Z',shine:'M110 116L116 116L120 119L117 122L108 120Z',seam:'M111 130L119 130'},
    ];
    const greaves=legs.map(leg=>path(leg.shape,kind==='cloak'?'#68472f':shadow)+
      path(leg.shine,metal?base:light,ink,1)+line(leg.seam,trim,1.5)+
      (metal?line(attack?'M97 121L98 126':'M113 123L114 128',light):'')).join('');
    const clasp=kind==='cloak'?'<g transform="'+chestTransform+'">'+
      path('M-11-13L-4-9L-9-4L-16-7Z',base)+path('M5-11L11-15L15-8L8-5Z',base)+
      path('M-2-10L1-12L4-9L1-6Z',trim,ink,1)+'</g>':'';
    return {back:'<g class="rig-armor-cape" shape-rendering="crispEdges">'+back+'</g>',
      front:'<g class="rig-tailored-armor armor-'+kind+'" shape-rendering="crispEdges" data-armor-material="'+kind+'">'+greaves+torso+arms+clasp+'</g>'};
  }
  function render(options={}){
    const pose=options.pose==='attack'?'attack':'ready',bone=poses[pose];
    const weapon=weapons[options.weapon]?options.weapon:'starter-sword';
    const armor=armors[options.armor]?options.armor:'',shield=shields[options.shield]?options.shield:'';
    const profile=weapons[weapon],suit=armors[armor],guard=shields[shield];
    const id='hero-rig-'+(++serial),sprite='arena/'+bone.file+'.webp';
    const image='<image href="'+sprite+'" width="204" height="142"/>';
    const customWeapon=weapon!=='starter-sword';
    const cut=(customWeapon?'<path d="'+bone.weaponCut+'" fill="black"/>':'')+(shield?'<path d="'+bone.shieldCut+'" fill="black"/>':'');
    const colors=suit?.colors;
    const tint=colors?'<filter id="'+id+'-tint" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>'+['R','G','B'].map((channel,i)=>'<feFunc'+channel+' type="table" tableValues="'+colors.map(color=>parseInt(color.slice(1+i*2,3+i*2),16)/255).join(' ')+'"/>').join('')+'</feComponentTransfer></filter>':'';
    const tailored=suit?armorArt(suit,pose):{front:'',back:''};
    const armorLayer=suit?'<g class="rig-worn-armor" mask="url(#'+id+'-armor-mask)"><g clip-path="url(#'+id+'-suit)" filter="url(#'+id+'-tint)">'+image+'</g>'+tailored.front+'</g>':'';
    const [sx,sy,sw,sh]=bone.shieldBox;
    const shieldLayer=guard?'<g class="rig-worn-shield">'+
      '<path d="M'+(bone.left[0]-6)+' '+(bone.left[1]-12)+'l15 3 4 13-11 11-11-8z" fill="'+(colors?.[1]||'#667990')+'" stroke="#172434" stroke-width="2"/>'+
      '<g transform="rotate(-7 '+bone.left.join(' ')+') translate('+sx+' '+sy+') scale('+sw/guard.size+' '+sh/guard.size+')">'+art(guard)+'</g></g>':'';
    const twin=profile.draw==='twin'?'<g class="rig-offhand-weapon" transform="translate('+bone.left.join(' ')+') rotate('+(pose==='attack'?-53:-35)+')">'+blade()+'</g>':'';
    const description=options.label||['Tu caballero',profile.name,suit?.name,guard?.name].filter(Boolean).join(' · ');
    return '<svg class="hero-rig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 204 142" preserveAspectRatio="xMidYMax meet" role="img" aria-label="'+esc(description)+'" data-hero-weapon="'+weapon+'" data-hero-armor="'+armor+'" data-hero-shield="'+shield+'" data-hero-pose="'+pose+'">'+
      '<defs><mask id="'+id+'-body" maskUnits="userSpaceOnUse" x="0" y="0" width="204" height="142" style="mask-type:luminance"><rect width="204" height="142" fill="white"/>'+cut+'</mask>'+
      '<mask id="'+id+'-armor-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="204" height="142" style="mask-type:luminance"><rect width="204" height="142" fill="white"/>'+(customWeapon?'<path d="'+bone.weaponCut+'" fill="black"/>':'')+'<path d="'+bone.shieldCut+'" fill="black"/></mask>'+
      '<clipPath id="'+id+'-hand"><path d="'+bone.handClip+'"/></clipPath><clipPath id="'+id+'-suit"><path d="'+bone.armorClip+'"/>'+(suit?.kind==='cloak'?'<path d="'+bone.capeClip+'"/>':'')+'</clipPath>'+tint+'</defs>'+
      tailored.back+twin+'<g class="rig-body" mask="url(#'+id+'-body)">'+image+'</g>'+armorLayer+shieldLayer+
      (customWeapon?held(profile,pose,bone)+'<g class="rig-grip-hand" clip-path="url(#'+id+'-hand)">'+image+'</g>':'')+'</svg>';
  }
  return {render,items:Object.freeze({weapons:Object.keys(weapons),armors:Object.keys(armors),shields:Object.keys(shields)})};
})();
