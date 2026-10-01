const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('node:path');
let app, page;
test.beforeEach(async () => {
  app = await electron.launch({ args: [path.join(__dirname, '..')] });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});
test.afterEach(async () => { if (app) await app.close(); });

test('合法系統查詢經過真正 IPC 往返，非法參數回傳可辨識錯誤', async () => {
  await page.locator('#label').fill('我的工具');
  await page.locator('#query').click();
  await expect(page.locator('#message')).toContainText('我的工具：0.1.0');
  expect(await page.evaluate(() => window.desktop.getAppInfo({label: '<script>'})))
    .toEqual({ok:false,error:{code:'INVALID_INPUT',message:'名稱須為 1 至 20 個中文字、英文字、數字或空格。'}});
  expect(await page.evaluate(() => Object.keys(window.desktop))).toEqual(['getAppInfo']);
});

test('相同 URL 的第二個視窗也不能冒用主視窗 IPC', async () => {
  const result = await app.evaluate(async ({ BrowserWindow }, preload) => {
    const rogue = new BrowserWindow({ show:false, webPreferences:{
      preload,
      nodeIntegration:false,contextIsolation:true,sandbox:true
    }});
    try {
      await rogue.loadURL('app://local/index.html');
      return await rogue.webContents.executeJavaScript("window.desktop.getAppInfo({label:'工具'})");
    } finally { rogue.destroy(); }
  }, path.join(__dirname, '../src/preload.cjs'));
  expect(result).toEqual({ok:false,error:{code:'FORBIDDEN',message:'此來源不可使用這個功能。'}});
});
