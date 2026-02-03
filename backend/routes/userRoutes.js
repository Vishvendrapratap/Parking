const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getOwnerProfile,
  updatePushToken,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { mongoIdValidation, validate } = require("../middleware/validators");

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
