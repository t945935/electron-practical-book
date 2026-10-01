const {Worker}=require('node:worker_threads');const path=require('node:path');
class SearchJob{
 constructor(){this.generation=0;this.worker=null;this.state={phase:'idle',scanned:0,skipped:0,results:[],truncated:false};this.finished=Promise.resolve();}
 start(root,query){
  if(typeof query!=='string'||!query.trim()||query.length>100)throw Object.assign(new Error('請輸入 1 至 100 字搜尋詞'),{code:'VALIDATION'});
  this.cancel();const generation=++this.generation;
  this.state={phase:'running',scanned:0,skipped:0,results:[],truncated:false};
  const worker=new Worker(path.join(__dirname,'search-worker.cjs'),{workerData:{root,query:query.trim().toLocaleLowerCase()}});this.worker=worker;
  this.finished=new Promise(resolve=>{
   worker.on('message',message=>{if(generation===this.generation)this.state=message;});
   worker.on('error',()=>{if(generation===this.generation)this.state={...this.state,phase:'error',message:'無法搜尋此資料夾'};});
   worker.on('exit',code=>{if(generation===this.generation){if(this.state.phase==='running')this.state={...this.state,phase:'error',message:'搜尋程序意外結束'};this.worker=null;}resolve(code);});
  });return this.status();
 }
 cancel(){if(this.worker){this.generation++;void this.worker.terminate();this.worker=null;this.state={...this.state,phase:'cancelled'};}return this.status();}
 status(){return structuredClone(this.state);}
 dispose(){this.cancel();}
}
module.exports={SearchJob};
