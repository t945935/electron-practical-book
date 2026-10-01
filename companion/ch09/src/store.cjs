const fs=require('node:fs/promises');const path=require('node:path');const {randomUUID}=require('node:crypto');
function valid(d){return d&&['taipei','kaohsiung','taichung'].includes(d.cityId)&&typeof d.city==='string'&&d.city.length<30&&Number.isFinite(d.temperature)&&Number.isInteger(d.code)&&require('./time.cjs').observedTime(d.observedAt)&&require('./time.cjs').fetchedTime(d.fetchedAt)&&d.source==='Open-Meteo'&&d.timezone==='Asia/Taipei';}
class Cache{
 constructor(dir){this.dir=dir;this.file=path.join(dir,'cache.json');}
 async load(){try{const stat=await fs.lstat(this.file);if(!stat.isFile()||stat.size>4096)throw new Error();const data=JSON.parse(await fs.readFile(this.file,'utf8'));if(data.schemaVersion!==1||!valid(data.weather))throw new Error();return data.weather;}catch(error){if(error.code==='ENOENT')return null;throw Object.assign(new Error('快取無法讀取，原檔保留'),{code:'CACHE'});}}
 async save(weather){if(!valid(weather))throw Object.assign(new Error('快取格式錯誤'),{code:'CACHE'});await fs.mkdir(this.dir,{recursive:true});await this.load();const temp=path.join(this.dir,`.cache-${randomUUID()}.tmp`);let handle;
  try{handle=await fs.open(temp,'wx',0o600);await handle.writeFile(JSON.stringify({schemaVersion:1,weather},null,2),'utf8');await handle.sync();await handle.close();handle=null;await fs.rename(temp,this.file);}finally{await handle?.close();await fs.rm(temp,{force:true});}
 }
}
module.exports={Cache};
