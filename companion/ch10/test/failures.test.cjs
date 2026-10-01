const {test}=require('node:test');const assert=require('node:assert/strict');const {Reminder}=require('../src/reminder.cjs');
test('非法秒數與取消提醒',()=>{const r=new Reminder();for(const n of [0,4,86401,5.5,'10',NaN])assert.throws(()=>r.schedule(n),{code:'VALIDATION'});r.schedule(5,0);r.cancel();assert.equal(r.tick(100000),false);});
test('休眠後以截止時間只補發一次；重排取代舊提醒',()=>{const r=new Reminder();r.schedule(5,0);r.schedule(10,0);assert.equal(r.tick(5000),false);assert.equal(r.tick(99999999),true);assert.equal(r.tick(99999999),false);});
