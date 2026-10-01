const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {SearchJob}=require('../src/search.cjs');

test('三份已知筆記：大小寫、中文、零結果',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'three-notes-'));
 const job=new SearchJob();
 try{
  await fs.writeFile(path.join(root,'a.md'),'今天研究 Electron 的 IPC。');
  await fs.writeFile(path.join(root,'b.txt'),'晚餐買青菜。');
  await fs.writeFile(path.join(root,'c.md'),'electron 可以製作桌面工具。');
  for(const [query,names] of [['Electron',['a.md','c.md']],['青菜',['b.txt']],['不存在的字串',[]]]){
   job.start(root,query);await job.finished;
   const state=job.status();assert.equal(state.phase,'done');assert.equal(state.scanned,3);
   assert.deepEqual(state.results.map(row=>row.name).sort(),names);
  }
 }finally{job.dispose();await fs.rm(root,{recursive:true,force:true});}
});
