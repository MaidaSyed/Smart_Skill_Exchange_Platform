const pool = require("../db/pool.js");

async function listSessionsForUser({ userId }) {
  const result = await pool.query(
    "SELECT s.id, s.request_id, s.learner_id, s.teacher_id, s.scheduled_date, s.start_time, s.end_time, s.duration_minutes, " +
      "(s.scheduled_date::timestamp + s.start_time) AS start_at, " +
      "((s.scheduled_date::timestamp + s.start_time) + (COALESCE(s.duration_minutes, 60)::int * interval '1 minute')) AS end_at, " +
      "CASE " +
      "WHEN s.status = 'cancelled' THEN 'cancelled' " +
      "WHEN now() < (s.scheduled_date::timestamp + s.start_time) THEN 'upcoming' " +
      "WHEN now() >= (s.scheduled_date::timestamp + s.start_time) AND now() < ((s.scheduled_date::timestamp + s.start_time) + (COALESCE(s.duration_minutes, 60)::int * interval '1 minute')) THEN 'active' " +
      "ELSE 'completed' END AS timing_status, " +
      "s.chat_enabled_at, s.chat_expires_at, s.meeting_link, s.status AS db_status, s.created_at, " +
      "lr.message, lr.exchange_type, lr.offered_credit_amount, os.name AS offered_skill_name, " +
      "CASE " +
      "WHEN lr.exchange_type = 'credits' AND $1::uuid = s.learner_id THEN s.teacher_id " +
      "WHEN lr.exchange_type = 'skill' AND $1::uuid = s.learner_id THEN s.teacher_id " +
      "WHEN lr.exchange_type = 'skill' AND $1::uuid = s.teacher_id THEN s.learner_id " +
      "ELSE NULL END AS required_reviewed_user_id, " +
      "CASE WHEN (CASE " +
      "WHEN lr.exchange_type = 'credits' AND $1::uuid = s.learner_id THEN s.teacher_id " +
      "WHEN lr.exchange_type = 'skill' AND $1::uuid = s.learner_id THEN s.teacher_id " +
      "WHEN lr.exchange_type = 'skill' AND $1::uuid = s.teacher_id THEN s.learner_id " +
      "ELSE NULL END) IS NULL THEN false ELSE EXISTS (" +
      "SELECT 1 FROM reviews rv WHERE rv.session_id = s.id AND rv.reviewer_id = $1::uuid AND rv.reviewed_user_id = (CASE " +
      "WHEN lr.exchange_type = 'credits' AND $1::uuid = s.learner_id THEN s.teacher_id " +
      "WHEN lr.exchange_type = 'skill' AND $1::uuid = s.learner_id THEN s.teacher_id " +
      "WHEN lr.exchange_type = 'skill' AND $1::uuid = s.teacher_id THEN s.learner_id " +
      "ELSE NULL END)" +
      ") END AS has_reviewed_required, " +
      "CASE WHEN now() >= ((s.scheduled_date::timestamp + s.start_time) + (COALESCE(s.duration_minutes, 60)::int * interval '1 minute')) THEN true ELSE false END AS can_review_now, " +
      "CASE WHEN now() >= ((s.scheduled_date::timestamp + s.start_time) + (COALESCE(s.duration_minutes, 60)::int * interval '1 minute')) THEN true ELSE false END AS is_expired, " +
      "us.proficiency, sk.name AS skill_name, sk.category, sk.skill_type, COALESCE(tp.full_name, 'Teacher') AS teacher_name, COALESCE(lp.full_name, 'Learner') AS learner_name " +
      "FROM sessions s " +
      "JOIN learning_requests lr ON lr.id = s.request_id " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills sk ON sk.id = us.skill_id " +
      "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
      "LEFT JOIN user_profiles tp ON tp.auth_user_id = s.teacher_id " +
      "LEFT JOIN user_profiles lp ON lp.auth_user_id = s.learner_id " +
      "WHERE s.learner_id = $1::uuid OR s.teacher_id = $1::uuid " +
      "ORDER BY s.scheduled_date ASC, s.start_time ASC",
    [userId],
  );
  return result.rows || [];
}

module.exports = {
  listSessionsForUser,
};
