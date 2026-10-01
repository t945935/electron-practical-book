const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{
  state: () => ipcRenderer.invoke('notes:state'),
  edit: value => ipcRenderer.invoke('notes:edit',value),
  open: () => ipcRenderer.invoke('notes:open'),
  save: () => ipcRenderer.invoke('notes:save'),
  newNote: () => ipcRenderer.invoke('notes:newNote'),
  close: () => ipcRenderer.invoke('notes:close'),
  onClose: callback => { ipcRenderer.on('notes:request-close', () => callback()); }
});
