const rolesModel = require("../models/rolesModel.js");

async function createRole(req, res) {
  const userId = req.body?.userId;
  const email = req.body?.email || null;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const data = await rolesModel.createRoleIfMissing({ userId, email });
    return res.json({ ok: true, data });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ ok: false, error: "Error" });
  }
}

async function getRole(req, res) {
  const userId = req.params?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const role = await rolesModel.getRoleByUserId({ userId });
    return res.json({ ok: true, role });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ ok: false, error: "Error" });
  }
}

module.exports = {
  createRole,
  getRole,
};
