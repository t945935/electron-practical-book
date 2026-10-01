const CITIES=Object.freeze({taichung:{name:'臺中',latitude:24.1477,longitude:120.6736},taipei:{name:'臺北',latitude:25.033,longitude:121.5654},kaohsiung:{name:'高雄',latitude:22.6273,longitude:120.3014}});
function fault(code,message){return Object.assign(new Error(message),{code});}
async function getWeather(city,{fetchImpl=fetch,timeoutMs=8000}={}){
 if(typeof city!=='string'||!Object.hasOwn(CITIES,city)) throw fault('VALIDATION','請選擇清單中的城市');
 const place=CITIES[city];
 const url=new URL('https://api.open-meteo.com/v1/forecast');
 url.search=new URLSearchParams({latitude:String(place.latitude),longitude:String(place.longitude),current:'temperature_2m,weather_code',timezone:'Asia/Taipei',temperature_unit:'celsius'});
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchImpl(url,{signal:controller.signal,redirect:'error'});
  if(!response.ok) throw fault('HTTP','天氣服務暫時無法使用');
  let body;try{body=await response.json();}catch{throw fault('FORMAT','天氣資料不是有效 JSON');}
  const c=body?.current;
  if(!body||typeof body!=='object'||Array.isArray(body)||!c||typeof c!=='object'||Array.isArray(c)||!Number.isFinite(c.temperature_2m)||!Number.isInteger(c.weather_code)||!require('./time.cjs').observedTime(c.time)||body.timezone!=='Asia/Taipei'||body.utc_offset_seconds!==28800||body.current_units?.temperature_2m!=='°C') throw fault('FORMAT','天氣資料格式不符');
  return {city:place.name,cityId:city,temperature:c.temperature_2m,code:c.weather_code,observedAt:c.time,timezone:'Asia/Taipei',fetchedAt:new Date().toISOString(),source:'Open-Meteo'};
 }catch(error){
  if(controller.signal.aborted) throw fault('TIMEOUT','查詢逾時，請稍後重試');
  if(['HTTP','FORMAT'].includes(error.code)) throw error;
  throw fault('OFFLINE','無法連線；請檢查網路或代理伺服器');
 }finally{clearTimeout(timer);}
}
module.exports={getWeather,CITIES};
