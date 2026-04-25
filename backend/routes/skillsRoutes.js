const express = require("express");
const skillsController = require("../controllers/skillsController.js");

const router = express.Router();

router.get("/user-skills/:userId", skillsController.listUserSkills);
router.post("/user-skills", skillsController.addUserSkill);
router.delete("/user-skills/:userId/:skillId", skillsController.removeUserSkill);
router.get("/explore-skills", skillsController.explore);

module.exports = router;
