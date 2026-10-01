const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const assert=require('node:assert/strict');const {createHash}=require('node:crypto');const {createLedger}=require('../../tools/ledger/store.cjs');const {importCSV,exportCSV}=require('../../tools/ledger/core.cjs');
// No user paths accepted: all replacement and recovery happen inside this new lab.
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ledger-backup-'));
const active=path.join(root,'ledger'),backup=path.join(root,'backup'),retained=path.join(root,'before-restore');
const hash=dir=>createHash('sha256').update(fs.readFileSync(path.join(dir,'ledger.json'))).digest('hex');
try{
 const rows=[{date:'2026-09-01',category:'='+'c'.repeat(79),note:'='+'x'.repeat(499),cents:10},{date:'2026-09-02',category:'餐,飲',note:'原文\n"保留"',cents:20}];
 createLedger(active).replace(rows);const original=fs.readFileSync(path.join(active,'ledger.json'));
 fs.cpSync(active,backup,{recursive:true,errorOnExist:true,force:false});assert.equal(hash(active),hash(backup));
 const manifest={source:active,backup,sha256:hash(backup)};fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
 assert.throws(()=>exportCSV(rows),/CSV_LIMIT/);
 createLedger(active).replace(importCSV('date,category,note,amount\n2026-09-03,交換,不同資料,1.00\n'));
 assert.notDeepEqual(createLedger(active).load().rows,rows);
 // Preserve the replaced version. Do not overwrite a running application's file.
 fs.renameSync(active,retained);fs.cpSync(backup,active,{recursive:true,errorOnExist:true,force:false});
 assert.deepEqual(fs.readFileSync(path.join(active,'ledger.json')),original);
 assert.deepEqual(createLedger(active).load().rows,rows);assert.equal(hash(active),manifest.sha256);
 console.log(JSON.stringify({...manifest,retained,restoredEveryField:true,restoredBytes:true},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true});}
