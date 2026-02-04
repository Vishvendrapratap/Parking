import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { SOCKET_URL } from "../constants/config";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  const joinConversation = useCallback(
    (conversationId) => {
      if (socket && connected) {
        socket.emit("join_conversation", conversationId);
      }
    },
    [socket, connected],
  );

  const leaveConversation = useCallback(
    (conversationId) => {
      if (socket && connected) {
        socket.emit("leave_conversation", conversationId);
      }
    },
    [socket, connected],
  );

  const sendTypingStart = useCallback(
    (conversationId, receiverId) => {
      if (socket && connected) {
        socket.emit("typing_start", { conversationId, receiverId });
      }
    },
    [socket, connected],
  );

  const sendTypingStop = useCallback(
    (conversationId, receiverId) => {
      if (socket && connected) {
        socket.emit("typing_stop", { conversationId, receiverId });
      }
    },
    [socket, connected],
  );

  const sendMessage = useCallback(
    (receiverId, text, parkingSpaceId, conversationId) => {
      if (socket && connected) {
        socket.emit("send_message", {
          receiverId,
          text,
          parkingSpaceId,
          conversationId,
        });
      }
    },
    [socket, connected],
  );

  const onNewMessage = useCallback(
    (callback) => {
      if (socket) {
        socket.on("new_message", callback);
        return () => socket.off("new_message", callback);
      }
      return () => {};
    },
    [socket],
  );

  const onUserTyping = useCallback(
    (callback) => {
      if (socket) {
        socket.on("user_typing", callback);
        return () => socket.off("user_typing", callback);
      }
      return () => {};
    },
    [socket],
  );

  const onUserStoppedTyping = useCallback(
    (callback) => {
      if (socket) {
        socket.on("user_stopped_typing", callback);
        return () => socket.off("user_stopped_typing", callback);
      }
      return () => {};
    },
    [socket],
  );

  const onMessagesRead = useCallback(
    (callback) => {
      if (socket) {
        socket.on("messages_read", callback);
        return () => socket.off("messages_read", callback);
      }
      return () => {};
    },
    [socket],
  );

  const onBookingUpdate = useCallback(
    (callback) => {
      if (socket) {
        socket.on("booking_update", callback);
        return () => socket.off("booking_update", callback);
      }
      return () => {};
    },
    [socket],
  );

  const onNewBooking = useCallback(
    (callback) => {
      if (socket) {
        socket.on("new_booking", callback);
        return () => socket.off("new_booking", callback);
      }
      return () => {};
    },
    [socket],
  );

  const value = {
    socket,
    connected,
    isConnected: connected, // alias for compatibility
    unreadMessages,
    setUnreadMessages,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    sendMessage,
    onNewMessage,
    onUserTyping,
    onUserStoppedTyping,
    onMessagesRead,
    onBookingUpdate,
    onNewBooking,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
