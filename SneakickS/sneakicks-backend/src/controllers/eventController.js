import * as eventModel from "../models/eventModel.js";

const MAX_BATCH = 50;
const MAX_DWELL_MS = 30 * 60 * 1000;

const normalizeEvent = (raw) => {
  if (!raw || !eventModel.EVENT_TYPES.includes(raw.type)) return null;
  const productId = raw.product_id == null ? null : Number(raw.product_id);
  if (productId !== null && (!Number.isInteger(productId) || productId <= 0)) return null;
  if (raw.type !== "search" && productId === null) return null;

  let dwellMs = raw.dwell_ms == null ? null : Math.round(Number(raw.dwell_ms));
  if (!Number.isFinite(dwellMs) || dwellMs < 0) dwellMs = null;
  else dwellMs = Math.min(dwellMs, MAX_DWELL_MS);

  const q = typeof raw.query === "string" ? raw.query.trim().slice(0, 200) : null;
  if (raw.type === "search" && !q) return null;

  return {
    type: raw.type,
    productId,
    query: q,
    dwellMs,
    source: typeof raw.source === "string" ? raw.source.slice(0, 40) : null,
    recRequestId:
      typeof raw.rec_request_id === "string" ? raw.rec_request_id.slice(0, 64) : null,
  };
};

/**
 * POST /api/events — nhan 1 lo su kien hanh vi (implicit feedback).
 * Body: { session_id, events: [{ type, product_id, dwell_ms, source, query, rec_request_id }] }
 */
export const ingestEvents = async (req, res) => {
  const { session_id: sessionIdRaw, events } = req.body || {};
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ success: false, message: "events[] is required" });
  }
  if (events.length > MAX_BATCH) {
    return res
      .status(400)
      .json({ success: false, message: `At most ${MAX_BATCH} events per batch` });
  }

  const sessionId =
    typeof sessionIdRaw === "string" && sessionIdRaw.length <= 64 ? sessionIdRaw : null;
  const userId = req.user?.id ?? null;
  if (!userId && !sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "session_id is required for guests" });
  }

  const normalized = events.map(normalizeEvent).filter(Boolean);
  const inserted = await eventModel.insertBatch({ userId, sessionId, events: normalized });

  if (userId && sessionId) await eventModel.attachSessionToUser(sessionId, userId);

  res.status(202).json({
    success: true,
    accepted: inserted,
    rejected: events.length - inserted,
  });
};
