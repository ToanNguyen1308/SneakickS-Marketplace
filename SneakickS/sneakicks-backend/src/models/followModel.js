import { query } from "../config/db.js";

/**
 * followModel — Week 6 (Wishlist / Follow)
 *
 * Bang `follows` da co san trong schema (UNIQUE(user_id, product_id)).
 * Tuan 6 bo sung CRUD + helper kiem tra trang thai follow.
 */

/**
 * Follow idempotent: neu da follow truoc do -> ON CONFLICT DO NOTHING -> tra ve null.
 * Nho UNIQUE(user_id, product_id) o tang DB, khong the tao 2 ban ghi follow trung.
 */
export const create = async (userId, productId) => {
  const { rows } = await query(
    `INSERT INTO follows (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING
     RETURNING id, user_id, product_id, created_at`,
    [userId, productId]
  );
  return rows[0] || null;
};

export const remove = async (userId, productId) => {
  const { rows } = await query(
    `DELETE FROM follows
      WHERE user_id = $1 AND product_id = $2
      RETURNING id`,
    [userId, productId]
  );
  return rows[0] || null;
};

/**
 * Lay danh sach user_id dang follow 1 san pham (dung de gui notification).
 */
export const listFollowersByProduct = async (productId) => {
  const { rows } = await query(
    `SELECT user_id FROM follows WHERE product_id = $1`,
    [productId]
  );
  return rows.map((r) => r.user_id);
};

export const isFollowing = async (userId, productId) => {
  const { rows } = await query(
    `SELECT 1 FROM follows WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return rows.length > 0;
};

export const countByUser = async (userId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM follows WHERE user_id = $1`,
    [userId]
  );
  return rows[0].total;
};

/**
 * Danh sach san pham user dang follow (kem lowestAsk / highestBid de hien UI giong ProductCard).
 */
export const findByUserPaged = async (userId, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT
        f.id           AS follow_id,
        f.created_at   AS followed_at,
        p.id,
        p.name,
        p.brand,
        p.description,
        p.image_url    AS image,
        p.category_id,
        c.name         AS category,
        p.retail_price AS price,
        p.colors,
        p.silhouette,
        (
            SELECT MIN(price) FROM asks
            WHERE product_id = p.id AND status = 'active'
        )              AS "lowestAsk",
        (
            SELECT MAX(price) FROM bids
            WHERE product_id = p.id AND status = 'active'
        )              AS "highestBid"
     FROM follows f
     JOIN products p        ON p.id = f.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC, f.id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
};
