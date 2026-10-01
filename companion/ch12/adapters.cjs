const path=require('node:path');
const noArgs=args=>{if(args.length)throw Error('INVALID');};
const one=(args)=>{if(args.length!==1)throw Error('INVALID');return args[0];};
function createAdapter(id,{dataDir,win,electron,quit,open}){
 const {dialog,Tray,Menu,nativeImage,Notification}=electron;
 if(['todo','notes','organizer','ledger'].includes(id))return require('./tools/'+id+'/service.cjs').createTool({dataDir,win,dialog});
 if(id==='timer')return {handlers:{}};
 if(id==='weather'){
  const {getWeather}=require('./tools/weather/weather.cjs');const {Cache}=require('./tools/weather/store.cjs');const cache=new Cache(dataDir);
  return {handlers:{async cached(...args){noArgs(args);try{return {weather:await cache.load(),warning:null};}catch{return {weather:null,warning:'快取損毀或版本不符；原檔保留'};}},async query(...args){const weather=await getWeather(one(args));let warning=null;try{await cache.save(weather);}catch{warning='資料已取得，但快取未儲存';}return {...weather,warning};}}};
 }
 if(id==='search'){
  const {SearchJob}=require('./tools/search/search.cjs');const job=new SearchJob();let root=null;
  return {dispose:()=>job.dispose(),handlers:{async choose(...args){noArgs(args);const r=await dialog.showOpenDialog(win,{properties:['openDirectory']});if(r.canceled)return {cancelled:true};job.cancel();root=r.filePaths[0];return {cancelled:false,name:path.basename(root)};},start(...args){const query=one(args);if(!root)throw Object.assign(Error('請先選取資料夾'),{code:'NOT_SELECTED'});return job.start(root,query);},status(...args){noArgs(args);return job.status();},cancel(...args){noArgs(args);return job.cancel();}}};
 }
 if(id==='reminder'){
  const {Reminder}=require('./tools/reminder/reminder.cjs');const reminder=new Reminder();let tray;const notifications=new Set();
  const pixels=Buffer.alloc(16*16*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=190;pixels[i+1]=95;pixels[i+2]=30;pixels[i+3]=255;}
  try{tray=new Tray(nativeImage.createFromBitmap(pixels,{width:16,height:16}));tray.setToolTip('自己的工具箱');tray.setContextMenu(Menu.buildFromTemplate([{label:'開啟工具箱',click:()=>open('home')},{label:'開啟提醒',click:()=>open('reminder')},{label:'取消提醒',click:()=>reminder.cancel()},{type:'separator'},{label:'結束整個工具箱',click:quit}]));tray.on('double-click',()=>open('reminder'));}catch{reminder.message='系統匣不可用；關閉視窗會取消提醒';}
  const ticker=setInterval(()=>{if(!reminder.tick())return;if(!Notification.isSupported()){reminder.message='提醒到期；此系統不支援通知';return;}try{const n=new Notification({title:'休息一下',body:'離開座位、喝水，再回來繼續。'});notifications.add(n);n.on('failed',()=>{reminder.message='通知傳送失敗，請檢查系統通知設定';notifications.delete(n);});n.on('close',()=>notifications.delete(n));n.on('click',()=>{open('reminder');notifications.delete(n);});n.show();reminder.message='已要求系統顯示通知；未看到時請檢查勿擾模式';}catch{reminder.message='通知建立失敗';}},250);
  return {hideOnClose:()=>Boolean(tray),dispose(){reminder.quit();clearInterval(ticker);for(const n of notifications)n.close();tray?.destroy();tray=null;},handlers:{schedule(...args){return reminder.schedule(one(args));},cancel(...args){noArgs(args);return reminder.cancel();},status(...args){noArgs(args);return {...reminder.snapshot(),notificationSupported:Notification.isSupported()};},quit(...args){noArgs(args);setImmediate(quit);return null;}}};
 }
 throw Error('UNKNOWN_TOOL');
}
module.exports={createAdapter};
