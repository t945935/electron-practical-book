const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{
  load: () => ipcRenderer.invoke('todo:load'),
  save: value => ipcRenderer.invoke('todo:save',value),
  recover: () => ipcRenderer.invoke('todo:recover')
});
