import { Router } from "express";
import { saveProgress } from "../services/userProgressService.js";
import { logger } from "../config/logger.js";

const router = Router({ mergeParams: true });

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const note = req.userDoc?.problemNotes?.get(slug) ?? "";
    return res.json({ slug, note });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch note." });
  }
});

router.put("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { note } = req.body;

    if (typeof note !== "string") {
      return res.status(400).json({ error: "note must be a string." });
    }
    if (note.length > 5000) {
      return res.status(400).json({ error: "Note must be under 5000 characters." });
    }

    if (!req.userDoc.problemNotes) req.userDoc.problemNotes = new Map();
    req.userDoc.problemNotes.set(slug, note);

    // Dual-writes to User (still authoritative — see userProgressService)
    // and UserProgress. Sent as a plain object, not the live Map instance —
    // that's what both models' Map-typed problemNotes path casts cleanly
    // from in a $set update. (markModified()+userDoc.save() is no longer
    // needed here since the write now goes through saveProgress's
    // updateOne rather than saving this Mongoose document directly.)
    await saveProgress(req.userDoc._id, {
      problemNotes: Object.fromEntries(req.userDoc.problemNotes),
    });

    return res.json({ slug, saved: true });
  } catch (err) {
    logger.error({ err }, "[Notes] PUT error");
    return res.status(500).json({ error: "Failed to save note." });
  }
});

router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    req.userDoc.problemNotes?.delete(slug);

    await saveProgress(req.userDoc._id, {
      problemNotes: Object.fromEntries(req.userDoc.problemNotes ?? []),
    });

    return res.json({ slug, deleted: true });
  } catch (err) {
    logger.error({ err }, "[Notes] DELETE error");
    return res.status(500).json({ error: "Failed to delete note." });
  }
});

export default router;
