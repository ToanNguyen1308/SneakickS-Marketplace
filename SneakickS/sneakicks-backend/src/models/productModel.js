import { query } from "../config/db.js";
import { sizesFor } from "../utils/sizes.js";

const PRODUCT_COLUMNS = `
      p.id,
      p.name,
      p.brand,
      p.description,
      p.image_url        AS image,
      p.category_id,
      c.name             AS category,
      p.release_date,
      p.retail_price     AS price,
      p.sku,
      p.silhouette,
      p.colorway,
      p.colors,
      p.gender,
      p.size_type,
      p.tags,
      p.created_at,
      (
          SELECT MIN(price) FROM asks
          WHERE product_id = p.id AND status = 'active'
      )                  AS "lowestAsk",
      (
          SELECT MAX(price) FROM bids
          WHERE product_id = p.id AND status = 'active'
      )                  AS "highestBid",
      (
          SELECT t.price FROM transactions t
          WHERE t.product_id = p.id AND t.status <> 'cancelled'
          ORDER BY t.created_at DESC, t.id DESC LIMIT 1
      )                  AS "lastSale",
      (
          SELECT COUNT(*)::int FROM transactions t
          WHERE t.product_id = p.id AND t.status <> 'cancelled'
            AND t.created_at >= NOW() - INTERVAL '30 days'
      )                  AS "sales30d"
`;

const FROM_PRODUCTS = `
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

const SELECT_PRODUCT_BASE = `SELECT ${PRODUCT_COLUMNS} ${FROM_PRODUCTS}`;

const SORTS = {
  featured: `x.id ASC`,
  newest: `x.release_date DESC NULLS LAST, x.id DESC`,
  price_asc: `x."lowestAsk" ASC NULLS LAST, x.id ASC`,
  price_desc: `x."lowestAsk" DESC NULLS LAST, x.id ASC`,
  most_active: `x."sales30d" DESC, x.id ASC`,
};

export const SORT_KEYS = Object.keys(SORTS);

const buildFilter = ({ brand, category, search, silhouette, gender } = {}) => {
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

  if (silhouette) {
    params.push(silhouette);
    where.push(`LOWER(p.silhouette) = LOWER($${params.length})`);
  }

  if (gender) {
    params.push(gender);
    where.push(`p.gender = $${params.length}`);
  }

  // Moi tu khoa phai xuat hien o ten, brand, dong giay hoac phoi mau ("dunk panda" -> 2 tu).
  const tokens = (search || "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const token of tokens) {
    params.push(`%${token}%`);
    const n = params.length;
    where.push(
      `(LOWER(p.name) LIKE $${n} OR LOWER(p.brand) LIKE $${n}
        OR LOWER(COALESCE(p.silhouette, '')) LIKE $${n}
        OR LOWER(COALESCE(p.colorway, '')) LIKE $${n})`
    );
  }

  return { where, params };
};

const whereSql = (where) => (where.length ? ` WHERE ${where.join(" AND ")}` : "");

export const findAll = async (filters = {}) => {
  const { where, params } = buildFilter(filters);
  const { rows } = await query(
    SELECT_PRODUCT_BASE + whereSql(where) + ` ORDER BY p.id ASC`,
    params
  );
  return rows;
};

export const findAllPaged = async ({ sort = "featured", limit = 20, offset = 0, ...filters } = {}) => {
  const { where, params } = buildFilter(filters);
  params.push(limit, offset);
  const orderBy = SORTS[sort] || SORTS.featured;
  const sql = `
    SELECT * FROM (${SELECT_PRODUCT_BASE}${whereSql(where)}) x
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const { rows } = await query(sql, params);
  return rows;
};

export const countAll = async (filters = {}) => {
  const { where, params } = buildFilter(filters);
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total ${FROM_PRODUCTS}${whereSql(where)}`,
    params
  );
  return rows[0].total;
};

/**
 * Keyset (cursor) pagination — Week 6.
 * Lay limit+1 row de phat hien con trang sau hay khong (hasNext).
 * Dung `p.id > cursor` thay vi OFFSET -> khong phai scan & skip N row.
 */
export const findAllKeyset = async ({ limit = 20, cursor = null, ...filters } = {}) => {
  const { where, params } = buildFilter(filters);
  if (cursor) {
    params.push(cursor);
    where.push(`p.id > $${params.length}`);
  }
  params.push(limit + 1);
  const sql =
    SELECT_PRODUCT_BASE +
    whereSql(where) +
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
 * Thi truong theo tung size (size picker kieu StockX).
 * Moi size: Lowest Ask, Highest Bid, Last Sale, so lenh dang mo.
 */
export const marketBySize = async (productId, sizeType) => {
  const { rows: extra } = await query(
    `SELECT DISTINCT size FROM (
        SELECT size FROM asks WHERE product_id = $1 AND status = 'active'
        UNION SELECT size FROM bids WHERE product_id = $1 AND status = 'active'
     ) s`,
    [productId]
  );
  const base = sizesFor(sizeType);
  const sizes = [...base, ...extra.map((r) => r.size).filter((s) => !base.includes(s))];

  const { rows } = await query(
    `SELECT s.size,
            (SELECT MIN(price) FROM asks
              WHERE product_id = $1 AND size = s.size AND status = 'active') AS "lowestAsk",
            (SELECT MAX(price) FROM bids
              WHERE product_id = $1 AND size = s.size AND status = 'active') AS "highestBid",
            (SELECT COUNT(*)::int FROM asks
              WHERE product_id = $1 AND size = s.size AND status = 'active') AS "askCount",
            (SELECT COUNT(*)::int FROM bids
              WHERE product_id = $1 AND size = s.size AND status = 'active') AS "bidCount",
            (SELECT t.price FROM transactions t
              WHERE t.product_id = $1 AND t.size = s.size AND t.status <> 'cancelled'
              ORDER BY t.created_at DESC, t.id DESC LIMIT 1) AS "lastSale"
       FROM unnest($2::text[]) WITH ORDINALITY AS s(size, ord)
      ORDER BY s.ord`,
    [productId, sizes]
  );
  return rows;
};

/** Giao dich gan nhat (bang "Last Sales" tren trang chi tiet). */
export const recentSales = async (productId, limit = 10) => {
  const { rows } = await query(
    `SELECT id, size, price, created_at
       FROM transactions
      WHERE product_id = $1 AND status <> 'cancelled'
      ORDER BY created_at DESC, id DESC
      LIMIT $2`,
    [productId, limit]
  );
  return rows;
};

/** Gia tri cho bo loc trang Browse: brand va dong giay (silhouette) kem so san pham. */
export const listFacets = async () => {
  const [brands, silhouettes] = await Promise.all([
    query(
      `SELECT brand, COUNT(*)::int AS count
         FROM products GROUP BY brand ORDER BY count DESC, brand ASC`
    ),
    query(
      `SELECT brand, silhouette, COUNT(*)::int AS count
         FROM products WHERE silhouette IS NOT NULL
        GROUP BY brand, silhouette ORDER BY brand ASC, count DESC`
    ),
  ]);
  return { brands: brands.rows, silhouettes: silhouettes.rows };
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
