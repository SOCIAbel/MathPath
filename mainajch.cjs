const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { existsSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');

app.setName('MathPath');
const testing = process.env.MATHPATH_SMOKE === '1';
if (process.env.MATHPATH_DATA_DIR && !testing) app.setPath('userData',path.resolve(process.env.MATHPATH_DATA_DIR));
if (testing) {
  app.setPath('userData',app.isPackaged?path.join(os.tmpdir(),'mathpath-smoke-'+process.pid):path.join(__dirname,'.qa','app-data-'+process.pid));
  app.disableHardwareAcceleration();
}
const entry = path.join(__dirname,'indexajch.html');
const entryUrl = pathToFileURL(entry).href;
let mainWindow;
let shuttingDown=false;
const bundlePython = path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','python','python.exe');
const python = process.env.MATHPATH_PYTHON || (existsSync(bundlePython)?bundlePython:'python');
const engine = path.join(process.resourcesPath,'engine','mathpath-engine.exe');
const dataDir = app.getPath('userData');
const database = path.join(dataDir,'aprendizaje.sqlite');
const aiFile = path.join(dataDir,'ai.json');

class WorkerBridge {
  constructor(){
    this.pending=new Map();
    this.sequence=0;
    this.process=null;
  }

  start(){
    const command=app.isPackaged?engine:python;
    const args=app.isPackaged?[database]:['-X','utf8','-B',path.join(__dirname,'workerajch.py'),database];
    const env={...process.env,PYTHONUTF8:'1'};
    if(app.isPackaged){delete env.PYTHONHOME;delete env.PYTHONPATH;}
    const child=spawn(command,args,{
      cwd:app.isPackaged?dataDir:__dirname, env, stdio:['pipe','pipe','pipe'], windowsHide:true
    });
    this.process=child;
    const output=createInterface({input:child.stdout});
    output.on('line',line=>{
      try {
        const message=JSON.parse(line);
        const waiting=this.pending.get(message.id);
        if(!waiting)return;
        this.pending.delete(message.id);
        clearTimeout(waiting.timeout);
        if(message.error)waiting.reject(new Error(message.error));
        else waiting.resolve(message.result);
      } catch(error) { console.error('Respuesta de Python:',error.message); }
    });
    child.stderr.on('data',data=>console.error(data.toString('utf8').trim()));
    child.stdin.on('error',()=>{});
    child.once('error',error=>this.fail(child,'No se pudo iniciar Python. Revisa la instalación de MathPath. '+error.message));
    child.once('exit',()=>this.fail(child,'Se cerró el motor matemático. Vuelve a intentarlo.'));
  }

  fail(child,message){
    if(this.process!==child)return;
    this.process=null;
    for(const {reject,timeout} of this.pending.values()){
      clearTimeout(timeout);
      reject(new Error(message));
    }
    this.pending.clear();
  }

  call(name,args={}){
    const payload=JSON.stringify({id:++this.sequence,name,args});
    if(payload.length>(name==='notebook'?170000:17000))
      return Promise.reject(new Error('El contenido es demasiado largo para una sola consulta.'));
    if(!this.process)this.start();
    const child=this.process, id=this.sequence;
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{
        this.fail(child,'El cálculo superó el tiempo disponible. Simplifica la entrada e inténtalo de nuevo.');
        child.kill();
      },32000);
      this.pending.set(id,{resolve,reject,timeout});
      child.stdin.write(payload+'\n','utf8',error=>{
        if(!error||!this.pending.has(id))return;
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(new Error('No se pudo enviar la consulta al motor.'));
      });
    });
  }

  close(){ if(this.process){const child=this.process;this.fail(child,'MathPath se está cerrando.');child.kill();} }
}

const worker = new WorkerBridge();
const workerOperations = new Set(['status','lesson','solve','example','preview','graph','matrixStep','notebook','solved','practice','grade','adventure','village','hint','retry',
  'activeExam','examStart','examSubmit','examDraft','examReview','settings','demo','study','teacher','validateSteps','note','fun','speechStream']);

async function getAiAjch(){
  return fs.readFile(aiFile,'utf8').then(JSON.parse).catch(error=>error.code==='ENOENT'?{}:Promise.reject(error));
}

async function setAiAjch(input){
  if(input.enabled!==true){
    await fs.rm(aiFile,{force:true});
    return {enabled:false};
  }
  if(!safeStorage.isEncryptionAvailable())throw new Error('El sistema no pudo habilitar el almacenamiento seguro de la clave.');
  const endpoint=new URL(String(input.endpoint||''));
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.hash)throw new Error('Usa un endpoint HTTPS sin credenciales en la URL.');
  const model=String(input.model||'').trim().slice(0,120);
  if(!model)throw new Error('Especifica el nombre del modelo.');
  const old=await getAiAjch();
  const secret=String(input.key||'').trim().slice(0,600);
  const key=secret?safeStorage.encryptString(secret).toString('base64'):old.endpoint===endpoint.href?old.key:null;
  if(!key)throw new Error('Ingresa la clave de API para este endpoint.');
  const temp=aiFile+'.tmp';
  await fs.writeFile(temp,JSON.stringify({endpoint:endpoint.href,model,key}));
  await fs.rename(temp,aiFile);
  return {enabled:true,endpoint:endpoint.href,model};
}

