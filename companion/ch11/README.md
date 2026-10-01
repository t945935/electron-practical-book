# 第 11 章：本機筆記搜尋器

## 啟動（Windows PowerShell）
在本資料夾，使用 Node.js 24 系列：

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

已有依賴不必重複安裝。`npm.cmd run package` 透過 Forge 封裝目前平台應用資料夾，不是安裝器。

## 操作與驗收
建立臨時資料夾，以 UTF-8 儲存 a.md（今天研究 Electron）、b.txt（晚餐買青菜）、c.md（electron 桌面工具）。選資料夾並搜尋 Electron，應匹配 a.md、c.md，順序不定。搜尋青菜只匹配 b.txt。

大量檔案時按「測試介面回應」，計數應增加；按取消，狀態與部分結果應穩定，不得稍後變成完成。小資料夾可能在按取消前已完成。`node --test test/load.test.cjs` 自動建立及清理大量暫存測試檔案。

## 範圍
只讀所選資料夾第一層 .md/.txt，不遞迴、不跟隨一般符號連結；每檔最多 1 MiB，最多檢查 10,000 項、顯示 200 結果。skipped 包含非文字檔及資料夾；truncated 表示不完整。按 UTF-8 解碼，不自動辨識 Big5。結果只列檔名，不開檔、不上傳。不把可被其他不可信程序同時修改的目錄當作安全沙箱。

## 檔案
src/search.cjs 管理 Worker 與世代編號，search-worker.cjs 執行有界搜尋，main.cjs 保留原生選取的根目錄。preload 只提供 choose/start/status/cancel。取消後舊 Worker 訊息及舊 UI 輪詢回覆都應失效。測試主執行緒心跳不等於已完成 Windows GUI 測試。

## 有限建構與整合同步

`node --test test/known-notes.test.cjs` 將正文三份筆記變成可重跑 fixture；再依正文加入 IPC 僅匹配 a.md 的案例。這是既有行為回歸，不冒充新功能 RED。`test/short-read.test.cjs` 同時保護短讀、EOF、超限及 handle 釋放。

大小寫選項等延伸不自動進入 ch12；依 12.3 唯讀核對清單、人工適配、整合回歸後才算同步。SearchJob／worker／read-bounded 與相關測試必須一起審核，不以取代整個 tools 目錄移植。
