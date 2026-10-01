const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const api=require('../core.cjs');const {createLedger}=require('../store.cjs');
test('month export filters a report without replacing the ledger',t=>{
 assert.equal(typeof api.exportMonth,'function');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'month-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const s=createLedger(dir);const rows=[{date:'2026-09-01',category:'練習',note:'=1',cents:10},{date:'2026-10-01',category:'練習',note:'keep',cents:20}];s.replace(rows);const before=fs.readFileSync(path.join(dir,'ledger.json'));
 assert.deepEqual(api.importCSV(api.exportMonth(s.load().rows,'2026-09')),[{...rows[0],note:"'=1"}]);assert.deepEqual(api.importCSV(api.exportMonth(rows,'2026-11')),[]);for(const month of ['2026-13','2026-9','bad'])assert.throws(()=>api.exportMonth(rows,month),/INVALID/);
 assert.deepEqual(fs.readFileSync(path.join(dir,'ledger.json')),before);assert.deepEqual(createLedger(dir).load().rows,rows);
});
