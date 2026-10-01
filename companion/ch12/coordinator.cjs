const CATALOG=Object.freeze([
 ['timer','專注計時器'],['todo','待辦事項'],['notes','Markdown 筆記本'],['organizer','檔案整理'],['ledger','CSV 記帳'],['weather','天氣資訊'],['reminder','休息提醒'],['search','筆記搜尋']
].map(([id,title])=>Object.freeze({id,title})));
class Coordinator{
 constructor({create}){this.create=create;this.entries=new Map();}
 serial(entry,task){const next=(entry.queue||Promise.resolve()).then(task);entry.queue=next.catch(()=>{});return next;}
 async invoke(id,name,event,...args){
  const e=this.entries.get(id),wc=e?.win.webContents;
  if(this.quitting&&!(e?.flushing&&id==='notes'&&['edit','close'].includes(name)))throw Error('QUITTING');
  if(!wc||e.win.isDestroyed()||event.sender!==wc||event.senderFrame!==wc.mainFrame||event.senderFrame?.url!==e.page)throw Error('FORBIDDEN');
  if(!Object.hasOwn(e.handlers,name))throw Error('UNKNOWN_METHOD');
  return this.serial(e,()=>e.handlers[name](...args));
 }
 async prepareQuit(){
  if(this.quitting)return false;this.quitting=true;
  try{
   for(const e of this.entries.values())if(!e.win.isDestroyed()){
    if(e.flushDraft&&!await e.flushDraft()){this.quitting=false;return false;}
    if(!await this.serial(e,()=>e.beforeClose?e.beforeClose():true)){this.quitting=false;return false;}
   }
   for(const e of this.entries.values())e.dispose?.();return true;
  }catch(error){this.quitting=false;throw error;}
 }
 async open(id){
  if(this.quitting)throw Error('QUITTING');
  if(!CATALOG.some(t=>t.id===id))throw Error('UNKNOWN_TOOL');
  let entry=this.entries.get(id);
  if(!entry||entry.win.isDestroyed()){entry=this.create(id);this.entries.set(id,entry);}
  entry.win.show();entry.win.focus();return {id};
 }
}
module.exports={CATALOG,Coordinator};
