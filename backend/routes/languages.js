import express from "express";
import { getLanguages } from "../controllers/languageController.js";

const router = express.Router();

// Public, no-auth-required, same mounting pattern as /api/problems (see
// server.js) — this is content discovery, not user-specific data.
router.get("/", getLanguages);

export default router;
