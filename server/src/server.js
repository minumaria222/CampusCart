import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

process.env.CLIENT_URL ||= "http://localhost:5173";

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be a valid TCP port.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not configured. Authentication endpoints will return 503 until it is set.");
} else if (process.env.JWT_SECRET.length < 32) {
  console.warn("JWT_SECRET should be at least 32 characters before using authentication.");
}

const app = createApp();
app.listen(port, () => {
  console.info(`CampusCart API listening on port ${port}.`);
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not configured. The server is running, but database-backed API routes return 503.");
    return;
  }
  connectDatabase(process.env.MONGODB_URI).catch(() => {
    console.warn("CampusCart API remains available, but database routes are disabled until MongoDB connects.");
  });
});
