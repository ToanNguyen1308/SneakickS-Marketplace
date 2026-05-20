import { query } from "../config/db.js";

/**
 * verificationModel — Week 5
 *
 * Tuong tac voi bang `verifications` (1-1 voi transactions).
 * Moi transaction o trang thai shipped_to_verify se co 1 row verifications
 * voi result='pending', sau khi admin pass/fail thi update result va verified_at.
 */

export const findByTransactionId = async (transactionId, client = null) => {
  const runner = client || { query };
  const { rows } = await runner.query(
    `SELECT id, transaction_id, admin_id, result, notes, verified_at
       FROM verifications
      WHERE transaction_id = $1`,
    [transactionId]
  );
  return rows[0] || null;
};

export const insertPending = async (client, { transactionId, adminId = null }) => {
  const { rows } = await client.query(
    `INSERT INTO verifications (transaction_id, admin_id, result)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (transaction_id) DO UPDATE
        SET admin_id = EXCLUDED.admin_id,
            result   = 'pending',
            notes    = NULL,
            verified_at = NULL
     RETURNING id, transaction_id, admin_id, result, notes, verified_at`,
    [transactionId, adminId]
  );
  return rows[0];
};

export const setStarted = async (client, { transactionId, adminId }) => {
  const { rows } = await client.query(
    `UPDATE verifications
        SET admin_id = $1
      WHERE transaction_id = $2 AND result = 'pending'
      RETURNING id, transaction_id, admin_id, result, notes, verified_at`,
    [adminId, transactionId]
  );
  return rows[0] || null;
};

export const setResult = async (
  client,
  { transactionId, adminId, result, notes }
) => {
  const { rows } = await client.query(
    `UPDATE verifications
        SET admin_id    = $1,
            result      = $2,
            notes       = $3,
            verified_at = NOW()
      WHERE transaction_id = $4
      RETURNING id, transaction_id, admin_id, result, notes, verified_at`,
    [adminId, result, notes || null, transactionId]
  );
  return rows[0] || null;
};

export const listByResult = async ({ result = "pending", limit = 50, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT v.id, v.transaction_id, v.admin_id, v.result, v.notes, v.verified_at,
            t.buyer_id, t.seller_id, t.product_id, t.size, t.price, t.status,
            t.created_at AS transaction_created_at,
            p.name      AS product_name,
            p.brand     AS product_brand,
            p.image_url AS product_image,
            ub.username AS buyer_username,
            us.username AS seller_username
       FROM verifications v
       JOIN transactions t  ON t.id = v.transaction_id
       LEFT JOIN products p  ON p.id = t.product_id
       LEFT JOIN users ub    ON ub.id = t.buyer_id
       LEFT JOIN users us    ON us.id = t.seller_id
      WHERE v.result = $1
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT $2 OFFSET $3`,
    [result, limit, offset]
  );
  return rows;
};

export const countByResult = async (result = "pending") => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM verifications WHERE result = $1`,
    [result]
  );
  return rows[0].total;
};
