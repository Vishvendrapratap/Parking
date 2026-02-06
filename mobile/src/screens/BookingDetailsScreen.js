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
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { format } from "date-fns";
import {
  getBooking,
  updateBookingStatus,
  cancelBooking,
  initiateBookingCompletion,
  verifyBookingCompletion,
} from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, BOOKING_STATUSES } from "../constants/config";
import Icon from "../components/Icon";

const BookingDetailsScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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
              await cancelBooking(bookingId);
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

  const handleApproveBooking = () => {
    Alert.alert(
      "Approve Booking",
      "Are you sure you want to approve this booking request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setActionLoading(true);
              await updateBookingStatus(bookingId, "confirmed");
              setBooking({ ...booking, status: "confirmed" });
              Alert.alert("Success", "Booking approved successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to approve booking");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectBooking = () => {
    Alert.alert(
      "Reject Booking",
      "Are you sure you want to reject this booking request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await updateBookingStatus(bookingId, "rejected");
              setBooking({ ...booking, status: "rejected" });
              Alert.alert("Success", "Booking rejected");
            } catch (error) {
              Alert.alert("Error", "Failed to reject booking");
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

  // Determine if current user is the owner of this booking's parking space
  const isOwner = () => {
    const ownerId = booking?.owner?._id || booking?.owner;
    return ownerId === user?._id || ownerId === user?.id;
  };

  const handleChat = () => {
    // If owner, chat with seeker; if seeker, chat with owner
    if (isOwner()) {
      navigation.navigate("ChatRoom", {
        receiverId: booking.seeker?._id || booking.seeker,
        receiverName: booking.seeker?.name || "Seeker",
        parkingSpaceId: booking.parkingSpace._id,
      });
    } else {
      navigation.navigate("ChatRoom", {
        receiverId: booking.parkingSpace.owner?._id || booking.owner,
        receiverName: booking.parkingSpace.owner?.name || "Owner",
        parkingSpaceId: booking.parkingSpace._id,
      });
    }
  };

  const getStatusColor = (status) => {
    const statusInfo = BOOKING_STATUSES[status];
    return statusInfo?.color || COLORS.gray[500];
  };

  const canCancel = () => {
    // Only seeker can cancel, and only pending/confirmed bookings before start time
    return (
      !isOwner() &&
      ["pending", "confirmed"].includes(booking?.status) &&
      new Date(booking?.startTime) > new Date()
    );
  };

  const canApproveOrReject = () => {
    // Only owner can approve/reject, and only pending bookings
    return isOwner() && booking?.status === "pending";
  };

  const canComplete = () => {
    // Only seeker can initiate completion, only for confirmed or active bookings
    return !isOwner() && ["confirmed", "active"].includes(booking?.status);
  };

  const handleInitiateCompletion = async () => {
    try {
      setActionLoading(true);
      await initiateBookingCompletion(bookingId);
      Alert.alert(
        "OTP Sent",
        "An OTP has been sent to the parking owner. Please ask them to share it with you to complete the booking.",
        [
          {
            text: "Enter OTP",
            onPress: () => setShowOtpModal(true),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to initiate completion"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setOtpLoading(true);
      await verifyBookingCompletion(bookingId, otp);
      setShowOtpModal(false);
      setOtp("");
      setBooking({ ...booking, status: "completed" });
      Alert.alert("Success", "Booking completed successfully!");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
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
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrowLeft" size="md" color={COLORS.text.primary} />
          <Text style={styles.backButton}> Back</Text>
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
          <View style={styles.parkingAddressRow}>
            <Icon name="mapMarker" size="sm" color={COLORS.text.secondary} />
            <Text style={styles.parkingAddress}>
              {booking.parkingSpace.location.address}
            </Text>
          </View>

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
              <Icon name="directions" size="md" color={COLORS.primary} />
              <Text style={styles.actionButtonText}> Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
              <Icon name="comment" size="md" color={COLORS.primary} />
              <Text style={styles.actionButtonText}>
                {isOwner() ? " Chat Seeker" : " Chat Owner"}
              </Text>
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
              <Icon name="arrowRight" size="lg" color={COLORS.text.secondary} />
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
              <Icon name="car" size="2xl" color={COLORS.primary} />
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
              ₹{booking.parkingSpace.pricePerHour} x {booking.duration} hour(s)
            </Text>
            <Text style={styles.priceValue}>
              ₹
              {(booking.parkingSpace.pricePerHour * booking.duration).toFixed(
                2,
              )}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>
              ₹
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
              ₹{booking.totalPrice.toFixed(2)}
            </Text>
          </View>

          <View
            style={[
              styles.paymentStatus,
              { backgroundColor: COLORS.secondary + "20" },
            ]}
          >
            <View style={styles.paymentStatusContent}>
              <Icon name="creditCard" size="md" color={COLORS.secondary} />
              <Text
                style={[styles.paymentStatusText, { color: COLORS.secondary }]}
              >
                {booking.paymentStatus || "Pay at Location"}
              </Text>
            </View>
          </View>
        </View>

        {/* Owner Action Buttons - Approve/Reject */}
        {canApproveOrReject() && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={[
                styles.rejectButton,
                actionLoading && styles.buttonDisabled,
              ]}
              onPress={handleRejectBooking}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.error} />
              ) : (
                <>
                  <Icon name="xmark" size="md" color={COLORS.error} />
                  <Text style={styles.rejectButtonText}> Reject</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.approveButton,
                actionLoading && styles.buttonDisabled,
              ]}
              onPress={handleApproveBooking}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Icon name="check" size="md" color={COLORS.white} />
                  <Text style={styles.approveButtonText}> Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Seeker Cancel Button */}
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

        {/* Seeker Complete Booking Button */}
        {canComplete() && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              actionLoading && styles.buttonDisabled,
            ]}
            onPress={handleInitiateCompletion}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Icon name="check" size="md" color={COLORS.white} />
                <Text style={styles.completeButtonText}> Complete Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Seeker Info for Owner */}
        {isOwner() && booking.seeker && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Seeker Information</Text>
            <View style={styles.seekerInfo}>
              <Icon name="user" size="2xl" color={COLORS.primary} />
              <View style={styles.seekerDetails}>
                <Text style={styles.seekerName}>{booking.seeker.name}</Text>
                {booking.seeker.phone && (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${booking.seeker.phone}`)
                    }
                  >
                    <Text style={styles.seekerPhone}>
                      {booking.seeker.phone}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Completion OTP</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <Icon name="xmark" size="lg" color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Please ask the parking owner for the 6-digit OTP to complete your booking.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={COLORS.gray[400]}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtp("");
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  otpLoading && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Verify & Complete</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleInitiateCompletion}
              disabled={actionLoading}
            >
              <Text style={styles.resendButtonText}>
                {actionLoading ? "Sending..." : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
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
    color: COLORS.text.primary,
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
    backgroundColor: COLORS.card,
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
    color: COLORS.text.primary,
  },
  parkingAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  parkingAddress: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 6,
    flex: 1,
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
    color: COLORS.text.primary,
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
    color: COLORS.text.primary,
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
    color: COLORS.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
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
  paymentStatusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
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
  ownerActions: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  seekerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  seekerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  seekerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  seekerPhone: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 32,
  },
  // Complete Button Styles
  completeButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 8,
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: "center",
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  resendButton: {
    marginTop: 16,
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
});

export default BookingDetailsScreen;
