const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get address from coordinates (reverse geocoding)
 */
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
    );

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const addressComponents = result.address_components;

      const getComponent = (type) => {
        const component = addressComponents.find((c) => c.types.includes(type));
        return component ? component.long_name : "";
      };

      return {
        formattedAddress: result.formatted_address,
        address:
          `${getComponent("street_number")} ${getComponent("route")}`.trim(),
        city:
          getComponent("locality") ||
          getComponent("administrative_area_level_2"),
        state: getComponent("administrative_area_level_1"),
        country: getComponent("country"),
        zipCode: getComponent("postal_code"),
        coordinates: [longitude, latitude],
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
};

/**
 * Get coordinates from address (forward geocoding)
 */
const getCoordinatesFromAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
    );

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;

      return {
        coordinates: [lng, lat],
        formattedAddress: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
};

/**
 * Calculate distance between two coordinates
 */
const calculateDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // in kilometers
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Get place autocomplete suggestions
 * Supports cities, states, localities, neighborhoods, and landmarks
 */
const getPlaceSuggestions = async (input, sessionToken) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("GOOGLE_MAPS_API_KEY is not set");
      return [];
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      {
        params: {
          input,
          key: GOOGLE_MAPS_API_KEY,
          sessiontoken: sessionToken,
          // No types restriction - allows all place types including:
          // cities, states, localities, neighborhoods, landmarks, addresses
          components: "country:in", // Restrict to India
        },
      },
    );

    // Check for API errors
    if (
      response.data.status !== "OK" &&
      response.data.status !== "ZERO_RESULTS"
    ) {
      console.error(
        "Google Places API error:",
        response.data.status,
        response.data.error_message,
      );
      return [];
    }

    const predictions = response.data.predictions || [];
    return predictions.map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || "",
    }));
  } catch (error) {
    console.error("Place autocomplete error:", error.message);
    return [];
  }
};

/**
 * Get place details
 */
const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          key: GOOGLE_MAPS_API_KEY,
          fields: "geometry,formatted_address,address_components",
        },
      },
    );

    if (response.data.result) {
      const result = response.data.result;
      const addressComponents = result.address_components;

      const getComponent = (type) => {
        const component = addressComponents.find((c) => c.types.includes(type));
        return component ? component.long_name : "";
      };

      return {
        formattedAddress: result.formatted_address,
        coordinates: [
          result.geometry.location.lng,
          result.geometry.location.lat,
        ],
        city:
          getComponent("locality") ||
          getComponent("administrative_area_level_2"),
        state: getComponent("administrative_area_level_1"),
        country: getComponent("country"),
        zipCode: getComponent("postal_code"),
      };
    }

    return null;
  } catch (error) {
    console.error("Place details error:", error.message);
    return null;
  }
};

module.exports = {
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  calculateDistance,
  getPlaceSuggestions,
  getPlaceDetails,
};
