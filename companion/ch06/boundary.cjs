const messages={FORBIDDEN:'拒絕未授權來源。',INVALID:'輸入格式不正確或超過本工具限制。',RECOVERY:'請先備份並復原損毀資料。',CHANGED:'檔案已在外部變更，請重新開啟或預覽。',COLLISION:'目的地名稱已存在；未開始整理。',IO:'操作失敗；請檢查權限、磁碟空間與檔案是否被占用。'};
function noArgs(value){if(value!==undefined)throw Error('INVALID');}
function gate(trusted,task){return async(event,value)=>{try{if(!trusted(event))throw Error('FORBIDDEN');return {ok:true,data:await task(value)};}catch(e){const code=Object.hasOwn(messages,e.message)?e.message:'IO';return {ok:false,error:{code,message:messages[code]}};}};}
module.exports={gate,noArgs};
