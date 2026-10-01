# 第 10 章：系統匣提醒工具

## 啟動（Windows PowerShell）
在本資料夾，使用 Node.js 24 系列：

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

已有依賴不必重複安裝。`npm.cmd run package` 透過 Forge 封裝目前平台應用，不會建立安裝器。

## 操作與驗收
1. 輸入 5 秒並排定，觀察預定時間與到期文字。
2. 重新排定 10 秒，關閉視窗；由系統匣右鍵「開啟提醒工具」回到原視窗。
3. 取消後不再提醒。重排只保留一份排程。
4. 用「結束程式」退出，確認啟動終端機返回；叉叉不是同一件事。

通知支援不等於授權或可見。沒有通知時，先看視窗的到期文字，再檢查 Windows 設定 → 系統 → 通知、勿擾模式及安裝識別。提醒不持久化；退出、關機後失效，睡眠不能保證準時。系統匣建立失敗時關窗會退出；圖示不可見的桌面環境請使用視窗內結束按鈕，不要先隱藏。

## 檔案與邊界
src/reminder.cjs 是可注入時間的純狀態模組；main.cjs 管理 Tray、Notification 與清理；preload 只公開 schedule/cancel/status/quit。test/core.test.cjs 與 failures.test.cjs 驗證截止時間、取消、重排及退出決策，不等於 Windows 系統通知驗收。

## 有限建構

正文 10.7 在副本破壞 `quit()` 旗標、保留正確測試期望，重現 hide/close 斷言失敗再還原。配套的十五分鐘快捷按鈕是完成答案；正文 12.3 教你移除答案後重建、用 `test/shortcut.test.cjs` 驗證普通輸入取代與取消，再同步到工具箱。前章改作不會自動進入 ch12。

通知要求、系統限制、實際看見分別記錄。第 14 章只做未簽署 Windows x64 ZIP，不替此工具補安裝捷徑或正式通知身分。
