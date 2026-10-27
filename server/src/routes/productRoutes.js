import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
} from "../controllers/productController.js";

const router = Router();

// Current user's listings
router.get("/mine", authenticate, asyncHandler(getMyProducts));

// Public listings search and view
router.get("/", asyncHandler(getProducts));
router.get("/:id", asyncHandler(getProductById));

// Create new listing
router.post("/", authenticate, asyncHandler(createProduct));

// Edit own listing
router.patch("/:id", authenticate, asyncHandler(updateProduct));

// Mark status (Available / Reserved / Sold)
router.patch("/:id/status", authenticate, asyncHandler(updateProductStatus));

// Soft-remove own listing
router.delete("/:id", authenticate, asyncHandler(deleteProduct));

export default router;
