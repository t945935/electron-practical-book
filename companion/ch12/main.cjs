const electron=require('electron');
const {app,BrowserWindow,ipcMain,protocol,session,dialog}=electron;
const fs=require('node:fs');const path=require('node:path');
const {Coordinator,CATALOG}=require('./coordinator.cjs');const {Settings}=require('./settings.cjs');const {createAdapter}=require('./adapters.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'tool',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
app.setAppUserModelId('tw.owntools.toolbox');
// Test-only data isolation, supplied by the local launch process, never by IPC.
if(process.env.TOOLBOX_TEST_DATA)app.setPath('userData',path.resolve(process.env.TOOLBOX_TEST_DATA));
let home,settings,approvedQuit=false,quitPending=false;
const coordinator=new Coordinator({create:createToolWindow});
const errorMessages={CSV_LIMIT:'安全 CSV 加上防護後超過欄位或五 MiB 上限；未匯出。請保留原始 ledger 目錄備份，不要刪除防護單引號。',FORBIDDEN:'拒絕未授權來源',UNKNOWN_TOOL:'找不到指定工具',UNKNOWN_METHOD:'找不到指定操作',QUITTING:'正在確認結束，請稍後重試',INVALID:'輸入格式不正確',SETTINGS:'設定損毀；請退出後備份 settings.json，再移走損毀檔',CHANGED:'檔案已由外部修改，請重新開啟',RECOVERY:'資料損毀；請先備份並復原',COLLISION:'目的地名稱衝突'};
async function reply(task){try{return {ok:true,data:await task()};}catch(e){const code=Object.hasOwn(errorMessages,e.message)?e.message:['VALIDATION','HTTP','FORMAT','OFFLINE','TIMEOUT','BUSY','NOT_SELECTED'].includes(e.code)?e.code:'IO';return {ok:false,error:{code,message:errorMessages[code]||'操作失敗；請檢查輸入、網路或磁碟'}};}}
function secureWindow(id,dir){
 const win=new BrowserWindow({width:1000,height:760,title:CATALOG.find(t=>t.id===id)?.title||'自己的工具箱',webPreferences:{...(fs.existsSync(path.join(dir,'preload.cjs'))?{preload:path.join(dir,'preload.cjs')} : {}),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,partition:'toolbox-'+id}});
 const ses=win.webContents.session;
 ses.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));ses.setPermissionCheckHandler(()=>false);
 // A separate in-memory session per tool prevents shared origin storage/cookies.
 const assets=new Map();for(const name of fs.readdirSync(dir))if(/\.(html|css|js|mjs)$/.test(name))assets.set('tool://'+id+'/'+name,path.join(dir,name));
 ses.protocol.handle('tool',async request=>{const file=request.method==='GET'&&assets.get(request.url);if(!file)return new Response('Not found',{status:404});try{const type=file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript';return new Response(await fs.promises.readFile(file),{headers:{'Content-Type':type+'; charset=utf-8'}});}catch{return new Response('Unavailable',{status:500});}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.on('will-attach-webview',e=>e.preventDefault());
 win.on('closed',()=>{ses.protocol.unhandle('tool');});
 return win;
}
function createToolWindow(id){
 const dir=path.join(__dirname,'tools',id),win=secureWindow(id,dir),page='tool://'+id+'/index.html';
 const dataDir=path.join(app.getPath('userData'),id);fs.mkdirSync(dataDir,{recursive:true});
 const entry={win,page,...createAdapter(id,{dataDir,win,electron,quit:()=>app.quit(),open:id=>id==='home'?openHome():coordinator.open(id)})};let closing=false,allowClose=false;
 if(id==='notes'){
  let pending,token,accepted=false;
  entry.handlers.close=(value)=>{if(value!==undefined)throw Error('INVALID');if(!pending)return {canceled:true};accepted=true;return {canceled:false};};
  entry.flushDraft=()=>{
   if(pending)return pending.promise;
   let resolve;const promise=new Promise(done=>resolve=done);token=require('node:crypto').randomUUID();accepted=false;entry.flushing=true;
   const finish=ok=>{if(!pending)return;clearTimeout(pending.timer);pending=null;entry.flushing=false;resolve(ok);};
   pending={promise,finish,timer:setTimeout(()=>finish(false),3000)};
   win.webContents.send('notes:request-close',token);return promise;
  };
  const ready=(event,value)=>{
   if(pending&&value===token&&event.sender===win.webContents&&event.senderFrame===win.webContents.mainFrame&&event.senderFrame?.url===page)pending.finish(accepted);
  };
  ipcMain.on('notes:close-ready',ready);
  win.on('closed',()=>{pending?.finish(false);ipcMain.removeListener('notes:close-ready',ready);});
  const confirmClose=entry.beforeClose;
  entry.beforeClose=async()=>{
   // Fixed application-owned code, never renderer-supplied script. Freeze the DOM
   // before comparing it with the accepted main-process draft; a rejected edit
   // must not let a clean/stale main session silently approve quitting.
   let locked=false;
   try{
    const draft=await win.webContents.executeJavaScript(`(() => {
     const controls=[...document.querySelectorAll('button,input,textarea')];
     if(controls.some(x=>x.disabled))return {blocked:true};
     controls.forEach(x=>x.disabled=true);
     return {text:document.getElementById('text').value,
      blocked:/未同步/.test(document.getElementById('name').textContent)||/結果不明/.test(document.getElementById('status').textContent),locked:true};
    })()`);
    locked=Boolean(draft.locked);
    if(draft.blocked||draft.text!==entry.handlers.state().text)return false;
    return await confirmClose();
   }catch{return false;}
   finally{if(locked&&!win.isDestroyed())await win.webContents.executeJavaScript("document.querySelectorAll('button,input,textarea').forEach(x=>x.disabled=false)").catch(()=>{});}
  };
 }
 for(const name of Object.keys(entry.handlers)){
  const channel=id+':'+name;ipcMain.removeHandler(channel);
  ipcMain.handle(channel,(event,...args)=>reply(()=>{if(args.length>1)throw Error('INVALID');return coordinator.invoke(id,name,event,...args);}));
 }
 win.on('close',event=>{
  if(approvedQuit||allowClose)return;event.preventDefault();
  if(quitPending||closing)return;
  if(entry.hideOnClose?.()){win.hide();return;}
  closing=true;(async()=>{if(entry.flushDraft&&!await entry.flushDraft())return;await coordinator.serial(entry,async()=>{if(!entry.beforeClose||await entry.beforeClose()){allowClose=true;win.close();}});})().catch(()=>dialog.showMessageBox(win,{type:'error',message:'無法安全關閉；請先複製筆記備份。'})).finally(()=>closing=false);
 });
 win.on('closed',()=>{entry.dispose?.();for(const name of Object.keys(entry.handlers))ipcMain.removeHandler(id+':'+name);coordinator.entries.delete(id);});
 win.loadURL(page);return entry;
}
function openHome(){if(home&&!home.isDestroyed()){home.show();home.focus();return;}
 home=secureWindow('home',path.join(__dirname,'home'));home.loadURL('tool://home/index.html');
 home.on('close',event=>{if(!approvedQuit){event.preventDefault();app.quit();}});
}
async function finishQuit(){
 if(quitPending||approvedQuit)return;quitPending=true;
 try{if(await coordinator.prepareQuit()){approvedQuit=true;app.quit();}}
 catch{await dialog.showMessageBox({type:'error',message:'尚未安全儲存，工具箱保持開啟。請先備份筆記。'});}
 finally{quitPending=false;}
}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',()=>{if(app.isReady())openHome();});
 app.on('before-quit',event=>{if(!approvedQuit){event.preventDefault();void finishQuit();}});
 app.on('window-all-closed',()=>{if(!approvedQuit)app.quit();});
 app.whenReady().then(()=>{
  settings=new Settings(app.getPath('userData'));
  const handlers={catalog:()=>CATALOG,open:id=>coordinator.open(id),settings:()=>settings.load(),saveSettings:v=>settings.save(v),quit:()=>{setImmediate(()=>app.quit());return null;}};
  for(const [name,fn] of Object.entries(handlers))ipcMain.handle('toolbox:'+name,(event,...args)=>reply(()=>{
   if(!home||event.sender!==home.webContents||event.senderFrame!==home.webContents.mainFrame||event.senderFrame?.url!=='tool://home/index.html')throw Error('FORBIDDEN');
   if(quitPending)throw Error('QUITTING');if(args.length!==(['open','saveSettings'].includes(name)?1:0))throw Error('INVALID');return fn(...args);
  }));
  openHome();try{const {startup}=settings.load();if(startup!=='home')void coordinator.open(startup);}catch{/* The home UI displays the recoverable error. */}
  app.on('activate',openHome);
 });
}
