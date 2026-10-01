const {test}=require('node:test');const assert=require('node:assert/strict');const {exportCSV,importCSV}=require('../core.cjs');
const row={date:'2026-09-01',category:'練習',note:'',cents:10};
test('export rejects safety-prefix overflow explicitly without mutating rows',()=>{
 for(const [key,max] of [['category',80],['note',500]]){
  const value='='+'x'.repeat(max-1),rows=[{...row,[key]:value}];assert.throws(()=>exportCSV(rows),/CSV_LIMIT/);assert.equal(rows[0][key],value);
  const safe=[{...row,[key]:'='+'x'.repeat(max-2)}];assert.equal(importCSV(exportCSV(safe))[0][key],"'"+safe[0][key]);
  const plain=[{...row,[key]:'x'.repeat(max)}];assert.deepEqual(importCSV(exportCSV(plain)),plain);
 }
});
test('export refuses a CSV larger than importer byte budget',()=>{const rows=Array.from({length:10000},()=>({...row,note:'字'.repeat(500)}));assert.throws(()=>exportCSV(rows),/CSV_LIMIT/);});
