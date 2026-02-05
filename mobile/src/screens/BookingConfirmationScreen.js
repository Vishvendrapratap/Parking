import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { COLORS } from "../constants/config";
import Icon from "../components/Icon";

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { booking } = route.params;

  const handleViewBooking = () => {
    navigation.navigate("BookingDetails", { bookingId: booking._id });
  };

  const handleBackHome = () => {
    navigation.navigate("MainTabs");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Icon name="checkCircle" size="4xl" color={COLORS.secondary} />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Booking Submitted!</Text>
        <Text style={styles.subtitle}>
          Your booking request has been sent to the owner.{"\n"}
          You'll be notified once it's confirmed.
        </Text>

        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Space</Text>
            <Text style={styles.detailValue}>
              {booking.parkingSpace?.title}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Time</Text>
            <Text style={styles.detailValue}>
              {format(new Date(booking.startTime), "MMM d, yyyy h:mm a")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.duration} hour(s)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₹{booking.totalPrice?.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>⏳ Pending Approval</Text>
          </View>
          <Text style={styles.statusNote}>
            The owner will review and confirm your booking soon.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewBooking}
        >
          <Text style={styles.primaryButtonText}>View Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackHome}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text.primary,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
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
  statusContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 24,
  },
  statusBadge: {
    backgroundColor: COLORS.warning + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warning,
  },
  statusNote: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 12,
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
});

export default BookingConfirmationScreen;

