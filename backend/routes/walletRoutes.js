const express = require("express");
const walletController = require("../controllers/walletController.js");

const router = express.Router();

router.get("/wallet/summary", walletController.summary);
router.get("/wallet/transactions", walletController.transactions);

module.exports = router;

