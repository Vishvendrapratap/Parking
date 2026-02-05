import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocation } from "../hooks/useLocation";
import { searchNearbyParking } from "../api/services";
import { COLORS, DEFAULT_LOCATION } from "../constants/config";
import Icon from "../components/Icon";

const { width, height } = Dimensions.get("window");

const HomeMapScreen = ({ navigation }) => {
  const {
    location,
    getCurrentLocation,
    loading: locationLoading,
  } = useLocation();
  const mapRef = useRef(null);
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParking, setSelectedParking] = useState(null);
  const [region, setRegion] = useState({
    ...DEFAULT_LOCATION,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    console.log("Initializing location...");
    const coords = await getCurrentLocation();
    console.log("Got coordinates:", coords);
    if (coords) {
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      console.log("Setting region to:", newRegion);
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      fetchNearbyParking(coords.latitude, coords.longitude);
    } else {
      console.log("No coordinates, using default location:", DEFAULT_LOCATION);
      fetchNearbyParking(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    }
  };

  const fetchNearbyParking = async (lat, lng) => {
    try {
      setLoading(true);
      const result = await searchNearbyParking(lat, lng, 5000);
      setParkingSpaces(result.data || []);
    } catch (error) {
      console.error("Error fetching parking:", error);
      Alert.alert("Error", "Failed to load nearby parking spaces");
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
  };

  const handleMarkerPress = (parking) => {
    setSelectedParking(parking);
  };

  const handleParkingDetails = () => {
    if (selectedParking) {
      navigation.navigate("ParkingDetails", { parkingId: selectedParking._id });
    }
  };

  const recenterMap = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
      fetchNearbyParking(coords.latitude, coords.longitude);
    }
  };

  const getSizeIconName = (size) => {
    switch (size) {
      case "small":
        return "car";
      case "sedan":
        return "carSide";
      case "suv":
        return "truck";
      default:
        return "parking";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Parking</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate("Search")}
        >
          <Icon name="mapMarker" size="sm" color={COLORS.primary} />
          <Text style={styles.searchButtonText}>Search location...</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {parkingSpaces.map((parking) => {
            const isSelected = selectedParking?._id === parking._id;
            return (
              <Marker
                key={parking._id}
                coordinate={{
                  latitude: parking.location.coordinates[1],
                  longitude: parking.location.coordinates[0],
                }}
                onPress={() => handleMarkerPress(parking)}
                tracksViewChanges={false}
              >
                <View
                  style={[styles.marker, isSelected && styles.markerSelected]}
                >
                  <Text style={styles.markerText}>₹{parking.pricePerHour}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* Recenter Button */}
        <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
          <Icon name="crosshairs" size="lg" color={COLORS.primary} />
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchNearbyParking(region.latitude, region.longitude)}
        >
          <Icon name="sync" size="sm" color={COLORS.gray[700]} />
          <Text style={styles.refreshButtonText}>Search this area</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Parking Card */}
      {selectedParking && (
        <View style={styles.parkingCard}>
          <View style={styles.parkingCardHeader}>
            <Icon
              name={getSizeIconName(selectedParking.parkingSize)}
              size="2xl"
              color={COLORS.primary}
            />
            <View style={styles.parkingCardInfo}>
              <Text style={styles.parkingTitle} numberOfLines={1}>
                {selectedParking.title}
              </Text>
              <Text style={styles.parkingAddress} numberOfLines={1}>
                {selectedParking.location.address}
              </Text>
            </View>
            <View style={styles.parkingPrice}>
              <Text style={styles.priceAmount}>
                ₹{selectedParking.pricePerHour}
              </Text>
              <Text style={styles.priceUnit}>/hr</Text>
            </View>
          </View>
          <View style={styles.parkingCardFooter}>
            <View style={styles.parkingRating}>
              <Text style={styles.ratingText}>
                ⭐ {selectedParking.rating?.toFixed(1) || "New"}
              </Text>
              <Text style={styles.reviewCount}>
                ({selectedParking.totalReviews || 0} reviews)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={handleParkingDetails}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: width,
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  marker: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: COLORS.secondary,
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  markerText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 12,
  },
  recenterButton: {
    position: "absolute",
    bottom: 200,
    right: 16,
    backgroundColor: COLORS.card,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  recenterButtonText: {
    fontSize: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  refreshButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
    marginLeft: 6,
  },
  parkingCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  parkingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  parkingSizeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  parkingCardInfo: {
    flex: 1,
  },
  parkingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  parkingAddress: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  parkingPrice: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  parkingCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  parkingRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HomeMapScreen;
