import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { format } from "date-fns";
import { getBooking, updateBookingStatus } from "../api/services";
import { COLORS, BOOKING_STATUSES } from "../constants/config";

const BookingDetailsScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const result = await getBooking(bookingId);
      setBooking(result.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load booking details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await updateBookingStatus(bookingId, "cancelled");
              setBooking({ ...booking, status: "cancelled" });
              Alert.alert("Success", "Booking cancelled successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to cancel booking");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const openNavigation = () => {
    const { coordinates } = booking.parkingSpace.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`;
    Linking.openURL(url);
  };

  const handleChat = () => {
    navigation.navigate("ChatRoom", {
      receiverId: booking.parkingSpace.owner._id,
      receiverName: booking.parkingSpace.owner.name,
      parkingSpaceId: booking.parkingSpace._id,
    });
  };

  const getStatusColor = (status) => {
    const statusInfo = BOOKING_STATUSES.find((s) => s.value === status);
    return statusInfo?.color || COLORS.gray[500];
  };

  const canCancel = () => {
    return (
      ["pending", "confirmed"].includes(booking?.status) &&
      new Date(booking?.startTime) > new Date()
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) {
    return null;
  }

  const statusColor = getStatusColor(booking.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View
          style={[styles.statusBanner, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>

        {/* Parking Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Parking Space</Text>
          <Text style={styles.parkingTitle}>{booking.parkingSpace.title}</Text>
          <Text style={styles.parkingAddress}>
            📍 {booking.parkingSpace.location.address}
          </Text>

          {/* Mini Map */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: booking.parkingSpace.location.coordinates[1],
                longitude: booking.parkingSpace.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: booking.parkingSpace.location.coordinates[1],
                  longitude: booking.parkingSpace.location.coordinates[0],
                }}
              />
            </MapView>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={openNavigation}
            >
              <Text style={styles.actionButtonText}>🧭 Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
              <Text style={styles.actionButtonText}>💬 Chat Owner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reservation Time</Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeDate}>
                {format(new Date(booking.startTime), "MMM d, yyyy")}
              </Text>
              <Text style={styles.timeTime}>
                {format(new Date(booking.startTime), "h:mm a")}
              </Text>
            </View>
            <View style={styles.timeDivider}>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.duration}>{booking.duration} hr</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeDate}>
                {format(new Date(booking.endTime), "MMM d, yyyy")}
              </Text>
              <Text style={styles.timeTime}>
                {format(new Date(booking.endTime), "h:mm a")}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        {booking.vehicleInfo && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleIcon}>🚗</Text>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehiclePlate}>
                  {booking.vehicleInfo.licensePlate}
                </Text>
                <Text style={styles.vehicleModel}>
                  {booking.vehicleInfo.make} {booking.vehicleInfo.model}
                  {booking.vehicleInfo.color &&
                    ` • ${booking.vehicleInfo.color}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Access Instructions */}
        {booking.parkingSpace.accessInstructions && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Access Instructions</Text>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsText}>
                {booking.parkingSpace.accessInstructions}
              </Text>
            </View>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              ${booking.parkingSpace.pricePerHour} x {booking.duration} hour(s)
            </Text>
            <Text style={styles.priceValue}>
              $
              {(booking.parkingSpace.pricePerHour * booking.duration).toFixed(
                2,
              )}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>
              $
              {(
                booking.totalPrice -
                booking.parkingSpace.pricePerHour * booking.duration
              ).toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${booking.totalPrice.toFixed(2)}
            </Text>
          </View>

          <View
            style={[
              styles.paymentStatus,
              { backgroundColor: COLORS.secondary + "20" },
            ]}
          >
            <Text
              style={[styles.paymentStatusText, { color: COLORS.secondary }]}
            >
              💳 {booking.paymentStatus || "Pay at Location"}
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        {canCancel() && (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              actionLoading && styles.cancelButtonDisabled,
            ]}
            onPress={handleCancelBooking}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    padding: 16,
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  parkingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  parkingAddress: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  mapContainer: {
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeItem: {
    flex: 1,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  timeDate: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  timeTime: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  timeDivider: {
    alignItems: "center",
  },
  arrow: {
    fontSize: 18,
    color: COLORS.gray[400],
  },
  duration: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  vehicleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  vehicleModel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  instructionsBox: {
    backgroundColor: COLORS.warning + "10",
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray[800],
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  paymentStatus: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonDisabled: {
    borderColor: COLORS.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default BookingDetailsScreen;
