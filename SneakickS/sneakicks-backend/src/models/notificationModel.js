import { query } from "../config/db.js";

/**
 * notificationModel — Week 7
 * Luu + truy van thong bao cho tung user (vd: san pham dang follow co Ask moi).
 */

export const create = async (client, { userId, type = "info", productId = null, message }) => {
  const runner = client || { query };
  const { rows } = await runner.query(
    `INSERT INTO notifications (user_id, type, product_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, type, product_id, message, is_read, created_at`,
    [userId, type, productId, message]
  );
  return rows[0];
};

export const listByUser = async (userId, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT id, user_id, type, product_id, message, is_read, created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
};

export const countByUser = async (userId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1`,
    [userId]
  );
  return rows[0].total;
};

export const countUnread = async (userId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS unread
       FROM notifications
      WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return rows[0].unread;
};

export const markRead = async (id, userId) => {
  const { rows } = await query(
    `UPDATE notifications
        SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [id, userId]
  );
  return rows[0] || null;
};

export const markAllRead = async (userId) => {
  const { rowCount } = await query(
    `UPDATE notifications SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return rowCount;
};
