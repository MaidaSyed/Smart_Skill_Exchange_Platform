const express = require("express");
const rootController = require("../controllers/rootController.js");

const router = express.Router();

router.get("/", rootController.getUsers);

module.exports = router;
