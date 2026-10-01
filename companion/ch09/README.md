# 第 9 章：天氣資訊面板

## 啟動（Windows PowerShell）
在本資料夾，使用 Node.js 24 系列：

```powershell
Set-Location C:\work\own-tools\companion\ch09
npm.cmd ci
npm.cmd test
npm.cmd run test:live
npm.cmd start
```

已有依賴且僅改程式時，不必重新安裝。`npm.cmd test` 為離線注入測試；`test:live` 真的呼叫 Open-Meteo，失敗不代表單元測試有問題。Forge 的 `npm.cmd run package` 產生目前平台應用資料夾，不是 Windows 安裝器。

## 操作與驗收
- 選臺北或高雄並查詢；確認攝氏、城市、資料時間及取得時間。
- 網路失敗或八秒逾時保留舊資料並顯示可能過期；重新啟動可載入快取。
- 快取位於 userData/weather/cache.json，schemaVersion 為 1。損毀時先退出並備份此檔，不要刪除整個 userData。
- 真實離線練習：先成功查詢，再停用網路、查詢、恢復網路。注入錯誤測試不能替代這項操作。

## 檔案與邊界
weather.cjs 固定城市和 API、store.cjs 管理快取、main.cjs 組合功能。preload 只提供 query/cached；renderer 不接受任意 URL。完整程式在 src，離線測試在 test，真 API 入口在 scripts/live.cjs。資料來源 Open-Meteo；使用前閱讀其服務方案、條款與資料授權： https://open-meteo.com/en/terms 。本工具不是災害預警。

## 必做建構

依 [lesson/README.md](lesson/README.md) 產生隔離起始版，留下 RED／GREEN、親自修改的檔案與既有回歸結果。只跑本目錄完成版不算建構完成。

## 入口與格式

本章獨立入口為 src/main.cjs，以 loadFile 配合 pathToFileURL 的精確主 frame URL；不要混用 ch08 的 tool protocol／main／preload／boundary。main 組合 getWeather 與 Cache，二者共用 src/time.cjs 驗證時間。JSON null 是 FORMAT；observedAt 必須是有效 YYYY-MM-DDTHH:mm，API 時區為 Asia/Taipei／28800 秒，fetchedAt 為 UTC ISO 毫秒格式。非法快取拒讀並保留。完成建構後支援臺中，不開放任意 URL。
