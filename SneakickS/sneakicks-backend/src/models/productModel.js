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

const buildFilter = ({ brand, category, search } = {}) => {
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

  return { where, params };
};

export const findAll = async ({ brand, category, search } = {}) => {
  const { where, params } = buildFilter({ brand, category, search });
  const sql =
    SELECT_PRODUCT_BASE +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY p.id ASC`;
  const { rows } = await query(sql, params);
  return rows;
};

export const findAllPaged = async ({
  brand,
  category,
  search,
  limit = 20,
  offset = 0,
} = {}) => {
  const { where, params } = buildFilter({ brand, category, search });
  params.push(limit, offset);
  const sql =
    SELECT_PRODUCT_BASE +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY p.id ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
};

export const countAll = async ({ brand, category, search } = {}) => {
  const { where, params } = buildFilter({ brand, category, search });
  const sql = `
    SELECT COUNT(*)::int AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where.length ? ` WHERE ${where.join(" AND ")}` : ""}
  `;
  const { rows } = await query(sql, params);
  return rows[0].total;
};

/**
 * Keyset (cursor) pagination — Week 6.
 * Lay limit+1 row de phat hien con trang sau hay khong (hasNext).
 * Dung `p.id > cursor` thay vi OFFSET -> khong phai scan & skip N row.
 */
export const findAllKeyset = async ({
  brand,
  category,
  search,
  limit = 20,
  cursor = null,
} = {}) => {
  const { where, params } = buildFilter({ brand, category, search });
  if (cursor) {
    params.push(cursor);
    where.push(`p.id > $${params.length}`);
  }
  params.push(limit + 1);
  const sql =
    SELECT_PRODUCT_BASE +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY p.id ASC LIMIT $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
};

export const findById = async (id) => {
  const { rows } = await query(SELECT_PRODUCT_BASE + ` WHERE p.id = $1`, [id]);
  return rows[0] || null;
};

/**
 * Lay nhanh lowestAsk / highestBid hien tai (dung cho WebSocket push).
 */
export const getTopOfBook = async (productId) => {
  const { rows } = await query(
    `SELECT
        (SELECT MIN(price) FROM asks WHERE product_id = $1 AND status = 'active') AS "lowestAsk",
        (SELECT MAX(price) FROM bids WHERE product_id = $1 AND status = 'active') AS "highestBid"`,
    [productId]
  );
  return rows[0] || { lowestAsk: null, highestBid: null };
};

/**
 * Lich su gia giao dich theo ngay trong `days` ngay gan nhat (cho Charts).
 * Gom nhom theo ngay, tinh avg/min/max + so luong giao dich.
 * Loai cac transaction da huy (`cancelled`) vi do khong phai gia khop that.
 */
export const priceHistory = async (productId, days = 30) => {
  const { rows } = await query(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(*)::int                  AS trades,
            ROUND(AVG(price)::numeric, 2)  AS avg_price,
            MIN(price)                     AS min_price,
            MAX(price)                     AS max_price
       FROM transactions
      WHERE product_id = $1
        AND status <> 'cancelled'
        AND created_at >= NOW() - ($2 || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC`,
    [productId, days]
  );
  return rows;
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
