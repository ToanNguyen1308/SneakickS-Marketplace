"""
Thong ke nhanh du lieu hanh vi (kiem tra bo mo phong persona co dung thiet ke khong).

  python -m eval.describe_data
"""
import psycopg

from app.config import db_params

SIM = "u.email LIKE '%@sim.sneakicks.local'"

QUERIES = {
    "Lượt xem theo persona và 3 thương hiệu xem nhiều nhất": f"""
        WITH v AS (
            SELECT split_part(u.username, '_', 2) AS persona, p.brand, COUNT(*) AS n
              FROM user_events e
              JOIN users u ON u.id = e.user_id
              JOIN products p ON p.id = e.product_id
             WHERE e.event_type = 'view' AND {SIM}
             GROUP BY 1, 2
        ), r AS (
            SELECT persona, brand, n, SUM(n) OVER (PARTITION BY persona) AS total,
                   ROW_NUMBER() OVER (PARTITION BY persona ORDER BY n DESC) AS rk
              FROM v
        )
        SELECT persona, MAX(total)::int AS views,
               STRING_AGG(brand || ' ' || ROUND(100.0 * n / total) || '%', ', ' ORDER BY rk) AS top_brands
          FROM r WHERE rk <= 3 GROUP BY persona ORDER BY persona
    """,
    "Chuyển đổi theo persona (số hành động trên 100 lượt xem)": f"""
        WITH persona AS (
            SELECT u.id, split_part(u.username, '_', 2) AS name FROM users u WHERE {SIM}
        ), counts AS (
            SELECT p.name,
                   COUNT(DISTINCT p.id) AS users,
                   (SELECT COUNT(*) FROM user_events e JOIN persona q ON q.id = e.user_id
                     WHERE q.name = p.name AND e.event_type = 'view') AS views,
                   (SELECT COUNT(*) FROM follows f JOIN persona q ON q.id = f.user_id WHERE q.name = p.name) AS follows,
                   (SELECT COUNT(*) FROM bids b JOIN persona q ON q.id = b.buyer_id WHERE q.name = p.name) AS bids,
                   (SELECT COUNT(*) FROM transactions t JOIN persona q ON q.id = t.buyer_id WHERE q.name = p.name) AS buys,
                   (SELECT COUNT(*) FROM asks a JOIN persona q ON q.id = a.seller_id WHERE q.name = p.name) AS asks
              FROM persona p GROUP BY p.name
        )
        SELECT name, users, views,
               ROUND(100.0 * follows / views, 2) AS follow,
               ROUND(100.0 * bids / views, 2) AS bid,
               ROUND(100.0 * buys / views, 2) AS buy,
               asks
          FROM counts ORDER BY name
    """,
    "Phân bố hoạt động": """
        WITH per_user AS (
            SELECT user_id, COUNT(*) AS n FROM user_events
             WHERE event_type = 'view' AND user_id IS NOT NULL GROUP BY user_id
        ), per_item AS (
            SELECT product_id, COUNT(*) AS n,
                   ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rk
              FROM user_events WHERE event_type = 'view' GROUP BY product_id
        )
        SELECT (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY n) FROM per_user)::int AS median_views_per_user,
               (SELECT MAX(n) FROM per_user)::int AS max_views_per_user,
               (SELECT COUNT(*) FROM per_item)::int AS products_viewed,
               (SELECT ROUND(100.0 * SUM(n) FILTER (WHERE rk <= 68) / SUM(n), 1) FROM per_item) AS top20pct_items_share,
               (SELECT ROUND(AVG(dwell_ms) / 1000.0, 1) FROM user_events WHERE event_type = 'view') AS avg_dwell_s,
               (SELECT ROUND(100.0 * AVG((dwell_ms < 3000)::int), 1) FROM user_events WHERE event_type = 'view') AS pct_under_3s
    """,
}


def main():
    with psycopg.connect(**db_params()) as conn, conn.cursor() as cur:
        for title, sql in QUERIES.items():
            cur.execute(sql)
            cols = [d.name for d in cur.description]
            print(f"\n{title}")
            print(" | ".join(cols))
            for row in cur.fetchall():
                print(" | ".join(str(x) for x in row))


if __name__ == "__main__":
    main()
