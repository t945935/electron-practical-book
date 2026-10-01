'use strict';
const fs=require('node:fs');const path=require('node:path');const {createHash}=require('node:crypto');
function group(name){const ext=path.extname(name).toLowerCase();return ['.jpg','.jpeg','.png','.gif'].includes(ext)?'images':['.txt','.md','.pdf','.csv'].includes(ext)?'documents':'others';}
function regular(file){const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.size>20*1024*1024)throw Error('INVALID');return s;}
function fingerprint(file){const s=regular(file);return [s.dev,s.ino,s.size,createHash('sha256').update(fs.readFileSync(file)).digest('hex')].join(':');}
function safeRoot(root){const s=fs.lstatSync(root);if(!s.isDirectory()||s.isSymbolicLink()||fs.realpathSync(root)!==path.resolve(root))throw Error('INVALID');}
function targetCheck(root,target){const dest=path.join(root,target),dir=path.dirname(dest);if(fs.existsSync(dir)){const s=fs.lstatSync(dir);if(!s.isDirectory()||s.isSymbolicLink())throw Error('INVALID');}try{fs.lstatSync(dest);throw Error('COLLISION');}catch(e){if(e.code!=='ENOENT')throw e;}}
function planDirectory(root){
 root=path.resolve(root);safeRoot(root);const entries=fs.readdirSync(root,{withFileTypes:true});if(entries.length>1000)throw Error('INVALID');
 const items=entries.filter(x=>x.isFile()).sort((a,b)=>a.name.localeCompare(b.name)).map(x=>({source:x.name,reason:(path.extname(x.name).toLowerCase()||'無副檔名')+' → '+group(x.name),target:group(x.name)+'/'+x.name,fingerprint:fingerprint(path.join(root,x.name))}));
 const seen=new Set();for(const x of items){const key=x.target.toLowerCase();if(seen.has(key))throw Error('COLLISION');seen.add(key);targetCheck(root,x.target);}return {root,items};
}
function applyPlan(plan){
 safeRoot(plan.root);
 // Only a main-owned plan may enter here; still reject injected traversal.
 for(const x of plan.items){if(path.basename(x.source)!==x.source||x.target!==group(x.source)+'/'+x.source)throw Error('INVALID');targetCheck(plan.root,x.target);if(fingerprint(path.join(plan.root,x.source))!==x.fingerprint)throw Error('CHANGED');}
 const completed=[];
 for(const x of plan.items){const from=path.join(plan.root,x.source),to=path.join(plan.root,x.target);try{targetCheck(plan.root,x.target);fs.mkdirSync(path.dirname(to),{recursive:true});if(fingerprint(from)!==x.fingerprint)throw Error('CHANGED');fs.linkSync(from,to); // EEXIST: never replace a racing target.
 try{fs.unlinkSync(from);}catch(e){return {completed,stopped:x.source,reason:'原檔未移除；目的地已有副本，請人工檢查。'};}completed.push(x.source);
 }catch(e){return {completed,stopped:x.source,reason:'整理停止，未完成項目保留原位。'};}}
 return {completed};
}
function stageDirectory(source,dest){safeRoot(source);const entries=fs.readdirSync(source,{withFileTypes:true});if(entries.length>1000)throw Error('INVALID');let total=0;for(const e of entries){if(e.isFile())total+=regular(path.join(source,e.name)).size;}if(total>100*1024*1024)throw Error('INVALID');fs.mkdirSync(dest);for(const e of entries){if(e.isFile())fs.copyFileSync(path.join(source,e.name),path.join(dest,e.name),fs.constants.COPYFILE_EXCL);}return dest;}
module.exports={group,planDirectory,applyPlan,stageDirectory};
