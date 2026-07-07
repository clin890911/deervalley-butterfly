/**
 * 鹿芝谷蝶影 蝴蝶攝影競賽 — 後端（Google Apps Script Web App）
 * ------------------------------------------------------------------
 * 零設定版：把此腳本綁在「報名試算表」上（試算表 → 擴充功能 → Apps Script），
 * 不需要填任何 ID。
 *
 * 收到前端送來的 { name, phone, photo(base64) }：
 *   1. 照片存進 Google 雲端硬碟的「蝴蝶比賽照片」資料夾（程式會自動建立）
 *   2. 在（綁定的）試算表 append 一列：[時間, 姓名, 電話, 照片連結]
 *   3. 回傳 { ok:true, url:照片連結 }
 *
 * 部署方式見同資料夾的 SETUP.md。
 * ================================================================== */

const PHOTO_FOLDER_NAME = "蝴蝶比賽照片";

function doPost(e) {
  // 併發鎖：避免多人同時送出時 appendRow 競爭寫入
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (lockErr) { return json({ ok: false, error: "系統忙碌，請稍後再試" }); }
  try {
    const body = JSON.parse(e.postData.contents);
    const name  = (body.name  || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const photo = (body.photo || "").toString();
    const postLink = (body.postLink || "").toString().trim();  // 社群帳號（選填）
    const message  = (body.message  || "").toString().trim();  // 照片含義（選填）

    if (!name || !phone || !photo) {
      return json({ ok: false, error: "缺少必要欄位" });
    }

    // --- 1. 解 base64 存成圖檔到 Drive（照片形如 "data:image/jpeg;base64,/9j/4AA..."） ---
    const match = photo.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return json({ ok: false, error: "照片格式錯誤" });

    const mime = match[1];
    const ext  = mime.split("/")[1] || "jpg";
    const stamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd_HHmmss");
    const safeName = name.replace(/[\/\\?%*:|"<>]/g, "_");
    const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), mime, stamp + "_" + safeName + "." + ext);

    const file = getPhotoFolder().createFile(blob);
    // 設為「知道連結的人都可檢視」，方便你在試算表點開
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const photoUrl = file.getUrl();

    // --- 2. 寫一列進試算表（電話以純文字寫入，保留開頭 0，避免被當數字） ---
    const sheet = getSheet();
    sheet.appendRow([new Date(), name, phone, photoUrl, postLink, message]);
    sheet.getRange(sheet.getLastRow(), 3).setNumberFormat("@").setValue(phone);

    // --- 3. 回傳成功 ---
    return json({ ok: true, url: photoUrl });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 取得綁定的試算表第一個分頁；若是空的，先補上標題列
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("找不到綁定的試算表；請從試算表的「擴充功能 → Apps Script」建立此腳本");
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(["時間", "姓名", "電話", "照片連結", "社群帳號", "照片含義"]);
  return sheet;
}

// 取得（或自動建立）照片資料夾
function getPhotoFolder() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
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
