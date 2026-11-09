import { randomUUID } from "node:crypto";

import * as productModel from "../models/productModel.js";
import * as recModel from "../models/recommendationModel.js";
import { callRecommender } from "../services/recommenderClient.js";

const LIMIT_MAX = 24;
const TRENDING_CACHE_MS = 60 * 1000;
const trendingCache = new Map();

const parseLimit = (raw, fallback) =>
  Math.min(Math.max(Number.parseInt(raw, 10) || fallback, 1), LIMIT_MAX);

const parseExclude = (raw) =>
  String(raw || "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50);

/**
 * Gan thong tin san pham (gia, Lowest Ask...) vao danh sach goi y.
 * `rec_request_id` dinh danh lan goi y nay; frontend gui kem khi user click (su kien rec_click).
 */
const respond = async (res, { items, source, model }) => {
  const products = await productModel.findByIds(items.map((i) => i.product_id));
  const meta = new Map(items.map((i) => [i.product_id, i]));
  res.json({
    success: true,
    source,
    model,
    rec_request_id: randomUUID(),
    count: products.length,
    data: products.map((p) => ({ ...p, reason: meta.get(p.id)?.reason ?? null })),
  });
};

/** GET /api/recommendations/trending?limit=12&exclude=1,2 */
export const getTrending = async (req, res) => {
  const limit = parseLimit(req.query.limit, 12);
  const exclude = parseExclude(req.query.exclude);
  const key = `${limit}|${exclude.join(",")}`;
  const hit = trendingCache.get(key);
  if (hit && Date.now() - hit.at < TRENDING_CACHE_MS) return respond(res, hit.result);

  const remote = await callRecommender("/recommend/trending", { k: limit, exclude: exclude.join(",") });
  const result = remote
    ? { items: remote.items, source: "recommender", model: remote.model }
    : { items: await recModel.trendingFallback(limit, exclude), source: "fallback", model: "trending-sql" };
  trendingCache.set(key, { at: Date.now(), result });
  return respond(res, result);
};

/** GET /api/recommendations/similar/:id?limit=8 */
export const getSimilar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }
  if (!(await productModel.exists(id))) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  const limit = parseLimit(req.query.limit, 8);
  const remote = await callRecommender(`/recommend/similar/${id}`, { k: limit });
  const result = remote
    ? { items: remote.items, source: "recommender", model: remote.model }
    : { items: await recModel.similarFallback(id, limit), source: "fallback", model: "similar-sql" };
  return respond(res, result);
};

/** GET /api/recommendations/recently-viewed?session_id=&limit=8&exclude=12 (khach hoac da dang nhap) */
export const getRecentlyViewed = async (req, res) => {
  const userId = req.user?.id ?? null;
  const sessionId =
    typeof req.query.session_id === "string" && req.query.session_id.length <= 64
      ? req.query.session_id
      : null;
  if (!userId && !sessionId) {
    return res.json({ success: true, source: "history", model: "recent", count: 0, data: [] });
  }
  const items = await recModel.recentlyViewed({
    userId,
    sessionId,
    limit: parseLimit(req.query.limit, 8),
    exclude: parseExclude(req.query.exclude),
  });
  return respond(res, { items, source: "history", model: "recent" });
};
