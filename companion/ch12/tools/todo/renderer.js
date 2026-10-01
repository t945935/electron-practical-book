const $=id=>document.getElementById(id);
function message(text){$('status').textContent=text;}
async function call(name,value){const result=await window.tool[name](value);if(!result.ok)throw Error(result.error.message);return result.data;}
let busy=false;
async function run(job){if(busy)return;busy=true;const controls=[...document.querySelectorAll('button,input,textarea')];const before=controls.map(x=>x.disabled);controls.forEach(x=>x.disabled=true);try{await job();}catch(e){message(e.message);}finally{controls.forEach((x,i)=>x.disabled=before[i]);busy=false;}}
let items=[],recoveryRequired=false;
function render(data){if(data.canceled)return;items=data.items;recoveryRequired=Boolean(data.recoveryRequired);$('recover').hidden=!data.recoveryRequired;$('form').hidden=data.recoveryRequired;$('list').replaceChildren();if(data.recoveryRequired){message('資料無法讀取；請使用復原按鈕保留損毀原檔。');return;}
 for(const item of items.filter(x=>!$('pending').checked||!x.done)){const li=document.createElement('li'),check=document.createElement('input'),label=document.createElement('span'),remove=document.createElement('button');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label','完成 '+item.text);label.textContent=item.text;remove.textContent='刪除';check.addEventListener('change',()=>run(async()=>{try{render(await call('save',items.map(x=>x.id===item.id?{...x,done:check.checked}:x)));message('已儲存');}catch(e){check.checked=item.done;throw e;}}));remove.addEventListener('click',()=>run(async()=>{render(await call('save',items.filter(x=>x.id!==item.id)));message('已儲存');}));li.append(check,label,remove);$('list').append(li);}}
$('pending').addEventListener('change',()=>render({items,recoveryRequired}));
$('form').addEventListener('submit',e=>{e.preventDefault();const text=$('text').value;run(async()=>{render(await call('save',[...items,{id:crypto.randomUUID(),text,done:false}]));$('text').value='';message('已儲存');});});
$('recover').addEventListener('click',()=>run(async()=>render(await call('recover'))));run(async()=>render(await call('load')));
