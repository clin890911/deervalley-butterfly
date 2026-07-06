/**
 * 蝴蝶拍攝比賽 — 後端（Google Apps Script Web App）
 * ------------------------------------------------------------------
 * 功能：接收 index.html 送來的 { name, phone, photo(base64) }
 *   1. 把照片存進指定的 Google 雲端硬碟資料夾
 *   2. 在試算表 append 一列：[時間, 姓名, 電話, 照片連結]
 *   3. 回傳 { ok:true, url:照片連結 }
 *
 * 部署方式見同資料夾的 SETUP.md。
 * ================================================================== */

// ★★★ 只要改這兩個 ID（見 SETUP.md 第 1、2 步）★★★
const SHEET_ID  = "PASTE_YOUR_SHEET_ID_HERE";     // 試算表網址 .../d/【這一段】/edit
const FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";    // Drive 資料夾網址 .../folders/【這一段】

// 試算表分頁名稱（預設用第一個分頁；如需指定可填分頁名，例如 "報名"）
const SHEET_NAME = "";

function doPost(e) {
  // 併發鎖：避免多人同時送出時 appendRow 競爭寫入
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (lockErr) { return json({ ok: false, error: "系統忙碌，請稍後再試" }); }
  try {
    const body = JSON.parse(e.postData.contents);
    const name  = (body.name  || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const photo = (body.photo || "").toString();

    if (!name || !phone || !photo) {
      return json({ ok: false, error: "缺少必要欄位" });
    }

    // --- 1. 解 base64 存成圖檔到 Drive ---
    // photo 形如 "data:image/jpeg;base64,/9j/4AA..."
    const match = photo.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return json({ ok: false, error: "照片格式錯誤" });

    const mime = match[1];
    const ext  = mime.split("/")[1] || "jpg";
    const bytes = Utilities.base64Decode(match[2]);
    const stamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd_HHmmss");
    const safeName = name.replace(/[\/\\?%*:|"<>]/g, "_");
    const fileName = stamp + "_" + safeName + "." + ext;

    const blob = Utilities.newBlob(bytes, mime, fileName);
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);
    // 設為「知道連結的人都可檢視」，方便你在試算表點開
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const photoUrl = file.getUrl();

    // --- 2. 寫一列進試算表 ---
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    sheet.appendRow([new Date(), name, phone, photoUrl]);

    // --- 3. 回傳成功 ---
    return json({ ok: true, url: photoUrl });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 讓瀏覽器直接開網址時有個友善回應（測試用）
function doGet() {
  return json({ ok: true, msg: "鹿芝谷蝶影 攝影競賽後端運作中" });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
