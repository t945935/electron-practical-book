# 第 7 章配套：安全工作副本整理

## Windows PowerShell

在本目錄執行，使用 Node.js 24。鎖版 Electron 44.5.1、Electron Forge 8.0.1；保留 package-lock.json。

```powershell
Set-Location C:\work\own-tools\companion\ch07
npm.cmd ci
npm.cmd test
npm.cmd start
```

已安裝依賴且鎖檔未變時不需重跑 npm.cmd ci。PowerShell 若阻擋 npm.ps1，使用 npm.cmd，不必放寬全域安全原則。

## 不需 GUI 的章節演練

```powershell
node walkthrough.cjs
node walkthrough.cjs collision
```

第 8 章 broken-money 是故意失敗的浮點反例，預期非零退出；其他演練應成功。測試用暫存目錄不讀取真正的使用者帳本或待辦。

## 檔案導覽

- core.cjs：核心規則與可隔離測試的函式。
- service.cjs：使用案例、對話框與主程序私有狀態。
- main.cjs / preload.cjs / boundary.cjs：程序、安全 IPC 與統一錯誤封套。
- index.html / renderer.js / styles.css：原生 JavaScript 介面。
- test/：核心、服務、邊界及靜態 UI 契約測試；不是 Windows GUI 自動化測試。

## 打包

```powershell
npm.cmd run package
npm.cmd run make
```

Forge 設定為 ASAR 與 ZIP maker。ZIP 不是安裝精靈、不是簽署發行檔，也不代表已驗證 Windows 安裝。請在 Windows 原生環境建置及操作驗收，不以 Linux 輸出代替。

## 安全範圍

sandbox 與 contextIsolation 開啟，nodeIntegration 關閉。IPC 只暴露本工具任務，不提供任意路徑讀寫或 shell。

只複製並整理所選資料夾第一層的工作副本，原件不移動。限制單檔 20 MiB、複製總量 100 MiB、頂層 1000 項。套用有確認與碰撞檢查，批次不是交易；部分完成需人工檢查。

## 必做建構

依 [lesson/README.md](lesson/README.md) 產生隔離起始版，留下 RED／GREEN、親自修改的檔案與既有回歸結果。只跑本目錄完成版不算建構完成。

## 部分完成復原

在本目錄執行 `node partial-walkthrough.cjs link` 與 `node partial-walkthrough.cjs unlink`。兩者固定在第二筆失敗，保存現況並保留舊 work，從未變原件另建 retry，驗證新計畫可完成。不在雙名稱的 work 碰撞重試，不猜測刪哪個名稱；腳本只清理自己建立的暫存根目錄。
