import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import NotificationBanner from "../components/NotificationBanner";

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children, navigation }) => {
  const { onBookingUpdate, onNewBooking } = useSocket();
  const { user } = useAuth();
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    title: "",
    type: "info",
    data: null,
  });

  // Define showNotification BEFORE it's used in useEffect hooks
  const showNotification = useCallback(
    ({ title, message, type = "info", data = null, duration = 4000 }) => {
      console.log("Showing notification:", { title, message, type });
      setNotification({
        visible: true,
        title,
        message,
        type,
        data,
        duration,
      });
    },
    [],
  );

  // Listen for booking updates (for seekers - when their booking is approved/rejected)
  useEffect(() => {
    console.log("Setting up booking_update listener");
    const unsubscribe = onBookingUpdate((data) => {
      console.log("Received booking_update event:", data);
      const { bookingId, status, message } = data;

      let title = "Booking Update";
      let type = "info";
      let notificationMessage = message;

      if (status === "confirmed") {
        title = "🎉 Booking Approved!";
        type = "success";
        notificationMessage =
          "Your parking booking has been confirmed by the owner.";
      } else if (status === "rejected") {
        title = "Booking Rejected";
        type = "error";
        notificationMessage =
          "Unfortunately, your booking request was rejected.";
      } else if (status === "cancelled") {
        title = "Booking Cancelled";
        type = "warning";
        notificationMessage = "Your booking has been cancelled.";
      } else if (status === "completed") {
        title = "Booking Completed";
        type = "success";
        notificationMessage =
          "Your parking session is complete. Don't forget to leave a review!";
      }

      showNotification({
        title,
        message: notificationMessage,
        type,
        data: { bookingId, status },
      });
    });

    return unsubscribe;
  }, [onBookingUpdate, showNotification]);

  // Listen for new bookings (for owners - when they receive a new booking request)
  useEffect(() => {
    if (user?.role === "owner") {
      console.log("Setting up new_booking listener for owner");
      const unsubscribe = onNewBooking((data) => {
        console.log("Received new_booking event:", data);
        const { booking } = data;

        showNotification({
          title: "📬 New Booking Request!",
          message: `${booking.seeker?.name || "Someone"} wants to book your parking space.`,
          type: "info",
          data: { bookingId: booking._id },
        });
      });

      return unsubscribe;
    }
  }, [onNewBooking, user?.role, showNotification]);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleNotificationPress = useCallback(() => {
    const { data } = notification;
    hideNotification();

    // Navigate to booking details if we have a bookingId
    if (data?.bookingId && navigation?.isReady?.()) {
      navigation.navigate("BookingDetails", { bookingId: data.bookingId });
    }
  }, [notification, navigation, hideNotification]);

  const value = {
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationBanner
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
        onDismiss={hideNotification}
        onPress={handleNotificationPress}
      />
    </NotificationContext.Provider>
  );
};
