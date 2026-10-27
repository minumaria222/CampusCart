import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [80, "Name cannot exceed 80 characters."]
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."]
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required."],
      select: false
    },
    collegeName: {
      type: String,
      required: [true, "College name is required."],
      trim: true,
      minlength: [2, "College name must be at least 2 characters."],
      maxlength: [120, "College name cannot exceed 120 characters."]
    },
    role: {
      type: String,
      enum: {
        values: ["student", "admin"],
        message: "Role must be either student or admin."
      },
      default: "student",
      immutable: true
    },
    accountStatus: {
      type: String,
      enum: {
        values: ["active", "suspended"],
        message: "Account status must be active or suspended."
      },
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);
