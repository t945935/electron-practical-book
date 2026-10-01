# 第 13 章：獨立輸入規則測試

使用 Node.js 24，在本目錄執行（Windows PowerShell、Linux shell 均可）：

```text
node --test duration.test.cjs
```

不需 npm 安裝，不啟動 Electron，也不修改工具箱資料。`duration.cjs` 與 `duration.test.cjs` 對應正文完整程式碼，驗證 1 到 180 的整數字串契約。

## 故障演練

複製本目錄到臨時練習目錄，在副本把 `minutes > 180` 改成 `minutes >= 180`，再執行相同命令。接受上邊界的測試應因 180 被拒絕而失敗；這不是語法或找不到模組的錯誤。還原 `>` 再跑一次，應無失敗。不要修改唯一的配套原件。

本練習只證明純函式規則及回歸測試能攔住邊界錯誤，不證明 IPC、圖形介面、通知或 Windows ZIP 成品驗收成功。全書分層命令見第 13 章 13.8 節。
