// API Configuration
// For Android Emulator: use "10.0.2.2" (maps to host localhost)
// For iOS Simulator: use "localhost"
// For Physical device: use your PC's IP address
import { Platform } from "react-native";

// Use your PC's actual Wi-Fi IP for physical devices
// Change this to your current IP address
const LOCAL_IP = "192.168.1.7";

export const API_URL = __DEV__
  ? `http://${LOCAL_IP}:5000/api`
  : "https://your-production-url.com/api";

export const SOCKET_URL = __DEV__
  ? `http://${LOCAL_IP}:5000`
  : "https://your-production-url.com";

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = "AIzaSyBF1cfg0RytU-lbuqnFET0VFoS9aOhvyXAv";

// Map defaults
export const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Parking sizes
export const PARKING_SIZES = [
  {
    value: "small",
    label: "Small Car",
    description: "Smart Car, Mini Cooper, Fiat 500",
    icon: "car",
  },
  {
    value: "sedan",
    label: "Sedan",
    description: "Honda Civic, Toyota Camry, BMW 3 Series",
    icon: "carSide",
  },
  {
    value: "suv",
    label: "SUV / Large",
    description: "Ford F-150, Chevy Tahoe, Range Rover",
    icon: "van",
  },
];

// Amenities
export const AMENITIES = [
  { value: "covered", label: "Covered", icon: "covered" },
  {
    value: "security_camera",
    label: "Security Camera",
    icon: "securityCamera",
  },
  { value: "gated", label: "Gated", icon: "gate" },
  { value: "ev_charging", label: "EV Charging", icon: "evCharging" },
  { value: "well_lit", label: "Well Lit", icon: "lightbulb" },
  {
    value: "handicap_accessible",
    label: "Handicap Accessible",
    icon: "wheelchair",
  },
  { value: "24_7_access", label: "24/7 Access", icon: "24hours" },
  { value: "security_guard", label: "Security Guard", icon: "guard" },
];

// Booking statuses
export const BOOKING_STATUSES = {
  pending: { label: "Pending", color: "#F59E0B" },
  confirmed: { label: "Confirmed", color: "#10B981" },
  active: { label: "Active", color: "#3B82F6" },
  completed: { label: "Completed", color: "#6B7280" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
  rejected: { label: "Rejected", color: "#EF4444" },
  expired: { label: "Expired", color: "#6B7280" },
};

// Colors
export const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  secondary: "#10B981",
  accent: "#F59E0B",
  background: "#F3F4F6",
  white: "#FFFFFF",
  black: "#1F2937",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    light: "#9CA3AF",
  },
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};
