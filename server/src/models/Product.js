import mongoose from "mongoose";

export const PRODUCT_CATEGORIES = [
  "Textbooks and Notes",
  "Calculators and Electronics",
  "Lab Equipment",
  "Stationery",
  "Hostel Essentials",
  "Clothing and Accessories",
  "Sports Equipment",
  "Other"
];

export const PRODUCT_CONDITIONS = ["Like New", "Good", "Used"];
export const PRODUCT_STATUSES = ["Available", "Reserved", "Sold", "Removed"];

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Listing title is required."],
      trim: true,
      minlength: [3, "Title must be at least 3 characters."],
      maxlength: [100, "Title cannot exceed 100 characters."]
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      trim: true,
      minlength: [10, "Description must be at least 10 characters."],
      maxlength: [2000, "Description cannot exceed 2000 characters."]
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: "Invalid product category selected."
      }
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
      max: [10000000, "Price exceeds allowed limit."]
    },
    condition: {
      type: String,
      required: [true, "Condition is required."],
      enum: {
        values: PRODUCT_CONDITIONS,
        message: "Condition must be 'Like New', 'Good', or 'Used'."
      }
    },
    images: {
      type: [{ type: String, maxlength: 2048 }],
      default: [],
      validate: [
        (images) => images.length <= 5,
        "A listing can include at most 5 images."
      ]
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller reference is required."],
      index: true
    },
    collegeName: {
      type: String,
      required: [true, "College name is required."],
      trim: true,
      maxlength: [120, "College name cannot exceed 120 characters."]
    },
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: "Available",
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
productSchema.index({ category: 1, condition: 1, price: 1, status: 1, isDeleted: 1 });

export const Product = mongoose.model("Product", productSchema);
