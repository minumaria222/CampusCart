import mongoose from "mongoose";
import { z } from "zod";
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, PRODUCT_STATUSES, Product } from "../models/Product.js";

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Validation schemas
const productInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(100),
    description: z.string().trim().min(10, "Description must be at least 10 characters.").max(2000),
    category: z.enum(PRODUCT_CATEGORIES, { errorMap: () => ({ message: "Select a valid category." }) }),
    price: z.number().finite().min(0, "Price cannot be negative.").max(10000000),
    condition: z.enum(PRODUCT_CONDITIONS, { errorMap: () => ({ message: "Select a valid condition." }) }),
    images: z
      .array(
        z.string().url().max(2048).refine(isHttpUrl, "Images must use HTTP or HTTPS protocols.")
      )
      .max(5, "You may provide up to 5 image URLs.")
      .default([])
  })
  .strict();

const productQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(40).default(12),
    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    condition: z.enum(PRODUCT_CONDITIONS).optional(),
    sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
    search: z.string().trim().max(100).optional()
  })
  .strict();

/**
 * Public: Browse, search, filter, and paginate available products.
 */
export async function getProducts(req, res) {
  const query = productQuerySchema.parse(req.query);

  if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
    return res.status(400).json({
      error: { message: "Minimum price cannot be greater than maximum price." }
    });
  }

  const filter = {
    status: "Available",
    isDeleted: false
  };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.condition) {
    filter.condition = query.condition;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  if (query.search) {
    const escaped = escapeRegex(query.search);
    const searchRegex = new RegExp(escaped, "i");
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const sortOption =
    query.sort === "price-asc"
      ? { price: 1, createdAt: -1 }
      : query.sort === "price-desc"
      ? { price: -1, createdAt: -1 }
      : { createdAt: -1 };

  const skip = (query.page - 1) * query.limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(query.limit)
      .populate("seller", "name collegeName")
      .select("-__v")
      .lean(),
    Product.countDocuments(filter)
  ]);

  return res.json({
    data: {
      products,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.max(1, Math.ceil(total / query.limit))
    }
  });
}

/**
 * Public: Get a single product by ID.
 */
export async function getProductById(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  const product = await Product.findOne({ _id: id, isDeleted: false })
    .populate("seller", "name collegeName")
    .select("-__v")
    .lean();

  if (!product) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  return res.json({ data: product });
}

/**
 * Authenticated: Get current user's listings.
 */
export async function getMyProducts(req, res) {
  const products = await Product.find({
    seller: req.user._id,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .populate("seller", "name collegeName")
    .lean();

  return res.json({
    data: {
      products,
      total: products.length
    }
  });
}

/**
 * Authenticated: Create a new product listing.
 */
export async function createProduct(req, res) {
  const input = productInputSchema.parse(req.body);

  const product = await Product.create({
    ...input,
    seller: req.user._id,
    collegeName: req.user.collegeName,
    status: "Available",
    isDeleted: false
  });

  await product.populate("seller", "name collegeName");

  return res.status(201).json({
    data: product
  });
}

/**
 * Authenticated (Owner): Edit listing details.
 */
export async function updateProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  const existing = await Product.findOne({ _id: id, isDeleted: false });
  if (!existing) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  if (!existing.seller.equals(req.user._id)) {
    return res.status(403).json({
      error: { message: "You do not have permission to edit this listing." }
    });
  }

  const input = productInputSchema.partial().strict().parse(req.body);
  if (!Object.keys(input).length) {
    return res.status(400).json({ error: { message: "Provide at least one field to update." } });
  }

  const updated = await Product.findOneAndUpdate(
    { _id: id, seller: req.user._id, isDeleted: false },
    { $set: input },
    { new: true, runValidators: true }
  ).populate("seller", "name collegeName");

  return res.json({ data: updated });
}

/**
 * Authenticated (Owner): Update listing status ('Available' | 'Reserved' | 'Sold').
 */
export async function updateProductStatus(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  const existing = await Product.findOne({ _id: id, isDeleted: false });
  if (!existing) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  if (!existing.seller.equals(req.user._id)) {
    return res.status(403).json({
      error: { message: "You do not have permission to update this listing's status." }
    });
  }

  const { status } = z
    .object({
      status: z.enum(["Available", "Reserved", "Sold"])
    })
    .strict()
    .parse(req.body);

  const updated = await Product.findOneAndUpdate(
    { _id: id, seller: req.user._id, isDeleted: false },
    { $set: { status } },
    { new: true, runValidators: true }
  ).populate("seller", "name collegeName");

  return res.json({ data: updated });
}

/**
 * Authenticated (Owner): Soft delete a product listing.
 */
export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  const existing = await Product.findOne({ _id: id, isDeleted: false });
  if (!existing) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  if (!existing.seller.equals(req.user._id)) {
    return res.status(403).json({
      error: { message: "You do not have permission to delete this listing." }
    });
  }

  await Product.findOneAndUpdate(
    { _id: id, seller: req.user._id },
    { $set: { isDeleted: true, status: "Removed" } }
  );

  return res.status(204).end();
}
