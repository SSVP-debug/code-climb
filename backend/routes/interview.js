/**
 * Interview Mode — premium feature.
 *
 * POST /api/interview/start    — begin a 45-min timed session for a problem
 * POST /api/interview/ask      — AI interviewer asks a follow-up question
 * POST /api/interview/submit   — submit final solution within the session
 * GET  /api/interview/:sessionId — get session status (time remaining, etc.)
 *
 * Sessions are stored in-memory (Map) — acceptable for MVP since interview
 * mode is low-volume. Move to Redis/MongoDB if this becomes a high-traffic
 * feature later.
 */
import { Router } from "express";
import { createRequire } from "module";
import Problem from "../models/Problem.js";
import { requirePremium } from "../middleware/premiumGate.js";

const require = createRequire(import.meta.url);
const router  = Router();

const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutes
const sessions = new Map(); // sessionId -> { userId, slug, startedAt, expiresAt, qaLog }

function getClaude() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    return new Anthropic();
  } catch {
    return null;
  }
}

// ── POST /api/interview/start ───────────────────────────────────────────────
router.post("/start", requirePremium, async (req, res) => {
  try {
    const { slug } = req.body;
    const problem = await Problem.findOne({ slug }).select("title difficulty topic description").lean();
    if (!problem) return res.status(404).json({ error: "Problem not found." });

    const sessionId = `iv_${req.userDoc._id}_${Date.now()}`;
    const now = Date.now();

    sessions.set(sessionId, {
      userId:    req.userDoc._id.toString(),
      slug,
      problemTitle: problem.title,
      startedAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      qaLog:     [],
      submitted: false,
    });

    return res.json({
      sessionId,
      problem: { title: problem.title, difficulty: problem.difficulty, topic: problem.topic },
      durationMs: SESSION_DURATION_MS,
      expiresAt:  now + SESSION_DURATION_MS,
    });
  } catch (err) {
    console.error("[Interview] start error:", err.message);
    return res.status(500).json({ error: "Failed to start interview session." });
  }
});

// ── POST /api/interview/ask ──────────────────────────────────────────────────
// AI interviewer asks a contextual follow-up based on the user's current code/approach.
router.post("/ask", requirePremium, async (req, res) => {
  try {
    const { sessionId, userMessage, currentCode } = req.body;
    const session = sessions.get(sessionId);

    if (!session) return res.status(404).json({ error: "Session not found or expired." });
    if (session.userId !== req.userDoc._id.toString()) {
      return res.status(403).json({ error: "Not your session." });
    }
    if (Date.now() > session.expiresAt) {
      return res.status(410).json({ error: "Interview session has expired." });
    }

    const claude = getClaude();
    if (!claude) {
      return res.status(503).json({
        error: "AI interviewer unavailable. Set ANTHROPIC_API_KEY to enable.",
      });
    }

    const conversationContext = session.qaLog
      .map(qa => `Interviewer: ${qa.question}\nCandidate: ${qa.answer}`)
      .join("\n\n");

    const prompt = `You are a senior software engineer conducting a live coding interview for the problem "${session.problemTitle}".
The candidate just said: "${userMessage}"
${currentCode ? `Their current code:\n${currentCode}\n` : ""}
${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

Respond as a real interviewer would: ask ONE focused follow-up question. Common angles: time/space complexity, edge cases, alternative approaches, why they chose this data structure. Keep it natural and conversational, 1-2 sentences. Do not write code yourself.`;

    const message = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const question = message.content?.[0]?.text?.trim() ?? "Can you walk me through your approach?";

    session.qaLog.push({ question, answer: userMessage, timestamp: Date.now() });

    return res.json({ question, timeRemainingMs: session.expiresAt - Date.now() });

  } catch (err) {
    console.error("[Interview] ask error:", err.message);
    return res.status(500).json({ error: "Failed to get interviewer response." });
  }
});

// ── POST /api/interview/submit ──────────────────────────────────────────────
router.post("/submit", requirePremium, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) return res.status(404).json({ error: "Session not found." });
    if (session.userId !== req.userDoc._id.toString()) {
      return res.status(403).json({ error: "Not your session." });
    }

    session.submitted = true;
    const durationUsedMs = Date.now() - session.startedAt;

    return res.json({
      success: true,
      sessionId,
      durationUsedMs,
      questionsAsked: session.qaLog.length,
    });

  } catch (err) {
    return res.status(500).json({ error: "Failed to submit interview." });
  }
});

// ── GET /api/interview/:sessionId ───────────────────────────────────────────
router.get("/:sessionId", requirePremium, (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.userId !== req.userDoc._id.toString()) {
    return res.status(403).json({ error: "Not your session." });
  }

  const timeRemainingMs = Math.max(0, session.expiresAt - Date.now());
  return res.json({
    slug: session.slug,
    problemTitle: session.problemTitle,
    timeRemainingMs,
    expired: timeRemainingMs === 0,
    questionsAsked: session.qaLog.length,
    submitted: session.submitted,
  });
});

// ── Periodic cleanup of expired sessions (every 10 min) ────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now > s.expiresAt + 60 * 60 * 1000) sessions.delete(id); // 1hr grace then purge
  }
}, 10 * 60 * 1000);

export default router;
