/**
 * Goi dich vu goi y Python (FastAPI) qua HTTP.
 * Tra ve null khi dich vu tat / loi / qua thoi gian cho -> controller dung SQL du phong.
 * Sau 1 lan loi, tam bo qua dich vu trong RETRY_AFTER_MS de khong lam cham moi request.
 */
const BASE_URL = process.env.REC_SERVICE_URL || "http://127.0.0.1:8000";
const TIMEOUT_MS = Number(process.env.REC_TIMEOUT_MS) || 800;
const RETRY_AFTER_MS = 30 * 1000;

let downUntil = 0;

export const callRecommender = async (path, params = {}) => {
  if (Date.now() < downUntil) return null;
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      if (res.status >= 500) downUntil = Date.now() + RETRY_AFTER_MS;
      return null;
    }
    return await res.json();
  } catch {
    downUntil = Date.now() + RETRY_AFTER_MS;
    return null;
  }
};
