const pool = require("../db/pool.js");

async function ensureProfileRow({ userId, client = null }) {
  const db = client || pool;
  await db.query(
    "INSERT INTO user_profiles(auth_user_id, credits) VALUES ($1::uuid, 0) ON CONFLICT (auth_user_id) DO NOTHING",
    [userId],
  );
}

async function getWalletSummary({ userId }) {
  await ensureProfileRow({ userId });
  const result = await pool.query(
    "SELECT " +
      "p.credits, " +
      "COALESCE(SUM(CASE WHEN ct.transaction_type IN ('earn','refund','transfer','signup_bonus','skill_bonus') THEN ct.amount ELSE 0 END),0)::int AS total_earned, " +
      "COALESCE(SUM(CASE WHEN ct.transaction_type IN ('spend') THEN ct.amount ELSE 0 END),0)::int AS total_spent, " +
      "COALESCE(COUNT(*) FILTER (WHERE ct.transaction_type = 'earn'),0)::int AS earn_count, " +
      "COALESCE(COUNT(*) FILTER (WHERE ct.transaction_type = 'spend'),0)::int AS spend_count " +
      "FROM user_profiles p " +
      "LEFT JOIN credit_transactions ct ON ct.user_id = p.auth_user_id " +
      "WHERE p.auth_user_id = $1::uuid " +
      "GROUP BY p.credits",
    [userId],
  );
  return result.rows?.[0] || { credits: 0, total_earned: 0, total_spent: 0, earn_count: 0, spend_count: 0 };
}

async function listTransactions({ userId, transactionType = null, limit = 30 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 30;
  const values = [userId];
  let idx = 2;
  const filters = ["ct.user_id = $1::uuid"];
  if (transactionType) {
    filters.push(`ct.transaction_type = $${idx++}`);
    values.push(transactionType);
  }
  const where = `WHERE ${filters.join(" AND ")}`;

  const result = await pool.query(
    "SELECT ct.id, ct.sender_id, ct.receiver_id, ct.user_id, ct.amount, ct.transaction_type, ct.request_id, ct.session_id, ct.created_at " +
      "FROM credit_transactions ct " +
      where +
      " ORDER BY ct.created_at DESC, ct.id DESC " +
      `LIMIT ${safeLimit}`,
    values,
  );
  return result.rows || [];
}

module.exports = {
  ensureProfileRow,
  getWalletSummary,
  listTransactions,
};
