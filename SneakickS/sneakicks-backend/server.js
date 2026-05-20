import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import bidRoutes from "./src/routes/bidRoutes.js";
import askRoutes from "./src/routes/askRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import verificationRoutes from "./src/routes/verificationRoutes.js";
import ratingRoutes from "./src/routes/ratingRoutes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./src/middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SneakickS Backend is running",
    version: "1.2.0 (Week 5 — Verification + Rating + Pagination)",
    endpoints: {
      products: [
        "GET    /api/products                          ?page=&limit=&brand=&category=&search=",
        "GET    /api/products/:id",
        "GET    /api/products/:id/orderbook?size=42",
      ],
      categories: [
        "GET    /api/categories",
        "GET    /api/categories/:id/products",
      ],
      auth: [
        "POST   /api/auth/register",
        "POST   /api/auth/login",
        "GET    /api/auth/me                           (auth required)",
      ],
      bids: [
        "POST   /api/bids                              (auth required)",
        "POST   /api/bids/buy-now                      (auth required)",
        "GET    /api/bids/me                           ?page=&limit=&status=  (auth required)",
        "DELETE /api/bids/:id                          (auth required)",
      ],
      asks: [
        "POST   /api/asks                              (auth required)",
        "POST   /api/asks/sell-now                     (auth required)",
        "GET    /api/asks/me                           ?page=&limit=&status=  (auth required)",
        "DELETE /api/asks/:id                          (auth required)",
      ],
      transactions: [
        "GET    /api/transactions/me                   ?page=&limit=&role=&status= (auth required)",
        "GET    /api/transactions/:id                  (auth required, owner or admin)",
        "POST   /api/transactions/:id/ship             (seller only)",
        "POST   /api/transactions/:id/complete         (buyer only)",
        "POST   /api/transactions/:id/rate             {rating, comment}  (buyer only, after completed)",
      ],
      verifications: [
        "GET    /api/admin/verifications               ?result=pending|passed|failed  (admin only)",
        "POST   /api/admin/verifications/:tid/start    (admin only)",
        "POST   /api/admin/verifications/:tid/pass     {notes?}              (admin only)",
        "POST   /api/admin/verifications/:tid/fail     {notes}               (admin only)",
      ],
      sellers: ["GET    /api/sellers/:id/ratings        ?page=&limit="],
    },
  });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/asks", askRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin/verifications", verificationRoutes);
app.use("/api/sellers", ratingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
