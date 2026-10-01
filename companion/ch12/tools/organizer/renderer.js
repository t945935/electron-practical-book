const $=id=>document.getElementById(id);
function message(text){$('status').textContent=text;}
async function call(name,value){const result=await window.tool[name](value);if(!result.ok)throw Error(result.error.message);return result.data;}
let busy=false;
async function run(job){if(busy)return;busy=true;const controls=[...document.querySelectorAll('button,input,textarea')];const before=controls.map(x=>x.disabled);controls.forEach(x=>x.disabled=true);try{await job();}catch(e){message(e.message);}finally{controls.forEach((x,i)=>x.disabled=before[i]);busy=false;}}
let ready=false;
function show(data){if(data.canceled){message('已取消');return;}$('workspace').textContent='工作副本位置：'+data.workspace;if(data.items){$('plan').textContent=data.items.map(x=>x.source+' → '+x.target+'（'+x.reason+'）').join('\n')||'沒有可整理的檔案';ready=data.items.length>0;message('請閱讀預覽，再按確認。');}else{ready=false;$('plan').textContent='已完成：'+data.completed.join('、')+(data.stopped?'\n停止於：'+data.stopped+'\n'+data.reason:'');message(data.stopped?'部分完成；先保存現況，保留此副本。從未變更原件另建工作副本，不要碰撞重試。':'整理完成；原始選取資料夾保持不變。');}}
for(const name of ['sample','choose','preview','apply'])$(name).addEventListener('click',async()=>{await run(async()=>{try{show(await call(name));}catch(e){ready=false;throw e;}});$('apply').disabled=!ready;});
