import mongoose from "mongoose";

export const REPORT_REASONS = [
  "Suspicious listing",
  "Prohibited item",
  "Misleading information",
  "Inappropriate content",
  "Other"
];

export const REPORT_STATUSES = ["Pending", "Reviewed", "Resolved"];

const reportSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Reported product reference is required."],
      index: true
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference is required."],
      index: true
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: [true, "Report reason is required."]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters."],
      default: ""
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "Pending",
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Strictly enforce one report per student per listing
reportSchema.index({ product: 1, reporter: 1 }, { unique: true });

export const Report = mongoose.model("Report", reportSchema);
