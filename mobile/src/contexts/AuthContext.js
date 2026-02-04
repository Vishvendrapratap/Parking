import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { api, setAuthToken } from "../api/axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("authToken");
      const storedUser = await SecureStore.getItemAsync("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthToken(storedToken);

        // Verify token is still valid
        try {
          const response = await api.get("/auth/me");
          setUser(response.data.data);
        } catch (error) {
          // Token invalid, clear storage
          await logout();
        }
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, phone, password) => {
    try {
      console.log("Attempting login with:", { email, phone });

      // Build request body, only include non-null values
      const requestBody = { password };
      if (email) requestBody.email = email;
      if (phone) requestBody.phone = phone;

      const response = await api.post("/auth/login", requestBody);

      console.log("Login response:", response.data);
      const { token: newToken, user: userData } = response.data;

      await SecureStore.setItemAsync("authToken", newToken);
      await SecureStore.setItemAsync("user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setAuthToken(newToken);

      return { success: true, user: userData };
    } catch (error) {
      console.log("Login error:", error.message);
      console.log("Error response:", error.response?.data);
      console.log("Error code:", error.code);
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const register = async (name, email, phone, password, role = "seeker") => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
        role,
      });

      const { token: newToken, user: userData } = response.data;

      await SecureStore.setItemAsync("authToken", newToken);
      await SecureStore.setItemAsync("user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setAuthToken(newToken);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const sendOTP = async (phone) => {
    try {
      const response = await api.post("/auth/send-otp", { phone });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP",
      };
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      const response = await api.post("/auth/verify-otp", { phone, otp });

      const { token: newToken, user: userData } = response.data;

      await SecureStore.setItemAsync("authToken", newToken);
      await SecureStore.setItemAsync("user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setAuthToken(newToken);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "OTP verification failed",
      };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("user");
      setToken(null);
      setUser(null);
      setAuthToken(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await api.put("/auth/updatedetails", userData);
      const updatedUser = response.data.data;

      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  const switchRole = async (newRole) => {
    try {
      const response = await api.put("/auth/switch-role", { role: newRole });
      const updatedUser = response.data.data;

      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Role switch failed",
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isOwner: user?.role === "owner",
    isSeeker: user?.role === "seeker",
    isAdmin: user?.role === "admin",
    login,
    register,
    sendOTP,
    verifyOTP,
    logout,
    updateUser,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
