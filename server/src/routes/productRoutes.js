import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { PRODUCT_CATEGORIES, Product } from "../models/Product.js";

const router = Router();
const conditions = ["Like New", "Good", "Used"];
const statuses = ["Available", "Reserved", "Sold"];
function isHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const productInput = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(PRODUCT_CATEGORIES),
  price: z.number().finite().min(0).max(10000000),
  condition: z.enum(conditions),
  images: z.array(z.string().url().max(2048).refine(isHttpUrl, "Images must use HTTP or HTTPS.")).max(5).default([])
}).strict();
const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(12),
  minPrice: z.coerce.number().finite().min(0).optional(),
  maxPrice: z.coerce.number().finite().min(0).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  condition: z.enum(conditions).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
  search: z.string().max(100).optional()
}).strict();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseProductQuery(query) {
  const input = productQuerySchema.parse(query);
  if (input.minPrice !== undefined && input.maxPrice !== undefined && input.minPrice > input.maxPrice) {
    throw new z.ZodError([{
      code: "custom",
      path: ["minPrice"],
      message: "Minimum price cannot exceed maximum price."
    }]);
  }
  return input;
}

async function listProducts(req, res, { mine = false } = {}) {
  const { page, limit, minPrice, maxPrice, search: searchText, category, condition, sort: sortOrder } = parseProductQuery(req.query);
  const filter = { status: mine ? { $ne: "Removed" } : "Available" };
  if (mine) filter.seller = req.user._id;
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (searchText) {
    const search = new RegExp(escapeRegex(searchText.trim()), "i");
    filter.$or = [{ title: search }, { description: search }];
  }

  const sort = sortOrder === "price-asc" ? { price: 1, createdAt: -1 } :
    sortOrder === "price-desc" ? { price: -1, createdAt: -1 } : { createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
      .populate("seller", "name collegeName")
      .select("-__v")
      .lean(),
    Product.countDocuments(filter)
  ]);
  res.json({ data: { products, total, page, limit, pages: Math.ceil(total / limit) } });
}

async function requireOwnedProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: { message: "Listing not found." } });
    return null;
  }
  const product = await Product.findOne({ _id: req.params.id, status: { $ne: "Removed" } });
  if (!product) {
    res.status(404).json({ error: { message: "Listing not found." } });
    return null;
  }
  if (!product.seller.equals(req.user._id)) {
    res.status(403).json({ error: { message: "You do not have permission to change this listing." } });
    return null;
  }
  return product;
}

router.get("/mine", authenticate, asyncHandler((req, res) => listProducts(req, res, { mine: true })));
router.get("/", asyncHandler((req, res) => listProducts(req, res)));

router.get("/:id", asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { message: "Listing not found." } });
  const product = await Product.findOne({ _id: req.params.id, status: { $ne: "Removed" } })
    .populate("seller", "name collegeName")
    .select("-__v")
    .lean();
  if (!product) return res.status(404).json({ error: { message: "Listing not found." } });
  res.json({ data: product });
}));

router.post("/", authenticate, asyncHandler(async (req, res) => {
  const input = productInput.parse(req.body);
  const product = await Product.create({
    ...input,
    seller: req.user._id,
    collegeName: req.user.collegeName
  });
  await product.populate("seller", "name collegeName");
  res.status(201).json({ data: product });
}));

router.patch("/:id", authenticate, asyncHandler(async (req, res) => {
  if (!await requireOwnedProduct(req, res)) return;
  const input = productInput.partial().strict().parse(req.body);
  if (!Object.keys(input).length) return res.status(400).json({ error: { message: "Provide at least one field to update." } });
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id, status: { $ne: "Removed" } },
    { $set: input },
    { new: true, runValidators: true }
  ).populate("seller", "name collegeName");
  if (!product) return res.status(404).json({ error: { message: "Listing not found." } });
  res.json({ data: product });
}));

router.patch("/:id/status", authenticate, asyncHandler(async (req, res) => {
  if (!await requireOwnedProduct(req, res)) return;
  const { status } = z.object({ status: z.enum(statuses) }).strict().parse(req.body);
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id, status: { $ne: "Removed" } },
    { $set: { status } },
    { new: true, runValidators: true }
  ).populate("seller", "name collegeName");
  if (!product) return res.status(404).json({ error: { message: "Listing not found." } });
  res.json({ data: product });
}));

router.delete("/:id", authenticate, asyncHandler(async (req, res) => {
  if (!await requireOwnedProduct(req, res)) return;
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id, status: { $ne: "Removed" } },
    { $set: { status: "Removed" } }
  );
  if (!product) return res.status(404).json({ error: { message: "Listing not found." } });
  res.status(204).end();
}));

export default router;
