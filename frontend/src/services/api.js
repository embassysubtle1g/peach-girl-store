const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const STOREFRONT_ORIGIN = 'https://embassysubtle1g.github.io';

let bridgeFrame = null;
let bridgeReadyPromise = null;
let resolveBridgeReady = null;
let rejectBridgeReady = null;
let requestSequence = 0;
const pendingRequests = new Map();

function ensureBridge() {
  if (!API_BASE_URL) {
    return Promise.reject(new Error('尚未設定商品管理 API 網址（VITE_API_BASE_URL）'));
  }
  if (bridgeReadyPromise) return bridgeReadyPromise;

  bridgeReadyPromise = new Promise((resolve, reject) => {
    resolveBridgeReady = resolve;
    rejectBridgeReady = reject;

    bridgeFrame = document.createElement('iframe');
    bridgeFrame.title = 'Peach Girl API connection';
    bridgeFrame.setAttribute('aria-hidden', 'true');
    bridgeFrame.tabIndex = -1;
    bridgeFrame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;bottom:-10px;border:0;opacity:0;pointer-events:none;';
    bridgeFrame.src = API_BASE_URL + (API_BASE_URL.includes('?') ? '&' : '?') + 'bridge=1';
    bridgeFrame.onerror = () => {
      rejectBridgeReady?.(new Error('無法載入商品管理 API，請確認 Apps Script 網頁應用程式已公開部署。'));
      bridgeReadyPromise = null;
    };
    document.body.appendChild(bridgeFrame);
  });

  return bridgeReadyPromise;
}

window.addEventListener('message', event => {
  if (!bridgeFrame || event.source !== bridgeFrame.contentWindow) return;

  const message = event.data;
  if (!message || typeof message !== 'object') return;

  if (message.type === 'PEACH_BRIDGE_READY') {
    resolveBridgeReady?.();
    resolveBridgeReady = null;
    rejectBridgeReady = null;
    return;
  }

  if (message.type === 'PEACH_API_RESPONSE' && message.id) {
    const pending = pendingRequests.get(message.id);
    if (!pending) return;
    window.clearTimeout(pending.timeout);
    pendingRequests.delete(message.id);
    if (!message.result?.success) {
      pending.reject(new Error(message.result?.message || 'API 執行失敗'));
    } else {
      pending.resolve(message.result.data);
    }
  }
});

export async function callApi(action, data = {}, token = null) {
  await ensureBridge();

  const id = String(++requestSequence);
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('API 回應逾時，請稍後再試。'));
    }, 120000);

    pendingRequests.set(id, { resolve, reject, timeout });
    bridgeFrame.contentWindow.postMessage({
      type: 'PEACH_API_REQUEST',
      id,
      payload: { action, data, token },
    }, '*');
  });
}
