const {app,BrowserWindow,ipcMain,protocol,net,dialog}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');const {gate,noArgs}=require('./boundary.cjs');const {createTool}=require('./service.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'tool',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const PAGE='tool://local/index.html';
if(!app.requestSingleInstanceLock()){app.quit();}else{
app.whenReady().then(()=>{
 protocol.handle('tool',request=>{const url=new URL(request.url);const allowed=['/index.html','/renderer.js','/styles.css'];if(url.host!=='local'||url.search||url.hash||!allowed.includes(url.pathname))return new Response('Not found',{status:404});return net.fetch(pathToFileURL(path.join(__dirname,url.pathname.slice(1))).href);});
 const win=new BrowserWindow({width:1000,height:760,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 win.webContents.session.setPermissionCheckHandler(()=>false);
 const tool=createTool({dataDir:path.join(app.getPath('userData'),'notes'),dialog,win});
 let queue=Promise.resolve();const serial=fn=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;};
 const trusted=event=>event.sender===win.webContents&&event.senderFrame===win.webContents.mainFrame&&event.senderFrame.url===PAGE;
 for(const [name,fn] of Object.entries(tool.handlers))ipcMain.handle('notes:'+name,gate(trusted,value=>serial(()=>fn(value))));
 let allowClose=false;
 ipcMain.handle('notes:close',gate(trusted,value=>serial(async()=>{noArgs(value);const ok=await tool.beforeClose();if(ok){allowClose=true;win.close();}return {canceled:!ok};})));
 // Never decide from a possibly stale session: the renderer flushes its draft first.
 win.on('close',event=>{if(allowClose)return;event.preventDefault();win.webContents.send('notes:request-close');});
 win.loadURL(PAGE);
});app.on('window-all-closed',()=>app.quit());}
