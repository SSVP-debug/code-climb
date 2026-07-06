import mongoose from "mongoose";
import { getMongoUri, maskMongoUri } from "./env.js";
import { logger } from "./logger.js";

export default async function connectDB() {
  const uri = getMongoUri();

  

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    
  } catch (error) {
    const hint = uri.startsWith("mongodb://127.0.0.1")
      ? "No local MongoDB detected. Use MongoDB Atlas and set MONGODB_URI in backend/.env to your Atlas connection string (one line)."
      : undefined;

    logger.error(
      { err: error, hint },
      "[MongoDB] Connection failed"
    );

    throw error;
  }
}