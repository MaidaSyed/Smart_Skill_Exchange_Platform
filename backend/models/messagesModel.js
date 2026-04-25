const pool = require("../db/pool.js");
const notificationsModel = require("./notificationsModel.js");

async function canMessage({ userId, otherUserId }) {
  const result = await pool.query(
    "SELECT (" +
      "EXISTS (SELECT 1 FROM learning_requests lr WHERE (lr.learner_id = $1::uuid AND lr.teacher_id = $2::uuid) OR (lr.learner_id = $2::uuid AND lr.teacher_id = $1::uuid)) " +
      "OR EXISTS (SELECT 1 FROM sessions s WHERE (s.learner_id = $1::uuid AND s.teacher_id = $2::uuid) OR (s.learner_id = $2::uuid AND s.teacher_id = $1::uuid)) " +
      "OR EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = $1::uuid AND m.receiver_id = $2::uuid) OR (m.sender_id = $2::uuid AND m.receiver_id = $1::uuid))" +
      ") AS ok",
    [userId, otherUserId],
  );
  return Boolean(result.rows?.[0]?.ok);
}

async function canSendMessage({ userId, otherUserId }) {
  const result = await pool.query(
    "SELECT (" +
      "EXISTS (" +
      "SELECT 1 FROM sessions s " +
      "WHERE ((s.learner_id = $1::uuid AND s.teacher_id = $2::uuid) OR (s.learner_id = $2::uuid AND s.teacher_id = $1::uuid)) " +
      "AND s.chat_enabled_at IS NOT NULL " +
      "AND s.chat_expires_at IS NOT NULL " +
      "AND now() >= s.chat_enabled_at " +
      "AND now() <= s.chat_expires_at" +
      ")" +
      ") AS ok",
    [userId, otherUserId],
  );
  return Boolean(result.rows?.[0]?.ok);
}

async function getActiveChatSessionId({ userId, otherUserId }) {
  const result = await pool.query(
    "SELECT s.id " +
      "FROM sessions s " +
      "WHERE ((s.learner_id = $1::uuid AND s.teacher_id = $2::uuid) OR (s.learner_id = $2::uuid AND s.teacher_id = $1::uuid)) " +
      "AND s.chat_enabled_at IS NOT NULL " +
      "AND s.chat_expires_at IS NOT NULL " +
      "AND now() >= s.chat_enabled_at " +
      "AND now() <= s.chat_expires_at " +
      "ORDER BY s.chat_enabled_at DESC, s.id DESC " +
      "LIMIT 1",
    [userId, otherUserId],
  );
  return result.rows?.[0]?.id || null;
}

async function getLatestExpiredChatSessionId({ userId, otherUserId }) {
  const result = await pool.query(
    "SELECT s.id " +
      "FROM sessions s " +
      "WHERE ((s.learner_id = $1::uuid AND s.teacher_id = $2::uuid) OR (s.learner_id = $2::uuid AND s.teacher_id = $1::uuid)) " +
      "AND s.chat_enabled_at IS NOT NULL " +
      "AND s.chat_expires_at IS NOT NULL " +
      "AND now() > s.chat_expires_at " +
      "ORDER BY s.chat_expires_at DESC, s.id DESC " +
      "LIMIT 1",
    [userId, otherUserId],
  );
  return result.rows?.[0]?.id || null;
}

async function ensureChatExpiredNotification({ userId, sessionId }) {
  if (!userId || !sessionId) return false;
  const exists = await pool.query(
    "SELECT 1 FROM notifications WHERE user_id = $1::uuid AND type = 'chat_expired' AND reference_id = $2 LIMIT 1",
    [userId, sessionId],
  );
  if (exists.rows?.length) return true;
  await notificationsModel.createNotification({
    userId,
    title: "Session chat expired",
    message: "This session chat has expired.",
    type: "chat_expired",
    referenceId: sessionId,
  });
  return true;
}

