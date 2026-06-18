import * as askModel from "../models/askModel.js";
import * as productModel from "../models/productModel.js";
import { matchNewAsk, sellNow } from "../services/matchingEngine.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";
import { notifyProduct, notifyFollowersOnNewAsk } from "../realtime/notify.js";

const validatePlaceAskBody = (body) => {
  const { product_id, size, price } = body || {};
  if (!product_id || !size || price === undefined || price === null) {
    return "product_id, size and price are required";
  }
  if (!Number.isInteger(Number(product_id)) || Number(product_id) <= 0) {
    return "product_id must be a positive integer";
  }
  if (Number(price) <= 0) {
    return "price must be greater than 0";
  }
  return null;
};

export const placeAsk = async (req, res) => {
  const error = validatePlaceAskBody(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const { product_id, size, price } = req.body;
  const productId = Number(product_id);
  const priceNumber = Number(price);

  if (!(await productModel.exists(productId))) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const result = await matchNewAsk({
    sellerId: req.user.id,
    productId,
    size: String(size),
    price: priceNumber,
  });

  // Order book thay doi -> push real-time toi nguoi dang xem san pham.
  await notifyProduct(productId);

  // Neu Ask con cho (chua khop) va la gia thap nhat -> bao cho followers.
  if (!result.matched) {
    await notifyFollowersOnNewAsk({
      productId,
      sellerId: req.user.id,
      price: priceNumber,
      size: String(size),
    });
  }

  return res.status(201).json({
    success: true,
    matched: result.matched,
    message: result.message,
    data: {
      ask: result.ask,
      bid: result.bid || null,
      transaction: result.transaction || null,
    },
  });
};

export const sellNowAsk = async (req, res) => {
  const { product_id, size } = req.body || {};
  if (!product_id || !size) {
    return res
      .status(400)
      .json({ success: false, message: "product_id and size are required" });
  }
  const productId = Number(product_id);
  if (!(await productModel.exists(productId))) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const result = await sellNow({
    sellerId: req.user.id,
    productId,
    size: String(size),
  });

  await notifyProduct(productId);

  return res.status(201).json({
    success: true,
    matched: result.matched,
    message: "Sell Now success",
    data: {
      bid: result.bid,
      transaction: result.transaction,
    },
  });
};

export const getMyAsks = async (req, res) => {
  const status = req.query.status;
  const { page, limit, offset } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    askModel.findByUserPaged(req.user.id, { status, limit, offset }),
    askModel.countByUser(req.user.id, { status }),
  ]);

  res.json({
    success: true,
    count: data.length,
    pagination: buildMeta(page, limit, total),
    data,
  });
};

export const cancelAsk = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid ask id" });
  }

  const existing = await askModel.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Ask not found" });
  }
  if (existing.seller_id !== req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot cancel another user's ask" });
  }
  if (existing.status !== "active") {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel ask with status='${existing.status}'`,
    });
  }

  const cancelled = await askModel.cancel(id, req.user.id);

  await notifyProduct(existing.product_id);

  res.json({
    success: true,
    message: "Ask cancelled",
    data: cancelled,
  });
};
