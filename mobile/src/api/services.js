import { api } from "./axios";

// ==================== PARKING SPACES ====================

export const getParkingSpaces = async (params = {}) => {
  const response = await api.get("/parking", { params });
  return response.data;
};

export const getParkingSpace = async (id) => {
  const response = await api.get(`/parking/${id}`);
  return response.data;
};

export const searchNearbyParking = async (
  lat,
  lng,
  radius = 5000,
  filters = {},
) => {
  const response = await api.get("/parking", {
    params: { lat, lng, radius, ...filters },
  });
  return response.data;
};

export const createParkingSpace = async (data) => {
  const response = await api.post("/parking", data);
  return response.data;
};

export const updateParkingSpace = async (id, data) => {
  const response = await api.put(`/parking/${id}`, data);
  return response.data;
};

export const deleteParkingSpace = async (id) => {
  const response = await api.delete(`/parking/${id}`);
  return response.data;
};

export const getMyListings = async (params = {}) => {
  const response = await api.get("/parking/owner/my-listings", { params });
  return response.data;
};

export const updateParkingStatus = async (id, status) => {
  const response = await api.put(`/parking/${id}/status`, { status });
  return response.data;
};

export const checkParkingAvailability = async (id, startTime, endTime) => {
  const response = await api.get(`/parking/${id}/availability`, {
    params: { startTime, endTime },
  });
  return response.data;
};

export const uploadParkingImages = async (id, formData) => {
  const response = await api.post(`/parking/${id}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ==================== BOOKINGS ====================

export const createBooking = async (data) => {
  const response = await api.post("/bookings", data);
  return response.data;
};

export const getBookings = async (params = {}) => {
  const response = await api.get("/bookings", { params });
  return response.data;
};

export const getMyBookings = async (params = {}) => {
  const response = await api.get("/bookings", { params });
  return response.data;
};

export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const updateBookingStatus = async (id, status, reason = "") => {
  const response = await api.put(`/bookings/${id}/status`, { status, reason });
  return response.data;
};

export const cancelBooking = async (id, reason = "") => {
  const response = await api.put(`/bookings/${id}/cancel`, { reason });
  return response.data;
};

export const addBookingReview = async (id, rating, comment) => {
  const response = await api.put(`/bookings/${id}/review`, { rating, comment });
  return response.data;
};

export const checkInBooking = async (id, photo = null) => {
  const response = await api.put(`/bookings/${id}/checkin`, { photo });
  return response.data;
};

export const checkOutBooking = async (id, photo = null) => {
  const response = await api.put(`/bookings/${id}/checkout`, { photo });
  return response.data;
};

// ==================== CHAT ====================

export const getConversations = async () => {
  const response = await api.get("/chat/conversations");
  return response.data;
};

export const getMessages = async (conversationId, page = 1) => {
  const response = await api.get(
    `/chat/conversations/${conversationId}/messages`,
    {
      params: { page },
    },
  );
  return response.data;
};

export const sendMessage = async (receiverId, text, parkingSpaceId = null) => {
  const response = await api.post("/chat/messages", {
    receiverId,
    text,
    parkingSpaceId,
  });
  return response.data;
};

export const startConversation = async (
  receiverId,
  parkingSpaceId = null,
  initialMessage = "",
) => {
  const response = await api.post("/chat/start", {
    receiverId,
    parkingSpaceId,
    initialMessage,
  });
  return response.data;
};

export const markMessagesAsRead = async (conversationId) => {
  const response = await api.put(`/chat/conversations/${conversationId}/read`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/chat/unread-count");
  return response.data;
};

// ==================== USERS ====================

export const getMyProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getUserProfile = async (id) => {
  const response = await api.get(`/users/${id}/profile`);
  return response.data;
};

export const updatePushToken = async (pushToken) => {
  const response = await api.put("/users/push-token", { pushToken });
  return response.data;
};
