import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { Product } from "../models/Product.js";
import { Wishlist } from "../models/Wishlist.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate({ path: "products", match: { status: "Available" }, populate: { path: "seller", select: "name collegeName" } })
    .lean();
  res.json({ data: wishlist?.products?.filter(Boolean) || [] });
}));

router.post("/:productId", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }
  const product = await Product.findOne({ _id: req.params.productId, status: "Available" }).select("_id");
  if (!product) return res.status(404).json({ error: { message: "Available listing not found." } });
  await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: product._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ data: { saved: true } });
}));

router.delete("/:productId", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  res.status(204).end();
}));

export default router;
