const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('node:path');
let app, page;
test.beforeEach(async () => {
  app = await electron.launch({ args: [path.join(__dirname, '..')] });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});
test.afterEach(async () => { if (app) await app.close(); });

test('自訂 protocol 不提供 package、main 或任意路徑', async () => {
  const statuses = await app.evaluate(async ({ net }) => {
    const urls = ['app://local/index.html', 'app://local/main.cjs', 'app://local/../package.json', 'app://evil/index.html'];
    return Promise.all(urls.map(async url => (await net.fetch(url)).status));
  });
  expect(statuses).toEqual([200, 404, 404, 404]);
  expect(await page.evaluate(() => typeof require)).toBe('undefined');
});
test('使用視窗關閉 API 後非 macOS 結束程序', async () => {
  if (process.platform === 'darwin') return;
  const closed = app.waitForEvent('close');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  await closed;
  app = null;
});
