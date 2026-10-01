const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePath=path.join(__dirname,'../../../tools/weather/weather.cjs');
test('固定城市查詢轉換為可呈現天氣',async()=>{
 assert.ok(fs.existsSync(modulePath),'weather module must exist');
 const {getWeather}=require(modulePath);
 const result=await getWeather('taipei',{fetchImpl:async()=>({ok:true,json:async()=>({timezone:'Asia/Taipei',utc_offset_seconds:28800,current:{temperature_2m:26,weather_code:3,time:'2026-09-30T10:00'},current_units:{temperature_2m:'°C'}})})});
 assert.equal(result.temperature,26); assert.equal(result.city,'臺北');
});
