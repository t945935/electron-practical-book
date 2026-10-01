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
const {dialog}=require('electron');const {SearchJob}=require('./search.cjs');
const job=new SearchJob();let root=null,choosing=false;
app.whenReady().then(()=>{
 permissions();createWindow();
 bind('search:choose',async(...args)=>{noArgs(args);if(choosing)throw Object.assign(new Error('選取視窗已開啟'),{code:'BUSY'});choosing=true;
  try{const result=await dialog.showOpenDialog(win,{properties:['openDirectory']});if(result.canceled)return {cancelled:true};job.cancel();root=result.filePaths[0];return {cancelled:false,name:path.basename(root)};}finally{choosing=false;}
 });
 bind('search:start',(...args)=>{if(args.length!==1)throw Object.assign(new Error('只接受一個搜尋詞'),{code:'VALIDATION'});if(!root)throw Object.assign(new Error('請先選取資料夾'),{code:'NOT_SELECTED'});return job.start(root,args[0]);});
 bind('search:status',(...args)=>{noArgs(args);return job.status();});
 bind('search:cancel',(...args)=>{noArgs(args);return job.cancel();});
 win.on('closed',()=>job.dispose());
});
app.on('before-quit',()=>job.dispose());app.on('window-all-closed',()=>app.quit());
