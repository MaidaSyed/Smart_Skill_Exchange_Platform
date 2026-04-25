const skillsModel = require("../models/skillsModel.js");
const { normalizeProficiency } = require("../utils/normalize.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function listUserSkills(req, res) {
  const userId = req.params?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }

  try {
    const skills = await skillsModel.listUserSkills({ userId });
    return res.json({ ok: true, skills });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function addUserSkill(req, res) {
  const userId = req.body?.userId;
  const name = req.body?.name;
  const category = req.body?.category || null;
  const skillType = req.body?.skillType || null;
  const proficiency = normalizeProficiency(req.body?.proficiency);

  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required" });
  }
  if (!name) {
    return res.status(400).json({ ok: false, error: "name is required" });
  }

  try {
    const result = await skillsModel.addOrUpdateUserSkillTx({
      userId,
      name,
      category,
      skillType,
      proficiency,
    });
    return res.json({
      ok: true,
      userSkill: result?.userSkill || null,
      inserted: Boolean(result?.inserted),
      bonusCredits: result?.inserted ? 2 : 0,
    });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function removeUserSkill(req, res) {
  const userId = req.params?.userId;
  const skillId = req.params?.skillId;

  if (!userId || !skillId) {
    return res.status(400).json({ ok: false, error: "userId and skillId are required" });
  }

  try {
    await skillsModel.removeUserSkill({ userId, skillId });
    return res.json({ ok: true });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function explore(req, res) {
  const category = req.query?.category || null;
  const skillType = req.query?.skillType || req.query?.type || null;
  const search = req.query?.search || req.query?.q || null;
  const sortRaw = req.query?.sort || null;
  const sort =
    sortRaw === "latest" ? "newest" : sortRaw === "alphabetical" ? "alpha" : sortRaw;

  const level = req.query?.level || null;
  const proficiencyRaw = req.query?.proficiency || req.query?.proficiency_level || level || null;
  const proficiency =
    typeof proficiencyRaw === "string" &&
    ["beginner", "intermediate", "advanced"].includes(proficiencyRaw.toLowerCase())
      ? proficiencyRaw.toLowerCase() === "beginner"
        ? 2
        : proficiencyRaw.toLowerCase() === "intermediate"
          ? 3
          : 4
      : proficiencyRaw;

  try {
    const results = await skillsModel.exploreSkills({
      category,
      skillType,
      search,
      proficiency,
      sort,
    });
    return res.json({ ok: true, results });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  listUserSkills,
  addUserSkill,
  removeUserSkill,
  explore,
};
