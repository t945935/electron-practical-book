# 第 8 章配套：CSV 支出帳本

## Windows PowerShell

在本目錄執行，使用 Node.js 24。鎖版 Electron 44.5.1、Electron Forge 8.0.1；保留 package-lock.json。

```powershell
Set-Location C:\work\own-tools\companion\ch08
npm.cmd ci
npm.cmd test
npm.cmd start
```

已安裝依賴且鎖檔未變時不需重跑 npm.cmd ci。PowerShell 若阻擋 npm.ps1，使用 npm.cmd，不必放寬全域安全原則。

## 不需 GUI 的章節演練

```powershell
node walkthrough.cjs money
node walkthrough.cjs broken-money
node walkthrough.cjs csv
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

支出只接受非負且最多兩位小數，以整數分保存；CSV 匯入確認後取代帳本，不是附加。取代前關閉應用，複製原始 ledger 目錄（含 ledger.json）備份；CSV 只供安全交換。安全 CSV 可能添加單引號，不能視為完全可逆原始資料。帳本損毀時停止寫入，沒有自動復原按鈕。

## 必做建構

依 [lesson/README.md](lesson/README.md) 產生隔離起始版，留下 RED／GREEN、親自修改的檔案與既有回歸結果。只跑本目錄完成版不算建構完成。

## 精確備份與 CSV 上限

取代前完全退出，複製練習 ledger 目錄含 ledger.json，記錄來源／備份位置與 SHA-256。恢復時先保留取代後目錄，再從備份複製到原位置，核對雜湊並重新載入逐欄核對。`node backup-walkthrough.cjs` 在隔離目錄完整演示；不接受真實資料路徑。CSV 防護後分類仍限 80、備註 500 字元、整份限五 MiB；超限回 CSV_LIMIT，不寫匯出檔、不剝單引號。`node --test test/exchange.test.js` 驗邊界。
