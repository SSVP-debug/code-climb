import express from "express";
import { getAnnouncement } from "../controllers/adminSettingsController.js";

const router = express.Router();

// GET /api/announcement — public, no auth. See adminSettingsController.js's
// getAnnouncement for why this only ever exposes { text, active }.
router.get("/", getAnnouncement);

export default router;