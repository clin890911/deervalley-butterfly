# 蝴蝶拍攝比賽 · 設定說明 🦋

客人流程：**手機打開網頁 → 填姓名／電話／上傳一張照片 → 送出 → 出現「加入 LINE 好友」按鈕**
你這邊：**打開 Google 試算表看名單、點連結看每個人上傳的蝴蝶照。**

檔案：
- `index.html` — 客人看到的網頁（單一檔）
- `apps-script/Code.gs` — 後端（貼到 Google Apps Script）
- `SETUP.md` — 本說明

---

## 完整測試（免設定，Demo 模式）

直接用瀏覽器打開 `index.html`，不用接任何後端就能整套跑一遍：
1. 填**姓名／電話／選一張照片** → 送出，看到「登記完成」與 LINE 按鈕。
2. 按「**＋ 再登記一位**」可連續登記多筆（現場一機多客也用得到）。
3. 頁尾「**🗂 查看已收到的登記（Demo 後台）**」→ 打開收件匣，看到每筆的**照片縮圖＋姓名＋電話＋時間**，模擬你未來在 Google 試算表會看到的內容。
4. 後台可「**匯出 CSV**」或「**全部清空**」重新測試。
> Demo 模式：資料只暫存在這台裝置的瀏覽器（localStorage），**不會上傳**；LINE 按鈕點了會提示「請填入 LINE_URL」。
> 要正式把資料＋照片收到雲端、並讓 LINE 按鈕生效，照下面步驟設定即可。

---

## 正式設定（約 5 分鐘）

### 步驟 1 — 建立 Google 試算表
1. 開一份新的 Google 試算表，命名例如「蝴蝶比賽報名」。
2. 第一列填標題：`時間`｜`姓名`｜`電話`｜`照片連結`（A1～D1）。
3. 從網址複製 **SHEET_ID**：
   `https://docs.google.com/spreadsheets/d/`**`這一長串就是 SHEET_ID`**`/edit`

### 步驟 2 — 建立照片資料夾
1. 在 Google 雲端硬碟建一個資料夾，例如「蝴蝶比賽照片」。
2. 進入資料夾，從網址複製 **FOLDER_ID**：
   `https://drive.google.com/drive/folders/`**`這一段就是 FOLDER_ID`**

### 步驟 3 — 建立後端 Apps Script
1. 到 [script.google.com](https://script.google.com) → 「新增專案」。
2. 把 `apps-script/Code.gs` 的內容整段貼進去（覆蓋預設的 `myFunction`）。
3. 把最上面兩行換成你的 ID：
   ```js
   const SHEET_ID  = "步驟1的SHEET_ID";
   const FOLDER_ID = "步驟2的FOLDER_ID";
   ```
4. 存檔（Ctrl/Cmd + S）。

### 步驟 4 — 部署成網頁應用程式，拿到網址
1. 右上角「部署」→「新增部署作業」。
2. 齒輪圖示選「**網頁應用程式**」。
3. 設定：
   - 說明：隨意（例如「蝴蝶比賽 v1」）
   - 執行身分：**我（你的 Google 帳號）**
   - 誰可以存取：**所有人**
4. 「部署」→ 第一次會要求授權，一路允許（若出現「Google 尚未驗證這個應用程式」→ 進階 → 前往…（不安全）→ 允許，這是你自己的腳本，安全）。
5. 複製畫面上的 **網頁應用程式網址**（結尾是 `/exec`）。

### 步驟 5 — 把兩個網址貼進 index.html
打開 `index.html`，最上方設定區改這兩行：
```js
const GOOGLE_SCRIPT_URL = "步驟4複製的 /exec 網址";
const LINE_URL          = "你的 LINE 加好友連結";
```
LINE 連結怎麼拿：LINE 官方帳號後台 →「加入好友」→ 網址型如
`https://line.me/R/ti/p/@你的ID` 或 `https://lin.ee/xxxxxxx`。

### 步驟 6 — 上線給客人掃
把 `index.html` 放上任一 https 空間，最簡單是 **GitHub Pages**（仍是單一檔）：
1. 建一個 repo，把 `index.html` 上傳。
2. Settings → Pages → 選 main 分支 → 存檔，得到一條 `https://帳號.github.io/repo/` 網址。
3. 用這條網址做一張 **QR code**，印出來貼在活動現場，客人掃碼就能填。

> ⚠️ 注意：直接用 `file://` 開啟（本機雙擊）時，送出可能被瀏覽器 CORS 擋下；
> **預覽畫面沒問題**，但要真正收資料請務必用 https 網址（如 GitHub Pages）開啟。

---

## 驗收清單
- [ ] 手機開網址，版面正常、大按鈕好點
- [ ] 三欄填齊後「送出」才會亮
- [ ] 選照片後有縮圖預覽、可更換
- [ ] 送出後試算表多一列、Drive 出現該照片、照片連結點得開
- [ ] 成功畫面的「加入 LINE 好友」點下去會開 LINE 加好友頁

## 之後想改什麼
- 要多張照片、加報名編號、Email 通知、活動說明頁 → 再找 Claude 擴充即可。
- 要正式活動頁（可線上部署、好維護）→ 可升級成 React 專案。
