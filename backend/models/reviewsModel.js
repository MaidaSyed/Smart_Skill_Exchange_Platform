const pool = require("../db/pool.js");
const notificationsModel = require("./notificationsModel.js");

async function createReview({
  sessionId,
  reviewerId,
  reviewedUserId,
  rating,
  comment = null,
}) {
  const ratingNum = Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) return null;

  const session = await pool.query(
    "SELECT s.id, s.learner_id, s.teacher_id, s.chat_expires_at, lr.exchange_type " +
      "FROM sessions s JOIN learning_requests lr ON lr.id = s.request_id WHERE s.id = $1",
    [sessionId],
  );
  const s = session.rows?.[0] || null;
  if (!s) return null;
  if (!s.chat_expires_at) return null;
  if (new Date(s.chat_expires_at).getTime() > Date.now()) return null;

  const reviewer = String(reviewerId);
  const reviewed = String(reviewedUserId);
  const a = String(s.learner_id);
  const b = String(s.teacher_id);

  if (!(reviewer === a || reviewer === b)) return null;
  if (!(reviewed === a || reviewed === b)) return null;
  if (reviewer === reviewed) return null;

  const ex = String(s.exchange_type || "").toLowerCase();
  const allowed =
    (ex === "credits" && reviewer === a && reviewed === b) ||
    (ex === "skill" && ((reviewer === a && reviewed === b) || (reviewer === b && reviewed === a)));
  if (!allowed) return null;

  const existing = await pool.query(
    "SELECT id FROM reviews WHERE session_id = $1 AND reviewer_id = $2::uuid AND reviewed_user_id = $3::uuid LIMIT 1",
    [sessionId, reviewerId, reviewedUserId],
  );
  if (existing.rowCount > 0) {
    const err = new Error("DUPLICATE_REVIEW");
    err.code = "23505";
    throw err;
  }

  const inserted = await pool.query(
    "INSERT INTO reviews(session_id, reviewer_id, reviewed_user_id, rating, comment) VALUES ($1, $2::uuid, $3::uuid, $4, $5) " +
      "RETURNING id, session_id, reviewer_id, reviewed_user_id, rating, comment, created_at",
    [sessionId, reviewerId, reviewedUserId, Math.trunc(ratingNum), comment || null],
  );
  const review = inserted.rows?.[0] || null;
  if (!review) return null;

  await notificationsModel.createNotification({
    userId: reviewedUserId,
    title: "New review",
    message: `You received a ${Math.trunc(ratingNum)}-star review.`,
    type: "new_review",
    referenceId: review.id,
  });

  return review;
}

