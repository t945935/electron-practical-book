# 第 8 章建構練習

### 必做建構：只匯出指定月份的純函式

前面的成品操作讓你認識安全基線；這一段才要親自改程式，不是只改測試預期。起始版保留金額、CSV 防護與 CSV_LIMIT，只缺 exportMonth。測試在函式應存在的斷言失敗。完整配套仍是參考答案，`lesson/starter.json` 保存起始檔，`lesson/complete.diff` 列出完成差異。只修改 core.cjs。

先關閉視窗，在本章目錄建立獨立練習副本。lesson.cjs 每次建立新的系統暫存目錄，不覆寫已有練習、不讀 userData，包含可直接跑 Node 測試的完整來源；不需再安裝 Electron。它不是要替換你的正式工具資料。

```powershell
Set-Location C:\work\own-tools\companion\ch08
$reference = (Get-Location).Path
$lab = node lesson.cjs
Set-Location $lab
node --test test/build.test.js *> red.txt
$LASTEXITCODE
```

此處退出碼應為 1，red.txt 應是上述斷言失敗，不是找不到模組或語法錯誤；後兩者必須先修環境。打開 `$lab` 內檔案，按以下順序手動修改：

1. 在 core 的 module.exports 前新增 `exportMonth(rows, month)`。先要求 month 為字串，並符合 `/^\d{4}-(0[1-9]|1[0-2])$/`；不合法就 `throw Error('INVALID')`。
2. 用 `const clean = validateRows(rows)` 驗證完整帳本，再回傳 `exportCSV(clean.filter(r => r.date.startsWith(month + '-')))`。
3. 將 exportMonth 加入 module.exports。不要呼叫 store.replace：這是報表子集合，不是刪除其他月份。
4. 測試實際保存九月、十月兩筆帳本，匯出九月再解析只得一筆且公式防護仍在；十一月得到只有標頭的有效 CSV。重新建立儲存器後兩筆均在，原 ledger.json 位元組完全不變。這次交付是可由主程序使用的報表函式，不新增 IPC 或畫面按鈕。

存檔後在同一個 `$lab` 目錄驗收：

```powershell
node --test test/build.test.js *> green.txt
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
| 核心：失敗／復原 | 精確 JSON 備份／取代／恢復、CSV 上限拒絕 | 保存本章故障命令輸出及復原核對；未做填「復原未驗」 | 留下失敗輸出與原件，修復後重跑 |
| 平台／外部服務 | 在自己的 Windows 原生視窗重做；不可拿 Node／DOM 替身當 GUI | 記錄作業系統、步驟與結果；沒有操作就填「平台未驗」 | 可繼續離線學習，不簽產品全通過 |

新增更多金額與前導符号反例為延伸；月份函式是必做，不只寫設計。
