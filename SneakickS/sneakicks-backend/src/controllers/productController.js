import * as productModel from "../models/productModel.js";
import * as bidModel from "../models/bidModel.js";
import * as askModel from "../models/askModel.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export const getAllProducts = async (req, res) => {
  const { brand, category, search } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    productModel.findAllPaged({ brand, category, search, limit, offset }),
    productModel.countAll({ brand, category, search }),
  ]);

  res.json({
    success: true,
    count: data.length,
    pagination: buildMeta(page, limit, total),
    data,
  });
};

export const getProductById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const product = await productModel.findById(id);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }
  res.json({ success: true, data: product });
};

export const getOrderBook = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const product = await productModel.findById(id);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const { size } = req.query;
  if (!size) {
    return res.status(400).json({
      success: false,
      message: "Query parameter `size` is required for orderbook",
    });
  }

  const [bids, asks] = await Promise.all([
    bidModel.findActiveByProductSize(id, size),
    askModel.findActiveByProductSize(id, size),
  ]);

  res.json({
    success: true,
    product: { id: product.id, name: product.name, brand: product.brand },
    size,
    bids: {
      count: bids.length,
      data: bids,
    },
    asks: {
      count: asks.length,
      data: asks,
    },
  });
};
