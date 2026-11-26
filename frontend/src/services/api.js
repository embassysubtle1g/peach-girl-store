const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

let bridgeFrame = null;
let bridgeWindow = null;
let bridgeReadyPromise = null;
let resolveBridgeReady = null;
let rejectBridgeReady = null;
let bridgeReadyTimer = null;
let requestSequence = 0;
const pendingRequests = new Map();

function normalizeImageUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  try {
    const url = new URL(value);
    const fileId = url.searchParams.get('id');
    if (url.hostname === 'drive.google.com' && url.pathname === '/uc' && fileId) {
      return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w1200';
    }
  } catch {
    // Keep non-URL values unchanged; the UI can handle an empty or invalid image URL.
  }
  return value;
}

function normalizeApiData(value) {
  if (Array.isArray(value)) return value.map(normalizeApiData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    key === 'imageUrl' ? normalizeImageUrl(item) : normalizeApiData(item),
  ]));
}

function resetBridge(error) {
  if (bridgeReadyTimer) window.clearTimeout(bridgeReadyTimer);
  bridgeReadyTimer = null;
  resolveBridgeReady = null;
  rejectBridgeReady = null;
  if (bridgeFrame?.parentNode) bridgeFrame.parentNode.removeChild(bridgeFrame);
  bridgeFrame = null;
  bridgeWindow = null;
  bridgeReadyPromise = null;
  return error;
}

function ensureBridge() {
  if (!API_BASE_URL) {
    return Promise.reject(new Error('尚未設定商品管理 API 網址（VITE_API_BASE_URL）'));
  }
  if (bridgeReadyPromise) return bridgeReadyPromise;

  bridgeReadyPromise = new Promise((resolve, reject) => {
    resolveBridgeReady = () => {
      if (bridgeReadyTimer) window.clearTimeout(bridgeReadyTimer);
      bridgeReadyTimer = null;
      resolveBridgeReady = null;
      rejectBridgeReady = null;
      resolve();
    };
    rejectBridgeReady = error => reject(resetBridge(error));

    bridgeFrame = document.createElement('iframe');
    bridgeFrame.title = 'Peach Girl API connection';
    bridgeFrame.setAttribute('aria-hidden', 'true');
    bridgeFrame.tabIndex = -1;
    bridgeFrame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;bottom:-10px;border:0;opacity:0;pointer-events:none;';
    bridgeFrame.onload = () => {
      // HtmlService may redirect to googleusercontent.com. Give its bridge script
      // a short window to announce readiness, then show a useful error instead
      // of leaving the admin login button spinning forever.
      bridgeReadyTimer = window.setTimeout(() => {
        rejectBridgeReady?.(new Error('Apps Script 橋接頁沒有回應。請確認已部署最新版本，且存取權限設為「任何人」。'));
      }, 10000);
    };
    bridgeFrame.onerror = () => {
      rejectBridgeReady?.(new Error('無法載入商品管理 API，請確認 Apps Script 網頁應用程式已公開部署。'));
    };
    bridgeFrame.src = API_BASE_URL + (API_BASE_URL.includes('?') ? '&' : '?') + 'bridge=1';
    document.body.appendChild(bridgeFrame);
  });

  return bridgeReadyPromise;
}

window.addEventListener('message', event => {
  if (!bridgeFrame) return;

  // Apps Script HTML Service can deliver its content through a Google-hosted
  // frame after redirecting. Accept only the expected Google origins.
  const trustedGoogleOrigin =
    event.origin === 'https://script.google.com' ||
    event.origin === 'https://script.googleusercontent.com' ||
    /^https:\/\/[^/]+\.googleusercontent\.com$/.test(event.origin);
  if (event.source !== bridgeFrame.contentWindow && !trustedGoogleOrigin) return;

  const message = event.data;
  if (!message || typeof message !== 'object') return;

  if (message.type === 'PEACH_BRIDGE_READY') {
    // HtmlService may run Bridge.html in a nested Google-hosted frame.
    // Remember the exact window that announced readiness and send requests there.
    bridgeWindow = event.source;
    resolveBridgeReady?.();
    return;
  }

  if (event.source !== bridgeWindow) return;

  if (message.type === 'PEACH_API_RESPONSE' && message.id) {
    const pending = pendingRequests.get(message.id);
    if (!pending) return;
    window.clearTimeout(pending.timeout);
    pendingRequests.delete(message.id);
    if (!message.result?.success) {
      pending.reject(new Error(message.result?.message || 'API 執行失敗'));
    } else {
      pending.resolve(normalizeApiData(message.result.data));
    }
  }
});

export async function callApi(action, data = {}, token = null) {
  await ensureBridge();

  const id = String(++requestSequence);
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Apps Script 沒有回覆 API 請求，請確認部署版本與存取權限。'));
    }, 30000);

    if (!bridgeWindow) {
      window.clearTimeout(timeout);
      reject(new Error('Apps Script 橋接視窗尚未就緒，請重新整理頁面再試一次。'));
      return;
    }

    pendingRequests.set(id, { resolve, reject, timeout });
    bridgeWindow.postMessage({
      type: 'PEACH_API_REQUEST',
      id,
      payload: { action, data, token },
    }, '*');
  });
}
