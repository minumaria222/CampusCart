import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
const credentials = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});
const registration = credentials.extend({
  name: z.string().trim().min(2).max(80),
  collegeName: z.string().trim().min(2).max(120)
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many attempts. Please wait a little and try again." } }
});

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "2h", issuer: "campuscart" });
  res.cookie("campuscart_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
    path: "/"
  });
}

function safeUser(user) {
  return { _id: user._id, name: user.name, email: user.email, collegeName: user.collegeName, role: user.role };
}

function requireJwtSecret(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ error: { message: "Authentication is unavailable until JWT_SECRET is configured." } });
  }
  next();
}

router.post("/register", authLimiter, requireJwtSecret, asyncHandler(async (req, res) => {
  const input = registration.parse(req.body);
  const existing = await User.exists({ email: input.email });
  if (existing) return res.status(409).json({ error: { message: "An account with that email already exists." } });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    collegeName: input.collegeName,
    role: "student"
  });
  setSessionCookie(res, user);
  res.status(201).json({ data: { user: safeUser(user) } });
}));

router.post("/login", authLimiter, requireJwtSecret, asyncHandler(async (req, res) => {
  const input = credentials.parse(req.body);
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ error: { message: "Email or password is incorrect." } });
  }
  if (user.accountStatus !== "active") return res.status(403).json({ error: { message: "This account is suspended." } });
  setSessionCookie(res, user);
  res.json({ data: { user: safeUser(user) } });
}));

router.post("/logout", (req, res) => {
  res.clearCookie("campuscart_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  res.status(204).end();
});

router.get("/me", authenticate, (req, res) => res.json({ data: safeUser(req.user) }));

router.patch("/me", authenticate, asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    collegeName: z.string().trim().min(2).max(120).optional()
  }).strict().parse(req.body);
  if (!Object.keys(input).length) {
    return res.status(400).json({ error: { message: "Provide your name or college to update." } });
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: input }, { new: true, runValidators: true })
    .select("_id name email collegeName role accountStatus");
  if (!user) return res.status(404).json({ error: { message: "Account not found." } });
  res.json({ data: safeUser(user) });
}));

export default router;
