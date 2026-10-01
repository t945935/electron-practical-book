const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const tick=()=>new Promise(r=>setImmediate(r));
test('filter hides completed rows without saving a subset',async()=>{
 const elements=Object.fromEntries(['form','text','recover','list','status','pending'].map(id=>[id,{checked:false,children:[],listeners:{},addEventListener(n,f){this.listeners[n]=f;},replaceChildren(){this.children=[];},append(...x){this.children.push(...x);},setAttribute(){}}]));
 const rows=[{id:'a',text:'A',done:false},{id:'b',text:'B',done:true}];let saves=0;
 vm.runInNewContext(fs.readFileSync(require.resolve('../../../tools/todo/renderer.js'),'utf8'),{document:{getElementById:id=>elements[id],querySelectorAll:()=>[],createElement:()=>({listeners:{},addEventListener(n,f){this.listeners[n]=f;},append(){},setAttribute(){}})},window:{tool:{load:async()=>({ok:true,data:{items:rows}}),save:async value=>{saves++;return {ok:true,data:{items:value}};}}}});
 await tick();assert.equal(elements.list.children.length,2);elements.pending.checked=true;
 assert.equal(typeof elements.pending.listeners.change,'function','filter change must be wired');elements.pending.listeners.change();assert.equal(elements.list.children.length,1);assert.equal(saves,0);
 elements.pending.checked=false;elements.pending.listeners.change();assert.equal(elements.list.children.length,2);assert.equal(rows.length,2);
});

test('filter cannot dismiss the recovery lock on a corrupt store',async()=>{
 const elements=Object.fromEntries(['form','text','recover','list','status','pending'].map(id=>[id,{checked:false,hidden:false,listeners:{},addEventListener(n,f){this.listeners[n]=f;},replaceChildren(){},append(){}}]));
 vm.runInNewContext(fs.readFileSync(require.resolve('../../../tools/todo/renderer.js'),'utf8'),{document:{getElementById:id=>elements[id],querySelectorAll:()=>[]},window:{tool:{load:async()=>({ok:true,data:{items:[],recoveryRequired:true}})}}});await tick();assert.equal(elements.form.hidden,true);elements.pending.checked=true;assert.equal(typeof elements.pending.listeners.change,'function');elements.pending.listeners.change();assert.equal(elements.form.hidden,true);assert.equal(elements.recover.hidden,false);
});