async function pickHintAjch(input){
  const grounding=await worker.call('teacher',input);
  if(grounding.clarify)return {grounding};
  const config=await getAiAjch();
  if(!config.key)return {grounding,note:'La IA está desactivada. Se usó la guía local.'};
  try {
    const secret=safeStorage.decryptString(Buffer.from(config.key,'base64'));
    const response=await fetch(config.endpoint,{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret},
      body:JSON.stringify({
        model:config.model,
        messages:[
          {role:'system',content:'Elige qué pista didáctica mostrar primero. Responde solo con el índice numérico de una de las pistas dadas. No calcules ni inventes resultados.'},
          {role:'user',content:JSON.stringify({question:String(input.question||'').slice(0,500),topic:grounding.name,hints:grounding.hints.map((hint,index)=>({index,...hint}))})}
        ],
        max_tokens:12
      }),signal:AbortSignal.timeout(10000),redirect:'error'
    });
    if(!response.ok)throw new Error('El proveedor devolvió HTTP '+response.status+'.');
    const payload=await response.json();
    const choice=payload.choices?.[0]?.message?.content?.trim();
    if(!/^[0-9]$/.test(choice)||!grounding.hints[Number(choice)])throw new Error('El proveedor no eligió una pista válida.');
    return {grounding,choice:Number(choice),note:'La IA ordenó las pistas del contenido local.'};
  } catch(error) {
    return {grounding,note:'Se usó la guía local. '+error.message};
  }
}

async function askAiAjch(messages,maxTokens){
  const config=await getAiAjch();
  if(!config.key)return null;
  const secret=safeStorage.decryptString(Buffer.from(config.key,'base64'));
  const response=await fetch(config.endpoint,{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret},
    body:JSON.stringify({model:config.model,messages,max_tokens:maxTokens}),
    signal:AbortSignal.timeout(25000),redirect:'error'
  });
  if(!response.ok)throw new Error('El proveedor devolvió HTTP '+response.status+'.');
  const payload=await response.json();
  return String(payload.choices?.[0]?.message?.content||'').trim();
}

async function explainSimpleAjch(args){
  const lesson=await worker.call('lesson',{id:args?.topic});
  const local='En pocas palabras: '+lesson.goal+' '+String(lesson.theory||'').split(/(?<=\.)\s/)[0]+
    (lesson.formula?' La regla clave es: '+lesson.formula+'.':'');
  try{
    const text=await askAiAjch([
      {role:'system',content:'Eres un profesor de matemáticas muy paciente. Reescribe la explicación para un niño de 10 años en español, '+
        'con un ejemplo de la vida diaria y máximo 120 palabras. No inventes resultados numéricos nuevos ni cambies la regla.'},
      {role:'user',content:JSON.stringify({tema:lesson.name,objetivo:lesson.goal,explicacion:lesson.theory,regla:lesson.formula})}
    ],320);
    if(text)return {text:text.slice(0,1500),source:'ia'};
    return {text:local,source:'local',note:'Activa la IA en Configuración para una explicación más completa.'};
  }catch(error){
    return {text:local,source:'local',note:'Se usó la versión local. '+error.message};
  }
}

async function photoProblemAjch(){
  const config=await getAiAjch();
  if(!config.key)throw new Error('Configura la IA en Configuración con un modelo que acepte imágenes para leer fotos.');
  const source=await dialog.showOpenDialog(mainWindow,{title:'Elegir foto del ejercicio',properties:['openFile'],
    filters:[{name:'Imágenes',extensions:['png','jpg','jpeg','webp']}]});
  if(source.canceled)return {canceled:true};
  const file=source.filePaths[0];
  const stat=await fs.stat(file);
  if(stat.size>5*1024*1024)throw new Error('La imagen debe pesar menos de 5 MB.');
  const extension=path.extname(file).slice(1).toLowerCase().replace('jpg','jpeg');
  const image='data:image/'+extension+';base64,'+(await fs.readFile(file)).toString('base64');
  const text=await askAiAjch([
    {role:'system',content:'Transcribe solo el ejercicio matemático de la imagen como una expresión en texto plano. '+
      'Usa * para multiplicar, / para dividir, ^ para potencias, sqrt() para raíces y = para ecuaciones. '+
      'Si hay un sistema, separa las ecuaciones con ;. Responde únicamente con la expresión, sin resolverla.'},
    {role:'user',content:[{type:'text',text:'Transcribe el ejercicio.'},{type:'image_url',image_url:{url:image}}]}
  ],120);
  const problem=String(text||'').replace(/^```\w*|```$/g,'').replace(/\s+/g,' ').trim().slice(0,300);
  if(!problem)throw new Error('No se pudo leer un ejercicio en la foto.');
  return {problem};
}

