const button = document.querySelector('#query');
const message = document.querySelector('#message');
button.addEventListener('click', async () => {
  button.disabled = true;
  message.textContent = '查詢中……';
  try {
    const result = await window.desktop.getAppInfo({ label: document.querySelector('#label').value });
    message.textContent = result.ok
      ? `${result.data.label}：${result.data.version}（${result.data.platform}）`
      : `${result.error.code}：${result.error.message}`;
  } catch {
    message.textContent = '連線中斷，請重新啟動應用程式。';
  } finally {
    button.disabled = false;
  }
});
