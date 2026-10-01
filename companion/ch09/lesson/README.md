# 第 9 章建構練習

### 必做建構：臺中固定城市與快取白名單

前面的成品操作讓你認識安全基線；這一段才要親自改程式，不是只改測試預期。起始版保留格式修正與兩個城市，缺臺中，測試會在 add fixed city 失敗。完整配套仍是參考答案，`lesson/starter.json` 保存起始檔，`lesson/complete.diff` 列出完成差異。只修改 src/weather.cjs、src/store.cjs、src/index.html。

先關閉視窗，在本章目錄建立獨立練習副本。lesson.cjs 每次建立新的系統暫存目錄，不覆寫已有練習、不讀 userData，包含可直接跑 Node 測試的完整來源；不需再安裝 Electron。它不是要替換你的正式工具資料。

```powershell
Set-Location C:\work\own-tools\companion\ch09
$reference = (Get-Location).Path
$lab = node lesson.cjs
Set-Location $lab
node --test test/build.test.cjs *> red.txt
$LASTEXITCODE
```

此處退出碼應為 1，red.txt 應是上述斷言失敗，不是找不到模組或語法錯誤；後兩者必須先修環境。打開 `$lab` 內檔案，按以下順序手動修改：

1. 在 weather 的 CITIES 加上 `taichung:{name:'臺中',latitude:24.1477,longitude:120.6736}`。座標只在主程序固定表；不接收 renderer 傳入的 URL 或座標。
2. store 的城市白名單加 `'taichung'`；漏掉時，網路轉換雖成功，cache.save 仍拒絕。這正是跨模組契約測試要找的問題。
3. HTML select 加 `<option value="taichung">臺中</option>`。不更動 preload、來源檢查或錯誤分類。
4. 測試注入含有效臺北時區的回應，檢查固定主機及緯度，保存臺中後用新的 Cache 讀回相同資料，未知城市仍被拒絕。這證明城市擴充與快取相容，不是證明當天臺中的真實氣溫。

存檔後在同一個 `$lab` 目錄驗收：

```powershell
node --test test/build.test.cjs *> green.txt
$LASTEXITCODE
npm.cmd test *> regression.txt
$LASTEXITCODE
```

兩次應為 0。只跑參考成品、或把測試預期改成錯誤結果，都不能代替這項建構。對照 `$reference\lesson\complete.diff` 檢查自己改的行，將變更檔與 red.txt、green.txt、regression.txt 一起複製到自己的長期練習資料夾；暫存目錄可能被系統清理。回復點是未修改的 `$reference` 與 starter.json：需要重做時回本章再執行 lesson.cjs，產生新副本，先保留舊的錯誤結果，不做覆寫式重置。節錄中未出現的安全碼照原樣保留。

### 本章交付與簽收

| 類別 | 輸入與預期 | 證據／狀態 | 不符合時 |
|---|---|---|---|
| 核心：成品操作 | 依本章視窗步驟操作，重啟／取消仍符合原契約 | 自己保存畫面與操作記錄；只跑測試填「操作未驗」 | 回到最先不同的步驟，不刪真實資料 |
| 核心：親自修改 | 上述起始版 RED，修改後 GREEN，既有回歸通過 | 變更檔、red.txt、green.txt、regression.txt；全有才填「建構完成」 | 只有 walkthrough 或 npm.cmd test，填「建構未完成」 |
| 核心：失敗／復原 | FORMAT／OFFLINE／TIMEOUT 分類及壞快取保留 | 保存本章故障命令輸出及復原核對；未做填「復原未驗」 | 留下失敗輸出與原件，修復後重跑 |
| 平台／外部服務 | 在自己的 Windows 原生視窗重做；不可拿 Node／DOM 替身當 GUI | 記錄作業系統、步驟與結果；沒有操作就填「平台未驗」 | 可繼續離線學習，不簽產品全通過 |

WMO 文字對照與過期門檻為延伸；不自動輪詢。

真實服務另外保存 `npm.cmd run test:live` 與視窗查詢結果。live 失敗而離線測試成功時，狀態是「離線部分完成／真實服務未驗或失敗」；停網後保留舊資料的 GUI 演練也另記，不從注入 TIMEOUT 推論真實斷網已通過。
