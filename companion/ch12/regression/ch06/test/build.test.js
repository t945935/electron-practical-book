const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {createTool}=require('../../../tools/notes/service.cjs');const {gate}=require('../../../tools/notes/boundary.cjs');const tick=()=>new Promise(r=>setImmediate(r));
test('byte counter tracks visible draft and dirty returns to clean',async()=>{
 const elements=Object.fromEntries(['text','name','status','preview','newNote','open','save','bytes'].map(id=>[id,{value:'',textContent:'',listeners:{},addEventListener(n,f){this.listeners[n]=f;},replaceChildren(){},append(){}}]));
 const h=createTool({dialog:{},win:{}}).handlers;const api=Object.fromEntries(Object.entries(h).map(([n,f])=>[n,v=>gate(()=>true,f)({},v)]));api.onClose=()=>{};
 vm.runInNewContext(fs.readFileSync(require.resolve('../../../tools/notes/renderer.js'),'utf8'),{TextEncoder,window:{tool:api},document:{getElementById:id=>elements[id],querySelectorAll:()=>[],createElement:()=>({})}});await tick();await tick();
 async function input(text){elements.text.value=text;elements.text.listeners.input();await tick();}
 await input('字');assert.equal(h.state().dirty,true);assert.equal(elements.bytes.textContent,'3 / 1048576 bytes');
 await input('');assert.equal(h.state().dirty,false);assert.match(elements.name.textContent,/無未儲存變更/);assert.equal(elements.bytes.textContent,'0 / 1048576 bytes');
 await input('x'.repeat(1048577));assert.equal(elements.bytes.textContent,'1048577 / 1048576 bytes');assert.match(elements.name.textContent,/未同步/);assert.equal(h.state().text,'');
});
