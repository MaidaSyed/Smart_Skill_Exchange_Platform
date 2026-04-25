const pool = require("../db/pool.js");

async function listUserSkills({ userId }) {
  const result = await pool.query(
    "SELECT us.id, us.skill_id, us.proficiency, s.name, s.category, s.skill_type FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.auth_user_id = $1::uuid ORDER BY s.name ASC",
    [userId],
  );
  return result.rows || [];
}

async function findSkillIdByName({ name }) {
  const result = await pool.query(
    "SELECT id FROM skills WHERE lower(name) = lower($1) LIMIT 1",
    [name],
  );
  return result.rows?.[0]?.id || null;
}

async function createSkill({ name, category, skillType }) {
  const result = await pool.query(
    "INSERT INTO skills(name, category, skill_type) VALUES ($1, $2, $3) RETURNING id",
    [name, category, skillType],
  );
  return result.rows?.[0]?.id || null;
}

async function addOrUpdateUserSkillTx({ userId, name, category, skillType, proficiency }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingSkill = await client.query(
      "SELECT id FROM skills WHERE lower(name) = lower($1) LIMIT 1",
      [name],
    );
    let skillId = existingSkill.rows?.[0]?.id || null;
    if (!skillId) {
      const created = await client.query(
        "INSERT INTO skills(name, category, skill_type) VALUES ($1, $2, $3) RETURNING id",
        [name, category, skillType],
      );
      skillId = created.rows?.[0]?.id || null;
    }
    if (!skillId) throw new Error("SKILL_CREATE_FAILED");

    const inserted = await client.query(
      "INSERT INTO user_skills(auth_user_id, skill_id, proficiency) VALUES ($1::uuid, $2, $3) ON CONFLICT (auth_user_id, skill_id) DO NOTHING RETURNING id, auth_user_id, skill_id, proficiency",
      [userId, skillId, proficiency],
    );

    if (inserted.rows?.[0]) {
      await client.query(
        "INSERT INTO user_profiles(auth_user_id, credits) VALUES ($1::uuid, 0) ON CONFLICT (auth_user_id) DO NOTHING",
        [userId],
      );
      await client.query(
        "UPDATE user_profiles SET credits = credits + 2 WHERE auth_user_id = $1::uuid",
        [userId],
      );
      await client.query(
        "INSERT INTO credit_transactions(user_id, amount, transaction_type) VALUES ($1::uuid, 2, 'skill_bonus')",
        [userId],
      );
      await client.query(
        "INSERT INTO notifications(user_id, title, message, type, reference_id) VALUES ($1::uuid, $2, $3, $4, $5)",
        [userId, "Skill bonus", "You earned 2 credits for adding a new skill.", "skill_bonus", null],
      );
      await client.query("COMMIT");
      return { inserted: true, userSkill: inserted.rows[0] };
    }

    const updated = await client.query(
      "UPDATE user_skills SET proficiency = $3 WHERE auth_user_id = $1::uuid AND skill_id = $2 RETURNING id, auth_user_id, skill_id, proficiency",
      [userId, skillId, proficiency],
    );
    await client.query("COMMIT");
    return { inserted: false, userSkill: updated.rows?.[0] || null };
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

async function removeUserSkill({ userId, skillId }) {
  await pool.query(
    "DELETE FROM user_skills WHERE auth_user_id = $1::uuid AND skill_id = $2",
    [userId, skillId],
  );
  return true;
}

async function exploreSkills({ category, skillType, search, proficiency, sort }) {
  const filters = [];
  const values = [];
  let idx = 1;

  if (category) {
    filters.push(`s.category = $${idx++}`);
    values.push(category);
  }
  if (skillType) {
    filters.push(`s.skill_type = $${idx++}`);
    values.push(skillType);
  }
  if (proficiency) {
    filters.push(`us.proficiency = $${idx++}`);
    values.push(Number(proficiency));
  }
  if (search) {
    filters.push(
      `(s.name ILIKE $${idx} OR COALESCE(p.full_name, '') ILIKE $${idx})`,
    );
    values.push(`%${search}%`);
    idx += 1;
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const orderBy = (() => {
    if (sort === "alpha") return "ORDER BY p.full_name ASC NULLS LAST, us.id DESC";
    if (sort === "rated") return "ORDER BY us.proficiency DESC, us.id DESC";
    return "ORDER BY us.created_at DESC, us.id DESC";
  })();
  const query =
    "SELECT us.id AS user_skill_id, us.auth_user_id AS teacher_id, us.proficiency, us.created_at AS user_skill_created_at, s.name AS skill_name, s.category, s.skill_type, p.full_name, p.bio, r.role, COALESCE(req.requests_count, 0) AS requests_count, COALESCE(tp.teachers_per_skill, 0) AS teachers_per_skill, COALESCE(rv.avg_rating, 0) AS avg_rating, COALESCE(rv.reviews_count, 0) AS reviews_count, COALESCE(st.sessions_as_teacher, 0) AS sessions_as_teacher " +
    "FROM user_skills us " +
    "JOIN skills s ON s.id = us.skill_id " +
    "LEFT JOIN user_profiles p ON p.auth_user_id = us.auth_user_id " +
    "LEFT JOIN user_roles r ON r.auth_user_id = us.auth_user_id " +
    "LEFT JOIN (SELECT user_skill_id, COUNT(*) AS requests_count FROM learning_requests GROUP BY user_skill_id) req ON req.user_skill_id = us.id " +
    "LEFT JOIN (SELECT skill_id, COUNT(DISTINCT auth_user_id) AS teachers_per_skill FROM user_skills GROUP BY skill_id) tp ON tp.skill_id = s.id " +
    "LEFT JOIN (SELECT reviewed_user_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS reviews_count FROM reviews GROUP BY reviewed_user_id) rv ON rv.reviewed_user_id = us.auth_user_id " +
    "LEFT JOIN (SELECT teacher_id, COUNT(*)::int AS sessions_as_teacher FROM sessions GROUP BY teacher_id) st ON st.teacher_id = us.auth_user_id " +
    where +
    " " +
    orderBy;

  const result = await pool.query(query, values);
  return result.rows || [];
}

module.exports = {
  listUserSkills,
  findSkillIdByName,
  createSkill,
  addOrUpdateUserSkillTx,
  removeUserSkill,
  exploreSkills,
};
