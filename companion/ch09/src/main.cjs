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
const {getWeather}=require('./weather.cjs');const {Cache}=require('./store.cjs');let busy=false,cache;
app.whenReady().then(()=>{
 permissions();createWindow();cache=new Cache(path.join(app.getPath('userData'),'weather'));
 bind('weather:cached',async(...args)=>{noArgs(args);try{return {weather:await cache.load(),warning:null};}catch{return {weather:null,warning:'快取損毀或版本不符；原檔保留，不會自動覆寫'};}});
 bind('weather:query',async(...args)=>{
  if(args.length!==1)throw Object.assign(new Error('請傳入城市代碼'),{code:'VALIDATION'});
  if(busy)throw Object.assign(new Error('查詢進行中'),{code:'BUSY'});
  busy=true;try{const weather=await getWeather(args[0]);let warning=null;try{await cache.save(weather);}catch{warning='本次資料已取得，但快取未儲存；請檢查磁碟或備份損毀快取';}return {...weather,warning};}finally{busy=false;}
 });
});
app.on('window-all-closed',()=>app.quit());
