const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('關窗隱藏；明確退出才允許關閉；到期只發一次',()=>{
 const p=path.join(__dirname,'../../../tools/reminder/reminder.cjs');assert.ok(fs.existsSync(p),'reminder module must exist');
 const {Reminder}=require(p);const r=new Reminder();
 assert.equal(r.closeAction(),'hide');r.schedule(5,1000);assert.equal(r.tick(5999),false);assert.equal(r.tick(6000),true);assert.equal(r.tick(6001),false);
 r.quit();assert.equal(r.closeAction(),'close');
});
