import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Wishlist } from "../models/Wishlist.js";

const router = Router();
router.use(authenticate);

/**
 * Get current user's saved items (available only).
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: "products",
        match: { status: "Available", isDeleted: false },
        populate: { path: "seller", select: "name collegeName" }
      })
      .lean();

    return res.json({ data: wishlist?.products?.filter(Boolean) || [] });
  })
);

/**
 * Add an available product to user's wishlist.
 */
router.post(
  "/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ error: { message: "Listing not found." } });
    }

    const product = await Product.findOne({ _id: productId, status: "Available", isDeleted: false }).select("_id");
    if (!product) {
      return res.status(404).json({ error: { message: "Available listing not found." } });
    }

    await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: product._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ data: { saved: true } });
  })
);

/**
 * Remove product from user's wishlist.
 */
router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ error: { message: "Listing not found." } });
    }

    await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: productId } });

    return res.status(204).end();
  })
);

export default router;
