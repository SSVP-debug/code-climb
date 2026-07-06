import mongoose from "mongoose";

/**
 * Campus Ambassador — an application/approval layer on top of the
 * existing referral system (routes/referral.js), not a parallel one.
 * An approved ambassador's actual referral tracking (code, referredBy,
 * referredCount) is the same referralCode/referredBy fields already on
 * User — this model only tracks the application workflow and the
 * ambassador-specific milestone rewards on top of that.
 */
const ambassadorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    collegeName: { type: String, required: true, trim: true },
    collegeDomain: { type: String, required: true, trim: true, lowercase: true },
    motivation: { type: String, trim: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: null },

    // Milestone ids already claimed (see config/ambassadorMilestones.js) —
    // prevents double-claiming the same reward.
    milestonesClaimed: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Ambassador = mongoose.model("Ambassador", ambassadorSchema);

export default Ambassador;