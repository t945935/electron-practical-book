'use strict';
const fs=require('node:fs');const path=require('node:path');const {randomUUID}=require('node:crypto');
function validText(text){if(typeof text!=='string'||Buffer.byteLength(text)>1024*1024)throw Error('INVALID');return text;}
function previewBlocks(text){validText(text);return text.split(/\r?\n/).filter(Boolean).map(line=>{const m=/^(#{1,3}) (.*)$/.exec(line);return {tag:m?'h'+m[1].length:/^- /.test(line)?'li':'p',text:m?m[2]:line.replace(/^- /,'')};});}
function atomicWrite(file,text){const tmp=file+'.tmp-'+randomUUID();let fd;try{fd=fs.openSync(tmp,'wx',0o600);fs.writeFileSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(tmp,file);}finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
function readNote(file){const st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>1024*1024)throw Error('INVALID');return validText(fs.readFileSync(file,'utf8'));}
function createNoteSession(){
 let file=null,text='',saved='';
 const snapshot=()=>({name:file?path.basename(file):'未命名.md',text,dirty:text!==saved});
 function edit(value){text=validText(value);return snapshot();}
 async function save(d){let target=file;if(!target){target=await d.chooseSave();if(!target)return {canceled:true,...snapshot()};if(fs.existsSync(target))readNote(target);}else if(readNote(file)!==saved)throw Error('CHANGED');atomicWrite(target,text);file=target;saved=text;return snapshot();}
 async function canLeave(d){if(text===saved)return true;const answer=await d.askDirty();if(answer==='discard')return true;if(answer==='save'){const r=await save(d);return !r.canceled;}return false;}
 async function open(d){if(!await canLeave(d))return {canceled:true,...snapshot()};const next=await d.chooseOpen();if(!next)return {canceled:true,...snapshot()};const content=readNote(next);file=next;text=saved=content;return snapshot();}
 async function fresh(d){if(!await canLeave(d))return {canceled:true,...snapshot()};file=null;text=saved='';return snapshot();}
 return {snapshot,edit,save,open,fresh,canLeave};
}
module.exports={previewBlocks,createNoteSession,readNote};
