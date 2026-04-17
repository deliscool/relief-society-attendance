// ─────────────────────────────────────────────
// Relief Society Attendance — Google Apps Script
// ─────────────────────────────────────────────
// SETUP:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script → paste this code
// 3. Create 3 sheet tabs: "Config", "Responses", "Settings"
// 4. In Config tab: Column A = member names (one per row), Column C = dates (YYYY-MM-DD, one per row)
// 5. In Settings tab: Cell A1 = "pin", Cell B1 = your chosen PIN (e.g. 1234)
// 6. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 7. Copy the Web App URL into your .env file as VITE_SCRIPT_URL
// ─────────────────────────────────────────────

var SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getPin() {
  var settings = getSheet("Settings");
  if (!settings) return "1234";
  var data = settings.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === "pin") return String(data[i][1]);
  }
  return "1234";
}

function doGet(e) {
  var action = e.parameter.action || "";
  var result;

  try {
    if (action === "getConfig") {
      result = handleGetConfig();
    } else if (action === "submit") {
      result = handleSubmit(e.parameter);
    } else if (action === "addName") {
      result = handleAddName(e.parameter);
    } else if (action === "removeName") {
      result = handleRemoveName(e.parameter);
    } else if (action === "addDate") {
      result = handleAddDate(e.parameter);
    } else if (action === "removeDate") {
      result = handleRemoveDate(e.parameter);
    } else if (action === "getSubmissions") {
      result = handleGetSubmissions(e.parameter);
    } else if (action === "verifyPin") {
      result = handleVerifyPin(e.parameter);
    } else {
      result = { error: "Unknown action" };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Config ───────────────────────────────────

function handleGetConfig() {
  var sheet = getSheet("Config");
  if (!sheet) return { names: [], dates: [] };

  var data = sheet.getDataRange().getValues();
  var names = [];
  var dates = [];

  for (var i = 0; i < data.length; i++) {
    var name = String(data[i][0]).trim();
    if (name && name !== "undefined") names.push(name);

    var dateVal = data[i][2];
    if (dateVal !== "" && dateVal !== null && dateVal !== undefined) {
      var dateStr;
      if (dateVal instanceof Date) {
        // Google Sheets stores dates as Date objects — format to YYYY-MM-DD
        dateStr = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        dateStr = String(dateVal).trim();
      }
      if (dateStr && dateStr !== "undefined") dates.push(dateStr);
    }
  }

  return { names: names, dates: dates };
}

// ─── Submit Attendance ─────────────────────────

function handleSubmit(params) {
  var name = params.name || "";
  var dates = params.dates || "";
  var timestamp = params.timestamp || new Date().toISOString();

  if (!name) return { error: "Name is required" };

  var sheet = getSheet("Responses");
  if (!sheet) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = ss.insertSheet("Responses");
    sheet.appendRow(["Timestamp", "Name", "Dates Attended"]);
  }

  sheet.appendRow([timestamp, name, dates]);
  return { success: true };
}

// ─── Name Management ───────────────────────────

function handleAddName(params) {
  if (!checkPin(params.pin)) return { error: "Invalid PIN" };
  var name = (params.name || "").trim();
  if (!name) return { error: "Name is required" };

  var sheet = getSheet("Config");
  if (!sheet) return { error: "Config sheet not found" };

  // Find first empty cell in column A
  var colA = sheet.getRange("A:A").getValues();
  var nextRow = 1;
  for (var i = 0; i < colA.length; i++) {
    if (colA[i][0] !== "") nextRow = i + 2;
  }
  sheet.getRange(nextRow, 1).setValue(name);
  return { success: true };
}

function handleRemoveName(params) {
  if (!checkPin(params.pin)) return { error: "Invalid PIN" };
  var name = (params.name || "").trim();

  var sheet = getSheet("Config");
  if (!sheet) return { error: "Config sheet not found" };

  var colA = sheet.getRange("A:A").getValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === name) {
      sheet.getRange(i + 1, 1).clearContent();
      return { success: true };
    }
  }
  return { error: "Name not found" };
}

// ─── Date Management ───────────────────────────

function handleAddDate(params) {
  if (!checkPin(params.pin)) return { error: "Invalid PIN" };
  var date = (params.date || "").trim();
  if (!date) return { error: "Date is required" };

  var sheet = getSheet("Config");
  if (!sheet) return { error: "Config sheet not found" };

  // Find first empty cell in column C
  var colC = sheet.getRange("C:C").getValues();
  var nextRow = 1;
  for (var i = 0; i < colC.length; i++) {
    if (colC[i][0] !== "") nextRow = i + 2;
  }
  sheet.getRange(nextRow, 3).setValue(date);
  return { success: true };
}

function handleRemoveDate(params) {
  if (!checkPin(params.pin)) return { error: "Invalid PIN" };
  var date = (params.date || "").trim();

  var sheet = getSheet("Config");
  if (!sheet) return { error: "Config sheet not found" };

  var colC = sheet.getRange("C:C").getValues();
  for (var i = 0; i < colC.length; i++) {
    if (String(colC[i][0]).trim() === date) {
      sheet.getRange(i + 1, 3).clearContent();
      return { success: true };
    }
  }
  return { error: "Date not found" };
}

// ─── Submissions ───────────────────────────────

function handleGetSubmissions(params) {
  if (!checkPin(params.pin)) return { error: "Invalid PIN" };

  var sheet = getSheet("Responses");
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var rows = [];
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    rows.push({
      timestamp: String(data[i][0]),
      name: String(data[i][1]),
      dates: String(data[i][2]),
    });
  }
  // Return most recent first
  return rows.reverse();
}

// ─── PIN Verify ────────────────────────────────

function handleVerifyPin(params) {
  return { valid: checkPin(params.pin) };
}

function checkPin(input) {
  return String(input || "").trim() === getPin();
}
