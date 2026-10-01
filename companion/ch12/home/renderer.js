const $=id=>document.getElementById(id);
async function call(name,...args){const r=await window.toolbox[name](...args);if(!r.ok)throw Error(r.error.message);return r.data;}
async function run(task){try{await task();}catch(e){$('status').textContent=e.message;}}
run(async()=>{for(const t of await call('catalog')){const button=document.createElement('button');button.textContent=t.title;button.dataset.tool=t.id;button.onclick=()=>run(async()=>{await call('open',t.id);$('status').textContent='已開啟 '+t.title;});$('tools').append(button);const option=document.createElement('option');option.value=t.id;option.textContent=t.title;$('startup').append(option);}$('startup').value=(await call('settings')).startup;});
$('save').onclick=()=>run(async()=>{await call('saveSettings',{startup:$('startup').value});$('status').textContent='已儲存；下次啟動時套用';});
$('quit').onclick=()=>run(()=>call('quit'));
