import { query } from "../config/db.js";

export const EVENT_TYPES = ["view", "search", "rec_click"];

/**
 * Chen 1 lo su kien. Su kien tham chieu san pham khong ton tai bi bo qua
 * (kiem tra EXISTS) thay vi lam hong ca lo.
 */
export const insertBatch = async ({ userId, sessionId, events }) => {
  if (!events.length) return 0;
  const values = [];
  const tuples = events.map((e, i) => {
    const b = i * 6;
    values.push(e.type, e.productId, e.query, e.dwellMs, e.source, e.recRequestId);
    return `($${b + 1}::varchar, $${b + 2}::int, $${b + 3}::varchar, $${b + 4}::int,
             $${b + 5}::varchar, $${b + 6}::varchar)`;
  });
  values.push(userId ?? null, sessionId ?? null);
  const u = values.length - 1;
  const s = values.length;

  const { rowCount } = await query(
    `INSERT INTO user_events
        (user_id, session_id, product_id, event_type, query, dwell_ms, source, rec_request_id)
     SELECT $${u}::int, $${s}::varchar, v.product_id, v.event_type, v.query, v.dwell_ms,
            v.source, v.rec_request_id
       FROM (VALUES ${tuples.join(", ")})
            AS v(event_type, product_id, query, dwell_ms, source, rec_request_id)
      WHERE v.product_id IS NULL
         OR EXISTS (SELECT 1 FROM products p WHERE p.id = v.product_id)`,
    values
  );
  return rowCount;
};

/** Gan lich su xem cua session khach vao tai khoan sau khi dang nhap. */
export const attachSessionToUser = async (sessionId, userId) => {
  await query(
    `UPDATE user_events SET user_id = $1 WHERE session_id = $2 AND user_id IS NULL`,
    [userId, sessionId]
  );
};
