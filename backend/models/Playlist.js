import mongoose from "mongoose";

/**
 * Playlist — curated problem collections.
 *
 * Two kinds, one collection (mirrors the pinnedProblems vs savedProblems
 * split in spirit, but this needs its own top-level model since playlists
 * are listable/ownable objects in their own right, not a sub-array on
 * User): official playlists (ownerId: null, isOfficial: true — seeded via
 * scripts/seedPlaylists.js, same upsert-on-name convention as
 * seedProblems.js) and custom playlists a user builds themselves
 * (ownerId set, isOfficial: false). Ownership/official-immutability is
 * enforced in the route, not here, matching the pinnedProblems cap
 * convention (schema-level checks are awkward with Mongoose update
 * operators).
 */
const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = official
    },
    isOfficial: { type: Boolean, default: false },
    problemSlugs: [{ type: String }],
  },
  { timestamps: true }
);

// Covers both list queries this feature needs: "all official playlists"
// and "this user's own playlists".
playlistSchema.index({ isOfficial: 1 });
playlistSchema.index({ ownerId: 1 });

export default mongoose.model("Playlist", playlistSchema);