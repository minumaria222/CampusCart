import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler.js";
import { User } from "../models/User.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ error: { message: "Authentication is unavailable until JWT_SECRET is configured." } });
  }
  const token = req.cookies?.campuscart_session;
  if (!token) return res.status(401).json({ error: { message: "Please log in to continue." } });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email collegeName role accountStatus");
    if (!user) return res.status(401).json({ error: { message: "Your session is no longer valid. Please log in again." } });
    if (user.accountStatus !== "active") return res.status(403).json({ error: { message: "This account is suspended." } });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: { message: "Your session has expired. Please log in again." } });
    }
    next(error);
  }
});
