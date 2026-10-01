const {getWeather}=require('../src/weather.cjs');
(async()=>{try{const result=await getWeather('taipei');console.log(JSON.stringify({mode:'REAL_NETWORK',...result},null,2));}catch(error){console.error(JSON.stringify({mode:'REAL_NETWORK',code:error.code,message:error.message}));process.exitCode=1;}})();
