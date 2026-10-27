import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";

// Validation Schemas
const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long.")
});

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  collegeName: z.string().trim().min(2, "College name must be at least 2 characters.").max(120)
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    collegeName: z.string().trim().min(2).max(120).optional()
  })
  .strict();

/**
 * Helper to set secure HttpOnly JWT cookie.
 */
function setSessionCookie(res, user) {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");

  const token = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "2h", issuer: "campuscart" }
  );

  res.cookie("campuscart_session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 2 * 60 * 60 * 1000,
    path: "/"
  });
}

/**
 * Filter safe fields from User object.
 */
function formatSafeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    collegeName: user.collegeName,
    role: user.role,
    accountStatus: user.accountStatus
  };
}

/**
 * Register a new student.
 * Strictly forces 'student' role server-side.
 */
export async function register(req, res) {
  const input = registrationSchema.parse(req.body);

  const existing = await User.exists({ email: input.email });
  if (existing) {
    return res.status(409).json({
      error: { message: "An account with that email address already exists." }
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  // Strictly enforce role: "student" regardless of incoming payload
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    collegeName: input.collegeName,
    role: "student",
    accountStatus: "active"
  });

  setSessionCookie(res, user);

  return res.status(201).json({
    data: { user: formatSafeUser(user) }
  });
}

/**
 * Log in student or administrator.
 */
export async function login(req, res) {
  const input = credentialsSchema.parse(req.body);

  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({
      error: { message: "Email or password is incorrect." }
    });
  }

  if (user.accountStatus !== "active") {
    return res.status(403).json({
      error: { message: "This account has been suspended. Please contact support." }
    });
  }

  setSessionCookie(res, user);

  return res.json({
    data: { user: formatSafeUser(user) }
  });
}

/**
 * Log out and clear session cookie.
 */
export function logout(req, res) {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");

  res.clearCookie("campuscart_session", {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/"
  });
  return res.status(204).end();
}

/**
 * Get current authenticated user profile.
 */
export function getMe(req, res) {
  return res.json({
    data: formatSafeUser(req.user)
  });
}

/**
 * Update authenticated user profile (Name and College only).
 */
export async function updateMe(req, res) {
  const input = updateProfileSchema.parse(req.body);

  if (!Object.keys(input).length) {
    return res.status(400).json({
      error: { message: "Provide at least your name or college to update." }
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: input },
    { new: true, runValidators: true }
  ).select("_id name email collegeName role accountStatus");

  if (!updatedUser) {
    return res.status(404).json({ error: { message: "User account not found." } });
  }

  return res.json({
    data: formatSafeUser(updatedUser)
  });
}
