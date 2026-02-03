import api from "./axios";

// Auth Services
export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  sendOTP: (phone) => api.post("/auth/send-otp", { phone }),
  verifyOTP: (phone, otp) => api.post("/auth/verify-otp", { phone, otp }),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/users/profile", data),
  switchRole: (role) => api.post("/auth/switch-role", { role }),
};

// Parking Services
export const parkingService = {
  search: (params) => api.get("/parking/search", { params }),
  getNearby: (lat, lng, radius = 5000) =>
    api.get("/parking/nearby", { params: { lat, lng, radius } }),
  getById: (id) => api.get(`/parking/${id}`),
  create: (data) => api.post("/parking", data),
  update: (id, data) => api.put(`/parking/${id}`, data),
  delete: (id) => api.delete(`/parking/${id}`),
  addImages: (id, formData) =>
    api.post(`/parking/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: (id, imageId) => api.delete(`/parking/${id}/images/${imageId}`),
  checkAvailability: (id, startTime, endTime) =>
    api.get(`/parking/${id}/availability`, { params: { startTime, endTime } }),
  getMyListings: () => api.get("/parking/my-listings"),
};

// Booking Services
export const bookingService = {
  create: (data) => api.post("/bookings", data),
  getAll: (params) => api.get("/bookings", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  addReview: (id, data) => api.post(`/bookings/${id}/review`, data),
  getOwnerBookings: () => api.get("/bookings/owner"),
};

// Chat Services
export const chatService = {
  getConversations: () => api.get("/chat/conversations"),
  getMessages: (conversationId) => api.get(`/chat/messages/${conversationId}`),
  sendMessage: (receiverId, text, parkingSpaceId) =>
    api.post("/chat/messages", { receiverId, text, parkingSpaceId }),
};

// User Services
export const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  uploadProfilePicture: (formData) =>
    api.post("/users/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Owner Services
export const ownerService = {
  getDashboard: () => api.get("/users/owner/dashboard"),
  getEarnings: (params) => api.get("/users/owner/earnings", { params }),
};

// Admin Services
export const adminService = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getListings: (params) => api.get("/admin/listings", { params }),
  updateListing: (id, data) => api.put(`/admin/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/admin/listings/${id}`),
  getBookings: (params) => api.get("/admin/bookings", { params }),
  getStats: () => api.get("/admin/stats"),
};
