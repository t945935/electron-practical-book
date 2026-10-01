const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const sync=require('node:fs');const os=require('node:os');const path=require('node:path');
test('搜尋本機 Markdown，worker 回傳進度與結果',async()=>{
 const p=path.join(__dirname,'../../../tools/search/search.cjs');assert.ok(sync.existsSync(p),'search module must exist');
 const {SearchJob}=require(p);const root=await fs.mkdtemp(path.join(os.tmpdir(),'book-search-'));
 try{await fs.writeFile(path.join(root,'a.md'),'今天研究 Electron');await fs.writeFile(path.join(root,'b.txt'),'另一份筆記');const job=new SearchJob();job.start(root,'electron');await job.finished;const state=job.status();assert.equal(state.phase,'done');assert.equal(state.scanned,2);assert.equal(state.results[0].name,'a.md');}finally{await fs.rm(root,{recursive:true,force:true});}
});
