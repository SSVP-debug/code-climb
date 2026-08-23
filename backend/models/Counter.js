import mongoose from "mongoose";

/**
 * Counter.js — atomic sequence generator, backing human-readable IDs like
 * Opportunity Radar's CC/001, CC/002, ... .
 *
 * Deliberately NOT the "find highest id, add 1" pattern used by
 * adminProblemController.js's nextAdminProblemId() — that file's own
 * comment flags it as a real (if currently low-probability) race under
 * concurrent creates. A single doc per counter name + MongoDB's atomic
 * findOneAndUpdate($inc) makes two concurrent callers provably never see
 * the same value, no unique-index-collision retry loop needed.
 *
 * Usage:
 *   import { nextSequence } from "./Counter.js";
 *   const n = await nextSequence("opportunity"); // 1, 2, 3, ...
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // counter name, e.g. "opportunity"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

export async function nextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export default Counter;
