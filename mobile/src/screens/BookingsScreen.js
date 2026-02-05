import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { getMyBookings } from "../api/services";
import { format } from "date-fns";
import { COLORS, BOOKING_STATUSES } from "../constants/config";
import Icon from "../components/Icon";

const BookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { onBookingUpdate } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, []),
  );

  // Listen for real-time booking updates
  useEffect(() => {
    const unsubscribe = onBookingUpdate((data) => {
      console.log("BookingsScreen: Received booking_update, refreshing...");
      fetchBookings();
    });
    return unsubscribe;
  }, [onBookingUpdate]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Always fetch as seeker for seeker's booking view
      // The isOwner check here determines which tab view to show, not the API role
      const params = {
        role: "seeker",
      };
      const result = await getMyBookings(params);
      console.log("=== FETCH BOOKINGS RESULT ===");
      console.log("Total bookings from API:", result.data?.length);
      if (result.data) {
        result.data.forEach((b, i) => {
          console.log(
            `Booking ${i + 1}: id=${b._id}, status="${b.status}", title="${b.parkingSpace?.title}"`,
          );
        });
      }
      setBookings(result.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const statusInfo = BOOKING_STATUSES[status];
    return statusInfo?.color || COLORS.gray[500];
  };

  const renderBookingItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() =>
          navigation.navigate("BookingDetails", { bookingId: item._id })
        }
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={styles.parkingTitle} numberOfLines={1}>
              {item.parkingSpace?.title || "Unknown Parking"}
            </Text>
            <View style={styles.parkingAddressRow}>
              <Icon name="mapMarker" size="xs" color={COLORS.gray[500]} />
              <Text style={styles.parkingAddress} numberOfLines={1}>
                {item.parkingSpace?.location?.address ||
                  "Address not available"}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <Icon name="calendar" size="xs" color={COLORS.gray[500]} />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>
              {item.startTime
                ? format(new Date(item.startTime), "MMM d, yyyy")
                : "N/A"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <Icon name="clock" size="xs" color={COLORS.gray[500]} />
              <Text style={styles.detailLabel}>Time</Text>
            </View>
            <Text style={styles.detailValue}>
              {item.startTime && item.endTime
                ? `${format(new Date(item.startTime), "h:mm a")} - ${format(new Date(item.endTime), "h:mm a")}`
                : "N/A"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <Icon name="money" size="xs" color={COLORS.gray[500]} />
              <Text style={styles.detailLabel}>Total</Text>
            </View>
            <Text style={styles.detailValue}>
              ₹{item.totalPrice?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {item.vehicleInfo?.licensePlate && (
          <View style={styles.vehicleInfo}>
            <Icon name="car" size="sm" color={COLORS.gray[600]} />
            <Text style={styles.vehicleText}>
              {item.vehicleInfo.make} {item.vehicleInfo.model} •{" "}
              {item.vehicleInfo.licensePlate}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  console.log("=== RENDER DEBUG ===");
  console.log("loading:", loading);
  console.log("bookings length:", bookings.length);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard" size="4xl" color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            Find a parking space and make a reservation
          </Text>
          <TouchableOpacity
            style={styles.findParkingButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.findParkingText}>Find Parking</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 12,
  },
  parkingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  parkingAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  parkingAddress: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  seekerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  seekerName: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bookingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  vehicleText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  findParkingButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  findParkingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default BookingsScreen;
