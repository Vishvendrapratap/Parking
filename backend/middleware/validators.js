const { validationResult, body, param, query } = require("express-validator");

// Validation result handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Auth validations
exports.registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Please provide a valid phone number"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["seeker", "owner"])
    .withMessage("Role must be seeker or owner"),
];

exports.loginValidation = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Please provide a valid phone number"),
  body("password").optional().notEmpty().withMessage("Password is required"),
];

// Parking space validations
exports.parkingSpaceValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  // Support both mobile (latitude/longitude/address) and web (location.coordinates) formats
  body("location.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be [longitude, latitude]"),
  body("location.coordinates.*")
    .optional()
    .isFloat()
    .withMessage("Coordinates must be numbers"),
  body("location.address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address is required"),
  // Mobile app format
  body("latitude")
    .optional()
    .isFloat()
    .withMessage("Latitude must be a number"),
  body("longitude")
    .optional()
    .isFloat()
    .withMessage("Longitude must be a number"),
  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address is required"),
  body("parkingSize")
    .isIn(["small", "sedan", "suv"])
    .withMessage("Parking size must be small, sedan, or suv"),
  body("pricePerHour")
    .isFloat({ min: 0 })
    .withMessage("Price per hour must be a positive number"),
];

// Booking validations
exports.bookingValidation = [
  body("parkingSpaceId").isMongoId().withMessage("Invalid parking space ID"),
  body("startTime").isISO8601().withMessage("Start time must be a valid date"),
  body("endTime")
    .isISO8601()
    .withMessage("End time must be a valid date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),
];

// Search validations
exports.searchValidation = [
  query("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  query("lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  query("radius")
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage("Radius must be between 100 and 50000 meters"),
  query("parkingSize")
    .optional()
    .isIn(["small", "sedan", "suv"])
    .withMessage("Invalid parking size"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max price must be a positive number"),
];

// Chat validations
exports.chatValidation = [
  body("receiverId").isMongoId().withMessage("Invalid receiver ID"),
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Message text is required")
    .isLength({ max: 2000 })
    .withMessage("Message cannot exceed 2000 characters"),
];

// MongoDB ID validation
exports.mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];
