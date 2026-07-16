import { Router } from "express";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService.js";

const router = Router();

// GET /api/notifications?limit=20&before=<ISO date>&unreadOnly=true
router.get("/", async (req, res) => {
  try {
    const { limit, before, unreadOnly } = req.query;
    const notifications = await listNotifications(req.userDoc._id, {
      limit: limit ? parseInt(limit) : undefined,
      before: before || null,
      unreadOnly: unreadOnly === "true",
    });
    return res.json({ notifications });
  } catch (err) {
    req.log?.error?.({ err }, "[Notifications] list failed");
    return res.status(500).json({ error: "Failed to load notifications." });
  }
});

// GET /api/notifications/unread-count — cheap poll target for the bell badge
router.get("/unread-count", async (req, res) => {
  try {
    const count = await getUnreadCount(req.userDoc._id);
    return res.json({ count });
  } catch (err) {
    req.log?.error?.({ err }, "[Notifications] unread-count failed");
    return res.status(500).json({ error: "Failed to load unread count." });
  }
});

// POST /api/notifications/:id/read
router.post("/:id/read", async (req, res) => {
  try {
    await markAsRead(req.userDoc._id, req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "[Notifications] mark-read failed");
    return res.status(500).json({ error: "Failed to mark notification as read." });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", async (req, res) => {
  try {
    await markAllAsRead(req.userDoc._id);
    return res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "[Notifications] mark-all-read failed");
    return res.status(500).json({ error: "Failed to mark notifications as read." });
  }
});

export default router;