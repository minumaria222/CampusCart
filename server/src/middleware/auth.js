import { randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";

/**
 * Middleware: Verify user JWT session from HttpOnly cookie.
 */
export async function authenticate(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      error: { message: "Authentication is unavailable until JWT_SECRET is configured." }
    });
  }

  const token = req.cookies?.campuscart_session;
  if (!token) {
    return res.status(401).json({
      error: { message: "Please log in to continue." }
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select(
      "_id name email collegeName role accountStatus"
    );

    if (!user) {
      return res.status(401).json({
        error: { message: "Your session is no longer valid. Please log in again." }
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        error: { message: "This account has been suspended. Please contact campus support." }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: { message: "Your session has expired or is invalid. Please log in again." }
      });
    }
    next(error);
  }
}

/**
 * Middleware: Authorize specific roles (defaulting to 'admin').
 */
export function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      error: { message: "Administrator access is required." }
    });
  }
  next();
}

/**
 * Role check factory for customizable role enforcement.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { message: "You do not have permission to access this resource." }
      });
    }
    next();
  };
}

/**
 * Middleware / Helper: Verify ownership of a product listing.
 */
export async function requireProductOwnership(req, res, next) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  if (!product.seller.equals(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({
      error: { message: "You do not have permission to modify this listing." }
    });
  }

  req.product = product;
  if (next) next();
  return product;
}

/**
 * Issue secure CSRF token and set lax cookie.
 */
export function issueCsrfToken(req, res) {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");
  const token = randomBytes(32).toString("hex");

  res.cookie("campuscart_csrf", token, {
    httpOnly: false,
    secure: isProduction,
    sameSite,
    path: "/"
  });
  res.json({ data: { token } });
}

/**
 * Middleware: Verify CSRF token on mutating HTTP requests.
 */
export function verifyCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.campuscart_csrf;
  const headerToken = req.get("X-CSRF-Token");

  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    return res.status(403).json({
      error: { message: "A valid CSRF token is required. Refresh the page and try again." }
    });
  }

  const expected = Buffer.from(cookieToken);
  const actual = Buffer.from(headerToken);

  if (!timingSafeEqual(expected, actual)) {
    return res.status(403).json({
      error: { message: "A valid CSRF token is required. Refresh the page and try again." }
    });
  }

  next();
}
