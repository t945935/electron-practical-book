# 第 5 章建構練習

### 必做建構：未完成篩選

前面的成品操作讓你認識安全基線；這一段才要親自改程式，不是只改測試預期。起始版仍可安全新增、勾選與保存，只缺顯示篩選。測試會停在 filter change must be wired。完整配套仍是參考答案，`lesson/starter.json` 保存起始檔，`lesson/complete.diff` 列出完成差異。只修改 renderer.js、index.html。

先關閉視窗，在本章目錄建立獨立練習副本。lesson.cjs 每次建立新的系統暫存目錄，不覆寫已有練習、不讀 userData，包含可直接跑 Node 測試的完整來源；不需再安裝 Electron。它不是要替換你的正式工具資料。

```powershell
Set-Location C:\work\own-tools\companion\ch05
$reference = (Get-Location).Path
$lab = node lesson.cjs
Set-Location $lab
node --test test/build.test.js *> red.txt
$LASTEXITCODE
```

此處退出碼應為 1，red.txt 應是上述斷言失敗，不是找不到模組或語法錯誤；後兩者必須先修環境。打開 `$lab` 內檔案，按以下順序手動修改：

1. 在 index.html 的清單前加入 `<label><input id="pending" type="checkbox">只顯示未完成</label>`。
2. renderer 的清單迴圈改為 `for (const item of items.filter(x => !$('pending').checked || !x.done))`。只篩選迴圈，不重新指定 `items`。
3. 將 `let items=[]` 改為 `let items=[], recoveryRequired=false`；render 接收資料、指定 items 後，加上 `recoveryRequired=Boolean(data.recoveryRequired)` 保存復原旗標。在表單監聽前加入 `$('pending').addEventListener('change', () => render({items, recoveryRequired}));`。沿用完整 items 與原復原狀態，切換不發 save，也不能把損毀畫面解除鎖定。
4. 不改勾選保存的 `items.map` 或刪除的 `items.filter`：前者修改完整清單，後者才是真的刪除。測試先有兩筆、切換只剩未完成、再切回兩筆，且切換期間 save 次數為零。

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
| 核心：失敗／復原 | 保存重啟與損毀隔離 | 保存本章故障命令輸出及復原核對；未做填「復原未驗」 | 留下失敗輸出與原件，修復後重跑 |
| 平台／外部服務 | 在自己的 Windows 原生視窗重做；不可拿 Node／DOM 替身當 GUI | 記錄作業系統、步驟與結果；沒有操作就填「平台未驗」 | 可繼續離線學習，不簽產品全通過 |

驗證器空白、重複 ID 與型別案例可再擴充；不是新增第二種保存路線。
