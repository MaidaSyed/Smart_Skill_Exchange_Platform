const pool = require("../db/pool.js");

async function createRoleIfMissing({ userId, email = null }) {
  const role = "user";

  try {
    const inserted = await pool.query(
      "INSERT INTO user_roles(auth_user_id, role) VALUES ($1::uuid, $2) ON CONFLICT (auth_user_id) DO NOTHING RETURNING auth_user_id, role, created_at",
      [userId, role],
    );

    if (inserted.rows?.[0]) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "INSERT INTO user_profiles(auth_user_id, email, credits) VALUES ($1::uuid, $2, 0) " +
            "ON CONFLICT (auth_user_id) DO UPDATE SET email = COALESCE(user_profiles.email, EXCLUDED.email)",
          [userId, email],
        );
        await client.query(
          "UPDATE user_profiles SET credits = credits + 10 WHERE auth_user_id = $1::uuid",
          [userId],
        );
        await client.query(
          "INSERT INTO credit_transactions(user_id, amount, transaction_type) VALUES ($1::uuid, 10, 'signup_bonus')",
          [userId],
        );
        await client.query(
          "INSERT INTO notifications(user_id, title, message, type, reference_id) VALUES ($1::uuid, $2, $3, $4, $5)",
          [userId, "Signup bonus", "You received 10 credits for signing up.", "signup_bonus", null],
        );
        await client.query("COMMIT");
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
      return inserted.rows[0];
    }

    const existing = await pool.query(
      "SELECT auth_user_id, role, created_at FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1",
      [userId],
    );
    return existing.rows?.[0] || null;
  } catch (error) {
    if (error?.code === "42P10") {
      const existing = await pool.query(
        "SELECT auth_user_id, role, created_at FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1",
        [userId],
      );
      if (existing.rows.length > 0) return existing.rows[0];

      await pool.query(
        "INSERT INTO user_roles(auth_user_id, role) VALUES ($1::uuid, $2)",
        [userId, role],
      );
      return { auth_user_id: userId, role };
    }

    throw error;
  }
}

async function getRoleByUserId({ userId }) {
  const result = await pool.query(
    "SELECT role FROM user_roles WHERE auth_user_id = $1::uuid LIMIT 1",
    [userId],
  );
  return result.rows?.[0]?.role || null;
}

module.exports = {
  createRoleIfMissing,
  getRoleByUserId,
};
