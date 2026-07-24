import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod;

// Starts an in-memory MongoDB instance and connects Mongoose to it. Call once
// per test file, in `beforeAll`. Real sparse-index / unique-index enforcement
// runs here — this is NOT a mock, which is the whole point (see
// backend/test/README.md, "Integration tier" section).
export async function startTestMongo() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

// Drops all collections between tests so each test starts from an empty DB
// without paying to spin up a new server per test. Call in `afterEach`.
export async function clearTestMongo() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

// Call in `afterAll`.
export async function stopTestMongo() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}