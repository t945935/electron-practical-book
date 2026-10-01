const status=document.querySelector('#status');const button=document.querySelector('#query');const weather=document.querySelector('#weather');let last=null;
button.disabled=true;window.tool.cached().then(reply=>{if(reply.ok){last=reply.data.weather;if(last){weather.textContent=`${last.city} ${last.temperature} °C\n資料時間：${last.observedAt}（${last.timezone}）`;status.textContent='上次快取資料（可能過期）；請按查詢更新';}if(reply.data.warning)status.textContent=reply.data.warning;}}).catch(()=>{status.textContent='快取讀取失敗';}).finally(()=>{button.disabled=false;});
button.addEventListener('click',async()=>{button.disabled=true;status.textContent='查詢中（最多約八秒）…';
 try{const reply=await window.tool.query(document.querySelector('#city').value);
 if(reply.ok){last=reply.data;weather.textContent=`${last.city} ${last.temperature} °C\n天氣代碼：${last.code}\n資料時間：${last.observedAt}（${last.timezone}）\n取得時間：${last.fetchedAt}`;status.textContent=last.warning||'查詢完成';}
 else{status.textContent=`${reply.error.code}：${reply.error.message}`+(last?'。下方為上次成功資料，可能過期，城市以資料標示為準。':'。目前沒有可顯示資料。');}
 }catch{status.textContent='與主程序連線失敗，請重新啟動';}finally{button.disabled=false;}
});
