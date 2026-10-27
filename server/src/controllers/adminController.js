import mongoose from "mongoose";
import { z } from "zod";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Report } from "../models/Report.js";
import { Enquiry } from "../models/Enquiry.js";

const pagingSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(80).optional()
  })
  .strict();

function buildSearchFilter(search, fields) {
  if (!search) return {};
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

/**
 * Admin: Aggregated statistics overview.
 */
export async function getStats(req, res) {
  const [users, activeListings, soldListings, pendingReports, pendingEnquiries] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ status: "Available", isDeleted: false }),
    Product.countDocuments({ status: "Sold" }),
    Report.countDocuments({ status: "Pending" }),
    Enquiry.countDocuments({ status: "Pending" })
  ]);

  return res.json({
    data: {
      users,
      activeListings,
      soldListings,
      pendingReports,
      pendingEnquiries
    }
  });
}

/**
 * Admin: Search and paginate user records.
 */
export async function getUsers(req, res) {
  const { page, limit, search } = pagingSchema.parse(req.query);
  const filter = buildSearchFilter(search, ["name", "email", "collegeName"]);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email collegeName role accountStatus createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  return res.json({
    data: {
      users,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

/**
 * Admin: Suspend or reactivate user account.
 */
export async function updateUserStatus(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "User not found." } });
  }

  const { accountStatus } = z
    .object({
      accountStatus: z.enum(["active", "suspended"])
    })
    .strict()
    .parse(req.body);

  if (id === req.user._id.toString() && accountStatus === "suspended") {
    return res.status(400).json({
      error: { message: "You cannot suspend your own administrator account." }
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: { accountStatus } },
    { new: true }
  ).select("name email collegeName role accountStatus createdAt").lean();

  if (!updatedUser) {
    return res.status(404).json({ error: { message: "User not found." } });
  }

  return res.json({ data: updatedUser });
}

/**
 * Admin: Browse listings for moderation.
 */
export async function getProducts(req, res) {
  const { page, limit, search } = pagingSchema.parse(req.query);
  const filter = buildSearchFilter(search, ["title", "description", "collegeName"]);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("seller", "name collegeName")
      .lean(),
    Product.countDocuments(filter)
  ]);

  return res.json({
    data: {
      products,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

/**
 * Admin: Moderate a listing (mark Available or Removed).
 */
export async function moderateProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  const { status } = z
    .object({
      status: z.enum(["Available", "Removed"])
    })
    .strict()
    .parse(req.body);

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        isDeleted: status === "Removed"
      }
    },
    { new: true }
  ).populate("seller", "name collegeName");

  if (!updatedProduct) {
    return res.status(404).json({ error: { message: "Listing not found." } });
  }

  return res.json({ data: updatedProduct });
}

/**
 * Admin: List submitted reports.
 */
export async function getReports(req, res) {
  const { page, limit } = pagingSchema.parse(req.query);

  const [reports, total] = await Promise.all([
    Report.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product", "title status isDeleted price")
      .populate("reporter", "name collegeName email")
      .lean(),
    Report.countDocuments()
  ]);

  return res.json({
    data: {
      reports,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

/**
 * Admin: Update report resolution status ('Reviewed' | 'Resolved').
 */
export async function updateReportStatus(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { message: "Report not found." } });
  }

  const { status } = z
    .object({
      status: z.enum(["Reviewed", "Resolved"])
    })
    .strict()
    .parse(req.body);

  const updatedReport = await Report.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  )
    .populate("product", "title status")
    .populate("reporter", "name collegeName");

  if (!updatedReport) {
    return res.status(404).json({ error: { message: "Report not found." } });
  }

  return res.json({ data: updatedReport });
}
