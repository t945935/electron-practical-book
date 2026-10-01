const {parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs/promises');const {constants}=require('node:fs');const path=require('node:path');
(async()=>{
 const state={phase:'running',scanned:0,skipped:0,results:[],truncated:false};
 const root=await fs.realpath(workerData.root);let visited=0,lastSent=0;
 const directory=await fs.opendir(root);
 for await(const entry of directory){
  if(++visited>10000){state.truncated=true;break;}
  if(!entry.isFile()||!['.md','.txt'].includes(path.extname(entry.name).toLowerCase())){state.skipped++;continue;}
  let handle;
  try{
   const filename=path.join(root,entry.name);
   if(await fs.realpath(filename)!==filename){state.skipped++;continue;}
   handle=await fs.open(filename,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
   const stat=await handle.stat();
   if(!stat.isFile()||stat.size>1024*1024){state.skipped++;continue;}
   const buffer=await require('./read-bounded.cjs').readBounded(handle);
   if(buffer===null){state.skipped++;continue;}
   const text=buffer.toString('utf8');state.scanned++;
   if(text.toLocaleLowerCase().includes(workerData.query)){
    if(state.results.length<200)state.results.push({name:entry.name});else state.truncated=true;
   }
  }catch{state.skipped++;}finally{await handle?.close();}
  if(Date.now()-lastSent>=100){parentPort.postMessage(state);lastSent=Date.now();}
 }
 state.phase='done';parentPort.postMessage(state);
})().catch(()=>{parentPort.postMessage({phase:'error',scanned:0,skipped:0,results:[],truncated:false,message:'無法讀取所選資料夾'});});
