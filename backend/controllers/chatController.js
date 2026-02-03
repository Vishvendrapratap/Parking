const { ChatMessage, Conversation } = require("../models/ChatMessage");

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    })
      .populate("participants", "name avatar")
      .populate("parkingSpace", "title images")
      .sort({ "lastMessage.timestamp": -1 });

    // Format response with unread counts
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== req.user.id,
      );
      return {
        _id: conv._id,
        participant: otherParticipant,
        parkingSpace: conv.parkingSpace,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount?.get(req.user.id) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await ChatMessage.find({
      conversation: conversationId,
      deletedFor: { $ne: req.user.id },
    })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    await ChatMessage.markAsRead(conversationId, req.user.id);

    res.status(200).json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};

// @desc    Send message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text, parkingSpaceId, messageType = "text" } = req.body;

    // Get or create conversation
    const conversation = await ChatMessage.getOrCreateConversation(
      req.user.id,
      receiverId,
      parkingSpaceId,
    );

    const message = await ChatMessage.create({
      conversation: conversation._id,
      sender: req.user.id,
      receiver: receiverId,
      text,
      messageType,
    });

    const populatedMessage = await ChatMessage.findById(message._id).populate(
      "sender",
      "name avatar",
    );

    // Emit to receiver via socket
    const io = req.app.get("io");
    io.to(`user_${receiverId}`).emit("new_message", {
      message: populatedMessage,
      conversationId: conversation._id,
    });

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

// @desc    Start or get conversation with user about a parking space
// @route   POST /api/chat/start
// @access  Private
exports.startConversation = async (req, res) => {
  try {
    const { receiverId, parkingSpaceId, initialMessage } = req.body;

    // Get or create conversation
    const conversation = await ChatMessage.getOrCreateConversation(
      req.user.id,
      receiverId,
      parkingSpaceId,
    );

    // Send initial message if provided
    if (initialMessage) {
      const message = await ChatMessage.create({
        conversation: conversation._id,
        sender: req.user.id,
        receiver: receiverId,
        text: initialMessage,
      });

      // Emit to receiver
      const io = req.app.get("io");
      io.to(`user_${receiverId}`).emit("new_message", {
        message: await message.populate("sender", "name avatar"),
        conversationId: conversation._id,
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name avatar")
      .populate("parkingSpace", "title images");

    res.status(200).json({
      success: true,
      data: populatedConversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting conversation",
      error: error.message,
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/conversations/:conversationId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await ChatMessage.markAsRead(conversationId, req.user.id);

    // Notify sender that messages are read
    const io = req.app.get("io");
    const conversation = await Conversation.findById(conversationId);
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== req.user.id,
    );

    io.to(`user_${otherUserId}`).emit("messages_read", {
      conversationId,
      readBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking messages as read",
      error: error.message,
    });
  }
};

// @desc    Delete message (soft delete for user)
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Soft delete for this user only
    if (!message.deletedFor.includes(req.user.id)) {
      message.deletedFor.push(req.user.id);
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message,
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      totalUnread += conv.unreadCount?.get(req.user.id) || 0;
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message,
    });
  }
};
