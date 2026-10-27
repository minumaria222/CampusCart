import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getStats,
  getUsers,
  updateUserStatus,
  getProducts,
  moderateProduct,
  getReports,
  updateReportStatus
} from "../controllers/adminController.js";

const router = Router();

// Apply authentication and administrator role check to all routes
router.use(authenticate, authorizeAdmin);

router.get("/stats", asyncHandler(getStats));
router.get("/users", asyncHandler(getUsers));
router.patch("/users/:id/status", asyncHandler(updateUserStatus));

router.get("/products", asyncHandler(getProducts));
router.patch("/products/:id/moderation", asyncHandler(moderateProduct));

router.get("/reports", asyncHandler(getReports));
router.patch("/reports/:id", asyncHandler(updateReportStatus));

export default router;
