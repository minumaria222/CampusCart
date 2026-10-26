import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  collegeName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  role: { type: String, enum: ["student", "admin"], default: "student", immutable: true },
  accountStatus: { type: String, enum: ["active", "suspended"], default: "active" }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
