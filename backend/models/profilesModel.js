const pool = require("../db/pool.js");

async function getProfileAndRole({ userId }) {
  const [roleResult, profileResult] = await Promise.all([
    pool.query("SELECT role FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1", [
      userId,
    ]),
    pool.query(
      "SELECT email, full_name, bio, credits, is_suspended FROM user_profiles WHERE auth_user_id = $1::uuid LIMIT 1",
      [userId],
    ),
  ]);

  return {
    profile: profileResult.rows?.[0] || null,
    role: roleResult.rows?.[0]?.role || null,
  };
}

async function upsertProfile({ userId, fullName, bio }) {
  try {
    const result = await pool.query(
      "INSERT INTO user_profiles(auth_user_id, full_name, bio) VALUES ($1::uuid, $2, $3) ON CONFLICT (auth_user_id) DO UPDATE SET full_name = EXCLUDED.full_name, bio = EXCLUDED.bio RETURNING auth_user_id, full_name, bio, credits",
      [userId, fullName, bio],
    );
    return result.rows?.[0] || null;
  } catch (error) {
    if (error?.code === "42P10") {
      const existing = await pool.query(
        "SELECT id FROM user_profiles WHERE auth_user_id = $1::uuid LIMIT 1",
        [userId],
      );

      if (existing.rows.length > 0) {
        const updated = await pool.query(
          "UPDATE user_profiles SET full_name = $2, bio = $3 WHERE auth_user_id = $1::uuid RETURNING auth_user_id, full_name, bio, credits",
          [userId, fullName, bio],
        );
        return updated.rows?.[0] || null;
      }

      await pool.query(
        "INSERT INTO user_profiles(auth_user_id, full_name, bio) VALUES ($1::uuid, $2, $3)",
        [userId, fullName, bio],
      );
      return { auth_user_id: userId, full_name: fullName, bio };
    }

    throw error;
  }
}

module.exports = {
  getProfileAndRole,
  upsertProfile,
};
