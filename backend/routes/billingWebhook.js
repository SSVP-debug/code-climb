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

    if (!signature) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid signature",
        });
    }

    // Constant-time comparison — a plain !== leaks timing information about
    // how many leading bytes matched, which an attacker can use to forge a
    // valid signature byte-by-byte. Buffers are compared by length first
    // since crypto.timingSafeEqual throws on mismatched lengths rather than
    // returning false.
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    const isValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
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