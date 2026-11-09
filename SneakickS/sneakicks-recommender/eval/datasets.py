"""
Nguon du lieu cho danh gia offline. Moi loader tra ve DataFrame chung:
    user (str), item (int), ts (datetime64), w (float), kind (str)

- sneakicks   : du lieu tren DB (mo phong persona + nguoi dung that).
- retailrocket: file events.csv tai tu Kaggle (dat vao data/retailrocket/), dung tu lan 4.
"""
from pathlib import Path

import pandas as pd

from app.data import W_BID, W_BUY, W_VIEW, load_snapshot

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_sneakicks():
    snap = load_snapshot()
    return snap.interactions, snap.products


def load_retailrocket(path: Path | None = None):
    path = path or DATA_DIR / "retailrocket" / "events.csv"
    if not path.exists():
        raise FileNotFoundError(f"Missing {path} — download events.csv from Kaggle RetailRocket.")
    df = pd.read_csv(path)
    weights = {"view": W_VIEW, "addtocart": W_BID, "transaction": W_BUY}
    kinds = {"view": "view", "addtocart": "bid", "transaction": "buy"}
    out = pd.DataFrame({
        "user": "u" + df["visitorid"].astype(str),
        "item": df["itemid"].astype(int),
        "ts": pd.to_datetime(df["timestamp"], unit="ms"),
        "w": df["event"].map(weights).astype(float),
        "kind": df["event"].map(kinds),
    })
    return out, None
