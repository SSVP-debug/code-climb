import { Router } from "express";

import {
  getPublicProfile,
} from "../controllers/publicProfileController.js";

const router = Router();

router.get(
  "/u/:username",
  getPublicProfile
);

export default router;