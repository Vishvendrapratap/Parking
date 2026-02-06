import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getMyBookings } from "../api/services";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const PendingRequestsContext = createContext();

export const PendingRequestsProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const { isAuthenticated, isOwner } = useAuth();
  const { socket } = useSocket();

  const fetchPendingCount = useCallback(async () => {
    if (!isAuthenticated || !isOwner) {
      setPendingCount(0);
      return;
    }

    try {
      const result = await getMyBookings({ status: "pending", role: "owner" });
      setPendingCount(result.data?.length || 0);
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
    }
  }, [isAuthenticated, isOwner]);

  // Fetch on mount and when authenticated as owner
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Listen for new bookings via socket (when someone books your space)
  useEffect(() => {
    if (!socket || !isOwner) return;

    const handleNewBooking = () => {
      // Increment pending count when a new booking request arrives
      setPendingCount((prev) => prev + 1);
    };

    const handleBookingUpdate = () => {
      // Refresh count when a booking is updated (approved/rejected)
      fetchPendingCount();
    };

    socket.on("new_booking", handleNewBooking);
    socket.on("booking_confirmed", handleBookingUpdate);
    socket.on("booking_rejected", handleBookingUpdate);
    socket.on("booking_cancelled", handleBookingUpdate);

    return () => {
      socket.off("new_booking", handleNewBooking);
      socket.off("booking_confirmed", handleBookingUpdate);
      socket.off("booking_rejected", handleBookingUpdate);
      socket.off("booking_cancelled", handleBookingUpdate);
    };
  }, [socket, isOwner, fetchPendingCount]);

  // Function to refresh the count
  const refreshPendingCount = useCallback(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Function to decrement count (call after approving/rejecting)
  const decrementPendingCount = useCallback(() => {
    setPendingCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <PendingRequestsContext.Provider
      value={{
        pendingCount,
        refreshPendingCount,
        decrementPendingCount,
      }}
    >
      {children}
    </PendingRequestsContext.Provider>
  );
};

export const usePendingRequests = () => {
  const context = useContext(PendingRequestsContext);
  if (!context) {
    throw new Error(
      "usePendingRequests must be used within a PendingRequestsProvider",
    );
  }
  return context;
};

export default PendingRequestsContext;
