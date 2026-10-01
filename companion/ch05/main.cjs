const {app,BrowserWindow,ipcMain,protocol,net,dialog}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');const {gate}=require('./boundary.cjs');const {createTool}=require('./service.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'tool',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const PAGE='tool://local/index.html';
if(!app.requestSingleInstanceLock()){app.quit();}else{
app.whenReady().then(()=>{
 protocol.handle('tool',request=>{const url=new URL(request.url);const allowed=['/index.html','/renderer.js','/styles.css'];if(url.host!=='local'||url.search||url.hash||!allowed.includes(url.pathname))return new Response('Not found',{status:404});return net.fetch(pathToFileURL(path.join(__dirname,url.pathname.slice(1))).href);});
 const win=new BrowserWindow({width:1000,height:760,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 win.webContents.session.setPermissionCheckHandler(()=>false);
 const tool=createTool({dataDir:path.join(app.getPath('userData'),'todo'),dialog,win});
 let queue=Promise.resolve();const serial=fn=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;};
 const trusted=event=>event.sender===win.webContents&&event.senderFrame===win.webContents.mainFrame&&event.senderFrame.url===PAGE;
 for(const [name,fn] of Object.entries(tool.handlers))ipcMain.handle('todo:'+name,gate(trusted,value=>serial(()=>fn(value))));
 let closing=false,allowClose=false;
 win.on('close',event=>{if(!tool.beforeClose||allowClose)return;event.preventDefault();if(closing)return;closing=true;serial(()=>tool.beforeClose()).then(ok=>{if(ok){allowClose=true;win.close();}}).catch(()=>dialog.showMessageBox(win,{type:'error',message:'無法儲存。視窗保持開啟，請先複製文字備份。'})).finally(()=>{closing=false;});});
 win.loadURL(PAGE);
});app.on('window-all-closed',()=>app.quit());}
