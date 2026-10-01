const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMinutes } = require('./duration.cjs');

test('接受一般值與上下邊界', () => {
  for (const [input, expected] of [['1', 1], ['25', 25], ['180', 180]]) {
    assert.equal(parseMinutes(input), expected);
  }
});

test('拒絕格式錯誤及超出範圍的值', () => {
  for (const input of ['', ' ', '1.5', '-1', '0', '181', '1e2', 25, null]) {
    assert.throws(() => parseMinutes(input));
  }
});
