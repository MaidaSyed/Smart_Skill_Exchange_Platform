const pool = require("../db/pool.js");

async function listUsers() {
  const result = await pool.query(
    "SELECT r.auth_user_id, COALESCE(p.full_name,'') AS full_name, COALESCE(p.email,'') AS email, COALESCE(p.is_suspended,false) AS is_suspended, COALESCE(r.role,'user') AS role " +
      "FROM user_roles r LEFT JOIN user_profiles p ON p.auth_user_id = r.auth_user_id " +
      "ORDER BY r.created_at DESC, r.id DESC",
  );
  return result.rows || [];
}

async function getAccountStatus({ userId }) {
  const result = await pool.query(
    "SELECT r.auth_user_id, COALESCE(p.is_suspended,false) AS is_suspended " +
      "FROM user_roles r " +
      "LEFT JOIN user_profiles p ON p.auth_user_id = r.auth_user_id " +
      "WHERE r.auth_user_id = $1::uuid " +
      "LIMIT 1",
    [userId],
  );
  const row = result.rows?.[0] || null;
  return {
    exists: Boolean(row?.auth_user_id),
    isSuspended: Boolean(row?.is_suspended),
  };
}

module.exports = {
  listUsers,
  getAccountStatus,
};
