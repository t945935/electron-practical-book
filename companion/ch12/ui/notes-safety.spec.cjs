const {test,expect,_electron:electron}=require('@playwright/test');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('oversized visible draft survives Save and whole-toolbox quit',async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'toolbox-draft-'));let app;
 try{
  app=await electron.launch({...(process.env.TOOLBOX_EXECUTABLE?{executablePath:process.env.TOOLBOX_EXECUTABLE,args:[]}:{args:[path.join(__dirname,'..')]}),env:{...process.env,TOOLBOX_TEST_DATA:data}});
  const home=await app.firstWindow();await home.waitForSelector('[data-tool="notes"]');
  const next=app.waitForEvent('window');await home.locator('[data-tool="notes"]').click();const notes=await next;await notes.waitForSelector('#text');
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});dialog.showSaveDialog=async()=>({canceled:true});});
  const huge='x'.repeat(1024*1024+1);await notes.locator('#text').fill(huge);
  await notes.locator('#save').click();await expect(notes.locator('#text')).toHaveValue(huge);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('://notes/')).close());
  await new Promise(r=>setTimeout(r,100));expect(app.windows()).toHaveLength(2);await expect(notes.locator('#text')).toHaveValue(huge);
  await home.locator('#quit').click();await new Promise(r=>setTimeout(r,500));
  expect(app.windows()).toHaveLength(2);await expect(notes.locator('#text')).toHaveValue(huge);
  await notes.locator('#text').fill('recovered draft');await expect.poll(()=>notes.evaluate(async()=>(await window.tool.state()).data.text)).toBe('recovered draft');
  await app.evaluate(({dialog,BrowserWindow})=>{dialog.showMessageBox=async()=>({response:2});BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('://notes/')).close();});
  await new Promise(r=>setTimeout(r,150));expect(app.windows()).toHaveLength(2);await expect(notes.locator('#text')).toHaveValue('recovered draft');
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:0});});await home.locator('#quit').click();
  await expect.poll(()=>home.evaluate(()=>window.toolbox.catalog()).then(r=>r.ok)).toBe(true);expect(app.windows()).toHaveLength(2);await expect(notes.locator('#text')).toHaveValue('recovered draft');
  await app.evaluate(({dialog,BrowserWindow})=>{dialog.showMessageBox=async()=>({response:1});BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('://notes/')).close();});
  await expect.poll(()=>app.windows().length).toBe(1);
  const exited=app.waitForEvent('close');await home.locator('#quit').click();await exited;app=null;
 }finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}
});
