const mongoose = require("mongoose");

// Conversation schema for managing chat threads
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    parkingSpace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSpace",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    lastMessage: {
      text: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: Date,
      isRead: Boolean,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for finding conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ "lastMessage.timestamp": -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

// Chat message schema
const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "location", "booking_request", "system"],
      default: "text",
    },
    // For image messages
    media: {
      url: String,
      type: String,
      thumbnailUrl: String,
    },
    // For location sharing
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: [Number],
    },
    // For booking-related messages
    bookingInfo: {
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
      action: {
        type: String,
        enum: ["request", "confirmed", "rejected", "cancelled"],
      },
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Delivery status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    // Soft delete
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
chatMessageSchema.index({ conversation: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ receiver: 1 });

// Update conversation's last message after saving
chatMessageSchema.post("save", async function () {
  await Conversation.findByIdAndUpdate(this.conversation, {
    lastMessage: {
      text: this.text,
      sender: this.sender,
      timestamp: this.createdAt,
      isRead: this.isRead,
    },
    $inc: { [`unreadCount.${this.receiver}`]: 1 },
  });
});

// Static method to get or create conversation
chatMessageSchema.statics.getOrCreateConversation = async function (
  user1Id,
  user2Id,
  parkingSpaceId = null,
) {
  let conversation = await Conversation.findOne({
    participants: { $all: [user1Id, user2Id] },
    ...(parkingSpaceId && { parkingSpace: parkingSpaceId }),
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [user1Id, user2Id],
      parkingSpace: parkingSpaceId,
      unreadCount: new Map([
        [user1Id.toString(), 0],
        [user2Id.toString(), 0],
      ]),
    });
  }

  return conversation;
};

// Static method to mark messages as read
chatMessageSchema.statics.markAsRead = async function (conversationId, userId) {
  const result = await this.updateMany(
    {
      conversation: conversationId,
      receiver: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
      status: "read",
    },
  );

  // Reset unread count for user
  await Conversation.findByIdAndUpdate(conversationId, {
    [`unreadCount.${userId}`]: 0,
    "lastMessage.isRead": true,
  });

  return result;
};

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { ChatMessage, Conversation };
