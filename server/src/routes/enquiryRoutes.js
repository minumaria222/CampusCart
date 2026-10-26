import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { Enquiry } from "../models/Enquiry.js";
import { Product } from "../models/Product.js";

const router = Router();
router.use(authenticate);

router.post("/", asyncHandler(async (req, res) => {
  const { productId, message } = z.object({
    productId: z.string().refine(mongoose.isValidObjectId, "Choose a valid listing."),
    message: z.string().trim().min(10).max(1000)
  }).strict().parse(req.body);
  const product = await Product.findOne({ _id: productId, status: "Available" }).select("seller");
  if (!product) return res.status(404).json({ error: { message: "This listing is no longer available." } });
  if (product.seller.equals(req.user._id)) return res.status(400).json({ error: { message: "You cannot enquire about your own listing." } });
  const enquiry = await Enquiry.create({
    product: product._id,
    buyer: req.user._id,
    seller: product.seller,
    message
  });
  res.status(201).json({ data: enquiry });
}));

router.get("/sent", asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({ buyer: req.user._id })
    .sort({ createdAt: -1 })
    .populate("product", "title status images price")
    .populate("seller", "name collegeName")
    .lean();
  res.json({ data: enquiries });
}));

router.get("/received", asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({ seller: req.user._id })
    .sort({ createdAt: -1 })
    .populate("product", "title status images price")
    .populate("buyer", "name collegeName")
    .lean();
  res.json({ data: enquiries });
}));

router.patch("/:id/status", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { message: "Enquiry not found." } });
  const { status } = z.object({ status: z.enum(["Responded", "Accepted", "Declined", "Closed"]) }).strict().parse(req.body);
  const enquiry = await Enquiry.findOne({ _id: req.params.id, seller: req.user._id })
    .populate("product", "title status")
    .populate("buyer", "name collegeName");
  if (!enquiry) return res.status(404).json({ error: { message: "Enquiry not found." } });
  if (enquiry.status === "Closed" || enquiry.status === "Declined") {
    return res.status(409).json({ error: { message: "This enquiry is already closed." } });
  }
  enquiry.status = status;
  await enquiry.save();
  res.json({ data: enquiry });
}));

export default router;