const answerRules='Usa ^ para potencias, * o nada para multiplicar, / para dividir, sqrt() para raíces, pi para π, '+
  'ln(), log(), sin(), cos(), tan() y e^() para exponenciales. Si hay constante de integración escribe + C. '+
  'Responde únicamente con la expresión, sin explicaciones, sin LaTeX y sin comillas.';
const cleanAnswer=text=>String(text||'').replace(/^```\w*|```$/g,'').replace(/^(respuesta|answer)\s*[:=]\s*/i,'')
  .replace(/\$+/g,'').replace(/\s+/g,' ').trim().slice(0,300);

async function withTempFileAjch(extension,data,task){
  const file=path.join(dataDir,'.captura-'+randomUUID()+extension);
  await fs.writeFile(file,data,{flag:'wx'});
  try{return await task(file);}
  finally{await fs.rm(file,{force:true});}
}

async function answerFromImageAjch(args){
  let image=typeof args?.image==='string'?args.image:'';
  if(image){
    if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)||image.length>8*1024*1024)
      throw new Error('La imagen no es válida o es demasiado grande.');
  }else{
    const source=await dialog.showOpenDialog(mainWindow,{title:'Elegir foto de tu respuesta',properties:['openFile'],
      filters:[{name:'Imágenes',extensions:['png','jpg','jpeg','webp']}]});
    if(source.canceled)return {canceled:true};
    const file=source.filePaths[0];
    if((await fs.stat(file)).size>6*1024*1024)throw new Error('La imagen debe pesar menos de 6 MB.');
    const extension=path.extname(file).slice(1).toLowerCase().replace('jpg','jpeg');
    image='data:image/'+extension+';base64,'+(await fs.readFile(file)).toString('base64');
  }
  const [,kind,base64]=image.match(/^data:image\/(png|jpeg|webp);base64,(.*)$/);
  let localError='';
  try{
    const local=await withTempFileAjch('.'+kind.replace('jpeg','jpg'),Buffer.from(base64,'base64'),file=>worker.call('scan',{path:file}));
    if(local.answer)return {answer:local.answer,latex:local.latex,source:'local'};
    localError='No se encontró una fórmula en la imagen.';
  }catch(error){localError=error.message;}
  const config=await getAiAjch();
  if(!config.key)throw new Error(localError+' Escribe más grande y con buena luz, o enfoca solo la respuesta final.');
  const question=String(args?.question||'').slice(0,300);
  const text=await askAiAjch([
    {role:'system',content:'Transcribe exactamente la respuesta matemática final escrita a mano en la imagen. No la corrijas ni resuelvas '+
      'el ejercicio: si está mal, transcríbela igual. Si hay varios pasos, toma solo el último resultado. '+answerRules},
    {role:'user',content:[{type:'text',text:'Ejercicio (solo como contexto, no lo resuelvas): '+question},{type:'image_url',image_url:{url:image}}]}
  ],120);
  const answer=cleanAnswer(text);
  if(!answer)throw new Error('No se pudo leer una respuesta en la imagen.');
  return {answer,source:'ia'};
}

function wavFromPcmAjch(pcm){
  const header=Buffer.alloc(44);
  header.write('RIFF',0);header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);
  header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(16000,24);
  header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);
  header.writeUInt32LE(pcm.length,40);
  return Buffer.concat([header,pcm]);
}

