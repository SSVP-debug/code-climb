import mongoose from "mongoose";
import { getMongoUri, maskMongoUri } from "./env.js";

export default async function connectDB() {
  const uri = getMongoUri();

  console.log(
    `[MongoDB] Connecting to ${maskMongoUri(uri)}`
  );

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB] Connected (database: ${mongoose.connection.name})`
    );
  } catch (error) {
    console.error("[MongoDB] Connection failed:");
    console.error(`  Message: ${error.message}`);

    if (uri.startsWith("mongodb://127.0.0.1")) {
      console.error(
        "  Hint: No local MongoDB detected. Use MongoDB Atlas and set MONGODB_URI in backend/.env to your Atlas connection string (one line)."
      );
    }

    throw error;
  }
}
