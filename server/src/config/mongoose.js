import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo() {
  mongoose.set("sanitizeFilter", true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log("MongoDB connected");
}
