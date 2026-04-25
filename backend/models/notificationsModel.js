const pool = require("../db/pool.js");

async function createNotification({
  userId,
  title,
  message,
  type,
  referenceId = null,
  client = null,
}) {
  const db = client || pool;
  const result = await db.query(
    "INSERT INTO notifications(user_id, title, message, type, reference_id) VALUES ($1::uuid, $2, $3, $4, $5) RETURNING id, user_id, title, message, type, reference_id, is_read, created_at",
    [userId, title, message, type, referenceId],
  );
  return result.rows?.[0] || null;
}

async function listNotifications({ userId, limit = 30, offset = 0, unreadOnly = false }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(100, Number(limit))) : 30;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;
  const where = unreadOnly ? "WHERE n.user_id = $1::uuid AND n.is_read = false" : "WHERE n.user_id = $1::uuid";
  const result = await pool.query(
    `SELECT n.id, n.user_id, n.title, n.message, n.type, n.reference_id, n.is_read, n.created_at
     FROM notifications n
     ${where}
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT $2 OFFSET $3`,
    [userId, safeLimit, safeOffset],
  );
  return result.rows || [];
}

async function getUnreadCount({ userId }) {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS unread_count FROM notifications WHERE user_id = $1::uuid AND is_read = false",
    [userId],
  );
  return result.rows?.[0]?.unread_count ?? 0;
}

async function markAllRead({ userId }) {
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1::uuid AND is_read = false",
    [userId],
  );
  return result.rowCount || 0;
}

async function markRead({ userId, notificationId }) {
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = $2 AND user_id = $1::uuid RETURNING id",
    [userId, notificationId],
  );
  return Boolean(result.rowCount);
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
};

