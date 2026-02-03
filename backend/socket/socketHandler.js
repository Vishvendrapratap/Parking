const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(
        `User ${socket.userId} joined conversation ${conversationId}`,
      );
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Handle typing indicator
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      io.to(`user_${receiverId}`).emit("user_typing", {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      io.to(`user_${receiverId}`).emit("user_stopped_typing", {
        conversationId,
        userId: socket.userId,
      });
    });

    // Handle message sent
    socket.on("send_message", (data) => {
      const { conversationId, receiverId, message } = data;

      // Emit to receiver
      io.to(`user_${receiverId}`).emit("new_message", {
        conversationId,
        message,
      });

      // Also emit to conversation room
      socket.to(`conversation_${conversationId}`).emit("new_message", {
        conversationId,
        message,
      });
    });

    // Handle message read
    socket.on("messages_read", ({ conversationId, senderId }) => {
      io.to(`user_${senderId}`).emit("messages_read", {
        conversationId,
        readBy: socket.userId,
      });
    });

    // Handle location sharing
    socket.on("share_location", ({ conversationId, receiverId, location }) => {
      io.to(`user_${receiverId}`).emit("location_shared", {
        conversationId,
        userId: socket.userId,
        location,
      });
    });

    // Handle booking notifications
    socket.on("booking_action", ({ bookingId, action, userId }) => {
      io.to(`user_${userId}`).emit("booking_notification", {
        bookingId,
        action,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initializeSocket, getIO };
