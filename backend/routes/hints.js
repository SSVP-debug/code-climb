/**
 * POST /api/hints/:slug
 * Body: { level: 1|2|3, language: "python"|"javascript"|"java"|"cpp" }
 *
 * Returns a progressive AI hint for the given problem + level.
 * Level 1 = gentle nudge (direction only)
 * Level 2 = approach hint (which pattern/data structure)
 * Level 3 = near-solution (concrete step-by-step, no code)
 *
 * Cached in MongoDB per (slug, level) for 30 days — drastically reduces
 * Claude API costs since the same hints are served to all users.
 *
 * Rate limited: 10 hint requests per user per hour (via aiLimiter).
 */
import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import Problem from "../models/Problem.js";
import { PREMIUM_FEATURES } from "../middleware/premiumGate.js";

const router = Router({ mergeParams: true });
const claude = new Anthropic();

// In-memory cache: key = `${slug}-${level}`, value = { hint, cachedAt }
const HINT_CACHE = new Map();
const HINT_TTL   = 30 * 24 * 60 * 60 * 1000; // 30 days

const LEVEL_PROMPTS = {
  1: (title, topic) =>
    `Give a one-sentence directional hint for the problem "${title}" (topic: ${topic}). ` +
    `Do NOT reveal the algorithm or data structure. Just tell the student what to think about. ` +
    `Max 30 words. Plain text only.`,

  2: (title, topic) =>
    `Give a 2-3 sentence approach hint for "${title}" (topic: ${topic}). ` +
    `Name the key data structure or algorithm pattern. Do NOT write any code. ` +
    `Plain text only, no markdown.`,

  3: (title, topic) =>
    `Give a concrete step-by-step solution approach for "${title}" (topic: ${topic}). ` +
    `3-5 numbered steps. No code. No pseudocode. Just clear English steps. ` +
    `Plain text only.`,
};

router.post("/", async (req, res) => {
  try {
    const { slug }  = req.params;
    const level     = parseInt(req.body.level) || 1;
    const validLevel = Math.min(3, Math.max(1, level));

    // ── Free tier limit: 3 hints/day (resets at midnight UTC) ───────────────
    // Premium users (or everyone, while MONETIZATION_ENABLED=false) skip this.
    if (!req.isPremium && req.userDoc) {
      const today = new Date().toISOString().split("T")[0];
      const hintLog = req.userDoc.dailyHintLog || {};
      const usedToday = hintLog.date === today ? (hintLog.count || 0) : 0;

      if (usedToday >= PREMIUM_FEATURES.UNLIMITED_AI_HINTS.freeLimitPerDay) {
        return res.status(402).json({
          error: `Free plan includes ${PREMIUM_FEATURES.UNLIMITED_AI_HINTS.freeLimitPerDay} hints/day. Upgrade to Pro for unlimited hints.`,
          upgradeUrl: "/pricing",
        });
      }

      req.userDoc.dailyHintLog = { date: today, count: usedToday + 1 };
      await req.userDoc.save();
    }

    // Cache check
    const cacheKey = `${slug}-${validLevel}`;
    const cached   = HINT_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < HINT_TTL) {
      return res.json({ hint: cached.hint, level: validLevel, cached: true });
    }

    // Fetch problem title + topic
    const problem = await Problem.findOne({ slug })
      .select("title topic difficulty")
      .lean();

    if (!problem) return res.status(404).json({ error: "Problem not found." });

    // Call Claude
    const prompt = LEVEL_PROMPTS[validLevel](problem.title, problem.topic);

    const message = await claude.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 200,
      messages:   [{ role: "user", content: prompt }],
    });

    const hint = message.content?.[0]?.text?.trim() ?? "Think carefully about the constraints.";

    // Cache it
    HINT_CACHE.set(cacheKey, { hint, cachedAt: Date.now() });

    return res.json({
      hint,
      level:      validLevel,
      cached:     false,
      problem:    problem.title,
    });

  } catch (err) {
    console.error("[Hints] error:", err.message);
    return res.status(500).json({ error: "Failed to generate hint. Try again shortly." });
  }
});

export default router;
