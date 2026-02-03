const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllParkingSpaces,
  verifyParkingSpace,
  featureParkingSpace,
  getAllBookings,
  deleteParkingSpace,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// All routes require admin access
router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);
router.get("/parking", getAllParkingSpaces);
router.put("/parking/:id/verify", verifyParkingSpace);
router.put("/parking/:id/feature", featureParkingSpace);
router.delete("/parking/:id", deleteParkingSpace);
router.get("/bookings", getAllBookings);

module.exports = router;
