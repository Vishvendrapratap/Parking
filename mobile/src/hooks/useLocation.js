import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (err) {
      setError("Failed to request location permission");
      return false;
    }
  };

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError("Location permission denied");
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coords);

      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync(coords);
      if (addressResult) {
        setAddress(addressResult);
      }

      return coords;
    } catch (err) {
      setError("Failed to get current location");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAddressFromCoords = useCallback(async (latitude, longitude) => {
    try {
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      return addressResult;
    } catch (err) {
      console.error("Failed to get address:", err);
      return null;
    }
  }, []);

  const getCoordsFromAddress = useCallback(async (address) => {
    try {
      const [result] = await Location.geocodeAsync(address);
      if (result) {
        return {
          latitude: result.latitude,
          longitude: result.longitude,
        };
      }
      return null;
    } catch (err) {
      console.error("Failed to geocode address:", err);
      return null;
    }
  }, []);

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
    getAddressFromCoords,
    getCoordsFromAddress,
    requestPermission,
  };
};

export default useLocation;
