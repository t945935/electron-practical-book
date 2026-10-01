const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tool',{
  load: () => ipcRenderer.invoke('ledger:load'),
  add: value => ipcRenderer.invoke('ledger:add',value),
  importCSV: () => ipcRenderer.invoke('ledger:importCSV'),
  exportCSV: () => ipcRenderer.invoke('ledger:exportCSV')
});
