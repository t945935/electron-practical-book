const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('node:path');
const { readFile } = require('node:fs/promises');

// 必須在 app ready 之前註冊；不開啟 bypassCSP。
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);
const ENTRY = 'app://local/index.html';
const assets = new Map([
  ['app://local/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['app://local/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['app://local/renderer.js', ['renderer.js', 'text/javascript; charset=utf-8']],
]);
let window;
function createWindow() {
  window = new BrowserWindow({
    width: 760, height: 580,
    title: '自己的工具，自己做',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.on('closed', () => { window = null; });
  window.loadURL(ENTRY);
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  protocol.handle('app', async request => {
    const asset = request.method === 'GET' && assets.get(request.url);
    if (!asset) return new Response('Not found', { status: 404 });
    try {
      const body = await readFile(path.join(__dirname, asset[0]));
      return new Response(body, { headers: { 'Content-Type': asset[1] } });
    } catch {
      return new Response('Asset unavailable', { status: 500 });
    }
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
