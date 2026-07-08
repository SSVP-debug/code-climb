import { Router } from "express";
import College from "../models/College.js";
import User from "../models/User.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.post(
  "/colleges/:id/approve",
  requireRole("admin"),
  async (req, res) => {
    try {
      const college = await College.findById(req.params.id);

      if (!college) {
        return res.status(404).json({ error: "College not found." });
      }

      if (college.verified) {
        return res.status(400).json({
          error: "College already verified.",
        });
      }

      college.verified = true;
      college.verifiedAt = new Date();
      await college.save();

      const user = await User.findById(college.adminUserId);

      if (user) {
        user.tpoProfile.verified = true;
        user.tpoProfile.verifiedAt = new Date();
        await user.save();
      }

      return res.json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        error: "Failed to approve college.",
      });
    }
  }
);

export default router;