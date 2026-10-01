const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const modulePath=path.join(__dirname,'../coordinator.cjs');
test('catalog creates exactly eight tools, rejects paths, reuses windows',async()=>{
 assert.ok(fs.existsSync(modulePath),'integration coordinator must exist');
 const {Coordinator,CATALOG}=require(modulePath);const made=[];
 const c=new Coordinator({create:id=>{const item={win:{isDestroyed:()=>false,show(){},focus(){}},handlers:{},dispose(){}};made.push(id);return item;}});
 assert.equal(CATALOG.length,8);for(const {id} of CATALOG){await c.open(id);await c.open(id);}assert.equal(made.length,8);
 await assert.rejects(()=>c.open('../main.cjs'),/UNKNOWN_TOOL/);
});

test('IPC binds exact contents, main frame and URL; serial work survives errors',async()=>{
 const {Coordinator}=require('../coordinator.cjs');const frame={url:'tool://todo/index.html'},wc={mainFrame:frame};let value=0;
 const c=new Coordinator({create:()=>({win:{webContents:wc,isDestroyed:()=>false,show(){},focus(){}},page:frame.url,handlers:{save:async n=>{value=n;return n;}}})});await c.open('todo');
 assert.equal(typeof c.invoke,'function','source-gated dispatch must exist');
 const good={sender:wc,senderFrame:frame};assert.equal(await c.invoke('todo','save',good,7),7);
 await assert.rejects(()=>c.invoke('todo','save',{sender:{},senderFrame:frame},9),/FORBIDDEN/);
 await assert.rejects(()=>c.invoke('todo','save',{sender:wc,senderFrame:{url:frame.url}},9),/FORBIDDEN/);
 frame.url='tool://notes/index.html';await assert.rejects(()=>c.invoke('todo','save',good,9),/FORBIDDEN/);assert.equal(value,7);
});

test('quit freezes new work, waits for queue, cancellation preserves every window',async()=>{
 const {Coordinator}=require('../coordinator.cjs');let allow=false,disposed=0;
 const c=new Coordinator({create:()=>({win:{isDestroyed:()=>false,show(){},focus(){}},handlers:{},beforeClose:async()=>allow,dispose:()=>disposed++})});
 await c.open('notes');assert.equal(typeof c.prepareQuit,'function','coordinated quit must exist');
 assert.equal(await c.prepareQuit(),false);assert.equal(disposed,0);await c.open('todo');
 allow=true;assert.equal(await c.prepareQuit(),true);assert.equal(disposed,2);await assert.rejects(()=>c.open('timer'),/QUITTING/);
});

test('shared settings persist fixed startup IDs and reject malformed data without overwriting',()=>{
 const file=path.join(__dirname,'../settings.cjs');assert.ok(fs.existsSync(file),'settings persistence must exist');
 const {Settings}=require(file);const root=fs.mkdtempSync(path.join(os.tmpdir(),'toolbox-settings-'));
 try{const s=new Settings(root);assert.equal(s.load().startup,'home');s.save({startup:'notes'});assert.equal(new Settings(root).load().startup,'notes');assert.throws(()=>s.save({startup:'../bad'}));fs.writeFileSync(path.join(root,'settings.json'),'broken');assert.throws(()=>s.load());assert.throws(()=>s.save({startup:'home'}));assert.equal(fs.readFileSync(path.join(root,'settings.json'),'utf8'),'broken');}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('integrated main and adapters are provided, not subprocess launchers',()=>{
 for(const name of ['main.cjs','adapters.cjs','home/preload.cjs','home/index.html'])assert.ok(fs.existsSync(path.join(__dirname,'..',name)),name+' missing');
});

test('quit must await renderer flush before consulting main draft',async()=>{
 const {Coordinator}=require('../coordinator.cjs');let confirm=0,dispose=0;
 const c=new Coordinator({create:()=>({win:{isDestroyed:()=>false,show(){},focus(){}},handlers:{},flushDraft:async()=>false,beforeClose:async()=>{confirm++;return true;},dispose:()=>dispose++})});
 await c.open('notes');assert.equal(await c.prepareQuit(),false);assert.equal(confirm,0);assert.equal(dispose,0);
});
