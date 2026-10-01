'use strict';
const fs=require('node:fs'); const path=require('node:path'); const {randomUUID}=require('node:crypto');
function validateItems(items){
  if(!Array.isArray(items)||items.length>1000) throw Error('INVALID');
  const ids=new Set();
  for(const x of items){if(!x||typeof x.id!=='string'||!/^[\w-]{1,80}$/.test(x.id)||ids.has(x.id)||typeof x.text!=='string'||!x.text.trim()||x.text.length>200||typeof x.done!=='boolean')throw Error('INVALID');ids.add(x.id);}
  return items.map(({id,text,done})=>({id,text:text.trim(),done}));
}
function atomicWrite(file,text){
  const temp=file+'.tmp-'+randomUUID(); let fd;
  try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,text,'utf8');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}
  finally{if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
function createTodoStore(dir){
  fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'todos.json');let blocked=false;
  function load(){
    try{if(fs.statSync(file).size>1024*1024)throw Error('INVALID');const doc=JSON.parse(fs.readFileSync(file,'utf8'));if(doc.schemaVersion!==1)throw Error('INVALID');const items=validateItems(doc.items);blocked=false;return {items,recoveryRequired:false};}
    catch(e){if(e.code==='ENOENT'){blocked=false;return {items:[],recoveryRequired:false};}if(e.code&&e.code!=='INVALID')throw e;blocked=true;return {items:[],recoveryRequired:true};}
  }
  function save(items){if(blocked)throw Error('RECOVERY');const clean=validateItems(items);atomicWrite(file,JSON.stringify({schemaVersion:1,items:clean},null,2));return {items:clean,recoveryRequired:false};}
  function recover(){if(!blocked)throw Error('INVALID');fs.renameSync(file,file+'.corrupt-'+randomUUID());blocked=false;return save([]);}
  load(); return {load,save,recover};
}
module.exports={createTodoStore,validateItems,atomicWrite};
