const runtime = document.querySelector('#runtime');
try {
  const versions = window.desktop.getVersions();
  runtime.textContent = `Electron ${versions.electron} / Chromium ${versions.chrome} / Node ${versions.node}`;
} catch {
  runtime.textContent = '無法讀取執行環境，請檢查 preload 路徑並重新啟動。';
}
