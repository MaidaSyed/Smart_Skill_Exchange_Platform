const express = require("express");
const requestsController = require("../controllers/requestsController.js");

const router = express.Router();

router.post("/requests", requestsController.createRequest);
router.get("/requests/sent", requestsController.getSent);
router.get("/requests/received", requestsController.getReceived);
router.put("/requests/:id/accept", requestsController.accept);
router.put("/requests/:id/reject", requestsController.reject);

module.exports = router;
