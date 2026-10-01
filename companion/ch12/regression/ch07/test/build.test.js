const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const vm=require('node:vm');const {createTool}=require('../../../tools/organizer/service.cjs');const {planDirectory}=require('../../../tools/organizer/core.cjs');
test('classification reason travels core to service to renderer without changing target',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reason-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const h=createTool({dataDir:dir,dialog:{},win:{}}).handlers;const view=h.sample();const plan=planDirectory(view.workspace);
 assert.ok(plan.items.every(x=>typeof x.reason==='string'&&x.reason.length>0),'core provides reason');assert.deepEqual(view.items.map(x=>x.reason),plan.items.map(x=>x.reason));
 const els=Object.fromEntries(['status','workspace','plan','sample','choose','preview','apply'].map(id=>[id,{listeners:{},addEventListener(n,f){this.listeners[n]=f;}}]));
 vm.runInNewContext(fs.readFileSync(require.resolve('../../../tools/organizer/renderer.js'),'utf8'),{document:{getElementById:id=>els[id],querySelectorAll:()=>[]},window:{tool:{sample:async()=>({ok:true,data:view})}}});await els.sample.listeners.click();
 for(const x of view.items){assert.ok(els.plan.textContent.includes(x.reason));assert.ok(els.plan.textContent.includes(x.target));}assert.ok(view.items.every(x=>!Object.hasOwn(x,'fingerprint')));
});
