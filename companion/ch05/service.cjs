const {createTodoStore}=require('./core.cjs');const {noArgs}=require('./boundary.cjs');
function createTool({dataDir,dialog,win}){const store=createTodoStore(dataDir);return {handlers:{load(value){noArgs(value);return store.load();},save(items){return store.save(items);},async recover(value){noArgs(value);const r=await dialog.showMessageBox(win,{type:'warning',buttons:['取消','保留損毀檔並建立空清單'],defaultId:0,cancelId:0,message:'復原不會刪除損毀原檔，但清單將從空白開始。'});return r.response===1?store.recover():{canceled:true};}}};}
module.exports={createTool};
