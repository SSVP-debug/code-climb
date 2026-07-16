import { Router } from "express";
import Problem from "../models/Problem.js";
import { isUserPremium } from "./billing.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { slug } = req.params;
    const problem  = await Problem.findOne({ slug }).select("editorial slug title").lean();

    if (!problem) return res.status(404).json({ error: "Problem not found." });

    // Check if user has solved this problem (userDoc populated by requireAuth)
    const solved   = req.userDoc?.solvedSlugs?.includes(slug) ?? false;
    const isAdmin = req.userDoc?.role === "admin";
    // Premium users can read any editorial without solving first — see PREMIUM_FEATURES.EDITORIAL_ACCESS
    const premium  = isUserPremium(req.userDoc);

    if (!solved && !isAdmin && !premium) {
      return res.status(403).json({
        error: "Solve this problem first to unlock the editorial.",
        locked: true,
      });
    }

    if (!problem.editorial?.content) {
      return res.json({ slug, content: "", available: false });
    }

    return res.json({
      slug,
      content:   problem.editorial.content,
      author:    problem.editorial.author  || "Code Club",
      updatedAt: problem.editorial.updatedAt,
      available: true,
    });

  } catch (err) {
    console.error("[Editorial] GET error:", err.message);
    return res.status(500).json({ error: "Failed to load editorial." });
  }
});

router.post("/", requireRole("admin"), async (req, res) => {
  try {
    const { slug }    = req.params;
    const { content } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string." });
    }

    const problem = await Problem.findOneAndUpdate(
      { slug },
      { "editorial.content": content, "editorial.updatedAt": new Date() },
      { new: true }
    ).select("slug editorial");

    if (!problem) return res.status(404).json({ error: "Problem not found." });

    return res.json({ slug, saved: true });
  } catch (err) {
    console.error("[Editorial] POST error:", err.message);
    return res.status(500).json({ error: "Failed to save editorial." });
  }
});

export default router;