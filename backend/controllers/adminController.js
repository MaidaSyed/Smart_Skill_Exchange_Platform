const adminModel = require("../models/adminModel.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function stats(req, res) {
  const userId = req.query?.userId || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const stats = await adminModel.getStats();
    return res.json({ ok: true, stats });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function users(req, res) {
  const userId = req.query?.userId || null;
  const search = req.query?.search || null;
  const limit = req.query?.limit || null;
  const offset = req.query?.offset || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const users = await adminModel.listUsers({ search, limit, offset });
    return res.json({ ok: true, users });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function setRole(req, res) {
  const userId = req.body?.userId || null;
  const targetUserId = req.params?.id || null;
  const role = req.body?.role || null;
  if (!userId || !targetUserId || !role) {
    return res.status(400).json({ ok: false, error: "userId, id, role are required" });
  }
  if (String(userId) === String(targetUserId)) {
    return res.status(400).json({ ok: false, error: "You cannot perform this action on your own account." });
  }

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const updated = await adminModel.setUserRole({ targetUserId, role });
    return res.json({ ok: true, user: updated });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function setSuspended(req, res) {
  const userId = req.body?.userId || null;
  const targetUserId = req.params?.id || null;
  const suspended = req.body?.suspended;
  if (!userId || !targetUserId) {
    return res.status(400).json({ ok: false, error: "userId and id are required" });
  }
  if (String(userId) === String(targetUserId)) {
    return res.status(400).json({ ok: false, error: "You cannot perform this action on your own account." });
  }

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const updated = await adminModel.setUserSuspended({ targetUserId, suspended });
    return res.json({ ok: true, user: updated });
  } catch (error) {
    console.log(error.message);
    if (error?.message === "USER_NOT_FOUND") {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function removeUser(req, res) {
  const userId = req.body?.userId || req.query?.userId || null;
  const targetUserId = req.params?.id || null;
  if (!userId || !targetUserId) {
    return res.status(400).json({ ok: false, error: "userId and id are required" });
  }
  if (String(userId) === String(targetUserId)) {
    return res.status(400).json({ ok: false, error: "You cannot perform this action on your own account." });
  }

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    await adminModel.deleteUser({ targetUserId });
    return res.json({ ok: true });
  } catch (error) {
    console.log(error.message);
    if (error?.message === "USER_NOT_FOUND") {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function skills(req, res) {
  const userId = req.query?.userId || null;
  const search = req.query?.search || null;
  const limit = req.query?.limit || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const skills = await adminModel.listSkills({ search, limit });
    return res.json({ ok: true, skills });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function duplicateSkills(req, res) {
  const userId = req.query?.userId || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const duplicates = await adminModel.listDuplicateSkills();
    return res.json({ ok: true, duplicates });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function removeSkill(req, res) {
  const userId = req.body?.userId || req.query?.userId || null;
  const skillId = req.params?.id || null;
  if (!userId || !skillId) return res.status(400).json({ ok: false, error: "userId and id are required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const deleted = await adminModel.deleteSkill({ skillId });
    return res.json({ ok: true, deleted });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function merge(req, res) {
  const userId = req.body?.userId || null;
  const fromSkillId = req.body?.fromSkillId;
  const toSkillId = req.body?.toSkillId;
  if (!userId || !fromSkillId || !toSkillId) {
    return res.status(400).json({ ok: false, error: "userId, fromSkillId, toSkillId are required" });
  }

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    await adminModel.mergeSkills({ fromSkillId, toSkillId });
    return res.json({ ok: true });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function sessions(req, res) {
  const userId = req.query?.userId || null;
  const filter = req.query?.filter || null;
  const limit = req.query?.limit || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const sessions = await adminModel.listSessions({ filter, limit });
    return res.json({ ok: true, sessions });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function reports(req, res) {
  const userId = req.query?.userId || null;
  const limit = req.query?.limit || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    const reports = await adminModel.getReports({ limit });
    return res.json({ ok: true, reports });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  stats,
  users,
  setRole,
  setSuspended,
  removeUser,
  skills,
  duplicateSkills,
  removeSkill,
  merge,
  sessions,
  reports,
};
