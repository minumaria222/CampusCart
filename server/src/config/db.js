import mongoose from "mongoose";

export async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.info("Connected to MongoDB.");
  } catch (error) {
    console.error("Could not connect to MongoDB. Check MONGODB_URI and database network access.");
    throw error;
  }
}
