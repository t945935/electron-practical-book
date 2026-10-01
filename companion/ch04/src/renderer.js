import { createTimer, formatTime } from './timer.mjs';
const timer = createTimer(1500000);
const clock = document.querySelector('#clock');
const status = document.querySelector('#status');
const message = document.querySelector('#message');
const start = document.querySelector('#start');
const pause = document.querySelector('#pause');
const labels = { idle: '準備開始', running: '專注中', paused: '已暫停', finished: '時間到，休息一下！' };
function render() {
  const snapshot = timer.read();
  clock.textContent = formatTime(snapshot.remainingMs);
  if (status.textContent !== labels[snapshot.state]) status.textContent = labels[snapshot.state];
  start.disabled = snapshot.state === 'running' || snapshot.state === 'finished';
  pause.disabled = snapshot.state !== 'running';
}
start.addEventListener('click', () => { timer.start(); render(); });
pause.addEventListener('click', () => { timer.pause(); render(); });
document.querySelector('#reset').addEventListener('click', () => {
  const seconds = Number(document.querySelector('#seconds').value);
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) {
    message.textContent = '請輸入 1 至 3600 的整數秒數。';
    return;
  }
  timer.reset(seconds * 1000);
  message.textContent = '';
  render();
});
const interval = setInterval(render, 200);
document.addEventListener('visibilitychange', render);
window.addEventListener('beforeunload', () => clearInterval(interval));
render();
