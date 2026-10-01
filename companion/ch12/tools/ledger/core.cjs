'use strict';
function parseMoney(text){if(typeof text!=='string'||!/^\d{1,14}(\.\d{1,2})?$/.test(text))throw Error('INVALID');const [whole,part='']=text.split('.');const n=BigInt(whole)*100n+BigInt(part.padEnd(2,'0'));if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('INVALID');return Number(n);}
function formatMoney(cents){if(!Number.isSafeInteger(cents)||cents<0)throw Error('INVALID');const n=BigInt(cents);return `${n/100n}.${String(n%100n).padStart(2,'0')}`;}
function validateRows(rows){if(!Array.isArray(rows)||rows.length>10000)throw Error('INVALID');return rows.map(r=>{if(!r||typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date+'T00:00:00Z'))||new Date(r.date+'T00:00:00Z').toISOString().slice(0,10)!==r.date||typeof r.category!=='string'||!r.category.trim()||r.category.length>80||typeof r.note!=='string'||r.note.length>500)throw Error('INVALID');formatMoney(r.cents);return {date:r.date,category:r.category,note:r.note,cents:r.cents};});}
function summarize(rows){validateRows(rows);let total=0n;const groups=Object.create(null);for(const r of rows){total+=BigInt(r.cents);groups[r.category]=(groups[r.category]||0n)+BigInt(r.cents);}const money=n=>`${n/100n}.${String(n%100n).padStart(2,'0')}`;return {total:money(total),groups:Object.entries(groups).map(([category,n])=>({category,total:money(n)}))};}
function parseCSV(text){if(typeof text!=='string'||Buffer.byteLength(text)>5*1024*1024)throw Error('INVALID');text=text.replace(/^\uFEFF/,'');let rows=[],row=[],field='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
 if(c==='"'){if(field||closed)throw Error('INVALID');quoted=true;}else if(c===','){row.push(field);field='';closed=false;}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';closed=false;}else{if(closed)throw Error('INVALID');field+=c;}}
 if(quoted)throw Error('INVALID');if(field||closed||row.length){row.push(field);rows.push(row);}return rows;
}
function importCSV(text){const [header,...rows]=parseCSV(text);if(JSON.stringify(header)!==JSON.stringify(['date','category','note','amount']))throw Error('INVALID');return validateRows(rows.map(r=>{if(r.length!==4)throw Error('INVALID');return {date:r[0],category:r[1],note:r[2],cents:parseMoney(r[3])};}));}
function csvCell(value){let s=String(value);if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function exportCSV(rows){validateRows(rows);const text='\uFEFFdate,category,note,amount\r\n'+rows.map(r=>[r.date,r.category,r.note,formatMoney(r.cents)].map(csvCell).join(',')+'\r\n').join('');
 // Require the protected text to fit the unchanged import contract. Never strip the prefix.
 try{importCSV(text);}catch{throw Error('CSV_LIMIT');}return text;}
function exportMonth(rows,month){
 if(typeof month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('INVALID');
 const clean=validateRows(rows);return exportCSV(clean.filter(r=>r.date.startsWith(month+'-')));
}
module.exports={exportMonth,parseMoney,formatMoney,validateRows,summarize,parseCSV,importCSV,exportCSV,csvCell};
