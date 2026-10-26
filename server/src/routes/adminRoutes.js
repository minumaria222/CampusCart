import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import { Enquiry } from "../models/Enquiry.js";
import { Product } from "../models/Product.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";

const router = Router();
router.use(authenticate, authorizeAdmin);

const paging = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(20),
  search: z.string().trim().max(80).optional()
}).strict();

function searchFilter(search, fields) {
  if (!search) return {};
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = new RegExp(escaped, "i");
  return { $or: fields.map((field) => ({ [field]: value })) };
}

router.get("/stats", asyncHandler(async (req, res) => {
  const [users, activeListings, soldListings, pendingReports, enquiries] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ status: "Available" }),
    Product.countDocuments({ status: "Sold" }),
    Report.countDocuments({ status: "Pending" }),
    Enquiry.countDocuments({ status: "Pending" })
  ]);
  res.json({ data: { users, activeListings, soldListings, pendingReports, pendingEnquiries: enquiries } });
}));

router.get("/users", asyncHandler(async (req, res) => {
  const { page, limit, search } = paging.parse(req.query);
  const filter = searchFilter(search, ["name", "email", "collegeName"]);
  const [users, total] = await Promise.all([
    User.find(filter).select("name email collegeName role accountStatus createdAt").sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  res.json({ data: { users, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
}));

router.patch("/users/:id/status", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { message: "User not found." } });
  const { accountStatus } = z.object({ accountStatus: z.enum(["active", "suspended"]) }).strict().parse(req.body);
  if (req.params.id === req.user._id.toString() && accountStatus === "suspended") {
    return res.status(400).json({ error: { message: "You cannot suspend your own administrator account." } });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { accountStatus } }, { new: true })
    .select("name email collegeName role accountStatus createdAt").lean();
  if (!user) return res.status(404).json({ error: { message: "User not found." } });
  res.json({ data: user });
}));

router.get("/products", asyncHandler(async (req, res) => {
  const { page, limit, search } = paging.parse(req.query);
  const filter = searchFilter(search, ["title", "description", "collegeName"]);
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("seller", "name collegeName")
      .lean(),
    Product.countDocuments(filter)
  ]);
  res.json({ data: { products, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
}));

router.patch("/products/:id/moderation", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { message: "Listing not found." } });
  const { status } = z.object({ status: z.enum(["Available", "Removed"]) }).strict().parse(req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true })
    .populate("seller", "name collegeName");
  if (!product) return res.status(404).json({ error: { message: "Listing not found." } });
  res.json({ data: product });
}));

router.get("/reports", asyncHandler(async (req, res) => {
  const { page, limit } = paging.parse(req.query);
  const [reports, total] = await Promise.all([
    Report.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("product", "title status")
      .populate("reporter", "name collegeName")
      .lean(),
    Report.countDocuments()
  ]);
  res.json({ data: { reports, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
}));

router.patch("/reports/:id", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { message: "Report not found." } });
  const { status } = z.object({ status: z.enum(["Reviewed", "Resolved"]) }).strict().parse(req.body);
  const report = await Report.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true })
    .populate("product", "title status")
    .populate("reporter", "name collegeName");
  if (!report) return res.status(404).json({ error: { message: "Report not found." } });
  res.json({ data: report });
}));

export default router;
