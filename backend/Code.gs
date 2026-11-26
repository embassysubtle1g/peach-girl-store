/**
 * Peach Girl Store - Apps Script 入口
 *
 * 所有業務功能已拆分至其他 .gs 檔案。
 * Bridge.html 保留為前端 iframe 唯一橋接入口。
 */

function doGet(e) {
  if (e && e.parameter && e.parameter.bridge === '1') {
    return HtmlService.createHtmlOutputFromFile('Bridge')
      .setTitle('Peach Girl Store API Bridge')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return jsonResponse_({
    success: true,
    data: { service: 'Peach Girl Store API', status: 'ready' },
    message: 'success'
  });
}

/**
 * 由可信任的前端 Bridge iframe 透過 google.script.run 呼叫。
 * 函式名稱不可加底線，否則 google.script.run 無法存取。
 */
function bridgeCall(request) {
  try {
    return {
      success: true,
      data: dispatchApi_(request),
      message: 'success'
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error && error.message ? error.message : 'API 執行失敗'
    };
  }
}

/**
 * 備用 HTTP POST 入口，與 Bridge 共用 dispatchApi_。
 */
function doPost(e) {
  try {
    var request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return jsonResponse_({
      success: true,
      data: dispatchApi_(request),
      message: 'success'
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      data: null,
      message: error && error.message ? error.message : 'API 執行失敗'
    });
  }
}
