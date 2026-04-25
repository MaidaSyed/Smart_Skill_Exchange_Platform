const express = require("express");
const profilesController = require("../controllers/profilesController.js");

const router = express.Router();

router.get("/profile/:userId", profilesController.getProfile);
router.put("/profile/:userId", profilesController.updateProfile);

module.exports = router;
