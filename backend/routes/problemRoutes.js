import express from "express";
import {
  getProblems,
  getProblemBySlug,
} from "../controllers/problemController.js";
import editorialRoutes from "./editorial.js";

const router = express.Router();

router.get("/", getProblems);
router.get("/:slug", getProblemBySlug);
router.use("/:slug/editorial", editorialRoutes);

export default router;