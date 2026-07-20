import { Router } from "express";
import crypto from "crypto";
import { createRequire } from "module";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import { SITE_URL } from "../config/site.js";
import { topicStatsToObject } from "../utils/topicStats.js";

const router  = Router();
const require = createRequire(import.meta.url);

// ── Track definitions — each track = a topic + min problem count ─────────────
export const TRACKS = [
  { id: "arrays",              name: "Arrays Master",              topic: "Arrays",              minSolve: 10 },
  { id: "dynamic-programming", name: "DP Specialist",              topic: "Dynamic Programming", minSolve: 15 },
  { id: "graphs",              name: "Graph Explorer",             topic: "Graphs",              minSolve: 10 },
  { id: "trees",               name: "Tree Climber",               topic: "Trees",               minSolve: 8  },
  { id: "binary-search",       name: "Binary Search Pro",          topic: "Binary Search",       minSolve: 6  },
  { id: "stacks",              name: "Stack Architect",            topic: "Stacks",              minSolve: 8  },
  { id: "two-pointers",        name: "Two Pointer Tactician",      topic: "Two Pointers",        minSolve: 6  },
  { id: "backtracking",        name: "Backtracking Expert",        topic: "Backtracking",        minSolve: 6  },
  { id: "linked-list",         name: "Linked List Engineer",       topic: "Linked List",         minSolve: 6  },
  { id: "heap",                name: "Heap Master",                topic: "Heap",                minSolve: 6  },
];

// ── GET /api/cert/tracks ────────────────────────────────────────────────────
router.get("/tracks", async (req, res) => {
  try {
    const topicStats = topicStatsToObject(req.userDoc?.topicStats);
    const earned = new Set((req.userDoc?.certificates || []).map(c => c.trackId));

    const tracks = TRACKS.map(t => ({
      ...t,
      solved:    topicStats[t.topic] || 0,
      progress:  Math.min(100, Math.round(((topicStats[t.topic] || 0) / t.minSolve) * 100)),
      complete:  (topicStats[t.topic] || 0) >= t.minSolve,
      certified: earned.has(t.id),
    }));

    return res.json({ tracks });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load tracks." });
  }
});

// ── POST /api/cert/claim/:trackId ───────────────────────────────────────────
router.post("/claim/:trackId", async (req, res) => {
  try {
    const track = TRACKS.find(t => t.id === req.params.trackId);
    if (!track) return res.status(404).json({ error: "Track not found." });

    const topicStats = topicStatsToObject(req.userDoc?.topicStats);
    const solved = topicStats[track.topic] || 0;
    if (solved < track.minSolve) {
      return res.status(400).json({
        error: `Need ${track.minSolve} ${track.topic} problems solved. You have ${solved}.`,
        solved, required: track.minSolve,
      });
    }

    // Already certified?
    const already = (req.userDoc.certificates || []).find(c => c.trackId === track.id);
    if (already) {
      return res.json({ alreadyClaimed: true, verifyCode: already.verifyCode });
    }

    // Generate unique 8-char verify code
    const verifyCode = crypto.randomBytes(4).toString("hex"); // 8 hex chars

    req.userDoc.certificates = req.userDoc.certificates || [];
    req.userDoc.certificates.push({
      trackId:   track.id,
      trackName: track.name,
      issuedAt:  new Date(),
      verifyCode,
    });
    await req.userDoc.save();

    return res.json({ success: true, trackName: track.name, verifyCode });
  } catch (err) {
    req.log.error({ err }, "[Cert] claim");
    return res.status(500).json({ error: "Failed to claim certificate." });
  }
});

// ── GET /api/cert/verify/:code (public) ─────────────────────────────────────
router.get("/verify/:code", async (req, res) => {
  try {
    const user = await User.findOne({
      "certificates.verifyCode": req.params.code,
    }).select("username displayName certificates").lean();

    if (!user) return res.status(404).json({ valid: false, error: "Certificate not found." });

    const cert = user.certificates.find(c => c.verifyCode === req.params.code);
    return res.json({
      valid: true,
      username:    user.username,
      displayName: user.displayName,
      trackName:   cert.trackName,
      issuedAt:    cert.issuedAt,
      verifyCode:  cert.verifyCode,
    });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed." });
  }
});

// ── GET /api/cert/:code/pdf — download certificate PDF (commit 088) ──────────
router.get("/:code/pdf", async (req, res) => {
  let PDFDocument, QRCode;
  try { PDFDocument = require("pdfkit"); } catch {
    return res.status(503).json({ error: "pdfkit not installed. Run: cd backend && npm install pdfkit" });
  }
  try { QRCode = require("qrcode"); } catch {
    return res.status(503).json({ error: "qrcode not installed. Run: cd backend && npm install qrcode" });
  }

  try {
    const user = await User.findOne({
      "certificates.verifyCode": req.params.code,
    }).select("username displayName certificates").lean();

    if (!user) return res.status(404).json({ error: "Certificate not found." });
    const cert = user.certificates.find(c => c.verifyCode === req.params.code);

    const verifyUrl = `${SITE_URL}/verify/${cert.verifyCode}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 120, margin: 1 });

    const doc = new PDFDocument({ size: "A4", margin: 60 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="codeclub_cert_${cert.verifyCode}.pdf"`);
    doc.pipe(res);

    // Border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(3).strokeColor("#22c55e").stroke();
    doc.rect(36, 36, doc.page.width - 72, doc.page.height - 72)
       .lineWidth(1).strokeColor("#16a34a").stroke();

    // Header
    doc.fontSize(12).fillColor("#22c55e").font("Helvetica-Bold")
       .text("CODE CLUB", { align: "center" }).moveDown(0.5);

    doc.fontSize(28).fillColor("#18181b").font("Helvetica-Bold")
       .text("Certificate of Achievement", { align: "center" }).moveDown(1);

    doc.fontSize(12).fillColor("#71717a").font("Helvetica")
       .text("This certifies that", { align: "center" }).moveDown(0.5);

    doc.fontSize(24).fillColor("#111827").font("Helvetica-Bold")
       .text(user.displayName || user.username, { align: "center" }).moveDown(0.5);

    doc.fontSize(12).fillColor("#71717a").font("Helvetica")
       .text("has successfully completed the", { align: "center" }).moveDown(0.5);

    doc.fontSize(18).fillColor("#16a34a").font("Helvetica-Bold")
       .text(cert.trackName, { align: "center" }).moveDown(1);

    doc.fontSize(10).fillColor("#9ca3af").font("Helvetica")
       .text(`Issued on ${new Date(cert.issuedAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}`, { align: "center" })
       .moveDown(0.5);

    doc.fontSize(10).fillColor("#9ca3af")
       .text(`Certificate ID: ${cert.verifyCode}`, { align: "center" }).moveDown(2);

    // QR code centered
    const qrX = (doc.page.width - 120) / 2;
    doc.image(qrBuffer, qrX, doc.y, { width: 120 });
    doc.moveDown(0.5);

    doc.fontSize(9).fillColor("#6b7280")
       .text("Scan to verify authenticity", { align: "center" }).moveDown(0.3);
    doc.fontSize(8).fillColor("#9ca3af")
       .text(verifyUrl, { align: "center", link: verifyUrl });

    doc.end();
  } catch (err) {
    req.log.error({ err }, "[Cert] PDF");
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate certificate PDF." });
  }
});

export default router;