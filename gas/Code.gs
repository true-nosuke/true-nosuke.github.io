const SPREADSHEET_ID = '1GZEX586PMIFYuwcnC8yfqAp3uUiJOTh0TDAzS_J8TOo';
const SHEET_NAME = 'stock';

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  values.shift(); // ヘッダー行を除外

  const data = values
    .filter(row => row.some(cell => cell !== ''))
    .map(row => ({
      item: row[0] || '',
      stock: row[1] || '',
      remark: row[2] || '',
      notice: row[3] || '',
      noticeDate: formatDate(row[4]),
      noticeTime: formatTime(row[5])
    }));

  const json = JSON.stringify(data);
  const callback = e?.parameter?.callback;

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(value) {
  if (!value) return '';
  try {
    return Utilities.formatDate(new Date(value), 'Asia/Tokyo', 'yyyy-MM-dd');
  } catch (e) {
    return '';
  }
}

function formatTime(value) {
  if (!value) return '';
  try {
    return Utilities.formatDate(new Date(value), 'Asia/Tokyo', 'HH:mm');
  } catch (e) {
    return '';
  }
}
