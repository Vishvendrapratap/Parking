import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "../api/services";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const UnreadMessagesContext = createContext();

export const UnreadMessagesProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const result = await getUnreadCount();
      setUnreadCount(result.data?.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [isAuthenticated]);

  // Fetch on mount and when authenticated
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      // Increment unread count when a new message arrives
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);

  // Function to mark messages as read (call this when opening chat)
  const markAsRead = useCallback((count = 0) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  // Function to refresh the count (call after reading messages)
  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCount,
        markAsRead,
        refreshUnreadCount,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error("useUnreadMessages must be used within an UnreadMessagesProvider");
  }
  return context;
};

export default UnreadMessagesContext;
