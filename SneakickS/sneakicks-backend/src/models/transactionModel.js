import { query } from "../config/db.js";

/**
 * transactionModel — Week 5
 *
 * Mo rong them count + offset/limit cho paging + helper update status atomic.
 * Cac luong doi state (ship / verify / complete / rate) duoc thuc thi trong
 * controller voi withTransaction de log audit dong thoi.
 */

const TRANSACTION_DETAIL_SELECT = `
  SELECT t.*,
         p.name      AS product_name,
         p.brand     AS product_brand,
         p.image_url AS product_image,
         ub.username AS buyer_username,
         us.username AS seller_username,
         v.id        AS verification_id,
         v.result    AS verification_result,
         v.notes     AS verification_notes,
         v.verified_at,
         r.rating    AS rating_value,
         r.comment   AS rating_comment,
         r.created_at AS rated_at
  FROM transactions t
  LEFT JOIN products       p  ON p.id  = t.product_id
  LEFT JOIN users          ub ON ub.id = t.buyer_id
  LEFT JOIN users          us ON us.id = t.seller_id
  LEFT JOIN verifications  v  ON v.transaction_id = t.id
  LEFT JOIN seller_ratings r  ON r.transaction_id = t.id
`;

export const findById = async (id) => {
  const { rows } = await query(
    `${TRANSACTION_DETAIL_SELECT} WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const buildUserFilter = (role) => {
  if (role === "buyer") return { sql: "t.buyer_id = $1", values: [] };
  if (role === "seller") return { sql: "t.seller_id = $1", values: [] };
  return { sql: "(t.buyer_id = $1 OR t.seller_id = $1)", values: [] };
};

export const countByUser = async (userId, { role = "all", status } = {}) => {
  const filter = buildUserFilter(role);
  const params = [userId, ...filter.values];
  let sql = `SELECT COUNT(*)::int AS total FROM transactions t WHERE ${filter.sql}`;
  if (status) {
    params.push(status);
    sql += ` AND t.status = $${params.length}`;
  }
  const { rows } = await query(sql, params);
  return rows[0].total;
};

export const findByUserPaged = async (
  userId,
  { role = "all", status, limit = 20, offset = 0 } = {}
) => {
  const filter = buildUserFilter(role);
  const params = [userId, ...filter.values];
  let sql = `
      SELECT t.id, t.ask_id, t.bid_id, t.buyer_id, t.seller_id,
             t.product_id, t.size, t.price, t.status,
             t.created_at, t.updated_at,
             p.name      AS product_name,
             p.brand     AS product_brand,
             p.image_url AS product_image,
             ub.username AS buyer_username,
             us.username AS seller_username
      FROM transactions t
      LEFT JOIN products p ON p.id = t.product_id
      LEFT JOIN users ub   ON ub.id = t.buyer_id
      LEFT JOIN users us   ON us.id = t.seller_id
      WHERE ${filter.sql}
  `;
  if (status) {
    params.push(status);
    sql += ` AND t.status = $${params.length}`;
  }
  params.push(limit, offset);
  sql += ` ORDER BY t.created_at DESC, t.id DESC LIMIT $${
    params.length - 1
  } OFFSET $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
};

export const findByUser = async (userId, role = "all") => {
  return findByUserPaged(userId, { role, limit: 100, offset: 0 });
};

/**
 * updateStatus — UPDATE atomic kem tra audit log o controller.
 * Tra ve null neu khong match WHERE (sai status / khong ton tai).
 */
export const updateStatus = async (
  client,
  { id, expectedStatus, newStatus }
) => {
  const { rows } = await client.query(
    `UPDATE transactions
        SET status = $1, updated_at = NOW()
      WHERE id = $2 AND status = $3
      RETURNING id, ask_id, bid_id, buyer_id, seller_id, product_id,
                size, price, status, created_at, updated_at`,
    [newStatus, id, expectedStatus]
  );
  return rows[0] || null;
};

export const insertStatusLog = async (
  client,
  { transactionId, oldStatus, newStatus, changedBy = null, note = null }
) => {
  await client.query(
    `INSERT INTO order_status_logs
        (transaction_id, old_status, new_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [transactionId, oldStatus, newStatus, changedBy, note]
  );
};
