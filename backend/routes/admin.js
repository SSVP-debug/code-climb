import { Router } from "express";
import College from "../models/College.js";
import User from "../models/User.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.post(
  "/recruiters/:id/approve",
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user || user.role !== "recruiter") {
        return res.status(404).json({
          error: "Recruiter not found.",
        });
      }

      user.recruiterProfile.verified = true;
      user.recruiterProfile.verifiedAt = new Date();

      await user.save();

      return res.json({
        success: true,
      });
    } catch {
      return res.status(500).json({
        error: "Failed to approve recruiter.",
      });
    }
  }
);
export default router;