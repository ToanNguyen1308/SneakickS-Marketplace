import * as followModel from "../models/followModel.js";
import * as productModel from "../models/productModel.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

/**
 * followController — Week 6 (Wishlist / Follow)
 */

export const followProduct = async (req, res) => {
  const productId = Number(req.body?.product_id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      success: false,
      message: "product_id must be a positive integer",
    });
  }

  if (!(await productModel.exists(productId))) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const created = await followModel.create(req.user.id, productId);
  return res.status(created ? 201 : 200).json({
    success: true,
    following: true,
    message: created ? "Followed product" : "Already following this product",
    data: created,
  });
};

export const unfollowProduct = async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const removed = await followModel.remove(req.user.id, productId);
  if (!removed) {
    return res.status(404).json({
      success: false,
      message: "You are not following this product",
    });
  }
  return res.json({
    success: true,
    following: false,
    message: "Unfollowed product",
  });
};

export const getFollowStatus = async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const following = await followModel.isFollowing(req.user.id, productId);
  return res.json({ success: true, following });
};

export const getMyFollows = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    followModel.findByUserPaged(req.user.id, { limit, offset }),
    followModel.countByUser(req.user.id),
  ]);

  res.json({
    success: true,
    count: data.length,
    pagination: buildMeta(page, limit, total),
    data,
  });
};
