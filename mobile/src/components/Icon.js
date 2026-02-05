/**
 * FontAwesome Icon Component for React Native Parking App
 * Uses @fortawesome/react-native-fontawesome for consistent icons
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faHouse,
  faMagnifyingGlass,
  faBars,
  faXmark,
  faArrowLeft,
  faArrowRight,
  faChevronUp,
  faChevronDown,
  faChevronRight,
  faChevronLeft,
  faCheck,
  faPlus,
  faMinus,
  faSliders,
  faGear,
  faRotate,
  faSquareParking,
  faCar,
  faCarSide,
  faTruck,
  faVanShuttle,
  faLocationDot,
  faMapMarkerAlt,
  faMap,
  faDiamondTurnRight,
  faCompass,
  faCrosshairs,
  faUser,
  faCircleUser,
  faUsers,
  faPenToSquare,
  faCamera,
  faImage,
  faComments,
  faComment,
  faMessage,
  faEnvelope,
  faPhone,
  faMobileScreenButton,
  faShareFromSquare,
  faCalendarDays,
  faClock,
  faClockRotateLeft,
  faBookmark,
  faClipboardList,
  faMoneyBillWave,
  faDollarSign,
  faIndianRupeeSign,
  faCreditCard,
  faWallet,
  faReceipt,
  faLock,
  faLockOpen,
  faShieldHalved,
  faKey,
  faVideo,
  faUserShield,
  faWarehouse,
  faChargingStation,
  faBolt,
  faLightbulb,
  faWheelchair,
  faToriiGate,
  faArrowDownLong,
  faStar,
  faStarHalfStroke,
  faHeart,
  faThumbsUp,
  faCircleCheck,
  faCircleXmark,
  faCircleExclamation,
  faCircleInfo,
  faChartLine,
  faChartBar,
  faChartPie,
  faList,
  faGrip,
  faTrashCan,
  faTrash,
  faRightFromBracket,
  faRightToBracket,
  faDownload,
  faUpload,
  faArrowUpRightFromSquare,
  faFileLines,
  faFileContract,
  faFile,
  faUserLock,
  faCircleQuestion,
  faBell,
  faBellSlash,
  faSpinner,
  faCircleNotch,
  faEllipsis,
  faBuilding,
  faRoad,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import {
  faStar as faStarEmpty,
  faHeart as faHeartEmpty,
} from "@fortawesome/free-regular-svg-icons";
import { COLORS } from "../constants/config";

// Icon name to FontAwesome icon mapping
const iconMap = {
  // Navigation & UI
  home: faHouse,
  search: faMagnifyingGlass,
  menu: faBars,
  close: faXmark,
  back: faArrowLeft,
  arrowLeft: faArrowLeft,
  forward: faArrowRight,
  arrowRight: faArrowRight,
  up: faChevronUp,
  down: faChevronDown,
  chevronRight: faChevronRight,
  chevronLeft: faChevronLeft,
  check: faCheck,
  checkCircle: faCircleCheck,
  times: faXmark,
  plus: faPlus,
  minus: faMinus,
  filter: faSliders,
  settings: faGear,
  refresh: faRotate,
  sync: faSync,

  // Parking & Location
  parking: faSquareParking,
  car: faCar,
  carSide: faCarSide,
  truck: faTruck,
  van: faVanShuttle,
  location: faLocationDot,
  mapMarker: faMapMarkerAlt,
  map: faMap,
  directions: faDiamondTurnRight,
  compass: faCompass,
  crosshairs: faCrosshairs,

  // User & Profile
  user: faUser,
  userCircle: faCircleUser,
  users: faUsers,
  edit: faPenToSquare,
  camera: faCamera,
  image: faImage,

  // Communication
  chat: faComments,
  comment: faComment,
  message: faMessage,
  envelope: faEnvelope,
  phone: faPhone,
  mobile: faMobileScreenButton,
  share: faShareFromSquare,

  // Booking & Calendar
  calendar: faCalendarDays,
  clock: faClock,
  history: faClockRotateLeft,
  bookmark: faBookmark,
  clipboard: faClipboardList,

  // Money & Payment
  money: faMoneyBillWave,
  dollar: faDollarSign,
  rupee: faIndianRupeeSign,
  indianRupee: faIndianRupeeSign,
  creditCard: faCreditCard,
  wallet: faWallet,
  receipt: faReceipt,

  // Security & Safety
  lock: faLock,
  unlock: faLockOpen,
  shield: faShieldHalved,
  key: faKey,
  securityCamera: faVideo,
  guard: faUserShield,

  // Amenities
  covered: faWarehouse,
  evCharging: faChargingStation,
  bolt: faBolt,
  lightbulb: faLightbulb,
  wheelchair: faWheelchair,
  gate: faToriiGate,
  "24hours": faClock,
  underground: faArrowDownLong,

  // Status & Ratings
  star: faStar,
  starHalf: faStarHalfStroke,
  starEmpty: faStarEmpty,
  heart: faHeart,
  heartEmpty: faHeartEmpty,
  thumbsUp: faThumbsUp,
  circleCheck: faCircleCheck,
  circleXmark: faCircleXmark,
  exclamation: faCircleExclamation,
  info: faCircleInfo,

  // Dashboard & Analytics
  dashboard: faChartLine,
  chart: faChartBar,
  chartBar: faChartBar,
  analytics: faChartPie,
  list: faList,
  grid: faGrip,

  // Actions
  trash: faTrashCan,
  delete: faTrash,
  signOut: faRightFromBracket,
  signIn: faRightToBracket,
  download: faDownload,
  upload: faUpload,
  external: faArrowUpRightFromSquare,

  // Documents
  document: faFileLines,
  file: faFile,
  terms: faFileContract,
  privacy: faUserLock,
  help: faCircleQuestion,

  // Notifications
  bell: faBell,
  bellSlash: faBellSlash,

  // Misc
  spinner: faSpinner,
  loading: faCircleNotch,
  ellipsis: faEllipsis,
  building: faBuilding,
  garage: faWarehouse,
  road: faRoad,
  driveway: faRoad,
};

// Size mapping
const sizeMap = {
  xs: 10,
  sm: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 28,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 56,
};

const Icon = ({ name, size = "base", color = COLORS.gray[600], style }) => {
  const icon = iconMap[name];
  const iconSize = sizeMap[size] || sizeMap.base;

  if (!icon) {
    console.warn(`Icon "${name}" not found, using default parking icon`);
    return (
      <FontAwesomeIcon
        icon={faSquareParking}
        size={iconSize}
        color={color}
        style={style}
      />
    );
  }

  return (
    <FontAwesomeIcon icon={icon} size={iconSize} color={color} style={style} />
  );
};

export default Icon;

// Also export a TabIcon component specifically for navigation
export const TabIcon = ({
  name,
  focused,
  activeColor = COLORS.primary,
  inactiveColor = COLORS.gray[400],
}) => {
  const tabIcons = {
    Home: "map",
    Search: "search",
    Bookings: "clipboard",
    Chat: "chat",
    Profile: "user",
    Dashboard: "dashboard",
    Listings: "parking",
    "My Listings": "parking",
  };

  const iconName = tabIcons[name] || "location";
  const color = focused ? activeColor : inactiveColor;
  const size = focused ? "xl" : "lg";

  return <Icon name={iconName} size={size} color={color} />;
};
