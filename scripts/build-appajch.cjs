const fs=require('node:fs/promises');
const path=require('node:path');
const esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'build-output','app');
(async()=>{
  if(path.relative(root,destination)!==path.join('build-output','app'))throw Error('Ruta de salida no válida.');
  await fs.rm(destination,{recursive:true,force:true});
  await fs.mkdir(destination,{recursive:true});
  for(const entry of await fs.readdir(root,{withFileTypes:true})){
    if(!entry.isFile()||!(/\.(js|css)$/.test(entry.name)||['indexajch.html','mainajch.cjs','preloadajch.cjs'].includes(entry.name)))continue;
    const source=await fs.readFile(path.join(root,entry.name),'utf8');
    let result=source;
    if(/\.(js|cjs)$/.test(entry.name)){
      result=(await esbuild.transform(source,{loader:'js',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,keepNames:true,legalComments:'eof',target:'es2022'})).code;
    }
    await fs.writeFile(path.join(destination,entry.name),result);
  }
  for(const directory of ['arena','recursos'])await fs.cp(path.join(root,directory),path.join(destination,directory),{recursive:true});
  const {name,version,description,main,author}=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
  await fs.writeFile(path.join(destination,'package.json'),JSON.stringify({name,version,description,main,author,private:true},null,2)+'\n');
  console.log('Interfaz compactada: sin documentos, fuentes Python, perfiles, claves ni herramientas de desarrollo.');
})().catch(error=>{console.error(error);process.exitCode=1;});
