const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('node:path');
let app, page;
test.beforeEach(async () => {
  app = await electron.launch({ args: [path.join(__dirname, '..')] });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});
test.afterEach(async () => { if (app) await app.close(); });

test('preload 只公開版本函式；Node 與 preload 私有世界不可見', async () => {
  await expect(page.locator('#runtime')).toContainText('Electron 44.5.1');
  expect(await page.evaluate(() => ({
    require: typeof window.require, process: typeof window.process,
    secret: typeof window.preloadOnly,
    keys: Object.keys(window.desktop)
  }))).toEqual({ require: 'undefined', process: 'undefined', secret: 'undefined', keys: ['getVersions'] });
  const preferences = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
  expect(preferences.nodeIntegration).toBe(false);
  expect(preferences.contextIsolation).toBe(true);
  expect(preferences.sandbox).toBe(true);
  expect(await page.evaluate(() => window.open('https://example.com'))).toBe(null);
});
