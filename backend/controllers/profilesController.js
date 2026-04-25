const profilesModel = require("../models/profilesModel.js");

async function getProfile(req, res) {
  const userId = req.params?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const result = await profilesModel.getProfileAndRole({ userId });
    return res.json({ ok: true, profile: result.profile, role: result.role });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ ok: false, error: "Error" });
  }
}

async function updateProfile(req, res) {
  const userId = req.params?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  const fullName = req.body?.fullName || null;
  const bio = req.body?.bio || null;

  try {
    const profile = await profilesModel.upsertProfile({ userId, fullName, bio });
    return res.json({ ok: true, profile });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ ok: false, error: "Error" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
