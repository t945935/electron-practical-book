const {test,expect,_electron:electron}=require('@playwright/test');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const root=path.join(__dirname,'..');
test('eight real windows, isolated IPC, persistent settings, notes save/search and cancelled quit',async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'toolbox-ui-'));let app;
 try{
  app=await electron.launch({...(process.env.TOOLBOX_EXECUTABLE?{executablePath:process.env.TOOLBOX_EXECUTABLE,args:[]}:{args:[root]}),env:{...process.env,TOOLBOX_TEST_DATA:data}});const home=await app.firstWindow();await home.waitForSelector('[data-tool="notes"]');
  expect(await home.evaluate(()=>window.toolbox.open('../bad'))).toMatchObject({ok:false,error:{code:'UNKNOWN_TOOL'}});
  const pages={};for(const id of ['timer','todo','notes','organizer','ledger','weather','reminder','search']){
   const next=app.waitForEvent('window');await home.locator(`[data-tool="${id}"]`).click();pages[id]=await next;await pages[id].waitForLoadState('domcontentloaded');
   await home.evaluate(id=>window.toolbox.open(id),id);
  }
  expect(app.windows()).toHaveLength(9);
  const beforeShortcut=Date.now();await pages.reminder.locator('#quick15').click();
  await expect.poll(()=>pages.reminder.evaluate(async()=> (await window.tool.status()).data.dueAt)).toBeGreaterThanOrEqual(beforeShortcut+900000);
  await pages.reminder.locator('#seconds').fill('10');await pages.reminder.locator('#schedule').click();
  await expect.poll(()=>pages.reminder.evaluate(async()=> (await window.tool.status()).data.dueAt)).toBeLessThan(Date.now()+15000);
  await pages.reminder.locator('#cancel').click();await expect.poll(()=>pages.reminder.evaluate(async()=> (await window.tool.status()).data.dueAt)).toBe(null);
  for(const page of Object.values(pages))expect(await page.evaluate(()=>typeof require)).toBe('undefined');
  const policies=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>{const p=w.webContents.getLastWebPreferences();return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration};}));
  expect(policies.every(p=>p.sandbox&&p.contextIsolation&&!p.nodeIntegration)).toBe(true);
  // Directly exercise registered IPC with a real foreign webContents.
  const forged=await app.evaluate(async({ipcMain,BrowserWindow})=>{const todo=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('://todo/'));const notes=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('://notes/'));return ipcMain._invokeHandlers.get('todo:save')({sender:notes.webContents,senderFrame:notes.webContents.mainFrame},[]);});
  expect(forged).toMatchObject({ok:false,error:{code:'FORBIDDEN'}});
  expect(await pages.todo.evaluate(()=>window.tool.save([{id:'integration',text:'整理讀書筆記',done:false}]))).toMatchObject({ok:true});
  await home.evaluate(()=>window.toolbox.saveSettings({startup:'todo'}));expect(JSON.parse(fs.readFileSync(path.join(data,'settings.json'),'utf8')).startup).toBe('todo');
  // A protected CSV that exceeds its import limit must retain its actionable code.
  expect(await pages.ledger.evaluate(()=>window.tool.add({date:'2026-09-01',category:'練習',note:'='+'x'.repeat(499),amount:'1.00'}))).toMatchObject({ok:true});
  expect(await pages.ledger.evaluate(()=>window.tool.exportCSV())).toMatchObject({ok:false,error:{code:'CSV_LIMIT'}});
  // Native dialogs are injected, not claimed as manually tested.
  const note=path.join(data,'integration.md');await app.evaluate(({dialog},{note,data})=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:note});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[data]});dialog.showMessageBox=async()=>({response:2});},{note,data});
  await pages.notes.locator('#text').fill('# Electron 整合筆記');await expect.poll(()=>pages.notes.evaluate(async()=> (await window.tool.state()).data.dirty)).toBe(true);
  expect(await pages.notes.evaluate(()=>window.tool.save())).toMatchObject({ok:true});expect(fs.readFileSync(note,'utf8')).toContain('Electron');
  expect(await pages.search.evaluate(()=>window.tool.choose())).toMatchObject({ok:true});expect(await pages.search.evaluate(()=>window.tool.start('Electron'))).toMatchObject({ok:true});await expect.poll(()=>pages.search.evaluate(async()=> (await window.tool.status()).data.phase)).toBe('done');expect((await pages.search.evaluate(()=>window.tool.status())).data.results.some(r=>r.name==='integration.md')).toBe(true);
  await pages.notes.locator('#text').fill('尚未保存');await expect.poll(()=>pages.notes.evaluate(async()=> (await window.tool.state()).data.dirty)).toBe(true);
  await home.locator('#quit').click();await expect.poll(()=>home.evaluate(()=>window.toolbox.catalog()).then(r=>r.ok)).toBe(true);expect(app.windows()).toHaveLength(9);
  expect((await pages.notes.evaluate(()=>window.tool.state())).data.text).toBe('尚未保存');
  // Closing and reopening search must attach a fresh service and protocol handler.
  await pages.search.close();const next=app.waitForEvent('window');await home.evaluate(()=>window.toolbox.open('search'));const reopened=await next;await reopened.waitForLoadState('domcontentloaded');expect((await reopened.evaluate(()=>window.tool.status())).data.phase).toBe('idle');
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});});const exited=app.waitForEvent('close');await home.locator('#quit').click();await exited;app=null;
  app=await electron.launch({...(process.env.TOOLBOX_EXECUTABLE?{executablePath:process.env.TOOLBOX_EXECUTABLE,args:[]}:{args:[root]}),env:{...process.env,TOOLBOX_TEST_DATA:data}});await expect.poll(()=>app.windows().filter(w=>w.url().includes('://home/')).length).toBe(1);const h=app.windows().find(w=>w.url().includes('://home/'));await h.waitForSelector('[data-tool="todo"]');await expect.poll(()=>app.windows().length).toBe(2);const todo=app.windows().find(w=>w.url().includes('://todo/'));await todo.waitForLoadState();expect((await todo.evaluate(()=>window.tool.load())).data.items[0].text).toBe('整理讀書筆記');
  console.log(JSON.stringify({windows:9,realElectron:true,dialogs:'injected',persistedRestart:true,crossToolSearch:true}));
 }finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}
});
