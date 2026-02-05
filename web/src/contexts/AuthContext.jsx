import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../api/services";
import toast from "react-hot-toast";

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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getProfile();
      // Note: axios interceptor already returns response.data
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      // Note: axios interceptor already returns response.data
      const { token, user: userData } = response;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      toast.success("Login successful!");

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      // Note: axios interceptor already returns response.data
      const { token, user: userData } = response;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      toast.success("Registration successful!");

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const switchRole = async (newRole) => {
    try {
      const response = await authService.switchRole(newRole);
      // Note: axios interceptor already returns response.data
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      toast.success(`Switched to ${newRole} mode`);
      return { success: true };
    } catch (error) {
      toast.error("Failed to switch role");
      return { success: false };
    }
  };

  const sendOTP = async (phone, isRegistration = false) => {
    try {
      const response = await authService.sendOTP(phone, isRegistration);
      // Note: axios interceptor already returns response.data, so response IS the data
      return {
        success: true,
        isNewUser: response.isNewUser,
        requiresRegistration: response.requiresRegistration,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send OTP";
      return { success: false, message };
    }
  };

  const verifyOTP = async (phone, otp, registrationData = null) => {
    try {
      const response = await authService.verifyOTP(
        phone,
        otp,
        registrationData,
      );
      // Note: axios interceptor already returns response.data, so response IS the data
      const { token, user: userData } = response;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      toast.success("Login successful!");

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "OTP verification failed";
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        switchRole,
        sendOTP,
        verifyOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
