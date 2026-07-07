import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const signature =
      req.headers["x-razorpay-signature"];

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(req.body)
        .digest("hex");

    if (signature !== expectedSignature) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid signature",
        });
    }

    const payload = JSON.parse(
      req.body.toString()
    );

    console.log(
      "Webhook event:",
      payload.event
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
    });
  }
});

export default router;