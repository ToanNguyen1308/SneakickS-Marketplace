"""Giu cac mo hinh da fit trong bo nho; tu nap lai du lieu khi qua REFRESH_SECONDS."""
import threading
import time
from datetime import datetime

import pandas as pd

from .config import REFRESH_SECONDS, TRENDING_HALF_LIFE_DAYS, TRENDING_WINDOW_DAYS
from .data import Snapshot, load_snapshot
from .models import ContentModel, PopularityModel, RecentlyViewedModel, TrendingModel


class ModelStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._fitted_at = 0.0
        self.snapshot: Snapshot | None = None

    def reload(self) -> None:
        snap = load_snapshot()
        now = pd.Timestamp(datetime.now())
        items = snap.products["id"].to_numpy()
        inter = snap.interactions
        self.popular = PopularityModel().fit(inter, items)
        self.trending = TrendingModel(TRENDING_HALF_LIFE_DAYS, TRENDING_WINDOW_DAYS).fit(inter, items, now)
        self.content = ContentModel().fit(inter, snap.products, now)
        self.recent = RecentlyViewedModel().fit(inter)
        self.owned = snap.open_asks.groupby("user")["item"].apply(set).to_dict()
        self.snapshot = snap
        self._fitted_at = time.time()

    def ensure_fresh(self) -> "ModelStore":
        if time.time() - self._fitted_at > REFRESH_SECONDS:
            with self._lock:
                if time.time() - self._fitted_at > REFRESH_SECONDS:
                    self.reload()
        return self

    def stats(self) -> dict:
        snap = self.snapshot
        if snap is None:
            return {}
        inter = snap.interactions
        return {
            "loaded_at": snap.loaded_at.isoformat(timespec="seconds"),
            "products": int(len(snap.products)),
            "users": int(inter["user"].nunique()),
            "interactions": int(len(inter)),
            "by_kind": {k: int(v) for k, v in inter["kind"].value_counts().items()},
        }
