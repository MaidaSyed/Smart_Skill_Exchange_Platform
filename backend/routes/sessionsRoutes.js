const express = require("express");
const sessionsController = require("../controllers/sessionsController.js");

const router = express.Router();

router.get("/sessions", sessionsController.listSessions);

module.exports = router;

