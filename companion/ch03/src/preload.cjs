const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  getAppInfo: payload => ipcRenderer.invoke('app:info', payload)
});
