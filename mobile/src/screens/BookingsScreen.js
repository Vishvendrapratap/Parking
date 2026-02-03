import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyBookings } from "../api/services";
import { format } from "date-fns";
import { COLORS, BOOKING_STATUSES } from "../constants/config";

const BookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const result = await getMyBookings({
        status: activeTab === "upcoming" ? "confirmed" : undefined,
      });
      setBookings(result.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
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
    const statusInfo = BOOKING_STATUSES.find((s) => s.value === status);
    return statusInfo?.color || COLORS.gray[500];
  };

  const filterBookings = () => {
    const now = new Date();
    if (activeTab === "upcoming") {
      return bookings.filter(
        (b) =>
          new Date(b.startTime) >= now &&
          ["pending", "confirmed"].includes(b.status),
      );
    } else if (activeTab === "past") {
      return bookings.filter(
        (b) =>
          new Date(b.endTime) < now ||
          ["completed", "cancelled"].includes(b.status),
      );
    }
    return bookings;
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() =>
        navigation.navigate("BookingDetails", { bookingId: item._id })
      }
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.parkingTitle} numberOfLines={1}>
            {item.parkingSpace?.title}
          </Text>
          <Text style={styles.parkingAddress} numberOfLines={1}>
            📍 {item.parkingSpace?.location?.address}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📅 Date</Text>
          <Text style={styles.detailValue}>
            {format(new Date(item.startTime), "MMM d, yyyy")}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>🕐 Time</Text>
          <Text style={styles.detailValue}>
            {format(new Date(item.startTime), "h:mm a")} -{" "}
            {format(new Date(item.endTime), "h:mm a")}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>💰 Total</Text>
          <Text style={styles.detailValue}>${item.totalPrice?.toFixed(2)}</Text>
        </View>
      </View>

      {item.vehicleInfo?.licensePlate && (
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleText}>
            🚗 {item.vehicleInfo.make} {item.vehicleInfo.model} •{" "}
            {item.vehicleInfo.licensePlate}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredBookings = filterBookings();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.tabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.tabTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No {activeTab} bookings</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === "upcoming"
                  ? "Find a parking space and make a reservation"
                  : "Your completed bookings will appear here"}
              </Text>
              {activeTab === "upcoming" && (
                <TouchableOpacity
                  style={styles.findParkingButton}
                  onPress={() => navigation.navigate("Home")}
                >
                  <Text style={styles.findParkingText}>Find Parking</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gray[800],
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  tabTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: COLORS.gray[800],
  },
  parkingAddress: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 4,
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
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  vehicleInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  vehicleText: {
    fontSize: 13,
    color: COLORS.gray[600],
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
    color: COLORS.gray[700],
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
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
