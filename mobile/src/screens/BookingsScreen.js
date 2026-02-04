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
import { useAuth } from "../contexts/AuthContext";
import { getMyBookings } from "../api/services";
import { format } from "date-fns";
import { COLORS, BOOKING_STATUSES } from "../constants/config";
import Icon from "../components/Icon";

const BookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isOwner = user?.activeRole === "owner";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isOwner ? "requests" : "upcoming");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [activeTab, isOwner]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        role: isOwner ? "owner" : "seeker",
      };
      const result = await getMyBookings(params);
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
    const statusInfo = BOOKING_STATUSES[status];
    return statusInfo?.color || COLORS.gray[500];
  };

  const filterBookings = () => {
    const now = new Date();

    if (isOwner) {
      // Owner view: filter by tab
      if (activeTab === "requests") {
        return bookings.filter((b) => b.status === "pending");
      } else if (activeTab === "upcoming") {
        return bookings.filter(
          (b) =>
            new Date(b.startTime) >= now && ["confirmed"].includes(b.status),
        );
      } else if (activeTab === "past") {
        return bookings.filter(
          (b) =>
            new Date(b.endTime) < now ||
            ["completed", "cancelled", "rejected"].includes(b.status),
        );
      }
    } else {
      // Seeker view: original logic
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
          <View style={styles.parkingAddressRow}>
            <Icon name="mapMarker" size="xs" color={COLORS.gray[500]} />
            <Text style={styles.parkingAddress} numberOfLines={1}>
              {item.parkingSpace?.location?.address}
            </Text>
          </View>
          {isOwner && item.seeker && (
            <View style={styles.seekerInfoRow}>
              <Icon name="user" size="xs" color={COLORS.gray[500]} />
              <Text style={styles.seekerName}>{item.seeker?.name}</Text>
            </View>
          )}
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
          <View style={styles.detailLabelRow}>
            <Icon name="calendar" size="xs" color={COLORS.gray[500]} />
            <Text style={styles.detailLabel}>Date</Text>
          </View>
          <Text style={styles.detailValue}>
            {format(new Date(item.startTime), "MMM d, yyyy")}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <View style={styles.detailLabelRow}>
            <Icon name="clock" size="xs" color={COLORS.gray[500]} />
            <Text style={styles.detailLabel}>Time</Text>
          </View>
          <Text style={styles.detailValue}>
            {format(new Date(item.startTime), "h:mm a")} -{" "}
            {format(new Date(item.endTime), "h:mm a")}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <View style={styles.detailLabelRow}>
            <Icon name="money" size="xs" color={COLORS.gray[500]} />
            <Text style={styles.detailLabel}>Total</Text>
          </View>
          <Text style={styles.detailValue}>${item.totalPrice?.toFixed(2)}</Text>
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

  const filteredBookings = filterBookings();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isOwner ? "Booking Requests" : "My Bookings"}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {isOwner && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "requests" && styles.tabActive]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "requests" && styles.tabTextActive,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>
        )}
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
            {isOwner ? "Confirmed" : "Upcoming"}
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
              <Icon
                name={isOwner ? "inbox" : "clipboard"}
                size="4xl"
                color={COLORS.gray[300]}
              />
              <Text style={styles.emptyText}>
                {isOwner
                  ? activeTab === "requests"
                    ? "No pending requests"
                    : activeTab === "upcoming"
                      ? "No confirmed bookings"
                      : "No past bookings"
                  : `No ${activeTab} bookings`}
              </Text>
              <Text style={styles.emptySubtext}>
                {isOwner
                  ? activeTab === "requests"
                    ? "New booking requests will appear here"
                    : activeTab === "upcoming"
                      ? "Confirmed bookings will appear here"
                      : "Completed bookings will appear here"
                  : activeTab === "upcoming"
                    ? "Find a parking space and make a reservation"
                    : "Your completed bookings will appear here"}
              </Text>
              {!isOwner && activeTab === "upcoming" && (
                <TouchableOpacity
                  style={styles.findParkingButton}
                  onPress={() => navigation.navigate("Home")}
                >
                  <Text style={styles.findParkingText}>Find Parking</Text>
                </TouchableOpacity>
              )}
              {isOwner && activeTab === "requests" && (
                <TouchableOpacity
                  style={styles.findParkingButton}
                  onPress={() => navigation.navigate("MyListings")}
                >
                  <Text style={styles.findParkingText}>Manage Listings</Text>
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
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.secondary,
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
