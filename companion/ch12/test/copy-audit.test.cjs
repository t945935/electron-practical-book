const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');
const {audit}=require('../scripts/check-copies.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
test('來源變動必須報差異，不准刷新基線掩蓋',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'copies-'));
 try{
  fs.mkdirSync(path.join(dir,'app'));fs.writeFileSync(path.join(dir,'source.cjs'),'new');fs.writeFileSync(path.join(dir,'app/target.cjs'),'old');
  const rows=[{source:'source.cjs',target:'target.cjs',source_sha256:hash('old'),target_sha256:hash('old'),modified:false}];
  const before=JSON.stringify(rows);
  assert.deepEqual(audit(rows,dir,path.join(dir,'app')).map(x=>x.status),['SOURCE_CHANGED']);
  assert.equal(JSON.stringify(rows),before);assert.equal(fs.readFileSync(path.join(dir,'app/target.cjs'),'utf8'),'old');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('目的改動、改作來源、缺檔與未變動分別可追蹤',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'copies-'));
 try{
  fs.writeFileSync(path.join(dir,'source.cjs'),'old');fs.writeFileSync(path.join(dir,'target.cjs'),'new');
  const row={source:'source.cjs',target:'target.cjs',source_sha256:hash('old'),target_sha256:hash('old'),modified:true};
  assert.equal(audit([row],dir,dir)[0].status,'TARGET_CHANGED');
  fs.writeFileSync(path.join(dir,'source.cjs'),'new');
  assert.equal(audit([row],dir,dir)[0].status,'BOTH_CHANGED');
  row.target_sha256=hash('new');
  assert.equal(audit([row],dir,dir)[0].status,'SOURCE_CHANGED');
  assert.equal(audit([row],dir,dir)[0].review,'MANUAL_MERGE');
  row.source_sha256=hash('new');assert.equal(audit([row],dir,dir)[0].status,'OK');
  fs.unlinkSync(path.join(dir,'target.cjs'));assert.equal(audit([row],dir,dir)[0].status,'MISSING');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('CLI 核對結果可保存且有差異時 exit 1，不修改任何檔案',()=>{
 const {spawnSync}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'copies-cli-'));
 try{
  const rows=[{source:'source.cjs',target:'target.cjs',source_sha256:hash('old'),target_sha256:hash('old'),modified:false}];
  fs.writeFileSync(path.join(dir,'COPIED-MODULES.json'),JSON.stringify(rows));
  fs.writeFileSync(path.join(dir,'source.cjs'),'new');fs.writeFileSync(path.join(dir,'target.cjs'),'old');
  const run=spawnSync(process.execPath,[path.join(__dirname,'../scripts/check-copies.cjs'),dir,dir],{encoding:'utf8'});
  assert.equal(run.status,1,'差異必須以 exit 1 阻擋同步完成宣告');
  assert.equal(JSON.parse(run.stdout).rows[0].status,'SOURCE_CHANGED');
  assert.equal(fs.readFileSync(path.join(dir,'COPIED-MODULES.json'),'utf8'),JSON.stringify(rows));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
