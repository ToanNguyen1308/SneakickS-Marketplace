import { query } from "../config/db.js";

const SELECT_PRODUCT_BASE = `
  SELECT
      p.id,
      p.name,
      p.brand,
      p.description,
      p.image_url        AS image,
      p.category_id,
      c.name             AS category,
      p.release_date,
      p.retail_price     AS price,
      p.created_at,
      (
          SELECT MIN(price) FROM asks
          WHERE product_id = p.id AND status = 'active'
      )                  AS "lowestAsk",
      (
          SELECT MAX(price) FROM bids
          WHERE product_id = p.id AND status = 'active'
      )                  AS "highestBid"
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export const findAll = async ({ brand, category, search } = {}) => {
  const where = [];
  const params = [];

  if (brand) {
    params.push(brand);
    where.push(`LOWER(p.brand) = LOWER($${params.length})`);
  }

  if (category) {
    params.push(category);
    where.push(`LOWER(c.name) = LOWER($${params.length})`);
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(p.name) LIKE $${params.length} OR LOWER(p.brand) LIKE $${params.length})`
    );
  }

  const sql =
    SELECT_PRODUCT_BASE +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY p.id ASC`;

  const { rows } = await query(sql, params);
  return rows;
};

export const findById = async (id) => {
  const { rows } = await query(SELECT_PRODUCT_BASE + ` WHERE p.id = $1`, [id]);
  return rows[0] || null;
};

export const findByCategory = async (categoryId) => {
  const { rows } = await query(
    SELECT_PRODUCT_BASE + ` WHERE p.category_id = $1 ORDER BY p.id ASC`,
    [categoryId]
  );
  return rows;
};

export const exists = async (id) => {
  const { rows } = await query(`SELECT 1 FROM products WHERE id = $1`, [id]);
  return rows.length > 0;
};
