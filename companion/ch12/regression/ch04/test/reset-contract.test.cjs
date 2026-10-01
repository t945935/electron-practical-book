const { test } = require('node:test');
const assert = require('node:assert/strict');

for (const state of ['running', 'paused']) {
  test(`${state} 非法重設不改期限或暫停餘額`, async () => {
    const { createTimer } = await import('../../../tools/timer/timer.mjs');
    for (const invalid of [0, -1, NaN, Infinity, 1.5, 3600001, '1000']) {
      let now = 1000;
      const timer = createTimer(10000, () => now);
      timer.start();
      now = 4000;
      if (state === 'paused') timer.pause();
      assert.throws(() => timer.reset(invalid), RangeError);
      assert.deepEqual(timer.read(), { state, remainingMs: 7000 });
      now = 6000;
      assert.deepEqual(timer.read(), { state, remainingMs: state === 'running' ? 5000 : 7000 });
      if (state === 'running') {
        now = 11000;
        assert.deepEqual(timer.read(), { state: 'finished', remainingMs: 0 });
      }
    }
  });
}
