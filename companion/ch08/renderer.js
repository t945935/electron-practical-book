const $=id=>document.getElementById(id);
function message(text){$('status').textContent=text;}
async function call(name,value){const result=await window.tool[name](value);if(!result.ok)throw Error(result.error.message);return result.data;}
let busy=false;
async function run(job){if(busy)return;busy=true;const controls=[...document.querySelectorAll('button,input,textarea')];const before=controls.map(x=>x.disabled);controls.forEach(x=>x.disabled=true);try{await job();}catch(e){message(e.message);}finally{controls.forEach((x,i)=>x.disabled=before[i]);busy=false;}}
function money(c){const n=BigInt(c);return `${n/100n}.${String(n%100n).padStart(2,'0')}`;}
function render(data){if(data.canceled){message('已取消，帳本不變');return;}if(data.exported){message('CSV 已匯出');return;}$('total').textContent='總支出：'+data.report.total;$('groups').replaceChildren();for(const g of data.report.groups){const li=document.createElement('li');li.textContent=g.category+'：'+g.total;$('groups').append(li);}$('rows').replaceChildren();for(const r of data.rows){const tr=document.createElement('tr');for(const value of [r.date,r.category,r.note,money(r.cents)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('rows').append(tr);}message('帳本已載入並保存');}
$('date').value=new Date().toLocaleDateString('en-CA');
$('form').addEventListener('submit',e=>{e.preventDefault();const v=Object.fromEntries(['date','category','note','amount'].map(k=>[k,$(k).value]));run(async()=>{render(await call('add',v));$('amount').value='';$('note').value='';});});
for(const name of ['importCSV','exportCSV'])$(name).addEventListener('click',()=>run(async()=>render(await call(name))));run(async()=>render(await call('load')));
