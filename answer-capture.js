// MathPath · Autor: Abel Josué Colquehuanca Humpiri
'use strict';

// Answer by voice or by scanning handwriting. The AI only transcribes; the local engine grades the answer.
const abelAnswerCapture=(()=>{
  let call=null,lastInput=null,voiceSession=null,camera=null;
  let voiceDevice='';
  try{voiceDevice=localStorage.getItem('mathpath-microphone')||'';}catch{}
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const superscripts={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
  // Turn symbols a transcription may contain into the syntax the engine reads.
  const normalize=text=>String(text||'')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,group=>'^'+(group.length>1?'(':'')+[...group].map(ch=>superscripts[ch]).join('')+(group.length>1?')':''))
    .replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/√\s*\(/g,'sqrt(')
    .replace(/√\s*([0-9a-z]+)/gi,'sqrt($1)').replace(/\*\*/g,'^').trim();

  const answerInputs=root=>[...root.querySelectorAll('form input[name="answer"]')];
  const questionText=input=>(input.closest('.panel,.fun-exercise,section')?.querySelector('.question')?.textContent||'').trim().slice(0,300);
  const captureIcons={
    voice:'<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 10.5v1a6.5 6.5 0 0 0 13 0v-1M12 18v3.5M8.5 21.5h7"/>',
    camera:'<path d="M8 6l1.5-3h5L16 6h3.5A2.5 2.5 0 0 1 22 8.5v10a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-10A2.5 2.5 0 0 1 4.5 6z"/><circle cx="12" cy="13" r="4"/>',
    file:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8" cy="8" r="1.5"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',
    board:'<path d="M15.5 4.5l4 4M4 20l4.5-1 12-12a2.8 2.8 0 0 0-4-4l-12 12zM13 20h8"/>',
    stop:'<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"/>',
    scan:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3M7 8h10M7 12h10M7 16h6"/>'
  };
  const captureIcon=kind=>'<svg class="capture-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+captureIcons[kind]+'</svg>';
  const captureButton=(kind,label,description)=>'<button type="button" class="capture-btn" data-capture="'+kind+'" aria-label="'+description+'" title="'+description+'"'+(kind==='voice'?' aria-pressed="false"':'')+'>'+captureIcon(kind)+'<span class="capture-label" aria-hidden="true">'+label+'</span></button>';

  function recordingState(button,active){
    button.classList.toggle('recording',active);
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'Detener dictado':'Dictar respuesta');
    button.title=active?'Detener dictado':'Dictar respuesta';
    button.querySelector('.capture-label').textContent=active?'Detener':'Dictar';
    button.querySelector('.capture-icon').outerHTML=captureIcon(active?'stop':'voice');
  }

  function decorate(view){
    for(const input of answerInputs(view)){
      const label=input.closest('label')||input;
      if(label.nextElementSibling?.classList.contains('capture-bar'))continue;
      // Voice for every level; scanning handwriting only for university exercises.
      const scan=input.form?.dataset.level==='3';
      label.insertAdjacentHTML('afterend','<div class="capture-bar" role="group" aria-label="Responder por voz'+(scan?' o escaneando':'')+'">'+
        captureButton('voice','Dictar','Dictar respuesta')+
        (scan?captureButton('camera','Cámara','Escanear con cámara')+
        captureButton('file','Subir foto','Subir foto de la respuesta')+
        captureButton('board','Pizarra','Escribir a mano'):'')+
        '<output class="capture-status" aria-live="polite"></output></div>'+
        '<div class="capture-preview" aria-live="polite" hidden></div>');
      if(input.value)preview(input);
    }
  }

  function barFor(input){return (input.closest('label')||input).nextElementSibling;}
  function status(input,text,kind=''){
    const node=barFor(input)?.querySelector('.capture-status');
    if(node){node.textContent=text;node.dataset.kind=kind;}
  }
  let previewTimer;
  function preview(input){
    clearTimeout(previewTimer);
    const box=barFor(input)?.nextElementSibling;
    if(!box?.classList.contains('capture-preview'))return;
    const value=normalize(input.value);
    if(!value){box.hidden=true;return;}
    if(voiceSession?.input===input&&!voiceSession.stopping&&/[+\-*/^=,(]\s*$/.test(value)){box.hidden=true;return;}
    previewTimer=setTimeout(async()=>{
      try{
        const result=await call('preview',{problem:value});
        const formula=String(result?.formula||'');
        box.hidden=false;
        box.innerHTML=formula.startsWith('<math ')?'<small>El motor lo lee así:</small> '+formula:'<small>⚠️ Revisa la escritura antes de comprobar.</small>';
      }catch{box.hidden=false;box.innerHTML='<small>⚠️ El motor no entiende esta escritura. Corrígela antes de comprobar.</small>';}
    },250);
  }

  function fill(input,answer,source){
    if(!input.isConnected)input=document.querySelector('form input[name="answer"]')||input;
    const value=normalize(answer);
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
    status(input,source+' → '+value+'. Revisa y pulsa Comprobar.','ok');
    preview(input);
    abelFunAudio?.play?.('pop');
    // Bring the check button into view so the student validates the transcription.
    input.form?.querySelector('button:not([type="button"])')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  const failure=(input,error)=>{if(!input.isConnected)input=document.querySelector('form input[name="answer"]')||input;status(input,String(error.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,''),'error');abelFunAudio?.play?.('wrong');};

  // ---- voice ----
  function voicePanel(input){
    const bar=barFor(input);
    let panel=bar.querySelector('.voice-panel');
    if(panel)return panel;
    panel=document.createElement('section');panel.className='voice-panel';panel.setAttribute('aria-label','Dictado de la respuesta');
    panel.innerHTML='<div class="voice-heading"><strong data-voice-state>Te escucho</strong><meter class="voice-level" min="0" max="1" value="0" aria-label="Nivel del micrófono"></meter></div>'+
      '<p class="voice-heard-label">Lo que dices</p><output class="voice-transcript" data-voice-words aria-live="polite">Aquí aparecerán tus palabras…</output>'+
      '<div class="voice-controls"><label>Micrófono<select data-voice-device aria-label="Elegir micrófono"><option value="">Predeterminado</option></select></label>'+
      '<button type="button" class="btn primary" data-voice="done">Terminar</button><button type="button" class="btn" data-voice="cancel">Cancelar</button>'+
      '<button type="button" class="btn" data-voice="again" hidden>Volver a dictar</button></div>'+
      '<p class="voice-help" data-voice-help>Habla con naturalidad. Tu respuesta se escribe arriba mientras hablas.</p>';
    bar.append(panel);
    panel.addEventListener('click',event=>{
      const action=event.target.closest('[data-voice]')?.dataset.voice;
      if(action==='again')void toggleVoice(input,bar.querySelector('[data-capture="voice"]'));
      if(voiceSession?.input!==input)return;
      if(action==='done')void finishVoice(voiceSession);
      if(action==='cancel')void finishVoice(voiceSession,{cancel:true,restore:true});
    });
    panel.querySelector('[data-voice-device]').addEventListener('change',async event=>{
      voiceDevice=event.target.value;try{localStorage.setItem('mathpath-microphone',voiceDevice);}catch{}
      if(voiceSession?.input===input){await finishVoice(voiceSession,{cancel:true,restore:true});await toggleVoice(input,bar.querySelector('[data-capture="voice"]'));}
    });
    return panel;
  }
  async function microphoneChoices(panel){
    try{
      const devices=await navigator.mediaDevices.enumerateDevices(),select=panel.querySelector('[data-voice-device]');
      select.replaceChildren(new Option('Predeterminado',''));
      for(const device of devices.filter(device=>device.kind==='audioinput'&&device.deviceId!=='default'&&device.deviceId!=='communications'))
        select.add(new Option(device.label||'Micrófono '+select.options.length,device.deviceId));
      select.value=voiceDevice;if(select.selectedIndex<0)select.value='';
    }catch{}
  }
  function voiceMessage(session,text){session.panel.querySelector('[data-voice-state]').textContent=text;}
  function voiceReading(session,result){
    if(voiceSession!==session||!session.input.isConnected||session.canceled)return;
    const heard=String(result.heard||'').trim(),answer=normalize(result.answer||'');
    session.heard=heard;
    const words=session.panel.querySelector('[data-voice-words]');
    if(heard&&words.textContent!==heard)words.textContent=heard;
    if(answer&&answer.length<=450&&session.input.value!==answer){
      session.input.value=answer;
      session.input.dispatchEvent(new Event('input',{bubbles:true}));
    }
    if(heard&&!session.stopping)voiceMessage(session,'Te escucho…');
  }
  function pcmText(buffer){
    const bytes=new Uint8Array(buffer);let binary='';
    for(let index=0;index<bytes.length;index+=8000)binary+=String.fromCharCode(...bytes.subarray(index,index+8000));
    return btoa(binary);
  }
  function pumpVoice(session){
    if(!session.ready||session.draining||session.canceled)return session.draining;
    const task=(async()=>{
      while(session.queue.length&&!session.canceled){
        const pcm=session.queue.shift();
        const result=await call('speechStream',{action:'chunk',session:session.id,pcm});
        voiceReading(session,result);
      }
    })();
    session.draining=task;
    task.catch(error=>{session.error=error;session.queue.length=0;void finishVoice(session,{cancel:true,restore:false});})
      .finally(()=>{if(session.draining===task)session.draining=null;});
    return task;
  }
  function releaseVoice(session){
    clearTimeout(session.limit);
    session.stream?.getTracks().forEach(track=>track.stop());
    session.source?.disconnect();session.node?.disconnect();session.sink?.disconnect();
    if(session.context&&session.context.state!=='closed')void session.context.close().catch(()=>{});
  }
  function finishVoice(session,options={}){
    if(session.finishing)return session.finishing;
    session.stopping=true;session.canceled=Boolean(options.cancel||!session.startSent);
    session.button.disabled=true;
    voiceMessage(session,session.canceled?'Dictado detenido':'Terminando de escuchar…');
    session.finishing=(async()=>{
      try{
        if(session.node){
          await new Promise(resolve=>{
            const timer=setTimeout(resolve,700);session.stopped=()=>{clearTimeout(timer);resolve();};
            session.node.port.postMessage({type:session.canceled?'cancel':'stop'});
          });
        }
        releaseVoice(session);
        if(session.begin)await session.begin;
        if(session.canceled)session.queue.length=0;
        else{session.ready=true;await pumpVoice(session);}
        if(session.draining)await session.draining;
        const result=session.startSent?await call('speechStream',{action:session.canceled?'cancel':'stop',session:session.id}):null;
        if(!session.canceled&&result){voiceReading(session,result);}
        if(voiceSession===session&&session.input.isConnected){
          if(session.canceled){
            if(options.restore){session.input.value=session.original;session.input.dispatchEvent(new Event('input',{bubbles:true}));}
            voiceMessage(session,'Dictado detenido');
            if(session.error)throw session.error;
          }else if(result?.heard){
            voiceMessage(session,'Revisa tu respuesta');
            session.panel.querySelector('[data-voice-help]').textContent='Si alguna palabra se entendió mal, corrige «Tu respuesta» antes de comprobar.';
            status(session.input,'Dictado terminado. Revisa y pulsa Comprobar.','ok');
            session.input.focus();
          }else{
            voiceMessage(session,session.peak>.008?'No entendí las palabras':'No llega sonido');
            session.panel.querySelector('[data-voice-help]').textContent=session.peak>.008?
              'El micrófono recibió audio. Prueba despacio: «cinco más seis» o «equis a la cuarta más siete».':
              'Elige otro micrófono en la lista y vuelve a dictar. La barra verde debe moverse al hablar.';
          }
        }
      }catch(error){
        session.queue.length=0;
        if(session.startSent)void call('speechStream',{action:'cancel',session:session.id}).catch(()=>{});
        if(voiceSession===session&&session.input.isConnected){voiceMessage(session,'No pude completar el dictado');failure(session.input,error);}
      }finally{
        releaseVoice(session);
        recordingState(session.button,false);session.button.disabled=false;
        session.panel.querySelector('.voice-level').value=0;
        session.panel.querySelector('[data-voice="done"]').hidden=true;
        session.panel.querySelector('[data-voice="cancel"]').hidden=true;
        session.panel.querySelector('[data-voice="again"]').hidden=false;
        if(voiceSession===session)voiceSession=null;
      }
    })();
    return session.finishing;
  }
  async function toggleVoice(input,button){
    if(voiceSession){
      const previous=voiceSession;await finishVoice(previous);
      if(previous.input===input)return;
    }
    if(!input.isConnected)return;
    const panel=voicePanel(input);
    const session={id:crypto.randomUUID(),input,button,panel,original:input.value,queue:[],ready:false,peak:0,heard:'',started:performance.now()};
    voiceSession=session;panel.hidden=false;
    panel.querySelector('[data-voice="done"]').hidden=false;panel.querySelector('[data-voice="cancel"]').hidden=false;
    panel.querySelector('[data-voice="again"]').hidden=true;
    panel.querySelector('[data-voice-words]').textContent='Aquí aparecerán tus palabras…';
    panel.querySelector('[data-voice-help]').textContent=input.form?.dataset.level==='3'?
      'Tu respuesta se escribe arriba. Ejemplo: «cuatro por equis al cubo más siete».':'Tu respuesta se escribe arriba. Ejemplo: «cinco más seis».';
    status(input,'');voiceMessage(session,'Preparando micrófono…');recordingState(button,true);
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('No se pudo acceder al micrófono en este equipo.');
      try{session.context=new AudioContext({sampleRate:16000});}catch{session.context=new AudioContext();}
      await session.context.resume();
      const settings={channelCount:{ideal:1},echoCancellation:true,noiseSuppression:true,autoGainControl:true};
      try{session.stream=await navigator.mediaDevices.getUserMedia({audio:{...settings,...(voiceDevice?{deviceId:{exact:voiceDevice}}:{})}});}
      catch(error){
        if(!voiceDevice||!['NotFoundError','OverconstrainedError'].includes(error.name))throw error;
        voiceDevice='';try{localStorage.removeItem('mathpath-microphone');}catch{}
        session.stream=await navigator.mediaDevices.getUserMedia({audio:settings});
      }
      if(session.stopping||voiceSession!==session){releaseVoice(session);return;}
      await microphoneChoices(panel);
      await session.context.audioWorklet.addModule(new URL('voice-capture-worklet.js',document.baseURI).href);
      if(session.stopping||voiceSession!==session){releaseVoice(session);return;}
      session.source=session.context.createMediaStreamSource(session.stream);
      session.node=new AudioWorkletNode(session.context,'mathpath-voice-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});
      session.sink=session.context.createGain();session.sink.gain.value=0;
      session.node.port.onmessage=event=>{
        const data=event.data;
        if(data.type==='stopped'){session.stopped?.();return;}
        if(data.type!=='chunk'||session.canceled||voiceSession!==session)return;
        session.peak=Math.max(session.peak,data.peak||0);
        panel.querySelector('.voice-level').value=Math.min(1,(data.level||0)*8);
        if(!session.heard&&performance.now()-session.started>3000)voiceMessage(session,session.peak>.008?'Habla con naturalidad…':'No llega sonido. Prueba otro micrófono.');
        session.queue.push(pcmText(data.pcm));
        if(session.queue.length>40){session.error=new Error('El dictado se atrasó. Inténtalo de nuevo con una respuesta más corta.');void finishVoice(session,{cancel:true,restore:false});return;}
        void pumpVoice(session);
      };
      session.source.connect(session.node);session.node.connect(session.sink);session.sink.connect(session.context.destination);
      session.startSent=true;
      session.begin=call('speechStream',{action:'start',session:session.id,variable:input.form?.dataset.variable||'x'});
      await session.begin;
      if(session.stopping||voiceSession!==session)return;
      session.ready=true;voiceMessage(session,'Te escucho…');void pumpVoice(session);
      session.limit=setTimeout(()=>void finishVoice(session),55000);
      for(const track of session.stream.getAudioTracks())track.addEventListener('ended',()=>{if(!session.stopping)void finishVoice(session);});
    }catch(error){
      if(session.stopping)return;
      session.error=new Error(error.name==='NotAllowedError'?'Permite usar el micrófono en Windows y vuelve a intentarlo.':error.name==='NotFoundError'?'Conecta un micrófono y vuelve a intentar.':error.message||'No se pudo iniciar el micrófono.');
      await finishVoice(session,{cancel:true,restore:false});
    }
  }
  // The offline recognizer needs 16 kHz mono 16-bit PCM.
  async function pcm16k(blob){
    const context=new AudioContext();
    let decoded;
    try{decoded=await context.decodeAudioData(await blob.arrayBuffer());}
    catch{throw new Error('No se pudo leer el audio grabado.');}
    finally{void context.close();}
    const frames=Math.max(1,Math.ceil(decoded.duration*16000));
    const offline=new OfflineAudioContext(1,frames,16000);
    const source=offline.createBufferSource();
    source.buffer=decoded;source.connect(offline.destination);source.start();
    const samples=(await offline.startRendering()).getChannelData(0);
    const bytes=new Uint8Array(samples.length*2);
    const view=new DataView(bytes.buffer);
    let peak=0;
    for(const value of samples)peak=Math.max(peak,Math.abs(value));
    const gain=peak>0&&peak<.5?.9/peak:1;   // quiet microphones get louder before recognition
    samples.forEach((value,index)=>view.setInt16(index*2,Math.max(-1,Math.min(1,value*gain))*32767,true));
    let binary='';
    for(let index=0;index<bytes.length;index+=32768)binary+=String.fromCharCode(...bytes.subarray(index,index+32768));
    return btoa(binary);
  }

  // ---- image (file, camera, whiteboard) ----
  async function readImage(input,image,source){
    status(input,'Leyendo tu respuesta…');
    try{
      const result=await call('answerFromImage',{image,question:questionText(input)});
      if(result.canceled){status(input,'');return;}
      fill(input,result.answer,source);
    }catch(error){failure(input,error);}
  }

  function cameraDialog(){
    if(camera)return camera;
    camera=document.createElement('dialog');
    camera.className='capture-camera';
    camera.innerHTML='<h2>📸 Escanear respuesta</h2><p>Enfoca solo tu respuesta final, con buena luz.</p><div class="capture-frame"><video autoplay playsinline muted></video><i aria-hidden="true"></i></div>'+
      '<div class="row"><button type="button" class="btn primary" data-camera="shoot">Tomar foto y leer</button><button type="button" class="btn" data-camera="close">Cancelar</button></div>';
    document.body.append(camera);
    camera.addEventListener('close',()=>{camera.stream?.getTracks().forEach(track=>track.stop());camera.stream=null;});
    camera.addEventListener('click',event=>{
      const action=event.target.closest('[data-camera]')?.dataset.camera;
      if(action==='close')camera.close();
      if(action==='shoot'){
        const video=camera.querySelector('video');
        if(!video.videoWidth)return;
        const canvas=document.createElement('canvas');
        const scale=Math.min(1,1280/video.videoWidth);
        canvas.width=video.videoWidth*scale;canvas.height=video.videoHeight*scale;
        canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
        const image=canvas.toDataURL('image/jpeg',.85);
        const target=camera.target;
        camera.close();
        abelFunAudio?.play?.('click');
        void readImage(target,image,'Leí en la cámara');
      }
    });
    return camera;
  }
  async function openCamera(input){
    const dialog=cameraDialog();
    try{dialog.stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},facingMode:'environment'}});}
    catch{return failure(input,new Error('No se encontró una cámara disponible. Usa «Subir foto» en su lugar.'));}
    dialog.target=input;
    dialog.querySelector('video').srcObject=dialog.stream;
    dialog.showModal();
  }

  const visibleAnswer=input=>input?.isConnected&&!input.disabled&&input.getClientRects().length>0;
  function prepareBoard(board,input){
    const scan=board.scanState;
    if(!scan)return;
    const visible=answerInputs(document).filter(visibleAnswer);
    const focused=document.activeElement;
    const target=input||(visible.includes(focused)?focused:null)||(visible.includes(lastInput)?lastInput:null)||(visible.length===1?visible[0]:null);
    scan.target=target;scan.result=null;scan.generation++;
    board.querySelector('[data-board-result]').hidden=true;
    board.querySelector('[data-board-status]').textContent=target?'Escribe solo la respuesta final y pulsa Escanear.':'Abre un ejercicio y selecciona el campo «Tu respuesta» para escanear.';
  }

  // Export only the writing: the notebook grid is CSS, never part of the scan.
  function boardImage(canvas){
    const {width,height}=canvas,pixels=canvas.getContext('2d').getImageData(0,0,width,height).data;
    let left=width,top=height,right=-1,bottom=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4;
      if(pixels[i+3]>24&&pixels[i]+pixels[i+1]+pixels[i+2]<735){
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
    }
    if(right<left)return null;
    const copy=document.createElement('canvas'),pad=24;
    copy.width=right-left+1+pad*2;copy.height=bottom-top+1+pad*2;
    const g=copy.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,copy.width,copy.height);
    g.drawImage(canvas,left,top,right-left+1,bottom-top+1,pad,pad,right-left+1,bottom-top+1);
    return copy.toDataURL('image/png');
  }

  function setupBoard(){
    const board=document.querySelector('.fun-board');
    if(!board||board.scanState)return;
    const scan=board.scanState={generation:0,revision:0,pending:false,target:null,result:null};
    board.insertAdjacentHTML('beforeend','<section class="board-scan" aria-label="Escanear lo escrito">'+
      '<div class="board-scan-actions"><button type="button" class="btn primary" data-board="scan">'+captureIcon('scan')+'<span>Escanear respuesta</span></button><small>Escribe → escanea → revisa</small></div>'+
      '<output data-board-status role="status" aria-live="polite"></output>'+
      '<div class="board-scan-result" data-board-result hidden><label>Respuesta detectada<input data-board-answer maxlength="450" autocomplete="off" spellcheck="false"></label>'+
      '<div class="board-scan-preview" data-board-preview></div><button type="button" class="btn primary" data-board="use">Usar respuesta</button></div></section>');
    const notice=(message,error=false)=>{const node=board.querySelector('[data-board-status]');node.textContent=message;node.dataset.kind=error?'error':'';};
    const valid=result=>visibleAnswer(result.target)&&questionText(result.target)===result.question&&result.revision===scan.revision;
    const invalidate=()=>{scan.revision++;scan.generation++;scan.result=null;board.querySelector('[data-board-result]').hidden=true;notice('Pulsa Escanear cuando termines de escribir.');};
    board.querySelector('canvas').addEventListener('pointerdown',invalidate);
    board.addEventListener('close',()=>{scan.generation++;});
    let previewVersion=0;
    async function detectedPreview(){
      const version=++previewVersion,node=board.querySelector('[data-board-preview]');
      const value=normalize(board.querySelector('[data-board-answer]').value);
      node.textContent='';
      if(!value)return;
      try{const result=await call('preview',{problem:value});if(version===previewVersion&&String(result?.formula||'').startsWith('<math '))node.innerHTML=result.formula;}catch{}
    }
    board.querySelector('[data-board-answer]').addEventListener('input',()=>void detectedPreview());
    board.addEventListener('click',async event=>{
      const command=event.target.closest('[data-board]')?.dataset.board;
      if(command==='clear'){invalidate();return;}
      if(command==='use'){
        const result=scan.result;
        if(!result||!valid(result)){notice('El ejercicio o los trazos cambiaron. Escanea de nuevo.',true);return;}
        const answer=normalize(board.querySelector('[data-board-answer]').value);
        if(!answer){notice('Revisa la respuesta antes de usarla.',true);return;}
        board.close();fill(result.target,answer,'Leí en la pizarra');return;
      }
      if(command!=='scan'||scan.pending)return;
      if(!visibleAnswer(scan.target)){prepareBoard(board);}
      if(!scan.target){notice('Selecciona primero el campo «Tu respuesta» de un ejercicio.',true);return;}
      const image=boardImage(board.querySelector('canvas'));
      if(!image){notice('La pizarra está vacía. Escribe tu respuesta primero.',true);return;}
      const result={target:scan.target,question:questionText(scan.target),revision:scan.revision};
      const generation=++scan.generation,button=board.querySelector('[data-board="scan"]');
      scan.pending=true;scan.result=null;board.querySelector('[data-board-result]').hidden=true;
      button.disabled=true;button.querySelector('span').textContent='Leyendo…';board.querySelector('.board-scan').setAttribute('aria-busy','true');
      notice('Leyendo tus trazos…');
      try{
        const reading=await call('answerFromImage',{image,question:result.question});
        if(!board.open||generation!==scan.generation)return;
        if(!valid(result)){notice('El ejercicio cambió. Vuelve a abrir la pizarra desde «Tu respuesta».',true);return;}
        if(reading.canceled||!String(reading.answer||'').trim())throw new Error('No pude leer la respuesta. Repasa los trazos y vuelve a escanear.');
        scan.result=result;
        board.querySelector('[data-board-answer]').value=normalize(reading.answer);
        board.querySelector('[data-board-result]').hidden=false;
        notice('Revisa la lectura. Puedes corregirla antes de usarla.');
        void detectedPreview();
      }catch(error){if(board.open&&generation===scan.generation)notice(String(error.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,''),true);}
      finally{scan.pending=false;button.disabled=false;button.querySelector('span').textContent='Escanear respuesta';board.querySelector('.board-scan').removeAttribute('aria-busy');}
    });
  }

  function openBoard(input){
    const board=document.querySelector('.fun-board');
    if(!board)return failure(input,new Error('La pizarra no está disponible.'));
    prepareBoard(board,input);
    if(!board.open){board.show();requestAnimationFrame(()=>board.fit?.());}
    status(input,'Escribe tu respuesta en la pizarra y pulsa «Escanear respuesta».');
  }

  function init(callFn){
    call=callFn;
    setupBoard();
    new MutationObserver(()=>{if(voiceSession&&!voiceSession.input.isConnected)void finishVoice(voiceSession,{cancel:true});}).observe(document.querySelector('#content')||document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&voiceSession)void finishVoice(voiceSession);});
    addEventListener('beforeunload',()=>{if(voiceSession)releaseVoice(voiceSession);});
    document.addEventListener('submit',event=>{
      if(voiceSession?.input.form!==event.target)return;
      event.preventDefault();event.stopImmediatePropagation();void finishVoice(voiceSession);
    },true);
    document.addEventListener('focusin',event=>{if(event.target.matches?.('input[name="answer"]'))lastInput=event.target;});
    document.addEventListener('input',event=>{
      const input=event.target;
      if(!input.matches?.('form input[name="answer"]'))return;
      if(event.isTrusted&&voiceSession?.input===input)void finishVoice(voiceSession,{cancel:true,restore:false});
      const fixed=normalize(input.value);
      if(fixed!==input.value.trim()&&/[⁰-⁹×÷−π√·]/.test(input.value)){
        const at=input.selectionStart;input.value=fixed;input.setSelectionRange(Math.min(at,fixed.length),Math.min(at,fixed.length));
      }
      preview(input);
    });
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-capture]');
      if(!button)return;
      event.preventDefault();
      const input=button.closest('form')?.querySelector('input[name="answer"]');
      if(!input)return;
      lastInput=input;
      const kind=button.dataset.capture;
      if(kind==='voice')void toggleVoice(input,button);
      if(kind==='file')void readImage(input,'','Leí en la foto');
      if(kind==='camera')void openCamera(input);
      if(kind==='board')openBoard(input);
    });
  }
  return {init,decorate,normalize,pcm16k,prepareBoard};
})();
