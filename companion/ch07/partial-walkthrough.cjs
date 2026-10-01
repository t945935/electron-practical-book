const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const assert=require('node:assert/strict');const {createHash}=require('node:crypto');const {stageDirectory,planDirectory,applyPlan}=require('./core.cjs');
const mode=process.argv[2];if(!['link','unlink'].includes(mode))throw Error('use link or unlink');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'partial-recovery-'));const original=path.join(root,'original'),work=path.join(root,'work'),retry=path.join(root,'retry');
const read=file=>fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
try{
 fs.mkdirSync(original);for(const [n,text] of [['a.txt','A'],['b.txt','B'],['c.txt','C']])fs.writeFileSync(path.join(original,n),text);
 const names=fs.readdirSync(original);const hashes=names.map(n=>digest(path.join(original,n)));stageDirectory(original,work);const plan=planDirectory(work);
 const method=mode+'Sync',actual=fs[method];let calls=0,result;
 // Only this process and this apply call see the injected OS failure.
 try{fs[method]=(...args)=>{if(++calls===2)throw Object.assign(Error('injected second '+mode),{code:'EPERM'});return actual(...args);};result=applyPlan(plan);}finally{fs[method]=actual;}
 assert.deepEqual(result.completed,['a.txt']);assert.equal(result.stopped,'b.txt');
 const state=names.map(name=>({name,original:read(path.join(original,name)),source:read(path.join(work,name)),target:read(path.join(work,'documents',name))}));
 assert.deepEqual(state,[{name:'a.txt',original:'A',source:null,target:'A'},{name:'b.txt',original:'B',source:'B',target:mode==='unlink'?'B':null},{name:'c.txt',original:'C',source:'C',target:null}]);
 assert.deepEqual(names.map(n=>digest(path.join(original,n))),hashes);
 fs.writeFileSync(path.join(root,'state.json'),JSON.stringify({mode,result,state,hashes},null,2),{flag:'wx'});
 if(mode==='unlink')assert.throws(()=>planDirectory(work),/COLLISION/);
 // Keep the failed workspace; restart by copying the unchanged originals.
 stageDirectory(original,retry);const completed=applyPlan(planDirectory(retry));assert.deepEqual(completed.completed,names);assert.equal(completed.stopped,undefined);
 for(const n of names)assert.equal(digest(path.join(retry,'documents',n)),digest(path.join(original,n)));
 assert.deepEqual(names.map(n=>digest(path.join(original,n))),hashes);
 console.log(JSON.stringify({mode,result,state,originalUnchanged:true,recovered:completed.completed,failedWorkspaceRetained:fs.existsSync(work)},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true});}
