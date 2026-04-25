const pool = require("../db/pool.js");
const notificationsModel = require("./notificationsModel.js");
const reviewsModel = require("./reviewsModel.js");

function addMinutesToTime(timeStr, minutes) {
  const parts = String(timeStr || "").split(":").map((n) => Number(n));
  const h = Number.isFinite(parts[0]) ? parts[0] : 0;
  const m = Number.isFinite(parts[1]) ? parts[1] : 0;
  const total = h * 60 + m + Number(minutes || 0);
  const outH = Math.floor(((total % (24 * 60)) + 24 * 60) % (24 * 60) / 60);
  const outM = ((total % 60) + 60) % 60;
  return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
}

async function createLearningRequest({
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
}) {
  if (!learnerId || !teacherId || !userSkillId) return null;
  if (String(learnerId) === String(teacherId)) return null;
  if (await reviewsModel.hasPendingReviews({ userId: learnerId })) {
    throw new Error("PENDING_REVIEW");
  }

  const ex = String(exchangeType || "").toLowerCase();
  if (ex !== "skill" && ex !== "credits") return null;

  const creditAmountRaw =
    offeredCreditAmount === "" || offeredCreditAmount === undefined ? null : Number(offeredCreditAmount);
  const creditAmount = Number.isFinite(creditAmountRaw) ? Math.trunc(creditAmountRaw) : null;
  const skillIdRaw = offeredSkillId === "" || offeredSkillId === undefined ? null : Number(offeredSkillId);
  const skillId = Number.isFinite(skillIdRaw) ? Math.trunc(skillIdRaw) : null;

  const result = await pool.query(
    "WITH valid AS (" +
      "SELECT CASE " +
      "WHEN $8 = 'credits' THEN ($10::int IS NOT NULL AND $10::int > 0) " +
      "WHEN $8 = 'skill' THEN (EXISTS (SELECT 1 FROM user_skills us WHERE us.auth_user_id = $1::uuid AND us.skill_id = $9) AND EXISTS (SELECT 1 FROM skills s WHERE s.id = $9)) " +
      "ELSE false END AS ok, " +
      "CASE WHEN $5::date IS NULL OR $6::time IS NULL THEN true ELSE (($5::date + $6::time) > now()) END AS future_ok" +
      ") " +
      "INSERT INTO learning_requests(learner_id, teacher_id, user_skill_id, message, preferred_date, preferred_start_time, duration_minutes, exchange_type, offered_skill_id, offered_credit_amount) " +
      "SELECT $1::uuid, $2::uuid, $3, $4, $5::date, $6::time, $7::int, $8, " +
      "CASE WHEN $8 = 'skill' THEN $9 ELSE NULL END, " +
      "CASE WHEN $8 = 'credits' THEN $10 ELSE NULL END " +
      "FROM valid WHERE ok AND future_ok " +
      "RETURNING id, learner_id, teacher_id, user_skill_id, message, preferred_date, preferred_start_time, duration_minutes, exchange_type, offered_skill_id, offered_credit_amount, status, teacher_seen, learner_seen, created_at, updated_at",
    [
      learnerId,
      teacherId,
      userSkillId,
      message || null,
      preferredDate || null,
      preferredStartTime || null,
      durationMinutes || null,
      ex,
      skillId,
      creditAmount,
    ],
  );

  const row = result.rows?.[0] || null;
  if (!row) return null;

  try {
    const details = await pool.query(
      "SELECT COALESCE(lp.full_name,'Learner') AS learner_name, s.name AS skill_name, lr.exchange_type, lr.offered_credit_amount, os.name AS offered_skill_name " +
        "FROM learning_requests lr " +
        "JOIN user_skills us ON us.id = lr.user_skill_id " +
        "JOIN skills s ON s.id = us.skill_id " +
        "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
        "LEFT JOIN user_profiles lp ON lp.auth_user_id = lr.learner_id " +
        "WHERE lr.id = $1",
      [row.id],
    );
    const d = details.rows?.[0] || null;
    if (d) {
      const exchangeText =
        d.exchange_type === "credits"
          ? `${d.offered_credit_amount || 0} Credits`
          : `Skill (${d.offered_skill_name || "—"})`;
      await notificationsModel.createNotification({
        userId: row.teacher_id,
        title: "New request",
        message: `${d.learner_name} requested to learn ${d.skill_name}. Exchange: ${exchangeText}`,
        type: "request_received",
        referenceId: row.id,
      });
    }
  } catch {
    const _IGNORE = 0;
  }

  return row;
}

