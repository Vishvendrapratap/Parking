// API Configuration
export const API_URL = __DEV__
  ? "http://localhost:5000/api" // Development
  : "https://your-production-url.com/api"; // Production

export const SOCKET_URL = __DEV__
  ? "http://localhost:5000"
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
    icon: "🚗",
  },
  {
    value: "sedan",
    label: "Sedan",
    description: "Honda Civic, Toyota Camry, BMW 3 Series",
    icon: "🚙",
  },
  {
    value: "suv",
    label: "SUV / Large",
    description: "Ford F-150, Chevy Tahoe, Range Rover",
    icon: "🚐",
  },
];

// Amenities
export const AMENITIES = [
  { value: "covered", label: "Covered", icon: "🏠" },
  { value: "security_camera", label: "Security Camera", icon: "📹" },
  { value: "gated", label: "Gated", icon: "🚧" },
  { value: "ev_charging", label: "EV Charging", icon: "⚡" },
  { value: "well_lit", label: "Well Lit", icon: "💡" },
  { value: "handicap_accessible", label: "Handicap Accessible", icon: "♿" },
  { value: "24_7_access", label: "24/7 Access", icon: "🕐" },
  { value: "security_guard", label: "Security Guard", icon: "👮" },
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
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};
