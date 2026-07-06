import express from "express";
import { getCompilerHealth } from "../controllers/healthController.js";

const router = express.Router();

router.get("/compiler", getCompilerHealth);

export default router;