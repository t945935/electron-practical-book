const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {getWeather,CITIES}=require('../src/weather.cjs');const {Cache}=require('../src/store.cjs');
test('Taichung fixed city survives cache restart and unknown city stays rejected',async t=>{
 assert.ok(Object.hasOwn(CITIES,'taichung'),'add fixed city');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'city-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let url;
 const weather=await getWeather('taichung',{fetchImpl:async u=>{url=u;return {ok:true,json:async()=>({timezone:'Asia/Taipei',utc_offset_seconds:28800,current:{temperature_2m:25,weather_code:3,time:'2026-09-30T10:00'},current_units:{temperature_2m:'°C'}})};}});
 assert.equal(url.hostname,'api.open-meteo.com');assert.equal(url.searchParams.get('latitude'),'24.1477');assert.equal(weather.city,'臺中');await new Cache(dir).save(weather);assert.deepEqual(await new Cache(dir).load(),weather);
 await assert.rejects(getWeather('unknown'),{code:'VALIDATION'});assert.match(fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8'),/<option value="taichung">臺中<\/option>/);
});
