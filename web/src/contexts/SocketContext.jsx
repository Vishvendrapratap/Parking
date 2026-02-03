import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem("token");
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || window.location.origin;

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const sendMessage = (receiverId, text, parkingSpaceId, conversationId) => {
    if (socket && isConnected) {
      socket.emit("send_message", {
        receiverId,
        text,
        parkingSpaceId,
        conversationId,
      });
    }
  };

  const joinConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit("join_conversation", { conversationId });
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit("leave_conversation", { conversationId });
    }
  };

  const startTyping = (receiverId, conversationId) => {
    if (socket && isConnected) {
      socket.emit("typing_start", { receiverId, conversationId });
    }
  };

  const stopTyping = (receiverId, conversationId) => {
    if (socket && isConnected) {
      socket.emit("typing_stop", { receiverId, conversationId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        joinConversation,
        leaveConversation,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
