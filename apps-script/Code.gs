/**
 * Google Apps Script web app that receives jobs from the Trabajar
 * Chrome extension and appends them to the 2026_job_search tab.
 *
 * Setup (one time):
 *   1. Open the 2026_job_search spreadsheet > Extensions > Apps Script.
 *   2. Paste this file in as Code.gs and save.
 *   3. Project Settings (gear) > Script Properties > add
 *        SHARED_SECRET = <any long random string>
 *   4. Deploy > New deployment > type "Web app"
 *        Execute as: Me    Who has access: Anyone
 *      Authorize when prompted, then copy the Web app URL (ends in /exec).
 *   5. Put the URL and the same secret in chrome-extension/.env.local
 *      (VITE_SHEETS_WEB_APP_URL and VITE_SHEETS_SECRET), then npm run build.
 *
 * After editing this file later: Deploy > Manage deployments > edit (pencil)
 * > Version: New version > Deploy. The /exec URL stays the same.
 */

const SHEET_NAME = '2026_job_search';
const HEADER_ROW = 2;
const FIRST_DATA_ROW = 3;
const EXPECTED_HEADERS = ['Date', 'Company', 'Position', 'Job board'];
const ALLOWED_LOCATIONS = ['REMOTE', 'HYBRID', 'ONSITE'];

// Column numbers (1-based)
const COL = { DATE: 1, COMPANY: 2, POSITION: 3, BOARD: 4, LOCATION: 7, NOTES: 8 };

/** Health check: open the /exec URL in a browser and you should see {"ok":true}. */
function doGet() {
  return json_({ ok: true, sheet: SHEET_NAME });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!secret || body.secret !== secret) {
      return json_({ ok: false, error: 'Unauthorized: secret missing or wrong' });
    }

    const job = body.job || {};
    const company = clean_(job.companyName);
    const position = clean_(job.positionTitle);
    const url = clean_(job.positionLink);
    const board = clean_(job.jobBoard);
    const location = clean_(job.workLocation).toUpperCase();
    const notes = clean_(job.notes);
    const date = clean_(job.date);

    if (!company || !position || !url) {
      return json_({ ok: false, error: 'Company, position and URL are required' });
    }
    if (location && ALLOWED_LOCATIONS.indexOf(location) === -1) {
      return json_({ ok: false, error: 'Work location must be REMOTE, HYBRID or ONSITE' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) return json_({ ok: false, error: 'Tab "' + SHEET_NAME + '" not found' });

      const headers = sheet.getRange(HEADER_ROW, 1, 1, EXPECTED_HEADERS.length).getDisplayValues()[0];
      if (EXPECTED_HEADERS.some(function (h, i) { return headers[i] !== h; })) {
        return json_({ ok: false, error: 'Header row changed: ' + headers.join(' | ') });
      }

      const dupRow = findDuplicate_(sheet, company, position, url);
      if (dupRow) return json_({ ok: false, error: 'Already in the sheet (row ' + dupRow + ')', row: dupRow });

      const row = nextRow_(sheet);
      if (date) sheet.getRange(row, COL.DATE).setValue(date);
      sheet.getRange(row, COL.COMPANY).setValue(company);
      sheet.getRange(row, COL.POSITION).setFormula(
        '=HYPERLINK("' + escapeQuotes_(url) + '", "' + escapeQuotes_(position) + '")'
      );
      if (board) sheet.getRange(row, COL.BOARD).setValue(board);
      if (location) sheet.getRange(row, COL.LOCATION).setValue(location);
      if (notes) sheet.getRange(row, COL.NOTES).setValue(notes);
      SpreadsheetApp.flush();

      return json_({ ok: true, row: row });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/** Row after the last filled Company (column B) cell, starting at row 3. */
function nextRow_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < FIRST_DATA_ROW) return FIRST_DATA_ROW;
  const values = sheet.getRange(FIRST_DATA_ROW, COL.COMPANY, lastRow - FIRST_DATA_ROW + 1, 1).getValues();
  let last = FIRST_DATA_ROW - 1;
  values.forEach(function (r, i) { if (String(r[0]).trim() !== '') last = FIRST_DATA_ROW + i; });
  return last + 1;
}

/** Returns the row number of an existing entry with the same URL or company + position. */
function findDuplicate_(sheet, company, position, url) {
  const lastRow = sheet.getLastRow();
  if (lastRow < FIRST_DATA_ROW) return null;
  const n = lastRow - FIRST_DATA_ROW + 1;
  const companies = sheet.getRange(FIRST_DATA_ROW, COL.COMPANY, n, 1).getDisplayValues();
  const posRange = sheet.getRange(FIRST_DATA_ROW, COL.POSITION, n, 1);
  const formulas = posRange.getFormulas();
  const titles = posRange.getDisplayValues();
  const urlNeedle = '"' + escapeQuotes_(url) + '"';
  for (let i = 0; i < n; i++) {
    if (formulas[i][0] && formulas[i][0].indexOf(urlNeedle) !== -1) return FIRST_DATA_ROW + i;
    if (companies[i][0].trim().toLowerCase() === company.toLowerCase() &&
        titles[i][0].trim().toLowerCase() === position.toLowerCase()) return FIRST_DATA_ROW + i;
  }
  return null;
}

function clean_(v) { return v == null ? '' : String(v).trim(); }
function escapeQuotes_(s) { return String(s).replace(/"/g, '""'); }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
