/**
 * Google Sheets 資料庫共用功能
 */
function initializeStore() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('請先設定指令碼屬性 SPREADSHEET_ID');

  var ss = SpreadsheetApp.openById(id);
  var created = [];

  Object.keys(STORE_SHEETS).forEach(function(name) {
    var headers = STORE_SHEETS[name];
    var sheet = ss.getSheetByName(name);

    if (!sheet) {
      sheet = ss.insertSheet(name);
      created.push(name);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  });

  Logger.log('資料庫初始化完成。新建工作表：' + (created.join(', ') || '無') + '；資料庫：' + ss.getUrl());
}

function getStoreSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('請設定指令碼屬性 SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function getStoreSheet_(name) {
  var sheet = getStoreSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('找不到 ' + name + ' 工作表，請先執行 initializeStore()');
  return sheet;
}

function memberSheet_(name) {
  return getStoreSheet_(name);
}

function productSheet_() {
  return getStoreSheet_('Products');
}

function readProducts_() {
  var values = productSheet_().getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(String);
  return values.slice(1).filter(function(row) {
    return row[0];
  }).map(function(row) {
    var item = {};
    headers.forEach(function(key, index) {
      item[key] = row[index];
    });
    return item;
  });
}
