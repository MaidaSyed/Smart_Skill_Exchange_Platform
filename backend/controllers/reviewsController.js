const reviewsModel = require("../models/reviewsModel.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function create(req, res) {
  const sessionId = req.body?.sessionId;
  const reviewerId = req.body?.reviewerId;
  const reviewedUserId = req.body?.reviewedUserId;
  const rating = req.body?.rating;
  const comment = req.body?.comment || null;

  if (!sessionId || !reviewerId || !reviewedUserId || !rating) {
    return res.status(400).json({
      ok: false,
      error: "sessionId, reviewerId, reviewedUserId, rating are required",
    });
  }

  try {
    const review = await reviewsModel.createReview({
      sessionId,
      reviewerId,
      reviewedUserId,
      rating,
      comment,
    });
    if (!review) {
      return res.status(400).json({ ok: false, error: "Review not allowed or invalid." });
    }
    return res.json({ ok: true, review });
  } catch (error) {
    console.log(error.message);
    if (error?.code === "23505") {
      return res.status(400).json({ ok: false, error: "You already reviewed this user for this session." });
    }
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function listForUser(req, res) {
  const userId = req.params?.userId;
  const limit = req.query?.limit || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const reviews = await reviewsModel.listReviewsForUser({ userId, limit });
    return res.json({ ok: true, reviews });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function stats(req, res) {
  const userId = req.params?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const stats = await reviewsModel.getReputationStats({ userId });
    return res.json({ ok: true, stats });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function pending(req, res) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const pending = await reviewsModel.listPendingReviews({ userId });
    return res.json({ ok: true, pending });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function pendingExists(req, res) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const pending = await reviewsModel.hasPendingReviews({ userId });
    return res.json({ ok: true, pending });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  create,
  listForUser,
  stats,
  pending,
  pendingExists,
};
