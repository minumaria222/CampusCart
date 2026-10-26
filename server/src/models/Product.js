import mongoose from "mongoose";

export const PRODUCT_CATEGORIES = [
  "Textbooks and Notes", "Calculators and Electronics", "Lab Equipment", "Stationery",
  "Hostel Essentials", "Clothing and Accessories", "Sports Equipment", "Other"
];

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  category: { type: String, required: true, enum: PRODUCT_CATEGORIES },
  price: { type: Number, required: true, min: 0, max: 10000000 },
  condition: { type: String, required: true, enum: ["Like New", "Good", "Used"] },
  images: { type: [{ type: String, maxlength: 2048 }], default: [], validate: [(images) => images.length <= 5, "A listing can have at most 5 images."] },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  collegeName: { type: String, required: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ["Available", "Reserved", "Sold", "Removed"], default: "Available", index: true }
}, { timestamps: true });

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ category: 1, condition: 1, price: 1, status: 1 });

export const Product = mongoose.model("Product", productSchema);
