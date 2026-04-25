const messagesModel = require("../models/messagesModel.js");
const reviewsModel = require("../models/reviewsModel.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function getConversations(req, res) {
  const userId = req.query?.userId;
  const search = req.query?.search || null;
  const limit = req.query?.limit || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const conversations = await messagesModel.listConversations({ userId, search, limit });
    return res.json({ ok: true, conversations });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function getThread(req, res) {
  const userId = req.query?.userId;
  const otherUserId = req.query?.otherUserId;
  const limit = req.query?.limit || null;
  if (!userId || !otherUserId) {
    return res.status(400).json({ ok: false, error: "userId and otherUserId are required" });
  }

  try {
    const ok = await messagesModel.canMessage({ userId, otherUserId });
    if (!ok) {
      return res.status(403).json({ ok: false, error: "Messaging not allowed with this user." });
    }
    const canSend = await messagesModel.canSendMessage({ userId, otherUserId });
    if (!canSend) {
      const expiredSessionId = await messagesModel.getLatestExpiredChatSessionId({ userId, otherUserId });
      if (expiredSessionId) {
        await messagesModel.ensureChatExpiredNotification({ userId, sessionId: expiredSessionId });
      }
    }
    const messages = await messagesModel.listMessages({ userId, otherUserId, limit });
    return res.json({ ok: true, messages });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function send(req, res) {
  const senderId = req.body?.senderId;
  const receiverId = req.body?.receiverId;
  const messageText = req.body?.messageText;
  const requestId = req.body?.requestId ?? null;
  const sessionId = req.body?.sessionId ?? null;
  if (!senderId || !receiverId) {
    return res.status(400).json({ ok: false, error: "senderId and receiverId are required" });
  }
  if (!messageText) {
    return res.status(400).json({ ok: false, error: "messageText is required" });
  }
  if (String(senderId) === String(receiverId)) {
    return res.status(400).json({ ok: false, error: "Cannot message yourself." });
  }

  try {
    const pending = await reviewsModel.hasPendingReviews({ userId: senderId });
    if (pending) {
      return res.status(403).json({
        ok: false,
        error: "Please complete your pending review before continuing.",
      });
    }
    const canAccess = await messagesModel.canMessage({ userId: senderId, otherUserId: receiverId });
    if (!canAccess) {
      return res.status(403).json({ ok: false, error: "Messaging not allowed with this user." });
    }
    const canSend = await messagesModel.canSendMessage({ userId: senderId, otherUserId: receiverId });
    if (!canSend) {
      return res.status(403).json({ ok: false, error: "This session chat has expired." });
    }

    const message = await messagesModel.sendMessage({
      senderId,
      receiverId,
      messageText,
      requestId,
      sessionId,
    });
    if (!message) {
      return res.status(400).json({ ok: false, error: "Invalid message." });
    }
    return res.json({ ok: true, message });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function markRead(req, res) {
  const userId = req.body?.userId || req.query?.userId;
  const otherUserId = req.body?.otherUserId || req.query?.otherUserId;
  if (!userId || !otherUserId) {
    return res.status(400).json({ ok: false, error: "userId and otherUserId are required" });
  }

  try {
    const updated = await messagesModel.markRead({ userId, otherUserId });
    const unreadCount = await messagesModel.getUnreadCount({ userId });
    return res.json({ ok: true, updated, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function getUnreadCount(req, res) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const unreadCount = await messagesModel.getUnreadCount({ userId });
    return res.json({ ok: true, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  getConversations,
  getThread,
  send,
  markRead,
  getUnreadCount,
};
