import { query } from "../config/db.js";

export const findById = async (id) => {
  const { rows } = await query(
    `SELECT id, seller_id, product_id, size, price, status, created_at
     FROM asks WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const findByUser = async (userId, { status } = {}) => {
  const params = [userId];
  let sql = `
      SELECT a.id, a.seller_id, a.product_id, a.size, a.price, a.status, a.created_at,
             p.name AS product_name, p.brand, p.image_url AS product_image
      FROM asks a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.seller_id = $1
  `;
  if (status) {
    params.push(status);
    sql += ` AND a.status = $${params.length}`;
  }
  sql += ` ORDER BY a.created_at DESC, a.id DESC`;
  const { rows } = await query(sql, params);
  return rows;
};

export const findByUserPaged = async (
  userId,
  { status, limit = 20, offset = 0 } = {}
) => {
  const params = [userId];
  let sql = `
      SELECT a.id, a.seller_id, a.product_id, a.size, a.price, a.status, a.created_at,
             p.name AS product_name, p.brand, p.image_url AS product_image
      FROM asks a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.seller_id = $1
  `;
  if (status) {
    params.push(status);
    sql += ` AND a.status = $${params.length}`;
  }
  params.push(limit, offset);
  sql += ` ORDER BY a.created_at DESC, a.id DESC LIMIT $${
    params.length - 1
  } OFFSET $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
};

export const countByUser = async (userId, { status } = {}) => {
  const params = [userId];
  let sql = `SELECT COUNT(*)::int AS total FROM asks WHERE seller_id = $1`;
  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  const { rows } = await query(sql, params);
  return rows[0].total;
};

export const findActiveByProductSize = async (productId, size, { limit = 100 } = {}) => {
  const { rows } = await query(
    `SELECT id, seller_id, product_id, size, price, status, created_at
     FROM asks
     WHERE product_id = $1 AND size = $2 AND status = 'active'
     ORDER BY price ASC, created_at ASC, id ASC
     LIMIT $3`,
    [productId, size, limit]
  );
  return rows;
};

export const cancel = async (id, sellerId) => {
  const { rows } = await query(
    `UPDATE asks
     SET status = 'cancelled'
     WHERE id = $1 AND seller_id = $2 AND status = 'active'
     RETURNING id, seller_id, product_id, size, price, status, created_at`,
    [id, sellerId]
  );
  return rows[0] || null;
};
