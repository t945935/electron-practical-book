function validateDuration(value) {
  if (!Number.isInteger(value) || value < 1 || value > 3600000) {
    throw new RangeError('時間必須介於 1 與 3600000 毫秒。');
  }
}
export function createTimer(durationMs, now = Date.now) {
  validateDuration(durationMs);
  let state = 'idle', remainingMs = durationMs, deadline = null;
  let lastNow = -Infinity;
  function clock() {
    // 系統時間倒退時先凍結邏輯時鐘，不讓餘額增加。
    lastNow = Math.max(lastNow, now());
    return lastNow;
  }
  function read() {
    if (state === 'running') {
      remainingMs = Math.max(0, deadline - clock());
      if (remainingMs === 0) state = 'finished';
    }
    return { state, remainingMs };
  }
  function start() {
    read();
    if (state === 'idle' || state === 'paused') {
      deadline = clock() + remainingMs;
      state = 'running';
    }
    return read();
  }
  function pause() {
    read();
    if (state === 'running') state = 'paused';
    return read();
  }
  function reset(nextDuration = durationMs) {
    validateDuration(nextDuration);
    durationMs = nextDuration;
    state = 'idle';
    remainingMs = durationMs;
    deadline = null;
    lastNow = -Infinity;
    return read();
  }
  return { read, start, pause, reset };
}
export function formatTime(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
