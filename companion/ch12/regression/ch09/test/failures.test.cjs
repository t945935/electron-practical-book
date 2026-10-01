const {test}=require('node:test');const assert=require('node:assert/strict');const {getWeather}=require('../../../tools/weather/weather.cjs');
test('拒絕 URL、prototype 與錯誤型別',async()=>{for(const city of ['https://evil.invalid','__proto__',null,{}])await assert.rejects(()=>getWeather(city),{code:'VALIDATION'});});
test('HTTP 失敗不被當成離線',async()=>{await assert.rejects(()=>getWeather('taipei',{fetchImpl:async()=>({ok:false})}),{code:'HTTP'});});
test('網路拒絕連線有 OFFLINE',async()=>{await assert.rejects(()=>getWeather('taipei',{fetchImpl:async()=>{throw new TypeError('network');}}),{code:'OFFLINE'});});
test('逾時真正 abort fetch',async()=>{await assert.rejects(()=>getWeather('taipei',{timeoutMs:10,fetchImpl:(_u,{signal})=>new Promise((_r,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)))}),{code:'TIMEOUT'});});
test('欄位損壞有 FORMAT',async()=>{await assert.rejects(()=>getWeather('taipei',{fetchImpl:async()=>({ok:true,json:async()=>({current:{temperature_2m:null}})})}),{code:'FORMAT'});});
test('非 JSON 回應有 FORMAT 而非 OFFLINE',async()=>{await assert.rejects(()=>getWeather('taipei',{fetchImpl:async()=>({ok:true,json:async()=>{throw new SyntaxError('bad json');}})}),{code:'FORMAT'});});
