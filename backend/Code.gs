/**
 * Peach Girl Store - Google Apps Script API entry.
 * 第一階段先建立 API 骨架；正式啟用前需設定試算表 ID 與驗證機制。
 */
function doGet() {
  return jsonResponse_({ success: true, data: { service: 'Peach Girl Store API', status: 'ready' }, message: 'success' });
}

function doPost(e) {
  try {
    var request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = request.action || '';
    if (action === 'getProducts') {
      return jsonResponse_({ success: true, data: [], message: 'API scaffold: connect product sheet next' });
    }
    return jsonResponse_({ success: false, data: null, message: '尚未支援此 API：' + action });
  } catch (error) {
    return jsonResponse_({ success: false, data: null, message: error.message || 'Invalid request' });
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
