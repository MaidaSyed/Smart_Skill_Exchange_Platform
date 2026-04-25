const requestsModel = require("../models/requestsModel.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function createRequest(req, res) {
  const learnerId = req.body?.learnerId;
  const teacherId = req.body?.teacherId;
  const userSkillId = req.body?.userSkillId;
  const message = req.body?.message || null;
  const preferredDate = req.body?.preferredDate || null;
  const preferredStartTime = req.body?.preferredStartTime || null;
  const durationMinutes = req.body?.durationMinutes || null;
  const exchangeType = req.body?.exchangeType || req.body?.exchange_type || null;
  const offeredSkillId = req.body?.offeredSkillId ?? req.body?.offered_skill_id ?? null;
  const offeredCreditAmount = req.body?.offeredCreditAmount ?? req.body?.offered_credit_amount ?? null;

  if (!learnerId || !teacherId || !userSkillId) {
    return res.status(400).json({
      ok: false,
      error: "learnerId, teacherId and userSkillId are required",
    });
  }

  if (String(learnerId) === String(teacherId)) {
    return res.status(400).json({ ok: false, error: "You cannot request yourself." });
  }

  if (!exchangeType) {
    return res.status(400).json({ ok: false, error: "exchangeType is required" });
  }

  try {
    const data = await requestsModel.createLearningRequest({
      learnerId,
      teacherId,
      userSkillId,
      message,
      preferredDate,
      preferredStartTime,
      durationMinutes,
      exchangeType,
      offeredSkillId,
      offeredCreditAmount,
    });
    if (!data) {
      return res.status(400).json({
        ok: false,
        error:
          "Invalid request. For Skill Exchange: choose a skill you can teach. For Credit Exchange: enter a positive credit amount.",
      });
    }
    return res.json({ ok: true, request: data });
  } catch (error) {
    console.log(error.message);
    if (error?.message === "PENDING_REVIEW") {
      return res.status(403).json({
        ok: false,
        error: "Please complete your pending review before continuing.",
      });
    }
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function getSent(req, res) {
  const learnerId = req.query?.userId;
  if (!learnerId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const requests = await requestsModel.listSentRequests({ learnerId });
    return res.json({ ok: true, requests });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function getReceived(req, res) {
  const teacherId = req.query?.userId;
  if (!teacherId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const requests = await requestsModel.listReceivedRequests({ teacherId });
    return res.json({ ok: true, requests });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function accept(req, res) {
  const requestId = req.params?.id;
  const teacherId = req.body?.teacherId || null;
  if (!requestId || !teacherId) {
    return res.status(400).json({ ok: false, error: "id and teacherId are required" });
  }

  try {
    const data = await requestsModel.acceptRequestTx({ requestId, teacherId });
    if (data?.error === "PENDING_REVIEW") {
      return res.status(403).json({
        ok: false,
        error: "Please complete your pending review before continuing.",
      });
    }
    if (!data?.request) {
      return res.status(404).json({ ok: false, error: "Request not found" });
    }
    return res.json({ ok: true, request: data.request, session: data.session });
  } catch (error) {
    console.log(error.message);
    if (error?.message === "INSUFFICIENT_CREDITS") {
      return res.status(400).json({ ok: false, error: "Learner does not have enough credits." });
    }
    if (error?.message === "INVALID_CREDIT_AMOUNT") {
      return res.status(400).json({ ok: false, error: "Invalid credit amount." });
    }
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function reject(req, res) {
  const requestId = req.params?.id;
  const teacherId = req.body?.teacherId || null;
  if (!requestId || !teacherId) {
    return res.status(400).json({ ok: false, error: "id and teacherId are required" });
  }

  try {
    const updated = await requestsModel.rejectRequestTx({ requestId, teacherId });
    if (!updated) {
      return res.status(404).json({ ok: false, error: "Request not found" });
    }
    return res.json({ ok: true, request: updated });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function getNotificationsUnreadCount(req, res) {
  const userId = req.query?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const unreadCount = await requestsModel.getUnreadNotificationsCount({ userId });
    return res.json({ ok: true, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function getNotifications(req, res) {
  const userId = req.query?.userId;
  const limit = req.query?.limit;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const notifications = await requestsModel.listNotifications({ userId, limit });
    return res.json({ ok: true, notifications });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function markNotificationsSeen(req, res) {
  const userId = req.body?.userId || req.query?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const marked = await requestsModel.markNotificationsSeen({ userId });
    const unreadCount = await requestsModel.getUnreadNotificationsCount({ userId });
    return res.json({ ok: true, marked, unreadCount });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  createRequest,
  getSent,
  getReceived,
  accept,
  reject,
  getNotificationsUnreadCount,
  getNotifications,
  markNotificationsSeen,
};
