const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  addReview,
  checkIn,
  checkOut,
  initiateCompletion,
  verifyCompletion,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const {
  bookingValidation,
  mongoIdValidation,
  validate,
} = require("../middleware/validators");

router.post("/", protect, bookingValidation, validate, createBooking);
router.get("/", protect, getBookings);
router.get("/:id", protect, mongoIdValidation, validate, getBooking);
router.put(
  "/:id/status",
  protect,
  mongoIdValidation,
  validate,
  updateBookingStatus,
);
router.put("/:id/cancel", protect, mongoIdValidation, validate, cancelBooking);
router.put("/:id/review", protect, mongoIdValidation, validate, addReview);
router.put("/:id/checkin", protect, mongoIdValidation, validate, checkIn);
router.put("/:id/checkout", protect, mongoIdValidation, validate, checkOut);
router.put("/:id/initiate-completion", protect, mongoIdValidation, validate, initiateCompletion);
router.put("/:id/verify-completion", protect, mongoIdValidation, validate, verifyCompletion);

module.exports = router;
