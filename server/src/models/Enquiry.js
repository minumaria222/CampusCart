import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  status: { type: String, enum: ["Pending", "Responded", "Accepted", "Declined", "Closed"], default: "Pending" }
}, { timestamps: true });

export const Enquiry = mongoose.model("Enquiry", enquirySchema);
