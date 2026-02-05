const express = require("express");
const router = express.Router();
const {
  getAutocomplete,
  getPlace,
  geocodeAddress,
} = require("../controllers/geocodingController");

// Public routes - no authentication required
router.get("/autocomplete", getAutocomplete);
router.get("/place/:placeId", getPlace);
router.get("/geocode", geocodeAddress);

module.exports = router;
