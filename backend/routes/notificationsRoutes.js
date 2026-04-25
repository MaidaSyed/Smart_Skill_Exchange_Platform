const express = require("express");
const notificationsController = require("../controllers/notificationsController.js");

const router = express.Router();

router.get("/notifications/unread-count", notificationsController.getUnreadCount);
router.get("/notifications", notificationsController.list);
router.put("/notifications/mark-seen", notificationsController.markAllRead);
router.put("/notifications/:id/read", notificationsController.markOneRead);

module.exports = router;

