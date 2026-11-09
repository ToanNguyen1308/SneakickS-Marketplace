import { query } from "../config/db.js";

/**
 * Du phong khi dich vu goi y (Python) khong phan hoi — cung cong thuc Trending
 * (trong so tin hieu x 0.5^(tuoi/7 ngay), cua so 30 ngay) nhung tinh bang SQL.
 * San pham chua co tuong tac xep sau theo ngay phat hanh.
 */
export const trendingFallback = async (limit, exclude = []) => {
  const { rows } = await query(
    `WITH ev AS (
        SELECT product_id, created_at,
               CASE WHEN dwell_ms IS NOT NULL AND dwell_ms < 3000 THEN 0.3 ELSE 1 END AS w
          FROM user_events
         WHERE event_type = 'view' AND product_id IS NOT NULL
           AND created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT product_id, created_at, 3 FROM follows WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT product_id, created_at, 4 FROM bids WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT product_id, created_at, 6 FROM transactions
         WHERE status <> 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'
     ), scored AS (
        SELECT product_id,
               SUM(w * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - created_at)) / 604800.0)) AS score
          FROM ev GROUP BY product_id
     )
     SELECT p.id AS product_id, COALESCE(s.score, 0)::float AS score
       FROM products p LEFT JOIN scored s ON s.product_id = p.id
      WHERE NOT (p.id = ANY($2::int[]))
      ORDER BY score DESC, p.release_date DESC NULLS LAST, p.id ASC
      LIMIT $1`,
    [limit, exclude]
  );
  return rows.map((r) => ({ product_id: r.product_id, score: r.score, reason: "Trending now" }));
};

/** Du phong cho "Similar products": cung dong giay > cung brand > cung danh muc, gia gan nhau. */
export const similarFallback = async (productId, limit) => {
  const { rows } = await query(
    `SELECT p.id AS product_id,
            CASE WHEN p.silhouette = b.silhouette THEN 3
                 WHEN p.brand = b.brand THEN 2
                 WHEN p.category_id = b.category_id THEN 1 ELSE 0 END AS score,
            CASE WHEN p.silhouette = b.silhouette THEN 'Same silhouette · ' || b.silhouette
                 WHEN p.brand = b.brand THEN 'More from ' || b.brand
                 ELSE 'Similar style' END AS reason
       FROM products p, products b
      WHERE b.id = $1 AND p.id <> b.id
      ORDER BY score DESC, ABS(COALESCE(p.retail_price, 0) - COALESCE(b.retail_price, 0)) ASC, p.id ASC
      LIMIT $2`,
    [productId, limit]
  );
  return rows;
};

/**
 * Recently Viewed doc truc tiep tu user_events (can du lieu moi nhat, khong qua cache cua mo hinh).
 * Nguoi da dang nhap: theo user_id; khach: theo session_id.
 */
export const recentlyViewed = async ({ userId, sessionId, limit, exclude = [] }) => {
  const { rows } = await query(
    `SELECT product_id, MAX(created_at) AS last_seen, MAX(id) AS last_id
       FROM user_events
      WHERE event_type = 'view' AND product_id IS NOT NULL
        AND (($1::int IS NOT NULL AND user_id = $1)
             OR ($2::varchar IS NOT NULL AND user_id IS NULL AND session_id = $2))
        AND NOT (product_id = ANY($4::int[]))
      GROUP BY product_id
      ORDER BY last_seen DESC, last_id DESC
      LIMIT $3`,
    [userId ?? null, sessionId ?? null, limit, exclude]
  );
  return rows.map((r) => ({ product_id: r.product_id, score: null, reason: "Recently viewed" }));
};
