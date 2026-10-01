const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{schedule:seconds=>ipcRenderer.invoke('reminder:schedule',seconds),cancel:()=>ipcRenderer.invoke('reminder:cancel'),status:()=>ipcRenderer.invoke('reminder:status'),quit:()=>ipcRenderer.invoke('reminder:quit')});
