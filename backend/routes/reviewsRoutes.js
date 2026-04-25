const express = require("express");
const reviewsController = require("../controllers/reviewsController.js");

const router = express.Router();

router.post("/reviews", reviewsController.create);
router.get("/reviews/user/:userId", reviewsController.listForUser);
router.get("/reviews/stats/:userId", reviewsController.stats);
router.get("/pending-reviews", reviewsController.pending);
router.get("/pending-reviews/exists", reviewsController.pendingExists);

module.exports = router;
