const pool = require("../db/pool.js");

async function isAdmin({ userId }) {
  const result = await pool.query(
    "SELECT role FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1",
    [userId],
  );
  return result.rows?.[0]?.role === "admin";
}

async function getStats() {
  const result = await pool.query(
    "SELECT " +
      "(SELECT COUNT(DISTINCT auth_user_id)::int FROM user_roles) AS total_users, " +
      "(SELECT COUNT(*)::int FROM user_skills) AS total_skills_added, " +
      "(SELECT COUNT(*)::int FROM learning_requests) AS total_requests, " +
      "(SELECT COUNT(*)::int FROM sessions) AS total_accepted_sessions, " +
      "(SELECT COALESCE(SUM(amount),0)::int FROM credit_transactions WHERE transaction_type IN ('earn','spend','transfer','signup_bonus','skill_bonus')) AS total_credits_circulated, " +
      "(SELECT COUNT(*)::int FROM (" +
      "  SELECT DISTINCT user_id FROM credit_transactions WHERE created_at >= now() - interval '7 days' " +
      "  UNION SELECT DISTINCT sender_id AS user_id FROM messages WHERE created_at >= now() - interval '7 days' AND sender_id IS NOT NULL " +
      "  UNION SELECT DISTINCT receiver_id AS user_id FROM messages WHERE created_at >= now() - interval '7 days' AND receiver_id IS NOT NULL " +
      "  UNION SELECT DISTINCT learner_id AS user_id FROM learning_requests WHERE created_at >= now() - interval '7 days' " +
      "  UNION SELECT DISTINCT teacher_id AS user_id FROM learning_requests WHERE created_at >= now() - interval '7 days' " +
      ") au) AS active_users_this_week",
  );
  return result.rows?.[0] || null;
}

