// MathPath · Autor: Abel Josué Colquehuanca Humpiri
// Release check: run the bundled engine with no external Python or dependency paths.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const {createInterface}=require('node:readline');
const {randomUUID}=require('node:crypto');
const {once}=require('node:events');
(async()=>{
  const root=path.resolve(__dirname,'..');
  const directory=path.resolve(process.argv[2]||path.join(root,'dist','win-unpacked'));
  const asar=await import('@electron/asar');
  const files=asar.listPackage(path.join(directory,'resources','app.asar')).map(name=>name.replace(/\\/g,'/'));
  assert(files.includes('/index.html')&&files.includes('/main.cjs'),'Falta la interfaz.');
  assert(!files.some(name=>/\.(py|pyc|docx|sqlite|map)$/.test(name)||/\/(\.git|\.qa|\.respaldo|vendor|scripts)\//.test(name)||/\/ai\.json$/.test(name)),'El paquete incluye archivos de desarrollo o datos personales.');
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'mathpath-package-'));
  const env={...process.env,PYTHONUTF8:'1',HF_HUB_OFFLINE:'1',MATHPATH_PYTHON:'Z:\\no-python\\python.exe'};
  delete env.PYTHONPATH;delete env.PYTHONHOME;
  env.PATH=[path.join(process.env.SystemRoot||'C:\\Windows','System32'),process.env.SystemRoot||'C:\\Windows'].join(path.delimiter);
  const child=spawn(path.join(directory,'resources','engine','mathpath-engine.exe'),[path.join(temporary,'perfil.sqlite')],{cwd:temporary,env,windowsHide:true,stdio:['pipe','pipe','pipe']});
  const exited=once(child,'exit');
  const pending=new Map();let sequence=0,stderr='';
  child.stderr.on('data',chunk=>stderr+=chunk.toString());
  child.on('error',error=>{for(const {reject,timer} of pending.values()){clearTimeout(timer);reject(error);}pending.clear();});
  createInterface({input:child.stdout}).on('line',line=>{
    const response=JSON.parse(line),entry=pending.get(response.id);if(!entry)return;
    pending.delete(response.id);clearTimeout(entry.timer);
    response.error?entry.reject(Error(response.error+'\n'+stderr)):entry.resolve(response.result);
  });
  const call=(name,args={})=>new Promise((resolve,reject)=>{
    const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Tiempo agotado: '+name+'\n'+stderr));},60000);
    pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,name,args})+'\n');
  });
  try{
    const status=await call('status');assert(status.total>=335);
    assert.equal((await call('solve',{problem:'6 × 4 ÷ 3'})).result,'8');
    assert.equal((await call('solve',{operation:'integral',problem:'x^2',variable:'x'})).result,'x^3/3 + C');
    const formulas=JSON.parse(await fs.readFile(path.join(root,'recursos','formulas','indice.json'),'utf8'));
    const identity=Array.isArray(formulas)?formulas[0]:Object.keys(formulas)[0];
    assert.deepEqual(await call('fun',{action:'formulaFavorites'}),[]);
    assert.deepEqual(await call('fun',{action:'formulaFavorites',identity,enabled:true}),[identity]);
    const graph=await call('graph',{mode:3,expressions:['x^2-y^2'],bounds:[-4,4,-4,4]});assert.deepEqual(graph.zRange,[-16,16]);
    const session=randomUUID();await call('speechStream',{action:'start',session,variable:'x'});
    await call('speechStream',{action:'chunk',session,pcm:Buffer.alloc(8000).toString('base64')});
    assert.equal((await call('speechStream',{action:'stop',session})).done,true);
    console.log('Paquete autónomo, catálogo, fórmulas favoritas, cálculo, integral, gráfico 3D y modelo de voz comprobados.');
  }finally{
    child.stdin.end();
    const cleanup=setTimeout(()=>child.kill(),5000);await exited;clearTimeout(cleanup);
    const resolved=path.resolve(temporary),parent=path.resolve(os.tmpdir());
    if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('mathpath-package-'))throw Error('Ruta temporal no válida.');
    await fs.rm(resolved,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
