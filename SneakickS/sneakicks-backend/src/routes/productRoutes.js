import express from "express";
import {
  getAllProducts,
  getProductById,
  getOrderBook,
} from "../controllers/productController.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllProducts));
router.get("/:id", asyncHandler(getProductById));
router.get("/:id/orderbook", asyncHandler(getOrderBook));

export default router;
