# 第 2 章　看懂主程序、渲染程序與 preload

本資料夾是獨立且完整的章節專案；不必覆蓋前一章。使用 Node.js 24 系列，依 `package-lock.json` 安裝。Windows 請在本資料夾開 PowerShell：

```powershell
Set-Location C:\work\own-tools\companion\ch02
npm.cmd ci
npm.cmd test
npm.cmd start
```

畫面驗收：版本顯示成功；頁面的 require、process、preloadOnly 均不可見。

## 檔案入口

- `package.json`：固定依賴、scripts、應用版本與 main 入口。
- `src/main.cjs`：視窗生命週期、安全設定、app protocol 資源白名單。
- `src/index.html`、`src/style.css`：頁面與外部樣式。
- `src/renderer.js`：頁面事件；第 1 章保留空檔、未由 HTML 載入。
- `test/`：Node 測試；第 1、2 章僅檢查 HTML 版本一致性。
- `ui/`：Playwright 啟動真正 Electron 的自動測試。

第 2、3 章另有 `src/preload.cjs`；第 3 章的 `src/info-service.cjs` 處理來源與參數驗證；第 4 章的 `src/timer.mjs` 是可注入時鐘的純計時模組。

## GUI 測試與封裝

```powershell
npm.cmd run test:ui
npm.cmd run package
```

GUI 測試需要可用桌面工作階段。Linux 無顯示伺服器時可在已裝有 Xvfb 的環境使用 `xvfb-run -a npm run test:ui`；這不等於 Windows 驗收。Playwright 的 Electron 啟動器在測試流程可能加入 `--no-sandbox`，因此測試到的安全偏好值不能取代一般啟動及作業系統沙箱驗收。

`package` 只產生目前平台的應用封裝；`forge.config.cjs` 的 makers 是空陣列，沒有 `make` script，不會產生 Windows 安裝程式。不要把 Linux 封裝當成 Windows 發行證據。

## 故障排查

- 找不到 package.json：先確認目前位於本章資料夾。
- PowerShell 阻擋 npm.ps1：使用上面的 `npm.cmd`，不要放寬全機執行政策。
- 下載中斷：檢查網路／代理，保留 lockfile，不停用 TLS 驗證。
- 改 main 或 preload 後無變化：完整關閉舊應用再啟動。
- 修改範例安全設定前，先定位資源路徑、API 名稱與錯誤訊息。

## 版本與工作副本

書版與配套版本均為 `v1.0.0`，本章應用版號是 `0.1.0`；請核對本資料夾 `VERSION.json`。從讀者服務 https://github.com/t945935/electron-practical-book 的首頁核對對應版本與實際下載入口，不以可變分支當成固定版。依書中第 1 章保留原 ZIP／原始解壓目錄，再建立 `C:\work\own-tools` 工作副本；目的地存在就停止或另命名，不覆寫。各章是獨立完整專案，前章修改不自動帶入。復原單章前先另存自己的成果，不覆蓋其他章。

本章不需要私人文件、API 金鑰或 GitHub 上傳；所有練習先在自己的工作副本進行。

## 本章學習驗收

核心：三行版本實作、主世界的三個 undefined、唯一 getVersions、故障復原與 UI 重跑。延伸：改版面而不增加 API。

Node 測試、GUI 操作與 Windows 平台驗收分別記錄；未做 GUI 時僅邏輯部分完成，不是整章通過。延伸不作核心門檻。
