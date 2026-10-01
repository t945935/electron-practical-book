const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{choose:()=>ipcRenderer.invoke('search:choose'),start:query=>ipcRenderer.invoke('search:start',query),status:()=>ipcRenderer.invoke('search:status'),cancel:()=>ipcRenderer.invoke('search:cancel')});
