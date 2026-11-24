// MathPath · Autor: Abel Josué Colquehuanca Humpiri
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const python=process.env.MATHPATH_BUILD_PYTHON||process.env.MATHPATH_PYTHON||'python';
const env={...process.env,PYTHONUTF8:'1',PYTHONPATH:[path.join(root,'vendor'),process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)};
const probe=spawnSync(python,['-c','import PyInstaller; import sympy; import vosk; import onnxruntime; import tokenizers'],{cwd:root,env,encoding:'utf8',windowsHide:true});
if(probe.status!==0){
  console.error('Faltan herramientas de compilación. Consulta INSTALADOR.md.\n'+(probe.error?.message||probe.stderr||''));
  process.exit(1);
}
const result=spawnSync(python,['-m','PyInstaller','--noconfirm','--clean','--distpath',path.join(root,'build-output','engine'),'--workpath',path.join(root,'build-output','pyinstaller'),path.join(root,'build','mathpath-engine.spec')],{cwd:root,env,stdio:'inherit',windowsHide:true});
if(result.error||result.status!==0)process.exit(result.status||1);
const licenses=path.join(root,'build-output','licenses');
fs.mkdirSync(licenses,{recursive:true});
const license=spawnSync(python,['-c','import sys; from pathlib import Path; print(Path(sys.base_prefix)/"LICENSE.txt")'],{encoding:'utf8',env,windowsHide:true}).stdout.trim();
if(fs.existsSync(license))fs.copyFileSync(license,path.join(licenses,'Python-LICENSE.txt'));
for(const entry of fs.readdirSync(path.join(root,'vendor'),{withFileTypes:true})){
  if(!entry.isDirectory()||!entry.name.endsWith('.dist-info'))continue;
  const source=path.join(root,'vendor',entry.name);
  const copy=(directory,relative='')=>{
    for(const item of fs.readdirSync(directory,{withFileTypes:true})){
      const next=path.join(relative,item.name),file=path.join(directory,item.name);
      if(item.isDirectory()&&item.name.toLowerCase()==='licenses')copy(file,next);
      else if(item.isFile()&&/^(licen[cs]e|copying|notice|authors)/i.test(item.name)){
        const target=path.join(licenses,entry.name,next);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
      }
    }
  };copy(source);
}
console.log('Motor autónomo y licencias preparados.');
