import { query } from "../config/db.js";

/**
 * ratingModel — Week 5
 *
 * Tuong tac voi bang `seller_ratings`.
 * UNIQUE(transaction_id) dam bao 1 transaction chi co 1 review.
 * Trust score = AVG(rating) cho moi seller.
 */

export const insert = async (
  client,
  { transactionId, buyerId, sellerId, rating, comment }
) => {
  const { rows } = await client.query(
    `INSERT INTO seller_ratings (transaction_id, buyer_id, seller_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, transaction_id, buyer_id, seller_id, rating, comment, created_at`,
    [transactionId, buyerId, sellerId, rating, comment || null]
  );
  return rows[0];
};

export const findByTransactionId = async (transactionId) => {
  const { rows } = await query(
    `SELECT id, transaction_id, buyer_id, seller_id, rating, comment, created_at
       FROM seller_ratings
      WHERE transaction_id = $1`,
    [transactionId]
  );
  return rows[0] || null;
};

export const countBySeller = async (sellerId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM seller_ratings WHERE seller_id = $1`,
    [sellerId]
  );
  return rows[0].total;
};

export const summaryBySeller = async (sellerId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int        AS total_ratings,
            COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating
       FROM seller_ratings
      WHERE seller_id = $1`,
    [sellerId]
  );
  return rows[0] || { total_ratings: 0, avg_rating: 0 };
};

export const listBySeller = async (sellerId, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT r.id, r.transaction_id, r.buyer_id, r.seller_id, r.rating, r.comment, r.created_at,
            ub.username AS buyer_username,
            p.name      AS product_name,
            p.brand     AS product_brand
       FROM seller_ratings r
       LEFT JOIN users ub        ON ub.id = r.buyer_id
       LEFT JOIN transactions t  ON t.id = r.transaction_id
       LEFT JOIN products p      ON p.id = t.product_id
      WHERE r.seller_id = $1
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );
  return rows;
};
