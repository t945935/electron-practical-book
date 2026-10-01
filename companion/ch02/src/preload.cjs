const { contextBridge } = require('electron');
window.preloadOnly = '這個值只在隔離世界';
contextBridge.exposeInMainWorld('desktop', {
  getVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  })
});
