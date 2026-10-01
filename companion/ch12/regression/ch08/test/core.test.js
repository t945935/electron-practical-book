const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'); const os=require('node:os'); const path=require('node:path');
const file=path.join(__dirname,'../../../tools/ledger/core.cjs'); const api=fs.existsSync(file)?require(file):{};
test('first usable chapter behavior',t=>{ assert.equal(typeof api.parseMoney,'function'); assert.equal(api.parseMoney('0.10')+api.parseMoney('0.20'),30); assert.equal(api.formatMoney(30),'0.30'); });

test('reject amounts with exponent decimals blank negatives and overflow',()=>{for(const x of ['','1e3','0.001','-2',' 1','NaN','90071992547409.92'])assert.throws(()=>api.parseMoney(x),undefined,x);});
test('CSV quote roundtrip and formula neutralization',()=>{assert.equal(typeof api.exportCSV,'function');const rows=[{date:'2026-09-01',category:'餐,飲',note:'=1+1',cents:30}];const csv=api.exportCSV(rows);assert.ok(csv.includes("'=1+1"));assert.deepEqual(api.importCSV(csv),[{...rows[0],note:"'=1+1"}]);assert.throws(()=>api.importCSV('date,category,note,amount\n2026-02-30,x,y,1'));assert.throws(()=>api.importCSV('date,category,note,amount\n"unterminated'));});

test('category keys and huge totals remain precise',()=>{assert.equal(api.summarize([{date:'2026-09-01',category:'__proto__',note:'',cents:30}]).total,'0.30');assert.equal(api.summarize([{date:'2026-09-01',category:'x',note:'',cents:Number.MAX_SAFE_INTEGER},{date:'2026-09-01',category:'x',note:'',cents:Number.MAX_SAFE_INTEGER}]).total,'180143985094819.82');});

test('reserved object category becomes a normal report row',()=>{assert.deepEqual(api.summarize([{date:'2026-09-01',category:'__proto__',note:'',cents:30}]).groups,[{category:'__proto__',total:'0.30'}]);});

test('empty CSV export can be imported',()=>assert.deepEqual(api.importCSV(api.exportCSV([])),[]));
test('CSV retains comma quote and newline and guards formula prefixes',()=>{const r={date:'2026-09-01',category:'"餐,飲"',note:'line1\nline2',cents:100};assert.deepEqual(api.importCSV(api.exportCSV([r])),[r]);for(const s of ['=1','+1','-1','@SUM(A1)','\t=1',' \r=1'])assert.ok(api.csvCell(s).startsWith('"\''));});
