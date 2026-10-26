import mongoose from "mongoose";

export const REPORT_REASONS = ["Suspicious listing", "Prohibited item", "Misleading information", "Inappropriate content", "Other"];

const reportSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["Pending", "Reviewed", "Resolved"], default: "Pending", index: true }
}, { timestamps: true });

reportSchema.index({ product: 1, reporter: 1 }, { unique: true });

export const Report = mongoose.model("Report", reportSchema);
