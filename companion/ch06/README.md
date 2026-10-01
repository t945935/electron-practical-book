# 第 6 章配套：Markdown 筆記

## Windows PowerShell

在本目錄執行，使用 Node.js 24。鎖版 Electron 44.5.1、Electron Forge 8.0.1；保留 package-lock.json。

```powershell
Set-Location C:\work\own-tools\companion\ch06
npm.cmd ci
npm.cmd test
npm.cmd start
```

已安裝依賴且鎖檔未變時不需重跑 npm.cmd ci。PowerShell 若阻擋 npm.ps1，使用 npm.cmd，不必放寬全域安全原則。

## 不需 GUI 的章節演練

```powershell
node walkthrough.cjs preview
node walkthrough.cjs cancel
```

第 8 章 broken-money 是故意失敗的浮點反例，預期非零退出；其他演練應成功。測試用暫存目錄不讀取真正的使用者帳本或待辦。

## 檔案導覽

- core.cjs：核心規則與可隔離測試的函式。
- service.cjs：使用案例、對話框與主程序私有狀態。
- main.cjs / preload.cjs / boundary.cjs：程序、安全 IPC 與統一錯誤封套。
- index.html / renderer.js / styles.css：原生 JavaScript 介面。
- test/：核心、服務、邊界、執行 renderer 的 DOM 替身回歸與靜態 UI 契約測試；不是 Windows GUI 自動化測試。

## 打包

```powershell
npm.cmd run package
npm.cmd run make
```

Forge 設定為 ASAR 與 ZIP maker。ZIP 不是安裝精靈、不是簽署發行檔，也不代表已驗證 Windows 安裝。請在 Windows 原生環境建置及操作驗收，不以 Linux 輸出代替。

## 安全範圍

sandbox 與 contextIsolation 開啟，nodeIntegration 關閉。IPC 只暴露本工具任務，不提供任意路徑讀寫或 shell。

筆記只寫入原生對話框選定位置；僅支援簡易標題、段落、清單，HTML 保持文字。沒有自動重開或自動保存。取消、外部變更與寫入失敗均不可清除未保存內容。

文件上限為一 MiB UTF-8 位元組，不靜默截斷。超限或 edit IPC 失敗時，原文留在文字框並標示「未同步／未儲存」，清除過期預覽；儲存、開啟、新增及一般視窗關閉均須先成功同步最新輸入，否則不執行。先複製原文備份，縮小內容或待通訊恢復後重試；成功同步會清除舊錯誤。乾淨狀態標示「無未儲存變更」，不表示未命名空白文件已落盤。

若文件操作回覆遺失而顯示「操作結果不明」，不自動重試或宣稱保存成功：先把畫面文字存入另一個編輯器，再結束程式並重新開啟檔案核對。此狀態一般關閉也被阻止；必要時須在確認外部副本保存後強制結束。沒有自動備份、崩潰復原或 IPC 永不回覆的超時復原。忙碌期間的重複操作會忽略，完成後可重試。

## 必做建構

依 [lesson/README.md](lesson/README.md) 產生隔離起始版，留下 RED／GREEN、親自修改的檔案與既有回歸結果。只跑本目錄完成版不算建構完成。
