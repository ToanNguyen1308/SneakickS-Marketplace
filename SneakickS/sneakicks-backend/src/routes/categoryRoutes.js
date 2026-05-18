import express from "express";
import {
  getAllCategories,
  getProductsByCategoryId,
} from "../controllers/categoryController.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getAllCategories));
router.get("/:id/products", asyncHandler(getProductsByCategoryId));

export default router;
