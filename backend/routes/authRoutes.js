const express = require("express");
const router = express.Router();
const {
  register,
  login,
  sendOTP,
  verifyOTP,
  firebaseAuth,
  getMe,
  updateDetails,
  updatePassword,
  logout,
  switchRole,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  validate,
} = require("../middleware/validators");
const { upload } = require("../config/cloudinary");

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/firebase-auth", firebaseAuth);
router.get("/me", protect, getMe);
router.put(
  "/updatedetails",
  protect,
  upload.single("profilePicture"),
  updateDetails,
);
router.put("/updatepassword", protect, updatePassword);
router.get("/logout", protect, logout);
router.put("/switch-role", protect, switchRole);

module.exports = router;
