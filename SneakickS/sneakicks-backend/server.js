import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import bidRoutes from "./src/routes/bidRoutes.js";
import askRoutes from "./src/routes/askRoutes.js";
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
    version: "1.1.0 (Week 4 — PostgreSQL + JWT + Matching Engine)",
    endpoints: {
      products: [
        "GET    /api/products",
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
        "GET    /api/auth/me              (auth required)",
      ],
      bids: [
        "POST   /api/bids                 (auth required)",
        "POST   /api/bids/buy-now         (auth required)",
        "GET    /api/bids/me              (auth required)",
        "DELETE /api/bids/:id             (auth required)",
      ],
      asks: [
        "POST   /api/asks                 (auth required)",
        "POST   /api/asks/sell-now        (auth required)",
        "GET    /api/asks/me              (auth required)",
        "DELETE /api/asks/:id             (auth required)",
      ],
    },
  });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/asks", askRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
