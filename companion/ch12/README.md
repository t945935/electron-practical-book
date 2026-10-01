# 個人桌面工具箱（第 12、14 章）

單一 Electron 主程序與共同入口，整合計時、待辦、Markdown 筆記、檔案整理、CSV 記帳、天氣、提醒及本機搜尋。不是八個子程序啟動器。

## 開始

在本目錄使用 Node.js 24：

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run test:ui
npm.cmd start
```

測試自動建立暫存資料；UI 測試使用真實 Electron，但對話框回覆是注入值，不代表原生 Windows 對話框或通知已驗收。Linux 無桌面可用已安裝的 Xvfb：`xvfb-run -a npm run test:ui`。不關閉 sandbox。

## 完整任務

1. 待辦新增「整理讀書筆記」。
2. 筆記保存含 `Electron` 的 `.md` 到測試資料夾。
3. 搜尋明確選取該資料夾，找到剛才的文字。
4. 修改筆記後要求整個工具箱退出，選取消；全部視窗和文字應留下。
5. 將啟動時加開設定為待辦，正常退出、重開；待辦與設定保留。

資料根目錄由 Electron userData 決定，各工具使用固定子目錄；筆記存到使用者選定的檔案。提醒、倒數、搜尋結果不跨重啟保存。獨立章節資料不會自動搬入工具箱。

## 打包（Windows PowerShell）

```powershell
npm.cmd run package
npm.cmd run make:win
Get-ChildItem .\out -Recurse -Filter *.zip
```

Forge 使用 ZIP maker，產生解壓執行包，**不是 MSI／Setup 安裝器**，不建立捷徑、不簽章、不部署自動更新。解壓整份 ZIP 後啟動 `own-tools-toolbox.exe`；不可只複製 exe。Linux 的 `npm run make` 產生 Linux ZIP，maker 需要可執行的系統 `zip`。

搜尋 worker 和 `read-bounded.cjs` 透過 ASAR unpack 保留實體檔。成品測試可以指定本機執行檔再執行相同 UI 回歸：

```powershell
$env:TOOLBOX_EXECUTABLE = '填入封裝成品 own-tools-toolbox.exe 完整路徑'
npm.cmd run test:ui
Remove-Item Env:TOOLBOX_EXECUTABLE
```

UI 測試的 `TOOLBOX_TEST_DATA` 只由本機測試程序傳入，不由 renderer 決定。請勿對自己的唯一資料做故障測試。

## 模組同步與安全

`COPIED-MODULES.json` 列出來源、目的檔與 SHA-256。原始章節 main 不會被帶入。主程序以固定 ID 建窗、不同 session 分隔工具，IPC 核對 sender／主 frame／URL。筆記完整沿用第 6 章 renderer 的 onClose／close 協定；整合 preload 在 callback 結束後另送帶 token 的 close-ready。主程序先在佇列外等待同步，再鎖定控制項、比對畫面及已接受草稿，拒絕未同步／結果不明的退出，才詢問保存。不能只替換 renderer 而不檢查 close 協定。

`regression/` 指向本目錄實際 tools 模組；原各章 main 的靜態測試不冒充整合主程序測試。本版只交付未簽署 Windows x64 ZIP；Windows 原生操作與通知送達須另驗收，安裝器／簽章／自動更新屬範圍外，不是本版欠做的核心功能。「可攜」只指程式目錄；userData 不隨 ZIP 搬移。

### 固定學習副本與增量同步

前章個人改作不會自動進入本工具箱。依正文 12.3 在保留完整 companion 結構的學習副本重建十五分鐘快捷按鈕：ch10 先移除答案／測試失敗／重建，再對 tools/reminder 做同樣演練；不得覆蓋整個 tools 或 ch12 main。`test/shortcut.test.cjs` 的整合版本在 `regression/ch10/test/`，只適配 source 路徑。

在本目錄執行 `node scripts/check-copies.cjs > copy-audit.json`；exit 0=記錄相符，1=差異／缺檔，2=核對失敗。它只讀，不更新清單。可選參數為「來源根目錄、ch12 目的根目錄」，來源根應含 companion。`modified:true` 人工合併；`false` 也要先確認目的改作。工具只涵蓋已登記檔，新增 helper、renderer 資源與測試須人工納入。

來源回歸 → 檔案／依賴差異 → 整合回歸及 UI → 原生退出 → 才更新已審核列雜湊。筆記 renderer/service/preload/main 的 token 握手與佇列外等待不可拆；搜尋 SearchJob/worker/read-bounded 及短讀/取消測試不可拆。來源他章修正後再次核對，不得重新計算全部雜湊掩蓋未同步變更。

`ACCEPTANCE.md` 是開發／整合／Windows ZIP 的同一張驗收表，所有格子初始未測；請複製到 ZIP 外填寫。
