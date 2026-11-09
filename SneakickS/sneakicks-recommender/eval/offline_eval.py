"""
Danh gia offline cac baseline — chia theo thoi gian (temporal split).

  python -m eval.offline_eval                # du lieu SneakickS, test = 14 ngay cuoi, K = 10
  python -m eval.offline_eval --test-days 21 --k 20

Hai kich ban:
  A. "Mọi sản phẩm"  : sản phẩm đã tương tác trong tập train vẫn được tính (hành vi quay lại xem/mua).
  B. "Sản phẩm mới"  : loại sản phẩm đã tương tác trong train; chỉ đo khả năng gợi ý cái MỚI.

Relevant cua 1 user = cac san pham co tuong tac trong giai doan test voi trong so >= 1
(xem >= 3 giay, theo doi, dat Bid, mua). Do do binary, NDCG theo IT4613 L07.2.
"""
import argparse
import json
import math
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

from app.models import ContentModel, PopularityModel, RandomModel, RecentlyViewedModel, TrendingModel
from eval.datasets import load_sneakicks

REPORT_DIR = Path(__file__).resolve().parent.parent / "reports"


def temporal_split(inter: pd.DataFrame, test_days: int):
    cutoff = inter["ts"].max() - pd.Timedelta(days=test_days)
    return inter[inter["ts"] < cutoff], inter[inter["ts"] >= cutoff], cutoff


def user_metrics(recs: list[int], relevant: set[int], k: int) -> dict:
    hits = [1.0 if r in relevant else 0.0 for r in recs[:k]]
    dcg = sum(h / math.log2(i + 2) for i, h in enumerate(hits))
    idcg = sum(1.0 / math.log2(i + 2) for i in range(min(len(relevant), k)))
    return {
        "precision": sum(hits) / k,
        "recall": sum(hits) / len(relevant),
        "ndcg": dcg / idcg if idcg else 0.0,
        "hit": 1.0 if any(hits) else 0.0,
    }


def evaluate(model, users, relevant, seen, k, exclude_seen, n_items) -> dict:
    rows, shown = [], set()
    for u in users:
        ex = seen.get(u, set()) if exclude_seen else set()
        recs = [r.item for r in model.recommend(u, k=k, exclude=ex)]
        shown.update(recs)
        rows.append(user_metrics(recs, relevant[u], k))
    df = pd.DataFrame(rows)
    out = {m: float(df[m].mean()) for m in ("precision", "recall", "ndcg", "hit")}
    out["coverage"] = len(shown) / n_items
    return out


def build_models(train: pd.DataFrame, products: pd.DataFrame, cutoff):
    items = products["id"].to_numpy()
    return [
        ("Random", RandomModel(seed=7).fit(train, items)),
        ("Popularity", PopularityModel().fit(train, items)),
        ("Trending (half-life 7 ngày)", TrendingModel(7, 30).fit(train, items, cutoff)),
        ("Content-based (TF-IDF)", ContentModel().fit(train, products, cutoff)),
        ("Recently Viewed", RecentlyViewedModel().fit(train)),
    ]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test-days", type=int, default=14)
    ap.add_argument("--k", type=int, default=10)
    ap.add_argument("--min-train", type=int, default=3)
    args = ap.parse_args()
    k = args.k

    inter, products = load_sneakicks()
    train, test, cutoff = temporal_split(inter, args.test_days)

    registered = lambda df: df[df["user"].str.startswith("u")]
    train_counts = registered(train).groupby("user").size()
    seen = registered(train).groupby("user")["item"].apply(set).to_dict()
    test_pos = registered(test)[registered(test)["w"] >= 1.0]
    relevant_all = test_pos.groupby("user")["item"].apply(set).to_dict()
    eligible = [u for u in relevant_all if train_counts.get(u, 0) >= args.min_train]
    relevant_new = {u: relevant_all[u] - seen.get(u, set()) for u in eligible}
    eligible_new = [u for u in eligible if relevant_new[u]]

    n_items = len(products)
    n_users = inter.loc[inter["user"].str.startswith("u"), "user"].nunique()
    density = len(inter.drop_duplicates(["user", "item"])) / (inter["user"].nunique() * n_items)

    print(f"Dữ liệu: {len(inter):,} tương tác | {n_users:,} user đăng nhập | {n_items} sản phẩm | mật độ {density:.2%}")
    print(f"Mốc chia: {cutoff:%d/%m/%Y %H:%M} | train {len(train):,} | test {len(test):,}")
    print(f"User đánh giá: A = {len(eligible)} | B = {len(eligible_new)} (K = {k})\n")

    results = []
    for name, model in build_models(train, products, cutoff):
        a = evaluate(model, eligible, relevant_all, seen, k, False, n_items)
        b = None
        if not isinstance(model, RecentlyViewedModel):
            b = evaluate(model, eligible_new, relevant_new, seen, k, True, n_items)
        results.append({"model": name, "A": a, "B": b})

    def table(key: str, title: str) -> str:
        lines = [f"**{title}**", "",
                 f"| Mô hình | P@{k} | R@{k} | NDCG@{k} | HitRate@{k} | Coverage |",
                 "| :--- | ---: | ---: | ---: | ---: | ---: |"]
        for r in results:
            m = r[key]
            if m is None:
                lines.append(f"| {r['model']} | — | — | — | — | — |")
                continue
            lines.append(
                f"| {r['model']} | {m['precision']:.4f} | {m['recall']:.4f} | {m['ndcg']:.4f} "
                f"| {m['hit']:.4f} | {m['coverage']:.1%} |"
            )
        return "\n".join(lines)

    report = "\n\n".join([
        f"Dữ liệu: {len(inter):,} tương tác, {n_users:,} user đăng nhập, {n_items} sản phẩm, mật độ {density:.2%}. "
        f"Mốc chia {cutoff:%d/%m/%Y}, test = {args.test_days} ngày cuối; "
        f"{len(eligible)} user (kịch bản A), {len(eligible_new)} user (kịch bản B).",
        table("A", "Kịch bản A — mọi sản phẩm"),
        table("B", "Kịch bản B — chỉ sản phẩm mới"),
    ])
    print(report)

    REPORT_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d")
    (REPORT_DIR / f"offline_eval_{stamp}.md").write_text(report + "\n", encoding="utf-8")
    (REPORT_DIR / f"offline_eval_{stamp}.json").write_text(
        json.dumps({"k": k, "test_days": args.test_days, "cutoff": str(cutoff),
                    "users_A": len(eligible), "users_B": len(eligible_new), "results": results},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    np.seterr(all="ignore")
    main()
