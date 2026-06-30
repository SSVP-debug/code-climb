/**
 * GET  /api/notes/:slug   — get user's note for a problem
 * PUT  /api/notes/:slug   — save/update note (body: { note: "..." })
 * DELETE /api/notes/:slug — delete note
 *
 * Notes are stored as User.problemNotes Map<slug → text>.
 * Max 5000 chars per note to prevent abuse.
 */
import { Router } from "express";

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
    req.userDoc.markModified("problemNotes");
    await req.userDoc.save();

    return res.json({ slug, saved: true });
  } catch (err) {
    console.error("[Notes] PUT error:", err.message);
    return res.status(500).json({ error: "Failed to save note." });
  }
});

router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    req.userDoc.problemNotes?.delete(slug);
    req.userDoc.markModified("problemNotes");
    await req.userDoc.save();
    return res.json({ slug, deleted: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete note." });
  }
});

export default router;
