"""
Cac baseline goi y — GR2 lan 3 (chua co loc cong tac / AI, de lan 4).

  RandomModel          : ngau nhien (moc duoi khi danh gia)
  PopularityModel      : tong trong so tuong tac toan thoi gian
  TrendingModel        : tong trong so co giam dan theo thoi gian (half-life)
  ContentModel         : TF-IDF tren thuoc tinh san pham + cosine kNN; ho so user = trung binh
                         co trong so cac san pham da tuong tac (IT4613 L04)
  RecentlyViewedModel  : cac san pham xem gan nhat
"""
import math
import re
import zlib
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

DAY = pd.Timedelta(days=1)


@dataclass
class Rec:
    item: int
    score: float
    reason: str


def _top_k(items: np.ndarray, scores: np.ndarray, k: int, exclude, reason) -> list[Rec]:
    out: list[Rec] = []
    for idx in np.argsort(-scores, kind="stable"):
        item = int(items[idx])
        if item in exclude:
            continue
        out.append(Rec(item, float(scores[idx]), reason(idx) if callable(reason) else reason))
        if len(out) == k:
            break
    return out


class RandomModel:
    name = "random"

    def __init__(self, seed: int = 42):
        self.seed = seed

    def fit(self, interactions: pd.DataFrame, items: np.ndarray, now=None):
        self.items = np.asarray(items)
        return self

    def recommend(self, user=None, k=10, exclude=()):
        rng = np.random.default_rng([self.seed, zlib.crc32(str(user).encode())])
        return _top_k(self.items, rng.random(len(self.items)), k, set(exclude), "Random")


class PopularityModel:
    name = "popular"

    def fit(self, interactions: pd.DataFrame, items: np.ndarray, now=None):
        self.items = np.asarray(items)
        totals = interactions.groupby("item")["w"].sum()
        self.scores = totals.reindex(self.items, fill_value=0.0).to_numpy(float)
        return self

    def recommend(self, user=None, k=10, exclude=()):
        return _top_k(self.items, self.scores, k, set(exclude), "Most popular")


class TrendingModel:
    name = "trending"

    def __init__(self, half_life_days: float = 7.0, window_days: float = 30.0):
        self.half_life = half_life_days
        self.window = window_days

    def fit(self, interactions: pd.DataFrame, items: np.ndarray, now=None):
        self.items = np.asarray(items)
        now = pd.Timestamp(now) if now is not None else interactions["ts"].max()
        age = (now - interactions["ts"]) / DAY
        recent = interactions[(age >= 0) & (age <= self.window)]
        decay = np.power(0.5, age[recent.index] / self.half_life)
        totals = (recent["w"] * decay).groupby(recent["item"]).sum()
        self.scores = totals.reindex(self.items, fill_value=0.0).to_numpy(float)
        return self

    def recommend(self, user=None, k=10, exclude=()):
        return _top_k(self.items, self.scores, k, set(exclude), "Trending now")


def _slug(text) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(text or "").lower()).strip("_")


def product_document(p) -> str:
    """Bieu dien 1 san pham thanh chuoi token cho TF-IDF."""
    band = int(math.log2(max(float(p.retail_price or 25), 25) / 25))
    tokens = [
        f"brand_{_slug(p.brand)}", f"brand_{_slug(p.brand)}",
        f"sil_{_slug(p.silhouette)}", f"sil_{_slug(p.silhouette)}",
        f"cat_{_slug(p.category)}", f"gender_{p.gender}",
        f"color_{_slug(p.colorway)}", f"price_{band}",
    ]
    words = re.findall(r"[a-z0-9]+", f"{p.name} {p.tags or ''}".lower())
    return " ".join(tokens + words)


class ContentModel:
    name = "content"

    def __init__(self, profile_half_life_days: float = 30.0):
        self.profile_half_life = profile_half_life_days

    def fit(self, interactions: pd.DataFrame, products: pd.DataFrame, now=None):
        self.products = products.reset_index(drop=True)
        self.items = self.products["id"].to_numpy()
        self.index = {int(i): n for n, i in enumerate(self.items)}
        vec = TfidfVectorizer(token_pattern=r"[^ ]+", sublinear_tf=True)
        self.X = vec.fit_transform(self.products.apply(product_document, axis=1))
        self.sim = (self.X @ self.X.T).toarray()
        np.fill_diagonal(self.sim, 0.0)

        now = pd.Timestamp(now) if now is not None else interactions["ts"].max()
        inter = interactions[interactions["item"].isin(self.index)].copy()
        inter["dw"] = inter["w"] * np.power(0.5, ((now - inter["ts"]) / DAY).clip(lower=0) / self.profile_half_life)
        per_item = inter.groupby(["user", "item"])["dw"].sum().reset_index()
        per_item["row"] = per_item["item"].map(self.index)
        self.history = {
            u: (g["row"].to_numpy(), g["dw"].to_numpy(float))
            for u, g in per_item.groupby("user", sort=False)
        }
        return self

    def _reason_similar(self, base: int, other: int) -> str:
        a, b = self.products.iloc[base], self.products.iloc[other]
        if a.silhouette == b.silhouette:
            return f"Same silhouette · {a.silhouette}"
        if a.brand == b.brand:
            return f"More from {a.brand}"
        return "Similar style"

    def similar(self, item_id: int, k=10, exclude=()) -> list[Rec]:
        base = self.index.get(int(item_id))
        if base is None:
            return []
        ex = set(exclude) | {int(item_id)}
        return _top_k(self.items, self.sim[base], k, ex, lambda idx: self._reason_similar(base, idx))

    def recommend(self, user, k=10, exclude=()) -> list[Rec]:
        if user not in self.history:
            return []
        rows, weights = self.history[user]
        scores = self.sim[:, rows] @ weights

        def reason(idx):
            j = rows[int(np.argmax(self.sim[idx, rows] * weights))]
            return f"Because you viewed {self.products.iloc[j]['name']}"

        return _top_k(self.items, scores, k, set(exclude), reason)


class RecentlyViewedModel:
    name = "recent"

    def fit(self, interactions: pd.DataFrame, items=None, now=None):
        views = interactions[interactions["kind"] == "view"].sort_values("ts", ascending=False)
        views = views.drop_duplicates(["user", "item"])
        self.by_user = {u: g["item"].tolist() for u, g in views.groupby("user", sort=False)}
        return self

    def recommend(self, user, k=10, exclude=()) -> list[Rec]:
        ex = set(exclude)
        seq = [i for i in self.by_user.get(user, []) if i not in ex][:k]
        return [Rec(int(i), float(len(seq) - n), "Recently viewed") for n, i in enumerate(seq)]
