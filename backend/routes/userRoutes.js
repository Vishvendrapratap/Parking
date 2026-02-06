const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getOwnerProfile,
  updatePushToken,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { mongoIdValidation, validate } = require("../middleware/validators");

// Vehicle/Garage routes (must be before :id routes)
router.get("/vehicles", protect, getVehicles);
router.post("/vehicles", protect, addVehicle);
router.put("/vehicles/:vehicleId", protect, updateVehicle);
router.delete("/vehicles/:vehicleId", protect, deleteVehicle);
router.put("/vehicles/:vehicleId/default", protect, setDefaultVehicle);

router.get("/", protect, authorize("admin"), getUsers);
router.put("/push-token", protect, updatePushToken);
router.get("/:id", protect, mongoIdValidation, validate, getUser);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  mongoIdValidation,
  validate,
  updateUser,
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  mongoIdValidation,
  validate,
  deleteUser,
);
router.get("/:id/profile", mongoIdValidation, validate, getOwnerProfile);

module.exports = router;
