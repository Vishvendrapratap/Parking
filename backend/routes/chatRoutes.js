const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteMessage,
  getUnreadCount,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");
const { chatValidation, validate } = require("../middleware/validators");

router.get("/conversations", protect, getConversations);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.put("/conversations/:conversationId/read", protect, markAsRead);
router.post("/messages", protect, chatValidation, validate, sendMessage);
router.post("/start", protect, startConversation);
router.delete("/messages/:messageId", protect, deleteMessage);
router.get("/unread-count", protect, getUnreadCount);

module.exports = router;
