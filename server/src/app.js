import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { issueCsrfToken, verifyCsrf } from "./middleware/csrf.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"]
  }));
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use(verifyCsrf);

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/auth/csrf", issueCsrfToken);
  app.use("/api", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: { message: "MongoDB is not connected. Configure MONGODB_URI to enable marketplace data." }
      });
    }
    next();
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/enquiries", enquiryRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/admin", adminRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
