import express from "express";
import { getSellerRatings } from "../controllers/ratingController.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/:id/ratings", asyncHandler(getSellerRatings));

export default router;
