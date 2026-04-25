const express = require("express");
const adminController = require("../controllers/adminController.js");
const adminModel = require("../models/adminModel.js");

const router = express.Router();

async function requireAdmin(req, res, next) {
  const userId = req.query?.userId || req.body?.userId || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const ok = await adminModel.isAdmin({ userId });
    if (!ok) return res.status(403).json({ ok: false, error: "Forbidden" });
    return next();
  } catch (error) {
    console.log(error?.message || error);
    return res.status(500).json({ ok: false, error: "Error" });
  }
}

router.use("/admin", requireAdmin);

router.get("/admin/stats", adminController.stats);
router.get("/admin/users", adminController.users);
router.put("/admin/users/:id/role", adminController.setRole);
router.put("/admin/users/:id/status", adminController.setSuspended);
router.delete("/admin/users/:id", adminController.removeUser);
router.get("/admin/skills", adminController.skills);
router.get("/admin/skills/duplicates", adminController.duplicateSkills);
router.delete("/admin/skills/:id", adminController.removeSkill);
router.post("/admin/skills/merge", adminController.merge);
router.get("/admin/sessions", adminController.sessions);
router.get("/admin/reports", adminController.reports);

module.exports = router;
