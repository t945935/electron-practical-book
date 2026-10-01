const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('頁面應用版本與 manifest 一致', () => {
  const root = path.join(__dirname, '..');
  const pkg = require('../package.json');
  const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
  assert.ok(html.includes(`id="version">${pkg.version}</strong>`));
});
