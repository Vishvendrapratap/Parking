import axios from "axios";
import { API_URL } from "../constants/config";

console.log("API_URL configured as:", API_URL);

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Set auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("Making request to:", config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("API Response from:", response.config.url, "Status:", response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      console.error("API Error Response:", status, JSON.stringify(data));

      if (status === 401) {
        // Token expired or invalid
        // Handle logout in AuthContext
      }

      return Promise.reject(error);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error - No Response:", error.message);
      console.error("Request URL:", error.config?.url);
    } else {
      // Something else happened
      console.error("Request Setup Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
