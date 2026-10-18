import express from "express";
import { ingestEvents } from "../controllers/eventController.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.post("/", optionalAuth, asyncHandler(ingestEvents));

export default router;
