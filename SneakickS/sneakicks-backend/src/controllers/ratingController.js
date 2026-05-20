import * as ratingModel from "../models/ratingModel.js";
import * as userModel from "../models/userModel.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

/**
 * ratingController — Week 5
 *
 * Cung cap "trust score" cong khai cho moi seller:
 *   GET /api/sellers/:id/ratings?page=&limit=
 * Tra ve summary (avg_rating, total_ratings) + list cac review chi tiet.
 */

export const getSellerRatings = async (req, res) => {
  const sellerId = Number(req.params.id);
  if (!Number.isInteger(sellerId) || sellerId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid seller id" });
  }

  const seller = await userModel.findById(sellerId);
  if (!seller) {
    return res
      .status(404)
      .json({ success: false, message: "Seller not found" });
  }

  const { page, limit, offset } = parsePagination(req.query);
  const [summary, data] = await Promise.all([
    ratingModel.summaryBySeller(sellerId),
    ratingModel.listBySeller(sellerId, { limit, offset }),
  ]);

  res.json({
    success: true,
    seller: {
      id: seller.id,
      username: seller.username,
      avatar_url: seller.avatar_url,
    },
    summary: {
      avg_rating: Number(summary.avg_rating),
      total_ratings: summary.total_ratings,
    },
    count: data.length,
    pagination: buildMeta(page, limit, summary.total_ratings),
    data,
  });
};
