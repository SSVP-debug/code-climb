import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: String,
    displayName: String,
    leetcodeUsername: String,
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    solvedSlugs: {
      type: [String],
      default: [],
    },
    topicStats: {
      type: Map,
      of: Number,
      default: {},
    },
    activityDates: {
      type: [String],
      default: [],
    },
    solvedDifficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    recentActivity: {
      type: [
        {
          title: String,
          time: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
