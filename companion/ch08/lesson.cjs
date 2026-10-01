// Create an isolated source exercise; never modify the reference or userData.
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const target=fs.mkdtempSync(path.join(os.tmpdir(),'own-tools-build-'));
for(const entry of fs.readdirSync(__dirname,{withFileTypes:true})){
 if(entry.isFile()&&/\.(cjs|js|json|html|css)$/.test(entry.name)&&!['lesson.cjs','package-lock.json'].includes(entry.name))fs.copyFileSync(path.join(__dirname,entry.name),path.join(target,entry.name),fs.constants.COPYFILE_EXCL);
 if(entry.isDirectory()&&['src','test','scripts'].includes(entry.name))fs.cpSync(path.join(__dirname,entry.name),path.join(target,entry.name),{recursive:true,errorOnExist:true,force:false});
}
for(const [name,text] of Object.entries(require('./lesson/starter.json')))fs.writeFileSync(path.join(target,name),text);
console.log(target);
