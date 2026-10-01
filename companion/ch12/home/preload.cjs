const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('toolbox',{catalog:()=>ipcRenderer.invoke('toolbox:catalog'),open:id=>ipcRenderer.invoke('toolbox:open',id),settings:()=>ipcRenderer.invoke('toolbox:settings'),saveSettings:value=>ipcRenderer.invoke('toolbox:saveSettings',value),quit:()=>ipcRenderer.invoke('toolbox:quit')});
