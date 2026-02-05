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
      const { token, user: userData } = response.data;

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
      const { token, user: userData } = response.data;

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
      return { 
        success: true, 
        isNewUser: response.data.isNewUser,
        requiresRegistration: response.data.requiresRegistration,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send OTP";
      return { success: false, message };
    }
  };

  const verifyOTP = async (phone, otp, registrationData = null) => {
    try {
      const response = await authService.verifyOTP(phone, otp, registrationData);
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      toast.success("Login successful!");

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "OTP verification failed";
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
