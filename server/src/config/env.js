import "dotenv/config";
import path from "node:path";

const required = ["DATABASE_URL", "MONGODB_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  aiServiceTimeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS || 120000),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "./storage/uploads"),
  maxFileSize: Number(process.env.MAX_FILE_SIZE_MB || 15) * 1024 * 1024
};
