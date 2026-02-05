const {
  getPlaceSuggestions,
  getPlaceDetails,
  getCoordinatesFromAddress,
} = require("../utils/geocoding");

/**
 * @desc    Get place autocomplete suggestions
 * @route   GET /api/geocoding/autocomplete
 * @access  Public
 */
const getAutocomplete = async (req, res) => {
  try {
    const { input, sessionToken } = req.query;
    console.log("Autocomplete request for:", input);

    if (!input || input.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const suggestions = await getPlaceSuggestions(input, sessionToken);
    console.log("Autocomplete results:", suggestions.length, "suggestions");

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get place suggestions",
    });
  }
};

/**
 * @desc    Get place details (coordinates) from place ID
 * @route   GET /api/geocoding/place/:placeId
 * @access  Public
 */
const getPlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        error: "Place ID is required",
      });
    }

    const placeDetails = await getPlaceDetails(placeId);

    if (!placeDetails) {
      return res.status(404).json({
        success: false,
        error: "Place not found",
      });
    }

    res.status(200).json({
      success: true,
      data: placeDetails,
    });
  } catch (error) {
    console.error("Get place error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get place details",
    });
  }
};

/**
 * @desc    Geocode an address to coordinates
 * @route   GET /api/geocoding/geocode
 * @access  Public
 */
const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address is required",
      });
    }

    const result = await getCoordinatesFromAddress(address);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Geocode error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to geocode address",
    });
  }
};

module.exports = {
  getAutocomplete,
  getPlace,
  geocodeAddress,
};
