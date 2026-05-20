import { query } from "../config/db.js";

export const findById = async (id) => {
  const { rows } = await query(
    `SELECT id, buyer_id, product_id, size, price, status, created_at
     FROM bids WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const findByUser = async (userId, { status } = {}) => {
  const params = [userId];
  let sql = `
      SELECT b.id, b.buyer_id, b.product_id, b.size, b.price, b.status, b.created_at,
             p.name AS product_name, p.brand, p.image_url AS product_image
      FROM bids b
      LEFT JOIN products p ON p.id = b.product_id
      WHERE b.buyer_id = $1
  `;
  if (status) {
    params.push(status);
    sql += ` AND b.status = $${params.length}`;
  }
  sql += ` ORDER BY b.created_at DESC, b.id DESC`;
  const { rows } = await query(sql, params);
  return rows;
};

export const findByUserPaged = async (
  userId,
  { status, limit = 20, offset = 0 } = {}
) => {
  const params = [userId];
  let sql = `
      SELECT b.id, b.buyer_id, b.product_id, b.size, b.price, b.status, b.created_at,
             p.name AS product_name, p.brand, p.image_url AS product_image
      FROM bids b
      LEFT JOIN products p ON p.id = b.product_id
      WHERE b.buyer_id = $1
  `;
  if (status) {
    params.push(status);
    sql += ` AND b.status = $${params.length}`;
  }
  params.push(limit, offset);
  sql += ` ORDER BY b.created_at DESC, b.id DESC LIMIT $${
    params.length - 1
  } OFFSET $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
};

export const countByUser = async (userId, { status } = {}) => {
  const params = [userId];
  let sql = `SELECT COUNT(*)::int AS total FROM bids WHERE buyer_id = $1`;
  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  const { rows } = await query(sql, params);
  return rows[0].total;
};

export const findActiveByProductSize = async (productId, size, { limit = 100 } = {}) => {
  const { rows } = await query(
    `SELECT id, buyer_id, product_id, size, price, status, created_at
     FROM bids
     WHERE product_id = $1 AND size = $2 AND status = 'active'
     ORDER BY price DESC, created_at ASC, id ASC
     LIMIT $3`,
    [productId, size, limit]
  );
  return rows;
};

export const cancel = async (id, buyerId) => {
  const { rows } = await query(
    `UPDATE bids
     SET status = 'cancelled'
     WHERE id = $1 AND buyer_id = $2 AND status = 'active'
     RETURNING id, buyer_id, product_id, size, price, status, created_at`,
    [id, buyerId]
  );
  return rows[0] || null;
};
