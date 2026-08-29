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

  // mongoose.connect() only SCHEDULES each already-registered model's
  // index build in the background — it does not wait for it to finish.
  // Any test that writes immediately after connect() can race ahead of
  // that background build, so a real, schema-declared constraint (e.g.
  // ReferralQualification's `unique: true` on referredUserId — see that
  // model's own comment: "the actual 'one referrer per account'
  // enforcement... a DB constraint, not just an application-level
  // check") isn't actually active in MongoDB yet for the earliest
  // writes. That's an intermittent false pass, not a real guarantee —
  // timing-dependent, so it can pass in one run and fail in the next
  // with no code change at all. Model.init() resolves once a model's
  // indexes have genuinely finished building (a no-op if already built),
  // so every test in every file using this harness now runs against a
  // database whose real constraints are guaranteed active from its very
  // first write, not merely "usually" active.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
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