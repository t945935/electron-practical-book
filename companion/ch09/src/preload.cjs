const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{query:city=>ipcRenderer.invoke('weather:query',city),cached:()=>ipcRenderer.invoke('weather:cached')});
