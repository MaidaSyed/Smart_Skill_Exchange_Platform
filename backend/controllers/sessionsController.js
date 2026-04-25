const sessionsModel = require("../models/sessionsModel.js");

async function listSessions(req, res) {
  const userId = req.query?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const sessions = await sessionsModel.listSessionsForUser({ userId });
    return res.json({ ok: true, sessions });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ ok: false, error: "Error" });
  }
}

module.exports = {
  listSessions,
};

