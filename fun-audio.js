// MathPath · Autor: Abel Josué Colquehuanca Humpiri
'use strict';

// Synthesized sound effects and chiptune music. No audio files are needed.
const abelFunAudio=(()=>{
  let context=null,master=null,musicGain=null,musicTimer=null,musicTheme='',step=0;
  const read=(key,fallback)=>{try{const value=localStorage.getItem(key);return value===null?fallback:value;}catch{return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
  let muted=read('mathpath-muted','0')==='1';
  let musicOn=read('mathpath-music','1')==='1';

  function ready(){
    if(!context){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return null;
      context=new Audio();
      master=context.createGain();master.gain.value=.5;master.connect(context.destination);
      musicGain=context.createGain();musicGain.gain.value=.12;musicGain.connect(master);
    }
    if(context.state==='suspended')void context.resume();
    return context;
  }

  function tone(freq,start,length,{type='square',volume=.18,slide=0,target=master}={}){
    const ctx=ready();if(!ctx)return;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    const at=ctx.currentTime+start;
    osc.type=type;osc.frequency.setValueAtTime(freq,at);
    if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),at+length);
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(volume,at+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,at+length);
    osc.connect(gain);gain.connect(target);
    osc.start(at);osc.stop(at+length+.05);
  }

  function noise(start,length,volume=.2,filterFreq=1200){
    const ctx=ready();if(!ctx)return;
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    filter.type='lowpass';filter.frequency.value=filterFreq;
    gain.gain.value=volume;
    source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(master);
    source.start(ctx.currentTime+start);
  }

  const effects={
    click:()=>tone(660,0,.05,{type:'triangle',volume:.08}),
    correct:()=>{tone(660,0,.1,{type:'triangle'});tone(880,.09,.16,{type:'triangle'});},
    wrong:()=>{tone(220,0,.18,{type:'sawtooth',volume:.12,slide:-80});tone(165,.15,.22,{type:'sawtooth',volume:.1});},
    hit:()=>{noise(0,.12,.25,1800);tone(180,0,.1,{slide:-90,volume:.14});},
    crit:()=>{noise(0,.18,.3,3000);tone(520,0,.08);tone(1040,.06,.18,{type:'triangle'});tone(1560,.12,.2,{type:'triangle',volume:.12});},
    combo:()=>[523,659,784,1047].forEach((f,i)=>tone(f,i*.06,.14,{type:'square',volume:.12})),
    hurt:()=>{noise(0,.2,.28,700);tone(140,0,.25,{type:'sawtooth',slide:-60,volume:.14});},
    blocked:()=>{tone(900,0,.05,{type:'square',volume:.1});noise(0,.08,.18,4000);},
    coin:()=>{tone(988,0,.07,{type:'square',volume:.1});tone(1319,.06,.18,{type:'square',volume:.1});},
    win:()=>[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i*.11,.2,{type:'square',volume:.13})),
    lose:()=>[392,349,311,262].forEach((f,i)=>tone(f,i*.18,.3,{type:'triangle',volume:.14})),
    levelup:()=>[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.07,.22,{type:'square',volume:.12})),
    chest:()=>{noise(0,.3,.12,600);[784,988,1175,1568].forEach((f,i)=>tone(f,.25+i*.08,.3,{type:'triangle',volume:.14}));},
    achievement:()=>[659,784,988,1319].forEach((f,i)=>tone(f,i*.09,.28,{type:'triangle',volume:.15})),
    tick:()=>tone(1200,0,.03,{type:'square',volume:.05}),
    pop:()=>tone(440,0,.08,{type:'sine',volume:.15,slide:400}),
  };

  function play(name){
    if(muted||!effects[name])return;
    try{effects[name]();}catch{}
  }

  // Each biome gets its own scale, tempo and bass line.
  const themes={
    bridge:{tempo:150,scale:[262,294,330,392,440,523],bass:[131,98,110,87]},
    forest:{tempo:140,scale:[294,330,370,440,494,587],bass:[147,110,123,98]},
    cavern:{tempo:120,scale:[220,247,262,330,349,440],bass:[110,82,87,73]},
    snow:{tempo:110,scale:[330,370,415,494,554,659],bass:[165,123,139,110]},
    castle:{tempo:160,scale:[262,311,349,392,466,523],bass:[131,104,117,98]},
    desert:{tempo:130,scale:[294,311,370,392,440,523],bass:[147,98,110,73]},
    marsh:{tempo:105,scale:[220,262,294,330,392,440],bass:[110,87,98,73]},
    volcano:{tempo:170,scale:[247,262,311,370,392,494],bass:[123,92,104,82]},
    mill:{tempo:145,scale:[349,392,440,523,587,698],bass:[175,131,147,117]},
    boss:{tempo:180,scale:[233,247,277,311,349,370],bass:[117,92,98,73]},
    menu:{tempo:100,scale:[262,330,392,494,523,659],bass:[131,110,87,98]},
  };
  function music(theme){
    if(theme===musicTheme&&musicTimer)return;
    stopMusic();
    if(muted||!musicOn||!themes[theme]||!ready())return;
    musicTheme=theme;step=0;
    const {tempo,scale,bass}=themes[theme];
    const beat=60/tempo/2;
    const pattern=[0,2,4,2,5,4,2,1,0,3,4,3,5,4,3,2];
    musicTimer=setInterval(()=>{
      if(document.hidden)return;
      const note=scale[pattern[step%16]];
      tone(note,0,beat*.9,{type:'square',volume:.5,target:musicGain});
      if(step%4===0)tone(bass[(step/4|0)%4],0,beat*3.6,{type:'triangle',volume:.9,target:musicGain});
      if(step%2===1)tone(80,0,.04,{type:'sine',volume:.6,target:musicGain});
      step++;
    },beat*1000);
  }
  function stopMusic(){clearInterval(musicTimer);musicTimer=null;musicTheme='';}

  function setMuted(value){
    muted=value;write('mathpath-muted',value?'1':'0');
    if(muted)stopMusic();
  }
  function setMusic(value){
    musicOn=value;write('mathpath-music',value?'1':'0');
    if(!value)stopMusic();
  }
  return {play,music,stopMusic,setMuted,setMusic,
    get muted(){return muted;},get musicOn(){return musicOn;},get theme(){return musicTheme;}};
})();
