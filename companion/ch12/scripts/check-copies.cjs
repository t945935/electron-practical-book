const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function audit(rows,sourceRoot,targetRoot){
 return rows.map(row=>{
  const result={...row,review:row.modified?'MANUAL_MERGE':'COMPARE_THEN_COPY'};
  try{
   result.actual_source_sha256=hash(path.resolve(sourceRoot,row.source));
   result.actual_target_sha256=hash(path.resolve(targetRoot,row.target));
   const source=result.actual_source_sha256!==row.source_sha256;
   const target=result.actual_target_sha256!==row.target_sha256;
   result.status=source?(target?'BOTH_CHANGED':'SOURCE_CHANGED'):(target?'TARGET_CHANGED':'OK');
  }catch(error){if(error.code!=='ENOENT')throw error;result.status='MISSING';}
  return result;
 });
}
module.exports={audit};
if(require.main===module){
 try{
  const targetRoot=path.resolve(process.argv[3]||path.join(__dirname,'..'));
  const sourceRoot=path.resolve(process.argv[2]||path.join(targetRoot,'../..'));
  const rows=audit(JSON.parse(fs.readFileSync(path.join(targetRoot,'COPIED-MODULES.json'),'utf8')),sourceRoot,targetRoot);
  const changed=rows.filter(row=>row.status!=='OK').length;
  console.log(JSON.stringify({total:rows.length,changed,rows},null,2));
  process.exitCode=changed?1:0;
 }catch(error){console.error('核對失敗：'+error.message);process.exitCode=2;}
}

