// API Configuration
// For Android Emulator: use "10.0.2.2" (maps to host localhost)
// For iOS Simulator: use "localhost"
// For Physical device: use your PC's IP address
import { Platform } from "react-native";
import Constants from "expo-constants";

// Use your PC's actual Wi-Fi IP for physical devices
// Change this to your current IP address
const LOCAL_IP = "192.168.1.7";

// Production API URL - Update this when you deploy your backend
const PRODUCTION_API_URL = "https://your-production-api.com/api";
const PRODUCTION_SOCKET_URL = "https://your-production-api.com";

// Check if running in Expo Go development mode
const isDevelopment = __DEV__;

export const API_URL = isDevelopment
  ? `http://${LOCAL_IP}:5000/api`
  : PRODUCTION_API_URL;

export const SOCKET_URL = isDevelopment
  ? `http://${LOCAL_IP}:5000`
  : PRODUCTION_SOCKET_URL;

// Google Maps API Key (use different keys for iOS/Android in production)
// In production, keys are loaded from app.json config
export const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
  "AIzaSyDEYwDyIlL6CHzIcUzlNfkj9El2f3qf-nI"; // Fallback for development
// Map defaults (Mumbai, India)
export const DEFAULT_LOCATION = {
  latitude: 19.076,
  longitude: 72.8777,
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
  confirmed: { label: "Confirmed", color: "#169C46" },
  active: { label: "Active", color: "#2E77D0" },
  completed: { label: "Completed", color: "#8A8A8A" },
  cancelled: { label: "Cancelled", color: "#E91429" },
  rejected: { label: "Rejected", color: "#E91429" },
  expired: { label: "Expired", color: "#8A8A8A" },
};

// Colors - Spotify-inspired Dark Theme
export const COLORS = {
  primary: "#169C46", // Darker Spotify Green
  primaryDark: "#148F3D",
  secondary: "#1AA34A", // Slightly lighter
  accent: "#169C46",
  background: "#181818", // Layout background (lighter)
  surface: "#1E1E1E", // Surface elements
  card: "#121212", // Card/tile background (darker than layout)
  cardElevated: "#282828", // Elevated cards (lighter)
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#282828",
    100: "#333333",
    200: "#404040",
    300: "#535353",
    400: "#727272",
    500: "#8A8A8A",
    600: "#A7A7A7",
    700: "#B3B3B3",
    800: "#E5E5E5",
    900: "#FFFFFF",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#B3B3B3",
    light: "#727272",
  },
  success: "#169C46",
  warning: "#F59E0B",
  error: "#E91429",
  info: "#2E77D0",
  // Spotify-like gradients
  gradientStart: "#169C46",
  gradientEnd: "#191414",
};
