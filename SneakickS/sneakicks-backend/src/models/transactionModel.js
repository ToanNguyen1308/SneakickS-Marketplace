import { query } from "../config/db.js";

export const findById = async (id) => {
  const { rows } = await query(
    `SELECT t.*,
            p.name  AS product_name,
            p.brand AS product_brand,
            ub.username AS buyer_username,
            us.username AS seller_username
     FROM transactions t
     LEFT JOIN products p ON p.id = t.product_id
     LEFT JOIN users ub   ON ub.id = t.buyer_id
     LEFT JOIN users us   ON us.id = t.seller_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const findByUser = async (userId, role = "all") => {
  let where = "";
  const params = [userId];
  if (role === "buyer") where = "WHERE t.buyer_id = $1";
  else if (role === "seller") where = "WHERE t.seller_id = $1";
  else where = "WHERE t.buyer_id = $1 OR t.seller_id = $1";

  const { rows } = await query(
    `SELECT t.*,
            p.name AS product_name,
            p.brand,
            p.image_url AS product_image
     FROM transactions t
     LEFT JOIN products p ON p.id = t.product_id
     ${where}
     ORDER BY t.created_at DESC, t.id DESC`,
    params
  );
  return rows;
};
