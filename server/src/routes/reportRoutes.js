import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { REPORT_REASONS, Report } from "../models/Report.js";

const router = Router();
router.use(authenticate);

/**
 * Report a listing (One report per student per listing).
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { productId, reason, description = "" } = z
      .object({
        productId: z.string().refine(mongoose.isValidObjectId, "Choose a valid listing."),
        reason: z.enum(REPORT_REASONS, { errorMap: () => ({ message: "Select a valid report reason." }) }),
        description: z.string().trim().max(1000).optional()
      })
      .strict()
      .parse(req.body);

    const product = await Product.findOne({ _id: productId, isDeleted: false }).select("seller");
    if (!product) {
      return res.status(404).json({ error: { message: "Listing not found." } });
    }

    if (product.seller.equals(req.user._id)) {
      return res.status(400).json({ error: { message: "You cannot report your own listing." } });
    }

    const existing = await Report.exists({ product: productId, reporter: req.user._id });
    if (existing) {
      return res.status(409).json({ error: { message: "You have already reported this listing." } });
    }

    const report = await Report.create({
      product: productId,
      reporter: req.user._id,
      reason,
      description
    });

    return res.status(201).json({ data: report });
  })
);

/**
 * Get reports submitted by current student.
 */
router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .populate("product", "title status price")
      .lean();

    return res.json({ data: reports });
  })
);

export default router;
