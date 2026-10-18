import express from "express";
import {
  getAllProducts,
  getProductById,
  getOrderBook,
  getPriceHistory,
  getMarket,
  getRecentSales,
  getFacets,
} from "../controllers/productController.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllProducts));
router.get("/facets", asyncHandler(getFacets));
router.get("/:id", asyncHandler(getProductById));
router.get("/:id/orderbook", asyncHandler(getOrderBook));
router.get("/:id/price-history", asyncHandler(getPriceHistory));
router.get("/:id/market", asyncHandler(getMarket));
router.get("/:id/sales", asyncHandler(getRecentSales));

export default router;
