"""
SneakickS Recommender — microservice FastAPI (GR2 lan 3).

Chay:  .venv\\Scripts\\python -m uvicorn app.main:app --port 8000
Backend Node goi sang qua HTTP; neu dich vu tat, Node tu dung truy van SQL du phong.
"""
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, Query

from .models import Rec
from .service import ModelStore

store = ModelStore()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    store.reload()
    yield


app = FastAPI(title="SneakickS Recommender", version="0.1.0", lifespan=lifespan)


def _payload(model: str, recs: list[Rec], **extra) -> dict:
    return {
        "model": model,
        "version": store.snapshot.loaded_at.isoformat(timespec="seconds"),
        **extra,
        "items": [{"product_id": r.item, "score": round(r.score, 4), "reason": r.reason} for r in recs],
    }


def _exclude(raw: str | None) -> set[int]:
    return {int(x) for x in (raw or "").split(",") if x.strip().isdigit()}


@app.get("/")
def root():
    return {
        "message": "SneakickS Recommender is running",
        "docs": "/docs",
        "endpoints": [
            "GET  /health",
            "GET  /recommend/trending?k=12",
            "GET  /recommend/popular?k=12",
            "GET  /recommend/similar/{product_id}?k=8",
            "GET  /recommend/user?user_id=&session_id=&strategy=content|recent|trending|popular",
            "POST /admin/reload",
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", **store.ensure_fresh().stats()}


@app.post("/admin/reload")
def reload():
    store.reload()
    return {"status": "reloaded", **store.stats()}


@app.get("/recommend/trending")
def trending(k: int = Query(12, ge=1, le=100), exclude: str | None = None):
    s = store.ensure_fresh()
    return _payload("trending", s.trending.recommend(k=k, exclude=_exclude(exclude)))


@app.get("/recommend/popular")
def popular(k: int = Query(12, ge=1, le=100), exclude: str | None = None):
    s = store.ensure_fresh()
    return _payload("popular", s.popular.recommend(k=k, exclude=_exclude(exclude)))


@app.get("/recommend/similar/{product_id}")
def similar(product_id: int, k: int = Query(8, ge=1, le=50), exclude: str | None = None):
    s = store.ensure_fresh()
    if product_id not in s.content.index:
        raise HTTPException(status_code=404, detail="Unknown product")
    return _payload("content", s.content.similar(product_id, k=k, exclude=_exclude(exclude)))


@app.get("/recommend/user")
def for_user(
    user_id: int | None = None,
    session_id: str | None = None,
    k: int = Query(12, ge=1, le=100),
    strategy: Literal["content", "recent", "trending", "popular"] = "content",
    exclude: str | None = None,
):
    if user_id is None and not session_id:
        raise HTTPException(status_code=400, detail="user_id or session_id is required")
    s = store.ensure_fresh()
    key = f"u{user_id}" if user_id is not None else f"s{session_id}"
    ex = _exclude(exclude) | s.owned.get(key, set())

    models = {"content": s.content, "recent": s.recent, "trending": s.trending, "popular": s.popular}
    recs = models[strategy].recommend(key, k=k, exclude=ex)
    if not recs and strategy in ("content", "recent"):
        return _payload("trending", s.trending.recommend(k=k, exclude=ex), fallback_from=strategy)
    return _payload(strategy, recs)
