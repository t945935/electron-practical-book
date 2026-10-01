const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {getWeather}=require('../src/weather.cjs');const {Cache}=require('../src/store.cjs');
const body=time=>({timezone:'Asia/Taipei',utc_offset_seconds:28800,current:{temperature_2m:25,weather_code:3,time},current_units:{temperature_2m:'°C'}});
const query=b=>getWeather('taipei',{fetchImpl:async()=>({ok:true,json:async()=>b})});
test('null and non-object JSON are FORMAT',async()=>{for(const b of [null,[],1,'bad',true,{current:[]}])await assert.rejects(query(b),{code:'FORMAT'});});
test('API and cache require valid Taipei wall clock and UTC fetch instant',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'weather-format-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const cache=new Cache(dir);
 const valid=await query(body('2024-02-29T23:59'));await cache.save(valid);assert.deepEqual(await cache.load(),valid);
 for(const time of ['not-a-time','2026-02-29T12:00','2026-04-31T12:00','2026-01-01T24:00','2026-01-01T12:60','2026-01-01T12:00Z','2026-01-01T12:00:00']){
  await assert.rejects(query(body(time)),{code:'FORMAT'});
  await assert.rejects(cache.save({...valid,observedAt:time}),{code:'CACHE'});
  await fs.writeFile(cache.file,JSON.stringify({schemaVersion:1,weather:{...valid,observedAt:time}}));await assert.rejects(cache.load(),{code:'CACHE'});await fs.unlink(cache.file);
 }
 for(const fetchedAt of ['bad','2026-02-30T00:00:00.000Z','2026-01-01T00:00'])await assert.rejects(cache.save({...valid,fetchedAt}),{code:'CACHE'});
 for(const time of ['2026-01-01T00:00','2024-02-29T23:59'])assert.equal((await query(body(time))).observedAt,time);
 await assert.rejects(query({...body('2026-01-01T00:00'),timezone:'UTC'}),{code:'FORMAT'});
 await assert.rejects(query({...body('2026-01-01T00:00'),utc_offset_seconds:0}),{code:'FORMAT'});
});
