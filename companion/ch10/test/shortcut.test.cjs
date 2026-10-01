const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=path.join(__dirname,'../src');
const {Reminder}=require(path.join(source,'reminder.cjs'));

test('十五分鐘按鈕沿用排程；普通輸入可替換且取消有效',async()=>{
 const html=fs.readFileSync(path.join(source,'index.html'),'utf8');
 const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>['#'+m[1],{value:'10',textContent:''}]));
 assert.ok(elements.has('#quick15'),'HTML 必須提供 quick15 按鈕');
 const reminder=new Reminder();const calls=[];
 const reply=data=>({ok:true,data});
 const tool={
  schedule:async seconds=>{calls.push(seconds);return reply(reminder.schedule(seconds,1000));},
  cancel:async()=>reply(reminder.cancel()),status:async()=>reply(reminder.snapshot()),quit:()=>{}
 };
 vm.runInNewContext(fs.readFileSync(path.join(source,'renderer.js'),'utf8'),{
  document:{querySelector:selector=>elements.get(selector)},window:{tool},setTimeout:()=>{},Date
 });
 assert.equal(typeof elements.get('#quick15').onclick,'function');
 await elements.get('#quick15').onclick();
 assert.deepEqual(calls,[900]);assert.equal(reminder.dueAt,901000);
 await elements.get('#schedule').onclick();assert.deepEqual(calls,[900,10]);assert.equal(reminder.dueAt,11000);
 await elements.get('#quick15').onclick();assert.equal(reminder.dueAt,901000);
 await elements.get('#cancel').onclick();assert.equal(reminder.dueAt,null);assert.equal(reminder.tick(9999999),false);
});