async function listUsers({ search = null, limit = 50, offset = 0 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;
  const values = [];
  let idx = 1;
  const filters = [];

  if (search) {
    filters.push(`(COALESCE(p.full_name,'') ILIKE $${idx} OR COALESCE(p.email,'') ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx += 1;
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await pool.query(
    "SELECT " +
      "r.auth_user_id AS user_id, " +
      "COALESCE(p.full_name,'') AS full_name, " +
      "COALESCE(p.email,'') AS email, " +
      "COALESCE(r.role,'user') AS role, " +
      "COALESCE(p.credits,0)::int AS credits, " +
      "COALESCE(p.is_suspended,false) AS is_suspended, " +
      "COALESCE(p.created_at, r.created_at) AS joined_at " +
      "FROM user_roles r " +
      "LEFT JOIN user_profiles p ON p.auth_user_id = r.auth_user_id " +
      where +
      " ORDER BY joined_at DESC NULLS LAST, r.id DESC " +
      " LIMIT $1 OFFSET $2",
    values.length ? values.concat([safeLimit, safeOffset]) : [safeLimit, safeOffset],
  );
  return result.rows || [];
}

async function setUserRole({ targetUserId, role }) {
  const r = role === "admin" ? "admin" : "user";
  const result = await pool.query(
    "UPDATE user_roles SET role = $2 WHERE auth_user_id = $1::uuid RETURNING auth_user_id, role",
    [targetUserId, r],
  );
  return result.rows?.[0] || null;
}

async function setUserSuspended({ targetUserId, suspended }) {
  const exists = await pool.query("SELECT 1 FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1", [targetUserId]);
  if (!exists.rows?.length) throw new Error("USER_NOT_FOUND");
  await pool.query(
    "INSERT INTO user_profiles(auth_user_id, credits) VALUES ($1::uuid, 0) ON CONFLICT (auth_user_id) DO NOTHING",
    [targetUserId],
  );
  const result = await pool.query(
    "UPDATE user_profiles SET is_suspended = $2 WHERE auth_user_id = $1::uuid RETURNING auth_user_id, is_suspended",
    [targetUserId, Boolean(suspended)],
  );
  return result.rows?.[0] || null;
}

async function deleteUser({ targetUserId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const exists = await client.query("SELECT 1 FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1", [targetUserId]);
    if (!exists.rows?.length) throw new Error("USER_NOT_FOUND");
    await client.query("DELETE FROM notifications WHERE user_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM credit_transactions WHERE user_id = $1::uuid OR sender_id = $1::uuid OR receiver_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM reviews WHERE reviewer_id = $1::uuid OR reviewed_user_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM messages WHERE sender_id = $1::uuid OR receiver_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM sessions WHERE learner_id = $1::uuid OR teacher_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM learning_requests WHERE learner_id = $1::uuid OR teacher_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM user_skills WHERE auth_user_id = $1::uuid", [targetUserId]);
    await client.query("DELETE FROM user_profiles WHERE auth_user_id = $1::uuid", [targetUserId]);
    const deleted = await client.query("DELETE FROM user_roles WHERE auth_user_id = $1::uuid RETURNING auth_user_id", [targetUserId]);
    if (!deleted.rows?.length) throw new Error("USER_DELETE_FAILED");
    await client.query("COMMIT");
    return true;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      const _IGNORE = 0;
    }
    throw error;
  } finally {
    client.release();
  }
}

async function listSkills({ search = null, limit = 100 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(300, Number(limit))) : 100;
  const values = [];
  let idx = 1;
  const filters = [];
  if (search) {
    filters.push(`s.name ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await pool.query(
    "SELECT s.id, s.name, s.category, s.skill_type, s.created_at, " +
      "COALESCE(us.cnt,0)::int AS users_count, COALESCE(rq.cnt,0)::int AS requests_count " +
      "FROM skills s " +
      "LEFT JOIN (SELECT skill_id, COUNT(*) AS cnt FROM user_skills GROUP BY skill_id) us ON us.skill_id = s.id " +
      "LEFT JOIN (SELECT us2.skill_id, COUNT(*) AS cnt FROM learning_requests lr JOIN user_skills us2 ON us2.id = lr.user_skill_id GROUP BY us2.skill_id) rq ON rq.skill_id = s.id " +
      where +
      " ORDER BY users_count DESC, requests_count DESC, s.name ASC " +
      `LIMIT ${safeLimit}`,
    values,
  );
  return result.rows || [];
}

async function deleteSkill({ skillId }) {
  const result = await pool.query("DELETE FROM skills WHERE id = $1", [skillId]);
  return result.rowCount || 0;
}

async function listDuplicateSkills() {
  const result = await pool.query(
    "SELECT lower(name) AS key, COUNT(*)::int AS count, array_agg(id ORDER BY id) AS ids, array_agg(name ORDER BY id) AS names " +
      "FROM skills " +
      "GROUP BY lower(name) " +
      "HAVING COUNT(*) > 1 " +
      "ORDER BY count DESC, key ASC",
  );
  return result.rows || [];
}

async function renameSkill({ skillId, name }) {
  const newName = String(name || "").trim();
  if (!newName) return null;
  const result = await pool.query(
    "UPDATE skills SET name = $2 WHERE id = $1 RETURNING id, name",
    [skillId, newName],
  );
  return result.rows?.[0] || null;
}

async function mergeSkills({ fromSkillId, toSkillId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE learning_requests SET offered_skill_id = $2 WHERE offered_skill_id = $1",
      [fromSkillId, toSkillId],
    );
    await client.query(
      "UPDATE user_skills us SET skill_id = $2 " +
        "WHERE us.skill_id = $1 AND NOT EXISTS (" +
        "SELECT 1 FROM user_skills x WHERE x.auth_user_id = us.auth_user_id AND x.skill_id = $2" +
        ")",
      [fromSkillId, toSkillId],
    );
    await client.query("DELETE FROM user_skills WHERE skill_id = $1", [fromSkillId]);
    await client.query("DELETE FROM skills WHERE id = $1", [fromSkillId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      const _IGNORE = 0;
    }
    throw error;
  } finally {
    client.release();
  }
}

async function listSessions({ filter = null, limit = 200 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(400, Number(limit))) : 200;
  const values = [];
  let idx = 1;
  const filters = [];
  if (filter === "completed") {
    filters.push("s.chat_expires_at IS NOT NULL AND now() > s.chat_expires_at");
  } else if (filter === "upcoming") {
    filters.push("s.chat_expires_at IS NOT NULL AND now() <= s.chat_expires_at");
  } else if (filter === "cancelled") {
    filters.push("s.status = 'cancelled'");
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await pool.query(
    "SELECT s.id, s.request_id, s.learner_id, s.teacher_id, s.scheduled_date, s.start_time, s.end_time, s.duration_minutes, s.chat_enabled_at, s.chat_expires_at, s.status, lr.exchange_type, lr.offered_credit_amount, sk.name AS skill_name, " +
      "COALESCE(tp.full_name,'Teacher') AS teacher_name, COALESCE(lp.full_name,'Learner') AS learner_name " +
      "FROM sessions s " +
      "JOIN learning_requests lr ON lr.id = s.request_id " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills sk ON sk.id = us.skill_id " +
      "LEFT JOIN user_profiles tp ON tp.auth_user_id = s.teacher_id " +
      "LEFT JOIN user_profiles lp ON lp.auth_user_id = s.learner_id " +
      where +
      " ORDER BY s.scheduled_date DESC, s.start_time DESC " +
      `LIMIT ${safeLimit}`,
    values,
  );
  return result.rows || [];
}

async function getReports({ limit = 10 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(50, Number(limit))) : 10;
  const [activeTeachers, topRated, topEarners, mostRequested] = await Promise.all([
    pool.query(
      "SELECT s.teacher_id, COALESCE(p.full_name,'Teacher') AS name, COUNT(*)::int AS sessions_count " +
        "FROM sessions s LEFT JOIN user_profiles p ON p.auth_user_id = s.teacher_id " +
        "GROUP BY s.teacher_id, p.full_name " +
        "ORDER BY sessions_count DESC " +
        `LIMIT ${safeLimit}`,
    ),
    pool.query(
      "SELECT r.reviewed_user_id AS user_id, COALESCE(p.full_name,'User') AS name, AVG(r.rating)::float AS avg_rating, COUNT(*)::int AS reviews_count " +
        "FROM reviews r LEFT JOIN user_profiles p ON p.auth_user_id = r.reviewed_user_id " +
        "GROUP BY r.reviewed_user_id, p.full_name " +
        "HAVING COUNT(*) > 0 " +
        "ORDER BY avg_rating DESC, reviews_count DESC " +
        `LIMIT ${safeLimit}`,
    ),
    pool.query(
      "SELECT ct.user_id, COALESCE(p.full_name,'User') AS name, COALESCE(SUM(ct.amount),0)::int AS credits_earned " +
        "FROM credit_transactions ct LEFT JOIN user_profiles p ON p.auth_user_id = ct.user_id " +
        "WHERE ct.transaction_type IN ('earn','transfer') " +
        "GROUP BY ct.user_id, p.full_name " +
        "ORDER BY credits_earned DESC " +
        `LIMIT ${safeLimit}`,
    ),
    pool.query(
      "SELECT sk.id AS skill_id, sk.name, COUNT(*)::int AS requests_count " +
        "FROM learning_requests lr " +
        "JOIN user_skills us ON us.id = lr.user_skill_id " +
        "JOIN skills sk ON sk.id = us.skill_id " +
        "GROUP BY sk.id, sk.name " +
        "ORDER BY requests_count DESC " +
        `LIMIT ${safeLimit}`,
    ),
  ]);

  return {
    activeTeachers: activeTeachers.rows || [],
    topRated: topRated.rows || [],
    topEarners: topEarners.rows || [],
    mostRequested: mostRequested.rows || [],
  };
}

module.exports = {
  isAdmin,
  getStats,
  listUsers,
  setUserRole,
  setUserSuspended,
  deleteUser,
  listSkills,
  deleteSkill,
  listDuplicateSkills,
  renameSkill,
  mergeSkills,
  listSessions,
  getReports,
};
