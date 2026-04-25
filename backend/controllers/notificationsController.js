const notificationsModel = require("../models/notificationsModel.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function getUnreadCount(req, res) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const unreadCount = await notificationsModel.getUnreadCount({ userId });
    return res.json({ ok: true, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function list(req, res) {
  const userId = req.query?.userId;
  const limit = req.query?.limit;
  const offset = req.query?.offset;
  const unreadOnly = String(req.query?.unreadOnly || "").toLowerCase() === "true";
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const notifications = await notificationsModel.listNotifications({
      userId,
      limit,
      offset,
      unreadOnly,
    });
    return res.json({ ok: true, notifications });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function markAllRead(req, res) {
  const userId = req.body?.userId || req.query?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const updated = await notificationsModel.markAllRead({ userId });
    const unreadCount = await notificationsModel.getUnreadCount({ userId });
    return res.json({ ok: true, updated, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function markOneRead(req, res) {
  const userId = req.body?.userId || req.query?.userId;
  const notificationId = req.params?.id;
  if (!userId || !notificationId) {
    return res.status(400).json({ ok: false, error: "userId and id are required" });
  }

  try {
    const ok = await notificationsModel.markRead({ userId, notificationId });
    const unreadCount = await notificationsModel.getUnreadCount({ userId });
    return res.json({ ok: true, updated: ok, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  getUnreadCount,
  list,
  markAllRead,
  markOneRead,
};