async function dictateAnswerAjch(args){
  const pcmText=typeof args?.pcm==='string'?args.pcm:'';
  if(!pcmText||pcmText.length>4*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(pcmText))throw new Error('No se recibió un audio válido.');
  const pcm=Buffer.from(pcmText,'base64');
  const variable=/^[xyzt]$/.test(String(args?.variable))?args.variable:'x';
  let localError='';
  try{
    const local=await withTempFileAjch('.raw',pcm,file=>worker.call('speech',{path:file,variable}));
    if(local.answer)return {heard:local.heard,answer:local.answer,source:'local'};
    localError=local.heard?'Escuché «'+local.heard+'» pero no es una respuesta matemática.':'No se escuchó ninguna respuesta. Habla cerca del micrófono.';
  }catch(error){localError=error.message;}
  const config=await getAiAjch();
  if(!config.key)throw new Error(localError);
  const endpoint=new URL(config.endpoint);
  if(!/\/chat\/completions\/?$/.test(endpoint.pathname))throw new Error(localError);
  endpoint.pathname=endpoint.pathname.replace(/\/chat\/completions\/?$/,'/audio/transcriptions');
  const secret=safeStorage.decryptString(Buffer.from(config.key,'base64'));
  const form=new FormData();
  form.append('file',new Blob([wavFromPcmAjch(pcm)],{type:'audio/wav'}),'respuesta.wav');
  form.append('model',process.env.MATHPATH_TRANSCRIBE_MODEL||'whisper-1');
  form.append('language','es');
  const response=await fetch(endpoint,{method:'POST',headers:{'Authorization':'Bearer '+secret},body:form,
    signal:AbortSignal.timeout(30000),redirect:'error'});
  if(!response.ok)throw new Error(localError+' (la IA tampoco pudo transcribirlo: HTTP '+response.status+')');
  const heard=String((await response.json()).text||'').trim().slice(0,400);
  if(!heard)throw new Error(localError);
  const text=await askAiAjch([
    {role:'system',content:'Convierte una respuesta matemática dictada en español a una expresión en texto plano. '+
      'Ejemplos: "x a la cuarta más tres x más c" → x^4 + 3x + C; "raíz de dos sobre dos" → sqrt(2)/2; '+
      '"menos coseno de x" → -cos(x); "un medio" → 1/2. No resuelvas nada ni corrijas la respuesta. '+answerRules},
    {role:'user',content:heard}
  ],80);
  return {heard,answer:cleanAnswer(text)||heard,source:'ia'};
}

async function localFilesAjch(name){
  if(name==='backup'){
    const target=await dialog.showSaveDialog(mainWindow,{title:'Guardar respaldo de MathPath',defaultPath:'MathPath-respaldo.sqlite',filters:[{name:'Base SQLite',extensions:['sqlite']}]});
    if(target.canceled)return {canceled:true};
    await worker.call('backup',{path:target.filePath});
    return {name:path.basename(target.filePath)};
  }
  const source=await dialog.showOpenDialog(mainWindow,{title:'Seleccionar respaldo de MathPath',properties:['openFile'],filters:[{name:'Base SQLite',extensions:['sqlite']}]});
  if(source.canceled)return {canceled:true};
  const confirmation=await dialog.showMessageBox(mainWindow,{
    type:'question',title:'Restaurar respaldo',message:'¿Restaurar el progreso de este respaldo?',
    detail:'Se guardará una copia de los datos actuales antes de restaurar.',buttons:['Restaurar','Cancelar'],defaultId:1,cancelId:1
  });
  if(confirmation.response!==0)return {canceled:true};
  await worker.call('backup',{path:path.join(dataDir,'antes-de-restaurar-'+Date.now()+'.sqlite')});
  return {state:await worker.call('restore',{path:source.filePaths[0]})};
}

async function notebookPdfAjch(unit){
  const book=await worker.call('notebook',{action:'list',unit});
  if(!book.entries.length)throw new Error('Guarda al menos una entrada antes de exportar.');
  const filename='MathPath - '+book.course+'.pdf';
  const target=testing?{filePath:path.join(dataDir,filename)}:await dialog.showSaveDialog(mainWindow,{
    title:'Exportar el cuaderno',defaultPath:filename,filters:[{name:'PDF',extensions:['pdf']}],
  });
  if(target.canceled)return {canceled:true};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={exercise:'Ejercicio',graph:'Gráfica',note:'Apunte'};
  const articles=book.entries.map(({kind,title,body,payload})=>{
    const problem=[payload.question,payload.problem].filter(Boolean).join('\n');
    const lines=kind==='exercise'?'<pre>'+escape(problem)+'</pre>'+
      (payload.result?'<p><b>Resultado</b> '+escape(payload.result)+'</p>':''):kind==='graph'?
      '<pre>'+escape(payload.expressions.join('\n'))+'</pre>'+
      (/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(payload.image)?'<img alt="Gráfica guardada" src="'+payload.image+'">':''):'';
    return '<article><small>'+labels[kind]+'</small><h2>'+escape(title)+'</h2>'+lines+
      (body?'<p class="body">'+escape(body)+'</p>':'')+'</article>';
  }).join('');
  const html='<!doctype html><html lang="es"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'">'+
    '<style>@page{size:A4;margin:17mm}body{font:11pt/1.5 "Segoe UI",sans-serif;color:#263849;margin:0}'+
    'header{border-bottom:2px solid #2a6759;padding-bottom:10px;margin-bottom:16px}h1,h2,p,pre{margin:0}'+
    'h1{font-size:21pt}h2{font-size:14pt;margin:3px 0 8px}small{color:#356958}article{border-bottom:1px solid #d9e2e5;'+
    'padding:12px 0;break-inside:avoid}p,pre{margin:6px 0}pre,.body{white-space:pre-wrap;overflow-wrap:anywhere}'+
    'pre{font:10pt/1.5 Consolas,monospace}img{display:block;max-width:100%;max-height:110mm;margin-top:8px}</style>'+
    '<body><header><small>MathPath · Cuaderno universitario</small><h1>'+escape(book.course)+'</h1></header>'+articles+'</body></html>';
  const temporary=path.join(dataDir,'.cuaderno-'+randomUUID()+'.html');
  const printable=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,javascript:false}});
  try{
    await fs.writeFile(temporary,html,{encoding:'utf8',flag:'wx'});
    await printable.loadFile(temporary);
    const pdf=await printable.webContents.printToPDF({pageSize:'A4',printBackground:true,preferCSSPageSize:true});
    await fs.writeFile(target.filePath,pdf);
    return testing?{name:filename,verified:pdf.subarray(0,5).toString()==='%PDF-'}:{name:path.basename(target.filePath)};
  }finally{
    if(!printable.isDestroyed())printable.destroy();
    await fs.rm(temporary,{force:true});
  }
}

