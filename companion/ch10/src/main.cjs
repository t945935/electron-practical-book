const {app,BrowserWindow,ipcMain,session}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');const {guard,noArgs}=require('./boundary.cjs');
let win;
const page=pathToFileURL(path.join(__dirname,'index.html')).href;
function bind(channel,fn){ipcMain.handle(channel,guard(()=>win?.webContents,page,fn));}
function createWindow(){
 win=new BrowserWindow({width:960,height:720,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',event=>event.preventDefault());
 win.webContents.on('will-attach-webview',event=>event.preventDefault());
 win.loadFile(path.join(__dirname,'index.html'));return win;
}
function permissions(){session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);}
const {Tray,Menu,nativeImage,Notification}=require('electron');const {Reminder}=require('./reminder.cjs');
const reminder=new Reminder();let tray,ticker;const activeNotifications=new Set();
app.setAppUserModelId('tw.owntools.reminder');
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',()=>{win?.show();win?.focus();});
 app.whenReady().then(()=>{
  permissions();createWindow();
  // 明確繪製 16×16 BGRA 小圖，不依賴外部下載或空圖示。
  const pixels=Buffer.alloc(16*16*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=190;pixels[i+1]=95;pixels[i+2]=30;pixels[i+3]=255;}
  try{
   tray=new Tray(nativeImage.createFromBitmap(pixels,{width:16,height:16}));tray.setToolTip('休息提醒：右鍵可結束');
   tray.setContextMenu(Menu.buildFromTemplate([{label:'開啟提醒工具',click:()=>{win.show();win.focus();}},{label:'取消提醒',click:()=>reminder.cancel()},{type:'separator'},{label:'結束程式',click:()=>app.quit()}]));
   tray.on('double-click',()=>{win.show();win.focus();});
  }catch{reminder.message='無法建立系統匣；請使用視窗內的結束按鈕';}
  win.on('close',event=>{if(tray&&reminder.closeAction()==='hide'){event.preventDefault();win.hide();}});
  bind('reminder:schedule',(...args)=>{if(args.length!==1)throw Object.assign(new Error('只接受一個秒數'),{code:'VALIDATION'});return reminder.schedule(args[0]);});
  bind('reminder:cancel',(...args)=>{noArgs(args);return reminder.cancel();});
  bind('reminder:status',(...args)=>{noArgs(args);return {...reminder.snapshot(),notificationSupported:Notification.isSupported()};});
  bind('reminder:quit',(...args)=>{noArgs(args);setImmediate(()=>app.quit());return null;});
  ticker=setInterval(()=>{if(!reminder.tick())return;
   if(!Notification.isSupported()){reminder.message='提醒到期；此系統不支援通知，請開啟視窗查看';return;}
   try{
    const n=new Notification({title:'休息一下',body:'離開座位、喝水，再回來繼續。'});activeNotifications.add(n);
    n.on('failed',()=>{reminder.message='通知傳送失敗；請檢查系統通知權限、安裝識別與勿擾設定';activeNotifications.delete(n);});
    n.on('close',()=>activeNotifications.delete(n));n.on('click',()=>{win.show();win.focus();activeNotifications.delete(n);});
    n.show();reminder.message='提醒到期，已要求系統顯示通知；沒有看到時請檢查通知設定／勿擾模式';
   }catch{reminder.message='通知建立失敗；請檢查系統設定';}
  },250);
 });
 app.on('before-quit',()=>{reminder.quit();clearInterval(ticker);for(const n of activeNotifications)n.close();tray?.destroy();});
 app.on('window-all-closed',()=>{if(!tray)app.quit();});
}
