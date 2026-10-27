import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  register,
  login,
  logout,
  getMe,
  updateMe
} from "../controllers/authController.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: { message: "Too many authentication attempts. Please wait 15 minutes and try again." }
  }
});

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, asyncHandler(updateMe));

export default router;
