import express from "express";
import {
  listVerifications,
  startVerification,
  passVerification,
  failVerification,
} from "../controllers/verificationController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", asyncHandler(listVerifications));
router.post("/:tid/start", asyncHandler(startVerification));
router.post("/:tid/pass", asyncHandler(passVerification));
router.post("/:tid/fail", asyncHandler(failVerification));

export default router;
