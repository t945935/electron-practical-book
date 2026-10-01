const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('node:path');
let app, page;
test.beforeEach(async () => {
  app = await electron.launch({ args: [path.join(__dirname, '..')] });
  page = await app.firstWindow();
  await expect(page.locator('#status')).toHaveText('準備開始');
  // Control only this test page's clock; real Electron and DOM remain in use.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.reload(); // createTimer must capture the installed Date.now.
  await expect(page.locator('#status')).toHaveText('準備開始');
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
});
test.afterEach(async () => { if (app) await app.close(); });

test('編輯輸入不重設 idle 或 running，原期限仍到期', async () => {
  await page.locator('#seconds').fill('10');
  await expect(page.locator('#clock')).toHaveText('25:00');
  await page.locator('#reset').click();
  await page.locator('#start').click();
  await page.clock.runFor(3000);
  await expect(page.locator('#clock')).toHaveText('00:07');
  await page.locator('#seconds').fill('60');
  await page.clock.runFor(2000);
  await expect(page.locator('#status')).toHaveText('專注中');
  await expect(page.locator('#clock')).toHaveText('00:05');
  await page.clock.runFor(5000);
  await expect(page.locator('#status')).toHaveText('時間到，休息一下！');
});
for (const state of ['running', 'paused']) {
  test(`${state} 錯誤秒數只更新提示`, async () => {
    await page.locator('#seconds').fill('10');
    await page.locator('#reset').click();
    await page.locator('#start').click();
    await page.clock.runFor(3000);
    if (state === 'paused') await page.locator('#pause').click();
    await page.locator('#seconds').fill('0');
    await page.locator('#reset').click();
    await expect(page.locator('#message')).toHaveText('請輸入 1 至 3600 的整數秒數。');
    await page.clock.runFor(2000);
    await expect(page.locator('#status')).toHaveText(state === 'running' ? '專注中' : '已暫停');
    await expect(page.locator('#clock')).toHaveText(state === 'running' ? '00:05' : '00:07');
    if (state === 'running') {
      await page.clock.runFor(5000);
      await expect(page.locator('#clock')).toHaveText('00:00');
      await expect(page.locator('#status')).toHaveText('時間到，休息一下！');
    }
  });
}
