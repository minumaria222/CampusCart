import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import { connectDatabase, isDatabaseConnected } from "./config/db.js";
import { issueCsrfToken, verifyCsrf } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

export function createApp() {
  const app = express();

  // Trust reverse proxy (required for Render, Railway, Fly.io, Vercel)
  app.set("trust proxy", 1);

  // Basic security hardening
  app.disable("x-powered-by");
  app.use(helmet());

  // Cross-Origin Resource Sharing
  const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"]
    })
  );

  // Body and cookie parsing
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());

  // CSRF verification on all state-changing requests
  app.use(verifyCsrf);

  // Health and CSRF token endpoints (Public)
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      database: isDatabaseConnected() ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/auth/csrf", issueCsrfToken);

  // Graceful offline fallback check: If MongoDB is down, return 503
  app.use("/api", (req, res, next) => {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        error: {
          message: "Database is unavailable. Configure MONGODB_URI to enable marketplace persistence."
        }
      });
    }
    next();
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/enquiries", enquiryRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/admin", adminRoutes);

  // 404 and Global Error Handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();

const port = Number(process.env.PORT || 5000);

if (process.env.NODE_ENV !== "test") {
  if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET is not configured. Authentication will return 503 until it is set.");
  } else if (process.env.JWT_SECRET.length < 32) {
    console.warn("WARNING: JWT_SECRET should be at least 32 characters for production security.");
  }

  app.listen(port, () => {
    console.info(`CampusCart API server listening on http://localhost:${port}`);

    if (!process.env.MONGODB_URI) {
      console.warn("NOTICE: MONGODB_URI is not set. Public product requests will fallback to demo mode on the frontend.");
      return;
    }

    connectDatabase(process.env.MONGODB_URI).catch(() => {
      console.warn("NOTICE: CampusCart API is running in fallback mode until MongoDB becomes reachable.");
    });
  });
}

export default app;
