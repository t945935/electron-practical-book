const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {createTool}=require('../service.cjs');
const {gate}=require('../boundary.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(){
 const elements=Object.fromEntries(['text','name','status','preview','newNote','open','save','bytes'].map(id=>[id,{value:'',textContent:'',disabled:false,listeners:{},addEventListener(n,fn){this.listeners[n]=fn;},replaceChildren(){},append(){}}]));
 let closeRequest;const calls=[];const tool=createTool({dialog:{showMessageBox:async()=>({response:2}),showSaveDialog:async()=>({canceled:true}),showOpenDialog:async()=>({canceled:true})},win:{}});
 const api=Object.fromEntries(Object.entries(tool.handlers).map(([name,fn])=>[name,async value=>{calls.push(name);return gate(()=>true,fn)({},value);} ]));
 api.onClose=fn=>{closeRequest=fn;};api.close=async()=>{calls.push('close');return {ok:true,data:{canceled:!await tool.beforeClose()}};};
 const window={tool:api,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../renderer.js'),'utf8'),{TextEncoder,window,document:{getElementById:id=>elements[id],querySelectorAll:()=>['text','newNote','open','save'].map(id=>elements[id]),createElement:()=>({})}});
 await tick();await tick();calls.length=0;
 return {elements,api,calls,tool,input(text){elements.text.value=text;elements.text.listeners.input();},click(name){elements[name].listeners.click();},close(){assert.equal(typeof closeRequest,'function','renderer participates in native close');closeRequest();}};
}
test('rejected oversized input is retained when save/open/new are requested',async()=>{
 const h=await setup();const text='字'.repeat(350000);h.input(text);await tick();
 for(const name of ['save','open','newNote']){h.click(name);await tick();await tick();assert.equal(h.elements.text.value===text,true,'visible unsynchronized text must survive '+name);}
 assert.equal(h.calls.some(n=>['save','open','newNote'].includes(n)),false,'do not act on stale main text');
 assert.match(h.elements.name.textContent,/未同步/);assert.doesNotMatch(h.elements.status.textContent,/^已儲存$/);
});

test('native close cannot leave rejected or failed IPC text, but recovers after edit',async()=>{
 const h=await setup();h.input('x'.repeat(1024*1024+1));await tick();h.close();await tick();await tick();
 assert.equal(h.calls.includes('close'),false);assert.equal(h.elements.text.value.length,1024*1024+1);
 const edit=h.api.edit;h.api.edit=async()=>{throw Error('transport down');};h.input('recoverable text');await tick();h.close();await tick();await tick();
 assert.equal(h.calls.includes('close'),false);assert.equal(h.elements.text.value,'recoverable text');assert.match(h.elements.status.textContent,/未同步/);
 h.api.edit=edit;h.close();await tick();await tick();assert.equal(h.calls.includes('close'),true);assert.equal(h.elements.text.value,'recoverable text');assert.match(h.elements.status.textContent,/取消/);
});

test('lost open reply must not rebind old draft to an unknown document',async()=>{
 const h=await setup();h.input('keep original draft');await tick();
 h.api.open=async()=>{throw Error('lost reply');};h.click('open');await tick();await tick();
 assert.equal(h.elements.text.value,'keep original draft');h.calls.length=0;h.click('save');await tick();await tick();
 assert.equal(h.calls.includes('save'),false,'unknown document identity must block stale-draft writes');assert.match(h.elements.status.textContent,/結果不明/);
});

test('late successful edit reply cannot mark a newer rejected draft as synchronized',async()=>{
 const h=await setup();const edit=h.api.edit;let release;
 h.api.edit=value=>new Promise(resolve=>{release=async()=>resolve(await edit(value));});
 h.input('older');await tick();h.input('字'.repeat(350000));
 h.api.edit=edit;await release();await tick();await tick();
 assert.match(h.elements.name.textContent,/未同步/);assert.match(h.elements.status.textContent,/未同步/);assert.equal(h.elements.text.value.length,350000);
 assert.equal(h.tool.handlers.state().text,'older');
 h.input('fixed');await tick();assert.equal(h.tool.handlers.state().text,'fixed');assert.doesNotMatch(h.elements.status.textContent,/未同步/);
});
test('canceling synchronized save/open/new keeps the exact current draft',async()=>{
 const h=await setup();h.input('not on disk');await tick();
 for(const name of ['save','open','newNote']){h.click(name);await tick();await tick();assert.equal(h.elements.text.value,'not on disk');assert.match(h.elements.status.textContent,/取消/);}
 assert.equal(h.tool.handlers.state().dirty,true);
});
test('UTF-8 size boundary is accepted exactly, rejection never truncates',async()=>{
 const h=await setup();const exact='字'.repeat(349525)+'x';assert.equal(Buffer.byteLength(exact),1024*1024);
 h.input(exact);await tick();assert.equal(h.tool.handlers.state().text===exact,true);assert.doesNotMatch(h.elements.name.textContent,/未同步/);
 h.input(exact+'x');await tick();assert.equal(h.elements.text.value===exact+'x',true);assert.equal(h.tool.handlers.state().text===exact,true);assert.match(h.elements.name.textContent,/未同步/);
});
