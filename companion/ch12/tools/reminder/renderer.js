const status=document.querySelector('#status');const due=document.querySelector('#due');let version=0;
function show(reply){if(!reply.ok){status.textContent=reply.error.message;return;}status.textContent=reply.data.message;due.textContent=reply.data.dueAt?`預定：${new Date(reply.data.dueAt).toLocaleString()}`:'沒有等待中的提醒';if(reply.data.notificationSupported===false)status.textContent+='；此系統不支援通知';}
async function action(fn){version++;try{show(await fn());}catch{status.textContent='與主程序連線失敗';}}
document.querySelector('#schedule').onclick=()=>action(()=>window.tool.schedule(Number(document.querySelector('#seconds').value)));
document.querySelector('#quick15').onclick=()=>action(()=>window.tool.schedule(900));
document.querySelector('#cancel').onclick=()=>action(()=>window.tool.cancel());document.querySelector('#quit').onclick=()=>window.tool.quit();
async function poll(){const v=version;try{const reply=await window.tool.status();if(v===version)show(reply);}catch{status.textContent='無法取得狀態';}setTimeout(poll,500);}poll();
