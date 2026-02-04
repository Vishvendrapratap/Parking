/**
 * FontAwesome Icon Component for Parking App
 * Provides consistent icon usage across the web application
 */

const Icon = ({ name, className = "", size = "base", ...props }) => {
  // Size mapping
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
  };

  // Icon name mapping - maps semantic names to FontAwesome classes
  const iconMap = {
    // Navigation & UI
    home: "fa-solid fa-house",
    search: "fa-solid fa-magnifying-glass",
    menu: "fa-solid fa-bars",
    close: "fa-solid fa-xmark",
    back: "fa-solid fa-arrow-left",
    forward: "fa-solid fa-arrow-right",
    up: "fa-solid fa-chevron-up",
    down: "fa-solid fa-chevron-down",
    check: "fa-solid fa-check",
    times: "fa-solid fa-times",
    plus: "fa-solid fa-plus",
    minus: "fa-solid fa-minus",
    filter: "fa-solid fa-sliders",
    settings: "fa-solid fa-gear",
    refresh: "fa-solid fa-rotate",

    // Parking & Location
    parking: "fa-solid fa-square-parking",
    car: "fa-solid fa-car",
    carSide: "fa-solid fa-car-side",
    truck: "fa-solid fa-truck",
    van: "fa-solid fa-van-shuttle",
    location: "fa-solid fa-location-dot",
    mapMarker: "fa-solid fa-map-marker-alt",
    map: "fa-solid fa-map",
    directions: "fa-solid fa-diamond-turn-right",
    compass: "fa-solid fa-compass",
    crosshairs: "fa-solid fa-crosshairs",

    // User & Profile
    user: "fa-solid fa-user",
    userCircle: "fa-solid fa-circle-user",
    users: "fa-solid fa-users",
    edit: "fa-solid fa-pen-to-square",
    camera: "fa-solid fa-camera",
    image: "fa-solid fa-image",

    // Communication
    chat: "fa-solid fa-comments",
    message: "fa-solid fa-message",
    envelope: "fa-solid fa-envelope",
    phone: "fa-solid fa-phone",
    share: "fa-solid fa-share-from-square",

    // Booking & Calendar
    calendar: "fa-solid fa-calendar-days",
    clock: "fa-solid fa-clock",
    history: "fa-solid fa-clock-rotate-left",
    bookmark: "fa-solid fa-bookmark",
    clipboard: "fa-solid fa-clipboard-list",

    // Money & Payment
    money: "fa-solid fa-money-bill-wave",
    dollar: "fa-solid fa-dollar-sign",
    creditCard: "fa-solid fa-credit-card",
    wallet: "fa-solid fa-wallet",
    receipt: "fa-solid fa-receipt",

    // Security & Safety
    lock: "fa-solid fa-lock",
    unlock: "fa-solid fa-lock-open",
    shield: "fa-solid fa-shield-halved",
    key: "fa-solid fa-key",
    securityCamera: "fa-solid fa-video",
    guard: "fa-solid fa-user-shield",

    // Amenities
    covered: "fa-solid fa-warehouse",
    evCharging: "fa-solid fa-charging-station",
    bolt: "fa-solid fa-bolt",
    lightbulb: "fa-solid fa-lightbulb",
    wheelchair: "fa-solid fa-wheelchair",
    gate: "fa-solid fa-torii-gate",
    "24hours": "fa-solid fa-clock",
    underground: "fa-solid fa-arrow-down-long",

    // Status & Ratings
    star: "fa-solid fa-star",
    starHalf: "fa-solid fa-star-half-stroke",
    starEmpty: "fa-regular fa-star",
    heart: "fa-solid fa-heart",
    heartEmpty: "fa-regular fa-heart",
    thumbsUp: "fa-solid fa-thumbs-up",
    circleCheck: "fa-solid fa-circle-check",
    circleXmark: "fa-solid fa-circle-xmark",
    exclamation: "fa-solid fa-circle-exclamation",
    info: "fa-solid fa-circle-info",

    // Dashboard & Analytics
    dashboard: "fa-solid fa-chart-line",
    chart: "fa-solid fa-chart-bar",
    analytics: "fa-solid fa-chart-pie",
    list: "fa-solid fa-list",
    grid: "fa-solid fa-grip",

    // Actions
    trash: "fa-solid fa-trash-can",
    delete: "fa-solid fa-trash",
    signOut: "fa-solid fa-right-from-bracket",
    signIn: "fa-solid fa-right-to-bracket",
    download: "fa-solid fa-download",
    upload: "fa-solid fa-upload",
    external: "fa-solid fa-arrow-up-right-from-square",

    // Documents
    document: "fa-solid fa-file-lines",
    terms: "fa-solid fa-file-contract",
    privacy: "fa-solid fa-user-lock",
    help: "fa-solid fa-circle-question",

    // Notifications
    bell: "fa-solid fa-bell",
    bellSlash: "fa-solid fa-bell-slash",

    // Misc
    spinner: "fa-solid fa-spinner fa-spin",
    loading: "fa-solid fa-circle-notch fa-spin",
    ellipsis: "fa-solid fa-ellipsis",
    building: "fa-solid fa-building",
    garage: "fa-solid fa-warehouse",
    road: "fa-solid fa-road",
    driveway: "fa-solid fa-road",
  };

  const iconClass = iconMap[name] || iconMap.parking;
  const sizeClass = sizeClasses[size] || sizeClasses.base;

  return (
    <i className={`${iconClass} ${sizeClass} ${className}`} {...props}></i>
  );
};

export default Icon;