async function listSentRequests({ learnerId }) {
  const result = await pool.query(
    "SELECT lr.id, lr.learner_id, lr.teacher_id, lr.user_skill_id, lr.message, lr.status, lr.preferred_date, lr.preferred_start_time, lr.duration_minutes, lr.exchange_type, lr.offered_skill_id, lr.offered_credit_amount, os.name AS offered_skill_name, lr.created_at, lr.updated_at, s.name AS skill_name, s.category, s.skill_type, us.proficiency, COALESCE(tp.full_name, 'Teacher') AS teacher_name, COALESCE(lp.full_name, 'Learner') AS learner_name " +
      "FROM learning_requests lr " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills s ON s.id = us.skill_id " +
      "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
      "LEFT JOIN user_profiles tp ON tp.auth_user_id = lr.teacher_id " +
      "LEFT JOIN user_profiles lp ON lp.auth_user_id = lr.learner_id " +
      "WHERE lr.learner_id = $1::uuid " +
      "ORDER BY lr.created_at DESC",
    [learnerId],
  );
  return result.rows || [];
}

async function listReceivedRequests({ teacherId }) {
  const result = await pool.query(
    "SELECT lr.id, lr.learner_id, lr.teacher_id, lr.user_skill_id, lr.message, lr.status, lr.preferred_date, lr.preferred_start_time, lr.duration_minutes, lr.exchange_type, lr.offered_skill_id, lr.offered_credit_amount, os.name AS offered_skill_name, lr.created_at, lr.updated_at, s.name AS skill_name, s.category, s.skill_type, us.proficiency, COALESCE(tp.full_name, 'Teacher') AS teacher_name, COALESCE(lp.full_name, 'Learner') AS learner_name " +
      "FROM learning_requests lr " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills s ON s.id = us.skill_id " +
      "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
      "LEFT JOIN user_profiles tp ON tp.auth_user_id = lr.teacher_id " +
      "LEFT JOIN user_profiles lp ON lp.auth_user_id = lr.learner_id " +
      "WHERE lr.teacher_id = $1::uuid " +
      "ORDER BY lr.created_at DESC",
    [teacherId],
  );
  return result.rows || [];
}

async function acceptRequest({ requestId, teacherId }) {
  const where = teacherId
    ? "id = $1 AND teacher_id = $2::uuid AND status = 'pending'"
    : "id = $1 AND status = 'pending'";
  const values = teacherId ? [requestId, teacherId] : [requestId];
  const result = await pool.query(
    `UPDATE learning_requests SET status = 'accepted', teacher_seen = true, learner_seen = false, updated_at = now() WHERE ${where} RETURNING id, learner_id, teacher_id, user_skill_id, message, status, preferred_date, preferred_start_time, duration_minutes, exchange_type, offered_skill_id, offered_credit_amount, teacher_seen, learner_seen, created_at, updated_at`,
    values,
  );
  return result.rows?.[0] || null;
}

async function rejectRequest({ requestId, teacherId }) {
  const where = teacherId
    ? "id = $1 AND teacher_id = $2::uuid AND status = 'pending'"
    : "id = $1 AND status = 'pending'";
  const values = teacherId ? [requestId, teacherId] : [requestId];
  const result = await pool.query(
    `UPDATE learning_requests SET status = 'rejected', teacher_seen = true, learner_seen = false, updated_at = now() WHERE ${where} RETURNING id, learner_id, teacher_id, user_skill_id, message, status, preferred_date, preferred_start_time, duration_minutes, exchange_type, offered_skill_id, offered_credit_amount, teacher_seen, learner_seen, created_at, updated_at`,
    values,
  );
  return result.rows?.[0] || null;
}

