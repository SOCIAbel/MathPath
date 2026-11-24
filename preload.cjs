// MathPath · Autor: Abel Josué Colquehuanca Humpiri
const { contextBridge,ipcRenderer }=require('electron');
contextBridge.exposeInMainWorld('mathpath',{call:(name,args)=>ipcRenderer.invoke('mathpath:call',name,args)});
