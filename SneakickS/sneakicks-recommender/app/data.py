"""Doc catalog va phan hoi ngam dinh (implicit feedback) tu PostgreSQL cua SneakickS."""
from dataclasses import dataclass
from datetime import datetime

import pandas as pd
import psycopg

from .config import db_params

# Trong so tin hieu ngam dinh (chot o bao cao lan 1).
W_VIEW = 1.0
W_VIEW_SHORT = 0.3
W_FOLLOW = 3.0
W_BID = 4.0
W_BUY = 6.0
SHORT_DWELL_MS = 3000

PRODUCTS_SQL = """
SELECT p.id, p.name, p.brand, c.name AS category, p.silhouette, p.colorway, p.gender,
       p.tags, p.retail_price, p.size_type
  FROM products p JOIN categories c ON c.id = p.category_id
 ORDER BY p.id
"""

# user = 'u<id>' voi nguoi da dang nhap, 's<session_id>' voi khach.
INTERACTIONS_SQL = """
SELECT COALESCE('u' || e.user_id::text, 's' || e.session_id) AS "user",
       e.product_id AS item, e.created_at AS ts,
       CASE WHEN e.dwell_ms IS NOT NULL AND e.dwell_ms < %(short)s
            THEN %(w_short)s ELSE %(w_view)s END AS w,
       'view' AS kind
  FROM user_events e
 WHERE e.event_type = 'view' AND e.product_id IS NOT NULL
   AND (e.user_id IS NOT NULL OR e.session_id IS NOT NULL)
UNION ALL
SELECT 'u' || user_id::text, product_id, created_at, %(w_follow)s, 'follow' FROM follows
UNION ALL
SELECT 'u' || buyer_id::text, product_id, created_at, %(w_bid)s, 'bid' FROM bids
UNION ALL
SELECT 'u' || buyer_id::text, product_id, created_at, %(w_buy)s, 'buy'
  FROM transactions WHERE status <> 'cancelled'
"""

OPEN_ASKS_SQL = """
SELECT DISTINCT 'u' || seller_id::text AS "user", product_id AS item
  FROM asks WHERE status = 'active'
"""


@dataclass
class Snapshot:
    products: pd.DataFrame
    interactions: pd.DataFrame
    open_asks: pd.DataFrame
    loaded_at: datetime


def _frame(cur, sql: str, params: dict | None = None) -> pd.DataFrame:
    cur.execute(sql, params)
    cols = [d.name for d in cur.description]
    return pd.DataFrame(cur.fetchall(), columns=cols)


def load_snapshot() -> Snapshot:
    params = {
        "short": SHORT_DWELL_MS, "w_short": W_VIEW_SHORT, "w_view": W_VIEW,
        "w_follow": W_FOLLOW, "w_bid": W_BID, "w_buy": W_BUY,
    }
    with psycopg.connect(**db_params()) as conn, conn.cursor() as cur:
        products = _frame(cur, PRODUCTS_SQL)
        interactions = _frame(cur, INTERACTIONS_SQL, params)
        open_asks = _frame(cur, OPEN_ASKS_SQL)

    products["retail_price"] = products["retail_price"].astype(float)
    interactions["item"] = interactions["item"].astype(int)
    interactions["w"] = interactions["w"].astype(float)
    interactions["ts"] = pd.to_datetime(interactions["ts"])
    return Snapshot(products, interactions, open_asks, datetime.now())
