# 《自己的工具，自己做》讀者配套 v1.0.0

讀者服務與問題回報：https://github.com/t945935/electron-practical-book

這是 **來源 ZIP**，不是 Electron 執行檔、不是 Windows 安裝器，也不含書籍章節正文、封面或電子書。此包不附加開源授權；下載不代表另授開源再散布權利。第三方依賴依各自條款使用。

## 版本與完整性

書版 `v1.0.0`、配套 `v1.0.0`。根目錄 `VERSION.json` 沿用版本卡的 `bookVersion`／`companionVersion` 欄位；第 1–4 章另保留完整版本卡，應用版號 `0.1.0` 並非書版。`SHA256SUMS.txt` 列出所有交付檔（不含它自身）的 SHA-256；外部 ZIP 雜湊由發布者另提供。請先對照讀者服務的固定版本入口，不混用可變分支或別版鎖檔。

## Windows PowerShell 啟動指南

安裝 Node.js **24 系列**（含 npm），重新開啟 PowerShell。保留 ZIP 與原始解壓目錄；將 ZIP **內的 companion、README.md、VERSION.json 等**解壓到全新的 `C:\work\own-tools-original-v1.0.0`，不要多套一層未知目錄。

```powershell
node --version
npm.cmd --version
$ErrorActionPreference = 'Stop'
$source = 'C:\work\own-tools-original-v1.0.0'
$work = 'C:\work\own-tools'
if (Test-Path -LiteralPath $work) { throw '工作目錄已存在，請另命名；不覆寫。' }
$card = Get-Content -Raw "$source\VERSION.json" | ConvertFrom-Json
if ($card.bookVersion -ne 'v1.0.0' -or $card.companionVersion -ne 'v1.0.0') { throw '版本不符。' }
Copy-Item -LiteralPath $source -Destination $work -Recurse
Set-Location "$work\companion\ch01"
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw '依賴安裝失敗，停止啟動。' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw '基線測試失敗，先排查。' }
npm.cmd start
```

若 Node 不是 24 系列，先更正環境。PowerShell 使用 `npm.cmd` 避免 npm.ps1 政策問題，不要關閉全機安全政策或 TLS 驗證。安裝需要網路及 Electron 下載；保留 `package-lock.json`，不以升級全部依賴處理下載失敗。依賴未變時不需反覆 ci。

各章為獨立專案，在各自目錄安裝；**保留整個 companion 結構**。前章改作不會自動帶入後章。Linux/macOS 參考命令改為 `npm`，但平台功能仍須分開驗收。

## 章節地圖

| 目錄 | 內容與入口 |
|---|---|
| companion/ch01 | 第一個桌面視窗；npm.cmd ci / test / start |
| companion/ch02 | 主程序、renderer 與 preload |
| companion/ch03 | IPC 與 exercises 起始測試 |
| companion/ch04 | 專注計時器與 exercises 起始測試 |
| companion/ch05 | 待辦事項、walkthrough、lesson 建構 |
| companion/ch06 | Markdown 筆記、walkthrough、lesson 建構 |
| companion/ch07 | 工作副本整理、部分完成復原、lesson |
| companion/ch08 | CSV 支出帳本、精確備份、lesson |
| companion/ch09 | 天氣面板、離線測試、lesson；test:live 需真網路 |
| companion/ch10 | 系統匣提醒工具 |
| companion/ch11 | 本機筆記搜尋器 |
| companion/ch12 | 八工具整合、跨章 regression、複製來源核對；亦供第 14 章封裝 |
| companion/ch13 | 純函式：node --test duration.test.cjs；不需 npm 安裝 |

ch01–ch12 都在章節目錄執行 `npm.cmd ci`、`npm.cmd test`、`npm.cmd start`。GUI、lesson、walkthrough 與額外命令依各章 README；只跑完成版測試不代表完成自己的建構。ch12 不可單獨搬走，`COPIED-MODULES.json` 與 `scripts/check-copies.cjs` 需要兄弟章節來源：

```powershell
Set-Location C:\work\own-tools\companion\ch12
npm.cmd ci
npm.cmd test
node scripts/check-copies.cjs
npm.cmd start
```

核對退出碼 0 為登記檔一致、1 為差異或缺檔、2 為核對失敗。不得靠全部重算雜湊掩蓋未審核差異。第 14 章沒有獨立 ch14 程式，沿用 ch12；Forge 設定、各章 lockfile 及 .gitignore 是必要讀者原始專案檔，不是出版建置工具。

## 資料保護與驗收界線

只在工作副本及複製的測試資料操作；不要拿唯一筆記、帳本或私人目錄做首次故障演練。恢復單章前先另存成果，不覆蓋整個 companion。退出應用後再備份資料；userData 不隨來源 ZIP 搬移，獨立章節資料不會自動匯入工具箱。不附私人資料、憑證、node_modules 或封裝輸出。

此來源包不宣稱 Windows 原生視窗、通知、系統匣、真實網路、簽章或安裝器已驗收。Node 測試、GUI 測試、實際平台操作分別判定；未做 GUI 不等於整章通過。`npm.cmd run package`／各章可用的 make 命令是讀者自行封裝，不會把這個來源 ZIP 變成安裝器。

回報請附書版／配套 v1.0.0、章節、作業系統、Node/npm 版本、命令及最小重現；不要傳密碼、權杖或真實私人文件。
