const express = require("express");
const messagesController = require("../controllers/messagesController.js");

const router = express.Router();

router.get("/messages/conversations", messagesController.getConversations);
router.get("/messages/thread", messagesController.getThread);
router.get("/messages/unread-count", messagesController.getUnreadCount);
router.post("/messages", messagesController.send);
router.put("/messages/mark-read", messagesController.markRead);

module.exports = router;

