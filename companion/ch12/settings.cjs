const fs=require('node:fs');const path=require('node:path');const {randomUUID}=require('node:crypto');const {CATALOG}=require('./coordinator.cjs');
class Settings{
 constructor(root){this.file=path.join(root,'settings.json');}
 validate(value){if(!value||Array.isArray(value)||Object.keys(value).sort().join(',')!=='schemaVersion,startup'||value.schemaVersion!==1||!['home',...CATALOG.map(t=>t.id)].includes(value.startup))throw Error('SETTINGS');return value;}
 load(){try{return this.validate(JSON.parse(fs.readFileSync(this.file,'utf8')));}catch(e){if(e.code==='ENOENT')return {schemaVersion:1,startup:'home'};throw Error('SETTINGS');}}
 save(value){this.load();if(!value||Object.keys(value).join(',')!=='startup')throw Error('INVALID');const data=this.validate({schemaVersion:1,startup:value.startup});fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.tmp-'+randomUUID();try{fs.writeFileSync(temp,JSON.stringify(data),{flag:'wx',mode:0o600});fs.renameSync(temp,this.file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}return data;}
}
module.exports={Settings};
