import mongoose from "mongoose";

/**
 * Connect to MongoDB with timeout and lifecycle event listeners.
 * @param {string} uri - MongoDB connection string.
 */
export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI is required to establish database connection.");
  }

  mongoose.connection.on("connected", () => {
    console.info("MongoDB: Connection established successfully.");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB: Connection error encountered:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB: Connection lost. Reconnecting or awaiting restore...");
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== "production"
    });
    console.info("MongoDB connected readyState:", mongoose.connection.readyState);
  } catch (error) {
    console.error("Failed to connect to MongoDB. Check MONGODB_URI and IP whitelist.", error.message);
    throw error;
  }
}

/**
 * Returns current database connection state.
 * 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
 */
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
