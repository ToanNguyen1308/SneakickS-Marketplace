import * as bidModel from "../models/bidModel.js";
import * as productModel from "../models/productModel.js";
import { matchNewBid, buyNow } from "../services/matchingEngine.js";

const validatePlaceBidBody = (body) => {
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

export const placeBid = async (req, res) => {
  const error = validatePlaceBidBody(req.body);
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

  const result = await matchNewBid({
    buyerId: req.user.id,
    productId,
    size: String(size),
    price: priceNumber,
  });

  return res.status(201).json({
    success: true,
    matched: result.matched,
    message: result.message,
    data: {
      bid: result.bid,
      ask: result.ask || null,
      transaction: result.transaction || null,
    },
  });
};

export const buyNowBid = async (req, res) => {
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

  const result = await buyNow({
    buyerId: req.user.id,
    productId,
    size: String(size),
  });

  return res.status(201).json({
    success: true,
    matched: result.matched,
    message: "Buy Now success",
    data: {
      ask: result.ask,
      transaction: result.transaction,
    },
  });
};

export const getMyBids = async (req, res) => {
  const status = req.query.status;
  const data = await bidModel.findByUser(req.user.id, { status });
  res.json({ success: true, count: data.length, data });
};

export const cancelBid = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid bid id" });
  }

  const existing = await bidModel.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Bid not found" });
  }
  if (existing.buyer_id !== req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: "You cannot cancel another user's bid" });
  }
  if (existing.status !== "active") {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel bid with status='${existing.status}'`,
    });
  }

  const cancelled = await bidModel.cancel(id, req.user.id);
  res.json({
    success: true,
    message: "Bid cancelled",
    data: cancelled,
  });
};
