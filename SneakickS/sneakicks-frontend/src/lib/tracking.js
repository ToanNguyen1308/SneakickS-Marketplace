import api from "../api/axios";

/**
 * Ghi nhan hanh vi (implicit feedback) cho he goi y.
 * - Session het han sau 30 phut khong hoat dong.
 * - Su kien duoc gom lo va gui moi 5 giay, hoac ngay khi tab bi an (keepalive).
 */

const SESSION_KEY = "sk_session";
const IDLE_MS = 30 * 60 * 1000;
const FLUSH_MS = 5000;
const MAX_BATCH = 50;

const newId = () =>
  (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 64);

export const getSessionId = () => {
  const now = Date.now();
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    session = null;
  }
  if (!session || now - session.last > IDLE_MS) {
    session = { id: newId(), last: now };
  }
  session.last = now;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session.id;
};

let queue = [];
let timer = null;

const send = (events, keepalive) => {
  const body = { session_id: getSessionId(), events };
  if (!keepalive) {
    return api.post("/api/events", body).catch(() => {});
  }
  const token = localStorage.getItem("token");
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return fetch(`${base}/api/events`, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => {});
};

export const flush = (keepalive = false) => {
  clearTimeout(timer);
  timer = null;
  while (queue.length) {
    send(queue.splice(0, MAX_BATCH), keepalive);
  }
};

const schedule = () => {
  if (!timer) timer = setTimeout(() => flush(false), FLUSH_MS);
};

export const track = (type, payload = {}) => {
  queue.push({ type, ...payload });
  if (queue.length >= MAX_BATCH) flush(false);
  else schedule();
};

export const trackView = (productId, dwellMs, source) =>
  track("view", { product_id: Number(productId), dwell_ms: dwellMs, source });

const SEARCH_DEDUP_MS = 30 * 1000;
let lastSearch = { q: null, at: 0 };

/** Cung mot tu khoa trong 30 giay chi ghi 1 lan (tranh trung do re-render / tai lai URL). */
export const trackSearch = (query) => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return;
  const now = Date.now();
  if (q === lastSearch.q && now - lastSearch.at < SEARCH_DEDUP_MS) return;
  lastSearch = { q, at: now };
  track("search", { query: q });
};

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}