async function listReviewsForUser({ userId, limit = 30 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 30;
  const result = await pool.query(
    "SELECT r.id, r.session_id, r.reviewer_id, r.reviewed_user_id, r.rating, r.comment, r.created_at, " +
      "COALESCE(p.full_name, 'User') AS reviewer_name, s.scheduled_date, s.status AS session_status, sk.name AS skill_name " +
      "FROM reviews r " +
      "JOIN sessions s ON s.id = r.session_id " +
      "JOIN learning_requests lr ON lr.id = s.request_id " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills sk ON sk.id = us.skill_id " +
      "LEFT JOIN user_profiles p ON p.auth_user_id = r.reviewer_id " +
      "WHERE r.reviewed_user_id = $1::uuid " +
      "ORDER BY r.created_at DESC, r.id DESC " +
      `LIMIT ${safeLimit}`,
    [userId],
  );
  return result.rows || [];
}

async function getReputationStats({ userId }) {
  const result = await pool.query(
    "SELECT " +
      "COALESCE(AVG(r.rating),0)::float AS avg_rating, " +
      "COALESCE(COUNT(r.id),0)::int AS total_reviews, " +
      "COALESCE(COUNT(DISTINCT s.id),0)::int AS total_sessions, " +
      "COALESCE(SUM(CASE WHEN ct.transaction_type IN ('earn','transfer','refund','signup_bonus','skill_bonus') THEN ct.amount ELSE 0 END),0)::int AS credits_earned " +
      "FROM (SELECT $1::uuid AS user_id) u " +
      "LEFT JOIN reviews r ON r.reviewed_user_id = u.user_id " +
      "LEFT JOIN sessions s ON (s.learner_id = u.user_id OR s.teacher_id = u.user_id) " +
      "LEFT JOIN credit_transactions ct ON ct.user_id = u.user_id " +
      "GROUP BY u.user_id",
    [userId],
  );
  return result.rows?.[0] || null;
}

async function listPendingReviews({ userId }) {
  const result = await pool.query(
    "WITH ended AS (" +
      "SELECT s.id AS session_id, s.request_id, s.learner_id, s.teacher_id, s.scheduled_date, s.start_time, s.end_time, lr.exchange_type, sk.name AS skill_name " +
      "FROM sessions s " +
      "JOIN learning_requests lr ON lr.id = s.request_id " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills sk ON sk.id = us.skill_id " +
      "WHERE (s.learner_id = $1::uuid OR s.teacher_id = $1::uuid) " +
      "AND now() >= (s.scheduled_date::timestamp + s.end_time)" +
      "), required AS (" +
      "SELECT e.*, " +
      "CASE " +
      "WHEN e.exchange_type = 'credits' AND $1::uuid = e.learner_id THEN e.teacher_id " +
      "WHEN e.exchange_type = 'skill' AND $1::uuid = e.learner_id THEN e.teacher_id " +
      "WHEN e.exchange_type = 'skill' AND $1::uuid = e.teacher_id THEN e.learner_id " +
      "ELSE NULL END AS reviewed_user_id " +
      "FROM ended e" +
      ") " +
      "SELECT r.session_id, r.reviewed_user_id, COALESCE(p.full_name,'User') AS reviewed_name, r.skill_name, r.scheduled_date, r.start_time, r.end_time, r.exchange_type " +
      "FROM required r " +
      "LEFT JOIN user_profiles p ON p.auth_user_id = r.reviewed_user_id " +
      "WHERE r.reviewed_user_id IS NOT NULL " +
      "AND NOT EXISTS (" +
      "SELECT 1 FROM reviews rv WHERE rv.session_id = r.session_id AND rv.reviewer_id = $1::uuid AND rv.reviewed_user_id = r.reviewed_user_id" +
      ") " +
      "ORDER BY r.scheduled_date DESC, r.start_time DESC, r.session_id DESC",
    [userId],
  );
  return result.rows || [];
}

async function hasPendingReviews({ userId }) {
  const result = await pool.query(
    "SELECT EXISTS (" +
      "WITH ended AS (" +
      "SELECT s.id AS session_id, s.request_id, s.learner_id, s.teacher_id, lr.exchange_type " +
      "FROM sessions s JOIN learning_requests lr ON lr.id = s.request_id " +
      "WHERE (s.learner_id = $1::uuid OR s.teacher_id = $1::uuid) " +
      "AND now() >= (s.scheduled_date::timestamp + s.end_time)" +
      "), required AS (" +
      "SELECT e.session_id, " +
      "CASE " +
      "WHEN e.exchange_type = 'credits' AND $1::uuid = e.learner_id THEN e.teacher_id " +
      "WHEN e.exchange_type = 'skill' AND $1::uuid = e.learner_id THEN e.teacher_id " +
      "WHEN e.exchange_type = 'skill' AND $1::uuid = e.teacher_id THEN e.learner_id " +
      "ELSE NULL END AS reviewed_user_id " +
      "FROM ended e" +
      ") " +
      "SELECT 1 FROM required r " +
      "WHERE r.reviewed_user_id IS NOT NULL " +
      "AND NOT EXISTS (" +
      "SELECT 1 FROM reviews rv WHERE rv.session_id = r.session_id AND rv.reviewer_id = $1::uuid AND rv.reviewed_user_id = r.reviewed_user_id" +
      ")" +
      ") AS pending",
    [userId],
  );
  return Boolean(result.rows?.[0]?.pending);
}

module.exports = {
  createReview,
  listReviewsForUser,
  getReputationStats,
  listPendingReviews,
  hasPendingReviews,
};
