import express from "express";
import {
  getProblems,
  getProblemBySlug,
} from "../controllers/problemController.js";

const router = express.Router();

router.get("/", getProblems);
router.get("/:slug", getProblemBySlug);

export default router;