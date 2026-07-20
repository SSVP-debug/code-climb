import { Router } from "express";
import { z } from "zod";
import { createRequire } from "module";
import Problem from "../models/Problem.js";
import { requirePremium } from "../middleware/premiumGate.js";
import { validateBody } from "../middleware/validateBody.js";
import { getSession, setSession, sweepExpiredMemorySessions } from "../services/interviewSessionStore.js";

const require = createRequire(import.meta.url);
const router  = Router();

const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutes
const GRACE_MS            = 60 * 60 * 1000; // kept readable past expiry, same as the old cleanup sweep
const SESSION_TTL_SECONDS = Math.ceil((SESSION_DURATION_MS + GRACE_MS) / 1000);

// ── Validation schemas ──────────────────────────────────────────────────────
// (Staff review §3/§9/#11: this file had no validation at all. userMessage/
// currentCode in particular feed directly into an Anthropic prompt — an
// unbounded body here isn't just a robustness gap, it's an uncapped AI-cost
// and payload-size surface, on top of the existing per-user rate limit.)
const startSchema = z.object({
  slug: z.string().trim().min(1, "slug is required").max(200),
});

const askSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required"),
  userMessage: z.string().trim().min(1, "userMessage is required").max(4000),
  currentCode: z.string().max(20_000).optional().default(""),
});

const submitSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required"),
});

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
router.post("/start", requirePremium, validateBody(startSchema), async (req, res) => {
  try {
    const { slug } = req.body;
    const problem = await Problem.findOne({ slug }).select("title difficulty topic description").lean();
    if (!problem) return res.status(404).json({ error: "Problem not found." });

    const sessionId = `iv_${req.userDoc._id}_${Date.now()}`;
    const now = Date.now();

    await setSession(sessionId, {
      userId:    req.userDoc._id.toString(),
      slug,
      problemTitle: problem.title,
      startedAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      qaLog:     [],
      submitted: false,
    }, SESSION_TTL_SECONDS);

    return res.json({
      sessionId,
      problem: { title: problem.title, difficulty: problem.difficulty, topic: problem.topic },
      durationMs: SESSION_DURATION_MS,
      expiresAt:  now + SESSION_DURATION_MS,
    });
  } catch (err) {
    req.log.error({ err }, "[Interview] start error");
    return res.status(500).json({ error: "Failed to start interview session." });
  }
});

// ── POST /api/interview/ask ──────────────────────────────────────────────────
// AI interviewer asks a contextual follow-up based on the user's current code/approach.
router.post("/ask", requirePremium, validateBody(askSchema), async (req, res) => {
  try {
    const { sessionId, userMessage, currentCode } = req.body;
    const session = await getSession(sessionId);

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
    await setSession(sessionId, session, SESSION_TTL_SECONDS);

    return res.json({ question, timeRemainingMs: session.expiresAt - Date.now() });

  } catch (err) {
    req.log.error({ err }, "[Interview] ask error");
    return res.status(500).json({ error: "Failed to get interviewer response." });
  }
});

// ── POST /api/interview/submit ──────────────────────────────────────────────
router.post("/submit", requirePremium, validateBody(submitSchema), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await getSession(sessionId);

    if (!session) return res.status(404).json({ error: "Session not found." });
    if (session.userId !== req.userDoc._id.toString()) {
      return res.status(403).json({ error: "Not your session." });
    }

    session.submitted = true;
    await setSession(sessionId, session, SESSION_TTL_SECONDS);
    const durationUsedMs = Date.now() - session.startedAt;

    return res.json({
      success: true,
      sessionId,
      durationUsedMs,
      questionsAsked: session.qaLog.length,
    });

  } catch (err) {
    req.log.error({ err }, "[Interview] submit error");
    return res.status(500).json({ error: "Failed to submit interview." });
  }
});

// ── GET /api/interview/:sessionId ───────────────────────────────────────────
router.get("/:sessionId", requirePremium, async (req, res) => {
  const session = await getSession(req.params.sessionId);
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

// ── Periodic cleanup of the in-memory fallback store (every 10 min) ────────
// No-op when Redis is configured — Redis's own key TTL (SESSION_TTL_SECONDS,
// set on every write) already expires those entries on its own.
setInterval(sweepExpiredMemorySessions, 10 * 60 * 1000);

export default router;