const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{
  sample: () => ipcRenderer.invoke('organizer:sample'),
  choose: () => ipcRenderer.invoke('organizer:choose'),
  preview: () => ipcRenderer.invoke('organizer:preview'),
  apply: () => ipcRenderer.invoke('organizer:apply')
});
