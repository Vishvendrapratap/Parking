import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { getParkingSpace } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, PARKING_SIZES, AMENITIES } from "../constants/config";
import Icon from "../components/Icon";

const { width } = Dimensions.get("window");

const ParkingDetailsScreen = ({ route, navigation }) => {
  const { parkingId } = route.params;
  const { user } = useAuth();
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchParkingDetails();
  }, [parkingId]);

  const fetchParkingDetails = async () => {
    try {
      setLoading(true);
      const result = await getParkingSpace(parkingId);
      setParking(result.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load parking details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openNavigation = () => {
    const { coordinates } = parking.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`;
    Linking.openURL(url);
  };

  const handleBookNow = () => {
    // Check if user is the owner of this parking space
    const isOwnListing =
      parking.owner?._id === user?._id || parking.owner === user?._id;
    if (isOwnListing) {
      Alert.alert("Cannot Book", "You cannot book your own parking space.");
      return;
    }
    navigation.navigate("Booking", { parking });
  };

  const handleChat = () => {
    navigation.navigate("ChatRoom", {
      receiverId: parking.owner._id,
      receiverName: parking.owner.name,
      parkingSpaceId: parking._id,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!parking) {
    return null;
  }

  const sizeInfo = PARKING_SIZES.find((s) => s.value === parking.parkingSize);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrowLeft" size="lg" color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share" size="lg" color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {parking.images?.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
            >
              {parking.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image.url }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="parking" size="4xl" color={COLORS.primary} />
            </View>
          )}
          {parking.images?.length > 1 && (
            <View style={styles.pagination}>
              {parking.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{parking.title}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{parking.status}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{parking.pricePerHour}</Text>
              <Text style={styles.priceUnit}>/hour</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Icon name="mapMarker" size="sm" color={COLORS.text.secondary} />
            <Text style={styles.address}>
              {parking.location.formattedAddress || parking.location.address}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <Icon name="star" size="sm" color={COLORS.accent} />
            <Text style={styles.rating}>
              {parking.rating?.toFixed(1) || "New"}
            </Text>
            <Text style={styles.reviews}>
              ({parking.totalReviews || 0} reviews)
            </Text>
            <Text style={styles.bookings}>
              • {parking.totalBookings || 0} bookings
            </Text>
          </View>
        </View>

        {/* Size Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Size</Text>
          <View style={styles.sizeCard}>
            <Text style={styles.sizeIcon}>{sizeInfo?.icon}</Text>
            <View style={styles.sizeInfo}>
              <Text style={styles.sizeLabel}>{sizeInfo?.label}</Text>
              <Text style={styles.sizeDescription}>
                {sizeInfo?.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Space</Text>
          <Text style={styles.description}>{parking.description}</Text>
        </View>

        {/* Amenities */}
        {parking.amenities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {parking.amenities.map((amenity) => {
                const amenityInfo = AMENITIES.find((a) => a.value === amenity);
                return (
                  <View key={amenity} style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>{amenityInfo?.icon}</Text>
                    <Text style={styles.amenityLabel}>
                      {amenityInfo?.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Access Instructions */}
        {parking.accessInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Instructions</Text>
            <Text style={styles.instructions}>
              {parking.accessInstructions}
            </Text>
          </View>
        )}

        {/* Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: parking.location.coordinates[1],
                longitude: parking.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: parking.location.coordinates[1],
                  longitude: parking.location.coordinates[0],
                }}
              />
            </MapView>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={openNavigation}
            >
              <Icon name="directions" size="md" color={COLORS.white} />
              <Text style={styles.navigateButtonText}> Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Owner Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>
                {parking.owner.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{parking.owner.name}</Text>
              <View style={styles.ownerRatingRow}>
                <Icon name="star" size="sm" color={COLORS.accent} />
                <Text style={styles.ownerRating}>
                  {parking.owner.rating?.toFixed(1) || "New"} (
                  {parking.owner.totalReviews || 0} reviews)
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <Icon name="comment" size="md" color={COLORS.white} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPrice}>₹{parking.pricePerHour}</Text>
          <Text style={styles.bottomPriceUnit}>/hour</Text>
        </View>
        {(() => {
          const isOwnListing =
            parking.owner?._id === user?._id || parking.owner === user?._id;
          const isDisabled = parking.status !== "available" || isOwnListing;
          const buttonText = isOwnListing
            ? "Your Listing"
            : parking.status === "available"
              ? "Book Now"
              : "Not Available";

          return (
            <TouchableOpacity
              style={[
                styles.bookButton,
                isDisabled && styles.bookButtonDisabled,
              ]}
              onPress={handleBookNow}
              disabled={isDisabled}
            >
              <Text style={styles.bookButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 20,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 18,
  },
  imageGallery: {
    width: width,
    height: 280,
    position: "relative",
  },
  galleryImage: {
    width: width,
    height: 280,
  },
  placeholderImage: {
    width: width,
    height: 280,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 64,
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.card + "80",
  },
  paginationDotActive: {
    backgroundColor: COLORS.card,
    width: 20,
  },
  mainInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  statusBadge: {
    backgroundColor: COLORS.secondary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
    textTransform: "capitalize",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  address: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 6,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginLeft: 6,
  },
  reviews: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginLeft: 4,
  },
  bookings: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginLeft: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  sizeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    padding: 16,
    borderRadius: 12,
  },
  sizeIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  sizeInfo: {
    flex: 1,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  sizeDescription: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  amenityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  amenityLabel: {
    fontSize: 13,
    color: COLORS.gray[700],
  },
  instructions: {
    fontSize: 15,
    color: COLORS.gray[600],
    lineHeight: 22,
    backgroundColor: COLORS.warning + "10",
    padding: 12,
    borderRadius: 8,
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  navigateButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ownerAvatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  ownerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ownerRating: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginLeft: 4,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  bottomPriceUnit: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default ParkingDetailsScreen;