async function createSessionFromRequest({ request, client }) {
  const db = client || pool;
  const scheduledDate = request.preferred_date || new Date().toISOString().slice(0, 10);
  const startTime = request.preferred_start_time || "10:00";
  const duration = Number(request.duration_minutes) || 60;
  const endTime = addMinutesToTime(startTime, duration);
  const meetingLink = `https://meet.jit.si/ssep-${request.id}-${Date.now()}`;

  const inserted = await db.query(
    "INSERT INTO sessions(request_id, learner_id, teacher_id, scheduled_date, start_time, end_time, duration_minutes, chat_enabled_at, chat_expires_at, meeting_link) " +
      "VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, now(), (($4::date + $5::time) + ($7::int * interval '1 minute')), $8) " +
      "RETURNING id, request_id, learner_id, teacher_id, scheduled_date, start_time, end_time, duration_minutes, chat_enabled_at, chat_expires_at, meeting_link, status, created_at",
    [
      request.id,
      request.learner_id,
      request.teacher_id,
      scheduledDate,
      startTime,
      endTime,
      duration,
      meetingLink,
    ],
  );
  return inserted.rows?.[0] || null;
}

async function acceptRequestTx({ requestId, teacherId }) {
  const client = await pool.connect();
  try {
    if (await reviewsModel.hasPendingReviews({ userId: teacherId })) {
      return { request: null, session: null, error: "PENDING_REVIEW" };
    }
    await client.query("BEGIN");

    const updated = await client.query(
      "UPDATE learning_requests SET status = 'accepted', teacher_seen = true, learner_seen = false, updated_at = now() " +
        "WHERE id = $1 AND teacher_id = $2::uuid AND status = 'pending' AND (preferred_date IS NULL OR preferred_start_time IS NULL OR (preferred_date + preferred_start_time) > now()) " +
        "RETURNING id, learner_id, teacher_id, user_skill_id, message, status, preferred_date, preferred_start_time, duration_minutes, exchange_type, offered_skill_id, offered_credit_amount, teacher_seen, learner_seen, created_at, updated_at",
      [requestId, teacherId],
    );

    const request = updated.rows?.[0] || null;
    if (!request) {
      await client.query("ROLLBACK");
      return { request: null, session: null };
    }

    if (request.exchange_type === "credits") {
      const amount = Number(request.offered_credit_amount);
      const creditAmount = Number.isFinite(amount) ? Math.trunc(amount) : 0;
      if (creditAmount <= 0) {
        throw new Error("INVALID_CREDIT_AMOUNT");
      }

      await client.query(
        "INSERT INTO user_profiles(auth_user_id, credits) VALUES ($1::uuid, 0) ON CONFLICT (auth_user_id) DO NOTHING",
        [request.learner_id],
      );
      await client.query(
        "INSERT INTO user_profiles(auth_user_id, credits) VALUES ($1::uuid, 0) ON CONFLICT (auth_user_id) DO NOTHING",
        [request.teacher_id],
      );

      const debit = await client.query(
        "UPDATE user_profiles SET credits = credits - $2 WHERE auth_user_id = $1::uuid AND credits >= $2 RETURNING credits",
        [request.learner_id, creditAmount],
      );
      if (debit.rowCount === 0) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      await client.query(
        "UPDATE user_profiles SET credits = credits + $2 WHERE auth_user_id = $1::uuid",
        [request.teacher_id, creditAmount],
      );
    }

    const session = await createSessionFromRequest({ request, client });

    try {
      const who = await client.query(
        "SELECT COALESCE(tp.full_name,'Teacher') AS teacher_name, COALESCE(lp.full_name,'Learner') AS learner_name, s.name AS skill_name, os.name AS offered_skill_name " +
          "FROM learning_requests lr " +
          "JOIN user_skills us ON us.id = lr.user_skill_id " +
          "JOIN skills s ON s.id = us.skill_id " +
          "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
          "LEFT JOIN user_profiles tp ON tp.auth_user_id = lr.teacher_id " +
          "LEFT JOIN user_profiles lp ON lp.auth_user_id = lr.learner_id " +
          "WHERE lr.id = $1",
        [request.id],
      );
      const w = who.rows?.[0] || null;
      if (w) {
        const exchangeText =
          request.exchange_type === "credits"
            ? `${request.offered_credit_amount || 0} Credits`
            : `Skill (${w.offered_skill_name || "—"})`;
        await notificationsModel.createNotification({
          userId: request.learner_id,
          title: "Request accepted",
          message: `${w.teacher_name} accepted your ${w.skill_name} request. Exchange: ${exchangeText}`,
          type: "request_accepted",
          referenceId: request.id,
          client,
        });
        await notificationsModel.createNotification({
          userId: request.teacher_id,
          title: "Session scheduled",
          message: `Session scheduled with ${w.learner_name} for ${w.skill_name}.`,
          type: "session_scheduled",
          referenceId: session?.id || null,
          client,
        });
        await notificationsModel.createNotification({
          userId: request.learner_id,
          title: "Private chat opened",
          message: "Your private chat is now open until the session ends.",
          type: "chat_opened",
          referenceId: session?.id || null,
          client,
        });
        await notificationsModel.createNotification({
          userId: request.teacher_id,
          title: "Private chat opened",
          message: "Your private chat is now open until the session ends.",
          type: "chat_opened",
          referenceId: session?.id || null,
          client,
        });

        if (session?.id) {
          const chatText = `Session accepted for ${w.skill_name}. Use this chat to coordinate. Chat closes automatically after the session end time.`;
          const insertedMsg = await client.query(
            "INSERT INTO messages(sender_id, receiver_id, request_id, session_id, message_text) VALUES ($1::uuid, $2::uuid, $3, $4, $5) RETURNING id",
            [request.teacher_id, request.learner_id, request.id, session.id, chatText],
          );
          const msgId = insertedMsg.rows?.[0]?.id || null;
          if (msgId) {
            await notificationsModel.createNotification({
              userId: request.learner_id,
              title: "New message",
              message: chatText,
              type: "new_message",
              referenceId: msgId,
              client,
            });
          }
        }
      }
    } catch {
      const _IGNORE = 0;
    }

    if (request.exchange_type === "credits") {
      const amount = Number(request.offered_credit_amount);
      const creditAmount = Number.isFinite(amount) ? Math.trunc(amount) : 0;
      if (creditAmount > 0 && session?.id) {
        await client.query(
          "INSERT INTO credit_transactions(sender_id, receiver_id, user_id, amount, transaction_type, request_id, session_id) VALUES " +
            "($1::uuid, $2::uuid, $1::uuid, $3, 'spend', $4, $5), " +
            "($1::uuid, $2::uuid, $2::uuid, $3, 'earn', $4, $5)",
          [request.learner_id, request.teacher_id, creditAmount, request.id, session.id],
        );
        await notificationsModel.createNotification({
          userId: request.teacher_id,
          title: "Credits received",
          message: `You received ${creditAmount} credits for this session.`,
          type: "credits_received",
          referenceId: session.id,
          client,
        });
      }
    }

    await client.query("COMMIT");
    return { request, session };
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

async function rejectRequestTx({ requestId, teacherId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE learning_requests SET status = 'rejected', teacher_seen = true, learner_seen = false, updated_at = now() " +
        "WHERE id = $1 AND teacher_id = $2::uuid AND status = 'pending' " +
        "RETURNING id, learner_id, teacher_id, user_skill_id, message, status, preferred_date, preferred_start_time, duration_minutes, exchange_type, offered_skill_id, offered_credit_amount, teacher_seen, learner_seen, created_at, updated_at",
      [requestId, teacherId],
    );
    const row = result.rows?.[0] || null;
    if (!row) {
      await client.query("ROLLBACK");
      return null;
    }

    try {
      const who = await client.query(
        "SELECT COALESCE(tp.full_name,'Teacher') AS teacher_name, s.name AS skill_name " +
          "FROM learning_requests lr " +
          "JOIN user_skills us ON us.id = lr.user_skill_id " +
          "JOIN skills s ON s.id = us.skill_id " +
          "LEFT JOIN user_profiles tp ON tp.auth_user_id = lr.teacher_id " +
          "WHERE lr.id = $1",
        [row.id],
      );
      const w = who.rows?.[0] || null;
      if (w) {
        await notificationsModel.createNotification({
          userId: row.learner_id,
          title: "Request rejected",
          message: `${w.teacher_name} rejected your ${w.skill_name} request.`,
          type: "request_rejected",
          referenceId: row.id,
          client,
        });
      }
    } catch {
      const _IGNORE = 0;
    }

    await client.query("COMMIT");
    return row;
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

async function getUnreadNotificationsCount({ userId }) {
  const result = await pool.query(
    "SELECT (" +
      "SELECT COUNT(*)::int FROM learning_requests WHERE teacher_id = $1::uuid AND teacher_seen = false" +
      ") + (" +
      "SELECT COUNT(*)::int FROM learning_requests WHERE learner_id = $1::uuid AND learner_seen = false" +
      ") AS unread_count",
    [userId],
  );
  return result.rows?.[0]?.unread_count ?? 0;
}

async function listNotifications({ userId, limit = 25 }) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(100, Number(limit))) : 25;
  const result = await pool.query(
    "SELECT * FROM (" +
      "SELECT lr.id AS request_id, 'teacher' AS audience, lr.created_at AS ts, lr.status, lr.exchange_type, lr.offered_credit_amount, lr.offered_skill_id, os.name AS offered_skill_name, s.name AS requested_skill_name, COALESCE(lp.full_name, 'Learner') AS actor_name, lr.message " +
      "FROM learning_requests lr " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills s ON s.id = us.skill_id " +
      "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
      "LEFT JOIN user_profiles lp ON lp.auth_user_id = lr.learner_id " +
      "WHERE lr.teacher_id = $1::uuid AND lr.teacher_seen = false " +
      "UNION ALL " +
      "SELECT lr.id AS request_id, 'learner' AS audience, lr.updated_at AS ts, lr.status, lr.exchange_type, lr.offered_credit_amount, lr.offered_skill_id, os.name AS offered_skill_name, s.name AS requested_skill_name, COALESCE(tp.full_name, 'Teacher') AS actor_name, lr.message " +
      "FROM learning_requests lr " +
      "JOIN user_skills us ON us.id = lr.user_skill_id " +
      "JOIN skills s ON s.id = us.skill_id " +
      "LEFT JOIN skills os ON os.id = lr.offered_skill_id " +
      "LEFT JOIN user_profiles tp ON tp.auth_user_id = lr.teacher_id " +
      "WHERE lr.learner_id = $1::uuid AND lr.learner_seen = false" +
      ") n ORDER BY ts DESC LIMIT $2",
    [userId, safeLimit],
  );
  return result.rows || [];
}

async function markNotificationsSeen({ userId }) {
  const [a, b] = await Promise.all([
    pool.query(
      "UPDATE learning_requests SET teacher_seen = true, updated_at = now() WHERE teacher_id = $1::uuid AND teacher_seen = false",
      [userId],
    ),
    pool.query(
      "UPDATE learning_requests SET learner_seen = true, updated_at = now() WHERE learner_id = $1::uuid AND learner_seen = false",
      [userId],
    ),
  ]);
  return { teacherMarked: a.rowCount || 0, learnerMarked: b.rowCount || 0 };
}

module.exports = {
  createLearningRequest,
  listSentRequests,
  listReceivedRequests,
  acceptRequest,
  rejectRequest,
  createSessionFromRequest,
  acceptRequestTx,
  rejectRequestTx,
  getUnreadNotificationsCount,
  listNotifications,
  markNotificationsSeen,
};
