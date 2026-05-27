import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { runCode } from "../controllers/compilerController.js";

const router = Router();

router.post("/run", requireAuth, runCode);

export default router;
