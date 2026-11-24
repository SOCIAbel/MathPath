'use strict';

// Optional bitmap art decorates the existing game without owning its state.
const pixelArt=(()=>{
  const cache=new Map();
  const petAnchors={"draco-1.webp":[50.0,34.03],"buho-1.webp":[49.61,16.84],"slime-1.webp":[49.61,37.16],"draco-4.webp":[50.39,33.25],"slime-0.webp":[49.61,33.25],"draco-0.webp":[49.22,38.72],"buho-3.webp":[48.44,18.41],"buho-4.webp":[49.61,16.84],"buho-2.webp":[48.83,18.41],"draco-3.webp":[52.73,21.53],"buho-0.webp":[50.0,31.69],"draco-2.webp":[51.95,24.66],"slime-2.webp":[50.78,37.16],"slime-3.webp":[49.22,34.81],"slime-4.webp":[48.83,37.16]};
  const kings=new Set(['golem','mushroom','beetle','yeti','armor','sphinx','frog','lizard','scarecrow',
    'oak-boar','amethyst-bat','blizzard-wolf','copper-owl','solar-scorpion','moss-turtle','obsidian-ram',
    'miller-fox','thorn-stag','quartz-crab','ice-walrus','crest-griffin','temple-cobra','moss-witch',
    'ash-phoenix','wind-badger','canopy-spider','geode-slug','polar-hare','bell-gargoyle','dunes-vulture',
    'swamp-caiman','caldera-ape','miller-puppet','oak-hornet','crystal-mole']);
  const buildings=['Casa','Herrería','Panadería','Mercado','Posada','Molino','Biblioteca','Establo',
    'Tienda de pociones','Torre','Molino de agua','Castillo'];
  const medalGroups={
    llama:['Encendido','Imparable','Leyenda diaria','Disciplina'],
    espada:['Espada en mano','Caballero veterano','Rivalidad sana','Combo','Combo maestro'],
    corona:['Cazador de jefes','Terror de los reyes','Domador legendario','Héroe de MathPath'],
    rayo:['¡Crítico!','Rayo veloz','Superviviente','Inmortal','Ojo de halcón'],
    libro:['Calculadora humana','Mente brillante','Matrícula de honor','Investigador'],
    llave:['Explorador de errores','Tesoro','Misión especial'],
    carta:['Coleccionista','Gran archivo'],
  };
  const medalFor=new Map(Object.entries(medalGroups).flatMap(([symbol,names])=>names.map(name=>[name,symbol])));
  let scheduled=false;

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;upgrade();});
  }
  function available(file){
    if(!cache.has(file)){
      cache.set(file,'loading');
      const image=new Image();
      image.onload=()=>{cache.set(file,'ready');schedule();};
      image.onerror=()=>cache.set(file,'missing');
      image.src=file;
    }
    return cache.get(file)==='ready';
  }
  function picture(file,className,width,height=width){
    const image=new Image(width,height);
    image.src=file;image.className=className;image.alt='';image.draggable=false;
    return image;
  }
  function upgradeMedals(){
    for(const card of document.querySelectorAll('.fun-achievement')){
      const medal=card.querySelector('.fun-medal');
      if(!medal||medal.dataset.pixelArt)continue;
      const name=card.querySelector('strong')?.textContent;
      const file='recursos/logros/'+(medalFor.get(name)||'estrella')+'.webp';
      if(!available(file))continue;
      medal.replaceChildren(picture(file,'pixel-medal',56));
      medal.dataset.pixelArt='true';
      if(!card.classList.contains('got')){
        const lock=document.createElement('small');lock.className='pixel-medal-lock';lock.textContent='🔒';
        medal.append(lock);
      }
    }
  }
  function upgradeBosses(){
    for(const arena of document.querySelectorAll('.combat-arena.fun-crowned')){
      if(arena.classList.contains('pixel-royal'))continue;
      const id=arena.dataset.arenaRival;
      if(!kings.has(id))continue;
      const file='arena/'+id+'-rey.webp';
      if(!available(file))continue;
      const actor=arena.querySelector('.arena-character.enemy');
      if(!actor)continue;
      // Both animation states keep the king's identity during the four existing attacks.
      for(const image of actor.querySelectorAll(':scope > img'))image.src=file;
      for(const image of arena.closest('.combat-stage').querySelectorAll('svg image')){
        if(['arena/'+id+'.webp','arena/'+id+'-attack.webp'].includes(image.getAttribute('href')))
          image.setAttribute('href',file);
      }
      arena.classList.add('pixel-royal');
    }
    for(const boss of document.querySelectorAll('.fun-world-boss')){
      if(boss.dataset.pixelArt)continue;
      const reference=boss.closest('.route-biome')?.querySelector('.biome-rival')?.getAttribute('src');
      const id=reference?.match(/^arena\/([a-z-]+)\.webp$/)?.[1];
      if(!kings.has(id))continue;
      const file='arena/'+id+'-rey.webp',host=boss.querySelector(':scope > span');
      if(!host||!available(file))continue;
      host.replaceChildren(picture(file,'pixel-boss-portrait',72));
      boss.dataset.pixelArt='true';
    }
  }
  function upgradeTown(){
    for(const town of document.querySelectorAll('.fun-town')){
      if(town.dataset.pixelArt)continue;
      const original=town.querySelector(':scope > svg');
      const file='recursos/aldea/aldea-panorama.webp';
      if(!original||!available(file))continue;
      const count=original.querySelectorAll('.fun-house.built').length;
      const panorama=document.createElement('div');
      panorama.className='pixel-town';panorama.setAttribute('role','img');
      panorama.setAttribute('aria-label',count+' de 12 construcciones: '+buildings.slice(0,count).join(', '));
      for(let index=0;index<12;index++){
        const tile=document.createElement('span');
        tile.className='pixel-town-building'+(index<count?' built':' planned');
        tile.style.setProperty('--tile-position',index*100/11+'%');
        tile.style.setProperty('--build-delay',index*50+'ms');
        tile.title=buildings[index]+(index<count?' · Construido':' · Por construir');
        if(index>=count){const mark=document.createElement('b');mark.textContent='🔒';tile.append(mark);}
        panorama.append(tile);
      }
      original.setAttribute('hidden','');town.append(panorama);town.dataset.pixelArt='true';
    }
  }
  function alignHats(){
    for(const pet of document.querySelectorAll('.fun-pet-art')){
      if(pet.dataset.pixelArt)continue;
      const name=pet.querySelector('img')?.getAttribute('src');
      const anchor=petAnchors[name?.split('/').at(-1)]||[50,22];
      pet.style.setProperty('--hat-x',(anchor[0]-50)+'%');
      pet.style.setProperty('--hat-y',(anchor[1]-22)+'%');
      pet.dataset.pixelArt='true';
    }
  }
  function upgrade(){upgradeMedals();upgradeBosses();upgradeTown();alignHats();}
  function init(){
    const host=document.querySelector('#content');
    if(!host)return;
    new MutationObserver(schedule).observe(host,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  return {refresh:schedule};
})();