function installIpcAjch(){
  ipcMain.handle('mathpath:call',async(event,name,args)=>{
    if(event.sender!==mainWindow?.webContents||event.senderFrame?.url!==entryUrl)throw new Error('Origen no permitido.');
    if(workerOperations.has(name))return worker.call(name,args);
    if(name==='notebookPdf')return notebookPdfAjch(args?.unit);
    if(name==='backup'||name==='restore')return localFilesAjch(name);
    if(name==='getAi'){
      const config=await getAiAjch();
      return {enabled:Boolean(config.key),endpoint:config.endpoint,model:config.model};
    }
    if(name==='setAi')return setAiAjch(args);
    if(name==='teacherOnline')return pickHintAjch(args);
    if(name==='explainSimple')return explainSimpleAjch(args);
    if(name==='photoProblem')return photoProblemAjch();
    if(name==='answerFromImage')return answerFromImageAjch(args);
    if(name==='dictateAnswer')return dictateAnswerAjch(args);
    if(name==='openVideo'){
      const id=args?.id;
      if(typeof id!=='string'||!/^[-\w]{11}$/.test(id))throw new Error('Video no válido.');
      if(!testing)await shell.openExternal('https://www.youtube.com/watch?v='+id);
      return true;
    }
    if(name==='searchVideos'){
      const query=typeof args?.query==='string'?args.query.trim():'';
      if(!query||query.length>240)throw new Error('Escribe un tema para buscar videos.');
      const url=new URL('https://www.youtube.com/results');
      url.searchParams.set('search_query',query);
      if(!testing)await shell.openExternal(url.href);
      return true;
    }
    throw new Error('Operación no permitida.');
  });
}