async function listConversations({ userId, search = null, limit = 50 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const values = [userId];
  let idx = 2;

  const filters = [];
  if (search) {
    filters.push(`COALESCE(p.full_name,'') ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await pool.query(
    "WITH base AS (" +
      "SELECT " +
      "CASE WHEN m.sender_id = $1::uuid THEN m.receiver_id ELSE m.sender_id END AS other_user_id, " +
      "m.id, m.message_text, m.created_at, m.sender_id, m.receiver_id " +
      "FROM messages m " +
      "WHERE m.sender_id = $1::uuid OR m.receiver_id = $1::uuid" +
      "), last_msg AS (" +
      "SELECT DISTINCT ON (b.other_user_id) b.other_user_id, b.message_text AS last_message, b.created_at AS last_at, b.sender_id AS last_sender_id " +
      "FROM base b " +
      "ORDER BY b.other_user_id, b.created_at DESC, b.id DESC" +
      "), unread AS (" +
      "SELECT m.sender_id AS other_user_id, COUNT(*)::int AS unread_count " +
      "FROM messages m " +
      "WHERE m.receiver_id = $1::uuid AND m.is_read = false " +
      "GROUP BY m.sender_id" +
      ") " +
      "SELECT lm.other_user_id, COALESCE(p.full_name,'User') AS full_name, p.bio, lm.last_message, lm.last_at, lm.last_sender_id, COALESCE(u.unread_count,0) AS unread_count " +
      "FROM last_msg lm " +
      "LEFT JOIN user_profiles p ON p.auth_user_id = lm.other_user_id " +
      "LEFT JOIN unread u ON u.other_user_id = lm.other_user_id " +
      where +
      " ORDER BY lm.last_at DESC, lm.other_user_id ASC " +
      `LIMIT ${safeLimit}`,
    values,
  );
  return result.rows || [];
}

async function listMessages({ userId, otherUserId, limit = 50 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const result = await pool.query(
    "SELECT id, sender_id, receiver_id, message_text, is_read, created_at " +
      "FROM messages " +
      "WHERE (sender_id = $1::uuid AND receiver_id = $2::uuid) OR (sender_id = $2::uuid AND receiver_id = $1::uuid) " +
      "ORDER BY created_at DESC, id DESC " +
      "LIMIT $3",
    [userId, otherUserId, safeLimit],
  );
  return result.rows || [];
}

async function sendMessage({
  senderId,
  receiverId,
  messageText,
  requestId = null,
  sessionId = null,
}) {
  const ok = await canSendMessage({ userId: senderId, otherUserId: receiverId });
  if (!ok) return null;

  const trimmed = String(messageText || "").trim();
  if (!trimmed) return null;

  const activeSessionId = sessionId || (await getActiveChatSessionId({ userId: senderId, otherUserId: receiverId }));
  if (!activeSessionId) return null;

  const inserted = await pool.query(
    "INSERT INTO messages(sender_id, receiver_id, request_id, session_id, message_text) VALUES ($1::uuid, $2::uuid, $3, $4, $5) " +
      "RETURNING id, sender_id, receiver_id, request_id, session_id, message_text, is_read, created_at",
    [senderId, receiverId, requestId || null, activeSessionId, trimmed],
  );
  const msg = inserted.rows?.[0] || null;
  if (!msg) return null;

  const title = "New message";
  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
  await notificationsModel.createNotification({
    userId: receiverId,
    title,
    message: preview,
    type: "new_message",
    referenceId: msg.id,
  });

  return msg;
}

async function markRead({ userId, otherUserId }) {
  const result = await pool.query(
    "UPDATE messages SET is_read = true WHERE receiver_id = $1::uuid AND sender_id = $2::uuid AND is_read = false",
    [userId, otherUserId],
  );
  return result.rowCount || 0;
}

async function getUnreadCount({ userId }) {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS unread_count FROM messages WHERE receiver_id = $1::uuid AND is_read = false",
    [userId],
  );
  return result.rows?.[0]?.unread_count ?? 0;
}

module.exports = {
  canMessage,
  canSendMessage,
  getActiveChatSessionId,
  getLatestExpiredChatSessionId,
  ensureChatExpiredNotification,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
  getUnreadCount,
};
