const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('node:path');
test('本機視窗顯示書名與版本，關閉後結束', async () => {
  const app = await electron.launch({ args: [path.join(__dirname, '..')] });
  try {
    const page = await app.firstWindow();
    await expect(page.locator('h1')).toHaveText('自己的工具，自己做');
    await expect(page.locator('#version')).toHaveText('0.1.0');
    await expect(page).toHaveTitle('自己的工具，自己做');
  } finally { await app.close(); }
});
