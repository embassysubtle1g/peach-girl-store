const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function callApi(action, data = {}, token = null) {
  if (!API_BASE_URL) throw new Error('尚未設定 GAS API 網址（VITE_API_BASE_URL）');
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data, token }),
  });
  if (!response.ok) throw new Error(`API 請求失敗：HTTP ${response.status}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'API 執行失敗');
  return result.data;
}
