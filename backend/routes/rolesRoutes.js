const express = require("express");
const rolesController = require("../controllers/rolesController.js");

const router = express.Router();

router.post("/create-role", rolesController.createRole);
router.get("/user-role/:userId", rolesController.getRole);

module.exports = router;