async function createWindowAjch(){
  if(process.platform==='win32')app.setAppUserModelId('pe.mathpath.desktop');
  mainWindow=new BrowserWindow({
    title:'MathPath',width:1450,height:950,minWidth:920,minHeight:620,show:!testing,
    autoHideMenuBar:true,backgroundColor:'#101924',
    webPreferences:{preload:path.join(__dirname,'preloadajch.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:!testing}
  });
  if(testing)mainWindow.webContents.on('console-message',event=>{if(event.level==='error')console.error('[ventana]',event.message);});
  mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  mainWindow.webContents.on('will-navigate',event=>event.preventDefault());
  await mainWindow.loadFile(entry);
}

const primary=app.requestSingleInstanceLock();
if(!primary)app.quit();
else {
  app.on('second-instance',()=>{
    if(mainWindow?.isMinimized())mainWindow.restore();
    mainWindow?.focus();
  });
  app.whenReady().then(async()=>{
    await fs.mkdir(dataDir,{recursive:true});
    installIpcAjch();
    await createWindowAjch();
    if(testing){
      const check=await mainWindow.webContents.executeJavaScript(`
        (async () => {
          const api=window.mathpath;
          const waitFor=async selector=>{
            for(let i=0;i<100;i++){
              const element=document.querySelector(selector);
              if(element&&!element.disabled&&!document.querySelector('#content[aria-busy="true"]'))return element;
              await new Promise(resolve=>setTimeout(resolve,40));
            }
            throw Error('No se encontró '+selector+' · '+(document.querySelector(selector)?'(deshabilitado)':'(ausente)')+' · '+document.querySelector('#notice').textContent+' · '+document.querySelector('#content').innerText.replace(/\\s+/g,' ').slice(0,400));
          };
          const state=await api.call('status');
          const roster=[...state.adventureGuide.rivals,state.adventureGuide.dragon];
          if(Object.keys(state.adventureGuide.heroAttacks).length!==4||roster.some(rival=>rival.attacks.length<4))
            throw Error('Cuatro ataques por combatiente');
          if(state.topics.some(topic=>topic.level<3&&!abelYoutubeLessons[topic.id]))throw Error('Lecciones de YouTube del catálogo escolar');
          if(state.gradeBosses.length!==11||state.gradeBosses.some(boss=>!boss.intro||!boss.victory))throw Error('Historia y jefes por grado');
          if(state.levels.map(level=>level.title).join(',')!=='Primaria,Secundaria,Universitario')throw Error('Mapa de niveles');
          (await waitFor('[data-page="progress"]')).click();
          await waitFor('.progress-exam-empty');
          (await waitFor('[data-progress-stage="2"]')).click();
          await waitFor('[data-progress-stage="2"][aria-pressed="true"]');
          (await waitFor('.progress-unit[data-level="2"][data-route-unit="2"]')).click();
          await waitFor('.grade-tabs [data-unit="2"][aria-pressed="true"]');
          (await waitFor('[data-action="all-levels"]')).click();
          (await waitFor('[data-level="2"]')).click();
          const path=await waitFor('.route-path');
          if(path.querySelectorAll('.route-stop').length!==state.topics.filter(topic=>topic.level===2&&topic.unit===1).length)throw Error('Ruta escolar');
          (await waitFor('[data-action="all-levels"]')).click();
          (await waitFor('[data-level="3"]')).click();
          const catalog=await waitFor('.university-page');
          if(catalog.querySelectorAll('.university-topic').length!==state.topics.filter(topic=>topic.level===3&&topic.unit===1).length)
            throw Error('Catálogo universitario');
          (await waitFor('.university-heading [data-graph]')).click();
          (await waitFor('#graph-window[open] [data-plot-mode="3"]')).click();
          const surface=await api.call('graph',{mode:3,expressions:['x^2-y^2'],bounds:[-4,4,-4,4]});
          if(surface.zRange.join(',')!=='-16,16')throw Error('Graficador 3D');
          (await waitFor('#graph-window [data-graph-notebook]')).click();
          (await waitFor('#book-entry-form [type="submit"]')).click();
          await waitFor('.book-entry img');
          const pdf=await api.call('notebookPdf',{unit:1});
          if(!pdf.verified)throw Error('Exportación del cuaderno universitario');
          (await waitFor('[data-action="back-university"]')).click();
          (await waitFor('[data-action="all-levels"]')).click();
          (await waitFor('[data-level="1"]')).click();
          const primaryPath=await waitFor('.route-path');
          const nodes=primaryPath.querySelectorAll('.route-coin');
          const biomes=[...primaryPath.querySelectorAll('.route-biome')];
          if(biomes.slice(0,3).map(biome=>biome.dataset.routeWorld).join(',')!=='bridge,forest,cavern'||
             biomes[0].querySelectorAll('.route-stop').length!==3||biomes[1].querySelectorAll('.route-stop').length!==3)
            throw Error('Cambio de escenario después de tres misiones');
          for(const biome of biomes){
            if(!getComputedStyle(biome.querySelector('.biome-landscape')).backgroundImage.includes('/'+biome.dataset.routeWorld+'.webp'))
              throw Error('Paisaje del bioma');
            await biome.querySelector('.biome-rival').decode();
          }
          const centers=[...nodes].map(node=>node.getBoundingClientRect().x);
          if(new Set(centers).size<3||!nodes[0].matches('.active')||!nodes[1].matches('.locked')||!document.querySelector('.route-cup'))throw Error('Camino y estados de misiones');
          (await waitFor('[data-lesson="conteo"]')).click();
          (await waitFor('[data-action="start-mission"]')).click();
          await waitFor('.arena[data-arena-world="bridge"][data-arena-rival="golem"] .effect-river .arena-particles');
          const hearts=state.adventureGuide.rivals[0].hearts;
          for(let round=0;round<hearts;round++){
            await waitFor('[data-choice]');
            const stars=document.querySelectorAll('.count-visual [aria-hidden] span').length;
            const answer=document.querySelector('[data-choice="'+stars+'"]');
            if(!answer||stars<2)throw Error('Reto visual de conteo');
            answer.click();
            await waitFor('.mission-feedback.correct');
            if((await api.call('status')).adventure.wins.includes('conteo'))break;
            (await waitFor('[data-action="next-exercise"]')).click();
          }
          const next=await waitFor('[data-lesson="naturales"]');
          if(!next.textContent.includes('Siguiente misión'))throw Error('Desbloqueo de la siguiente misión');
          const loot=(await api.call('status')).adventure;
          if(!loot.wins.includes('conteo')||loot.hints!==1||loot.shields!==1)throw Error('Botín del duelo');
          if((await api.call('village',{action:'status'})).stock.coins!==8)throw Error('Monedas de la aldea');
          (await waitFor('.arena-page [data-action="open-village"]')).click();
          const pocket=await waitFor('.rpg-village [data-stock="coins"] strong');
          if(pocket.textContent!=='8')throw Error('Inventario de la mochila');
          (await waitFor('[data-village-view="shop"]')).click();
          const iron=await waitFor('.forge-costs [data-resource="coins"] strong');
          if(iron.textContent!=='8/16')throw Error('Materiales pendientes del taller');
          (await waitFor('[data-action="village-back"]')).click();
          await waitFor('.route-mission[data-lesson="conteo"] .route-coin.cleared');
          await waitFor('.route-mission[data-lesson="naturales"] .route-coin.active');
          (await waitFor('[data-page="progress"]')).click();
          (await waitFor('[data-progress-stage="1"]')).click();
          await waitFor('[data-progress-stage="1"][aria-pressed="true"]');
          const completion=await waitFor('.progress-completion .progress-ring strong');
          const precision=await waitFor('.progress-accuracy .progress-ring strong');
          if(completion.textContent!=='1'||precision.textContent!=='100 %'||document.querySelectorAll('.progress-segments .done').length!==1)throw Error('Gráficos de progreso');
          (await waitFor('#toggle-demo')).click();
          (await waitFor('[data-page="progress"]')).click();
          (await waitFor('.progress-exam')).click();
          await waitFor('#exam-review');
          (await waitFor('#toggle-demo')).click();
          (await waitFor('[data-page="teacher"]')).click();
          await waitFor('[data-teacher-level="1"]');
          if(document.querySelector('.teacher-catalog,.teacher-lesson'))throw Error('Profesor debe empezar por los niveles');
          (await waitFor('[data-teacher-level="1"]')).click();
          (await waitFor('.teacher-topic-results [data-teacher-topic="conteo"]')).click();
          await waitFor('.teacher-lesson .count-visual');
          const video=await waitFor('[data-video="YN5UmySnGpw"]');
          if(!video.textContent.includes('Smile and Learn')||!await api.call('openVideo',{id:video.dataset.video}))throw Error('Video de refuerzo');
          (await waitFor('.teacher-lesson [data-lesson-video="conteo"]')).click();
          const frame=await waitFor('#lesson-video[open] .video-frame');
          if(!frame.textContent.includes('La idea'))throw Error('Reproductor de minilecciones');
          document.querySelector('#lesson-video').close();
          (await waitFor('[data-action="teacher-topics"]')).click();
          (await waitFor('[data-action="teacher-levels"]')).click();
          (await waitFor('[data-teacher-level="2"]')).click();
          (await waitFor('[data-teacher-topic="lineales"]')).click();
          await waitFor('.guided-example .step-math math');
          (await waitFor('[data-action="teacher-next"]')).click();
          await waitFor('.guided-example .study-step[value="2"]');
          (await waitFor('[data-action="teacher-next"]')).click();
          const equationAnswer=await waitFor('.guided-example .final-answer');
          if(!equationAnswer.textContent.includes('x ='))throw Error('Ejemplo guiado');
          const sample=await waitFor('[data-action="sample-steps"]');
          sample.closest('details').open=true;
          sample.click();
          if((await waitFor('.step-report')).querySelectorAll('.passed').length!==2)throw Error('Revisión de pasos');
          (await waitFor('[data-page="practice"]')).click();
          const practiceForm=await waitFor('#practice-config');
          practiceForm.elements.topic.value='limites';
          practiceForm.requestSubmit();
          const answerForm=await waitFor('#practice-answer');
          if(!['voice','camera','file','board'].every(kind=>answerForm.querySelector('[data-capture="'+kind+'"]')))throw Error('Botones de dictado y escaneo');
          if(abelAnswerCapture.normalize('x⁴ + 3·x + C')!=='x^4 + 3*x + C')throw Error('Normalización de la respuesta');
          const sheet=document.createElement('canvas');sheet.width=700;sheet.height=200;
          const pen=sheet.getContext('2d');pen.fillStyle='#fff';pen.fillRect(0,0,700,200);pen.fillStyle='#1d2633';
          pen.font='80px serif';pen.fillText('x',60,140);pen.font='48px serif';pen.fillText('4',105,85);pen.font='80px serif';pen.fillText('+ 3x + C',150,140);
          const scanned=await api.call('answerFromImage',{image:sheet.toDataURL('image/png')});
          if(scanned.source!=='local'||scanned.answer.replace(/ /g,'')!=='x^4+3x+C')throw Error('Escaneo local: '+JSON.stringify(scanned));
          answerForm.elements.answer.value='x⁴';
          answerForm.elements.answer.dispatchEvent(new Event('input',{bubbles:true}));
          if(answerForm.elements.answer.value!=='x^4')throw Error('Corrección de superíndices');
          await waitFor('#practice-answer .capture-preview:not([hidden]) math');
          answerForm.elements.answer.value='76';
          answerForm.requestSubmit();
          const limit=await waitFor('.practice-board .limit-visual');
          if(!limit.querySelector('.limit-hole')||!document.querySelector('.practice-board .step-math math'))throw Error('Resolución gráfica del límite');
          (await waitFor('.practice-board [data-teacher-topic="limites"]')).click();
          await waitFor('.teacher-lesson [data-video="h9lEAU5-CSg"]');
          (await waitFor('[data-action="teacher-topics"]')).click();
          (await waitFor('[data-teacher-topic="integrales"]')).click();
          await waitFor('.teacher-lesson [data-lesson-video="integrales"]');
          const integralVideo=await waitFor('.teacher-lesson [data-video="'+abelYoutubeLessons.integrales[0]+'"]');
          if(!await api.call('openVideo',{id:integralVideo.dataset.video}))throw Error('Lección de YouTube de integrales');
          (await waitFor('[data-page="solver"]')).click();
          const form=await waitFor('#solver-form');
          form.elements.problem.value='6 × 4 ÷ 3';
          form.requestSubmit();
          const answer=await waitFor('#solver-result math');
          if(answer.textContent!=='8')throw Error('Notación escolar en el solucionador');
          if(!document.querySelector('#solver-form [data-fun="photo"]'))throw Error('Botón de foto en el solucionador');
          await waitFor('#fun-topbar .fun-level-badge');
          (await waitFor('[data-page="games"]')).click();
          (await waitFor('[data-fun="game:daily"]')).click();
          await waitFor('.fun-exercise');
          (await waitFor('[data-fun="hub"]')).click();
          (await waitFor('[data-fun="game:survival"]')).click();
          const survivalForm=await waitFor('[data-fun-form="survival-setup"]');
          for(const grade of [1,2,3,4,5])survivalForm.elements['g2-'+grade].checked=true;
          survivalForm.querySelector('[name=mode][value=grades]').checked=true;
          survivalForm.requestSubmit();
          if(!(await waitFor('.fun-scope')).textContent.includes('Toda Secundaria'))throw Error('Supervivencia con varios grados');
          await waitFor('.fun-timer');
          (await waitFor('[data-fun="hub"]')).click();
          (await waitFor('[data-fun="game:graph"]')).click();
          const curves=await waitFor('[data-fun-form="graph-setup"]');
          curves.elements.kline.checked=false;curves.elements.kabs.checked=false;curves.elements.kparabola.checked=true;
          curves.requestSubmit();
          if(!(await waitFor('.fun-formula')).textContent.includes('(x − h)²'))throw Error('Reto gráfico solo con parábolas');
          (await waitFor('[data-fun="hub"]')).click();
          (await waitFor('[data-fun="game:dungeon"]')).click();
          const cave=await waitFor('[data-fun-form="dungeon-setup"]');
          cave.elements['g1-1'].checked=true;cave.querySelector('[name=mode][value=grades]').checked=true;
          cave.requestSubmit();
          if(!(await waitFor('.fun-scope')).textContent.includes('Primaria 1.º'))throw Error('Mazmorra por grados');
          (await waitFor('[data-fun="hub"]')).click();
          (await waitFor('[data-fun="game:duel"]')).click();
          (await waitFor('[data-fun-form="duel-setup"] button')).click();
          await waitFor('.fun-duel-arena .fun-duelist.active');
          (await waitFor('[data-page="pet"]')).click();
          (await waitFor('[data-fun-form="adopt"] button')).click();
          await waitFor('.fun-pet-big svg, .fun-pet-big .fun-pet-art img');
          (await waitFor('[data-page="trophies"]')).click();
          await waitFor('.fun-achievement.got');
          (await waitFor('[data-fun="tab:habilidades"]')).click();
          await waitFor('.fun-skill');
          (await waitFor('[data-fun="tab:avatar"]')).click();
          await waitFor('.fun-swatch');
          (await waitFor('[data-page="cards"]')).click();
          if(!(await waitFor('.fun-cards')).querySelector('.fun-card:not(.locked)'))throw Error('Cartas de temas dominados');
          if(document.querySelector('[data-page="classroom"],[data-page="settings"],[data-fun="game:missions"]'))throw Error('Opciones de profesor en la app del estudiante');
          document.querySelector('.sidebar .profile').click();
          await waitFor('#settings-form');
          (await waitFor('[data-fun="board"]')).click();
          if(!document.querySelector('.fun-board[open]'))throw Error('Pizarra');
          document.querySelector('.fun-board [data-board="close"]').click();
          const play=await api.call('fun',{action:'summary'});
          if(play.xp<=0||!play.pet)throw Error('Experiencia y mascota');
          return {topics:state.total,result:answer.textContent,mission:'OK',progress:'OK',teacher:'OK',practice:'OK',notebookPdf:'OK',
            game:{xp:play.xp,level:play.level,achievements:Object.keys(play.achievements).length}};
        })()
      `);
      console.log('Ventana, SQLite, interfaz y solución comprobados:',JSON.stringify(check));
      app.quit();
    }
  }).catch(error=>{
    console.error(error);
    if(!testing)dialog.showErrorBox('MathPath',error.message);
    app.exit(1);
  });
}
app.on('before-quit',()=>{shuttingDown=true;worker.close();});
app.on('window-all-closed',()=>{if(!shuttingDown)app.quit();});
