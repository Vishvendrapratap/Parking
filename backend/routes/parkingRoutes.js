const express = require("express");
const router = express.Router();
const {
  getParkingSpaces,
  getParkingSpace,
  createParkingSpace,
  updateParkingSpace,
  deleteParkingSpace,
  uploadImages,
  deleteImage,
  getMyListings,
  updateStatus,
  checkAvailability,
  activateListing,
  deactivateListing,
} = require("../controllers/parkingController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  parkingSpaceValidation,
  searchValidation,
  mongoIdValidation,
  validate,
} = require("../middleware/validators");
const { upload } = require("../config/cloudinary");

// Public routes
router.get("/", searchValidation, validate, getParkingSpaces);
router.get("/:id", mongoIdValidation, validate, getParkingSpace);
router.get("/:id/availability", mongoIdValidation, validate, checkAvailability);

// Protected routes (Owner)
router.get(
  "/owner/my-listings",
  protect,
  authorize("owner", "admin"),
  getMyListings,
);
router.post(
  "/",
  protect,
  authorize("owner", "admin"),
  parkingSpaceValidation,
  validate,
  createParkingSpace,
);
router.put(
  "/:id",
  protect,
  authorize("owner", "admin"),
  mongoIdValidation,
  validate,
  updateParkingSpace,
);
router.delete(
  "/:id",
  protect,
  authorize("owner", "admin"),
  mongoIdValidation,
  validate,
  deleteParkingSpace,
);
router.put(
  "/:id/status",
  protect,
  authorize("owner", "admin"),
  mongoIdValidation,
  validate,
  updateStatus,
);

// Activate/Deactivate listing routes
router.put(
  "/:id/activate",
  protect,
  authorize("owner", "admin"),
  mongoIdValidation,
  validate,
  activateListing,
);
router.put(
  "/:id/deactivate",
  protect,
  authorize("owner", "admin"),
  mongoIdValidation,
  validate,
  deactivateListing,
);

// Image routes
router.post(
  "/:id/images",
  protect,
  authorize("owner", "admin"),
  upload.array("images", 10),
  uploadImages,
);
router.delete(
  "/:id/images/:imageId",
  protect,
  authorize("owner", "admin"),
  deleteImage,
);

module.exports = router;
