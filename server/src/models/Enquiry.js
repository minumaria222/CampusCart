import mongoose from "mongoose";

export const ENQUIRY_STATUSES = ["Pending", "Responded", "Accepted", "Declined", "Closed"];

const enquirySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required."],
      index: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer reference is required."],
      index: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller reference is required."],
      index: true
    },
    message: {
      type: String,
      required: [true, "Message is required."],
      trim: true,
      minlength: [10, "Message must be at least 10 characters."],
      maxlength: [1000, "Message cannot exceed 1000 characters."]
    },
    status: {
      type: String,
      enum: ENQUIRY_STATUSES,
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

enquirySchema.index({ seller: 1, createdAt: -1 });
enquirySchema.index({ buyer: 1, createdAt: -1 });

export const Enquiry = mongoose.model("Enquiry", enquirySchema);
