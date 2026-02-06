import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  getMyListings,
  getMyBookings,
  updateParkingSpace,
  deleteParkingSpace,
} from "../../api/services";
import { COLORS, PARKING_SIZES } from "../../constants/config";
import Icon from "../../components/Icon";
import Header from "../../components/Header";

const MyListingsScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [pendingByListing, setPendingByListing] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh listings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, []),
  );

  const fetchListings = async () => {
    try {
      setLoading(true);
      const [listingsResult, pendingResult] = await Promise.all([
        getMyListings(),
        getMyBookings({ role: "owner", status: "pending" }),
      ]);

      setListings(listingsResult.data || []);

      // Group pending bookings by parking space ID
      const pendingMap = {};
      (pendingResult.data || []).forEach((booking) => {
        const parkingId = booking.parkingSpace?._id || booking.parkingSpace;
        if (parkingId) {
          if (!pendingMap[parkingId]) {
            pendingMap[parkingId] = [];
          }
          pendingMap[parkingId].push(booking);
        }
      });
      setPendingByListing(pendingMap);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const toggleStatus = async (listing) => {
    const newStatus =
      listing.status === "available" ? "unavailable" : "available";

    try {
      await updateParkingSpace(listing._id, { status: newStatus });
      setListings(
        listings.map((l) =>
          l._id === listing._id ? { ...l, status: newStatus } : l,
        ),
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const handleDelete = (listing) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteParkingSpace(listing._id);
              setListings(listings.filter((l) => l._id !== listing._id));
              Alert.alert("Success", "Listing deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete listing");
            }
          },
        },
      ],
    );
  };

  const renderListingItem = ({ item }) => {
    const sizeInfo = PARKING_SIZES.find((s) => s.value === item.parkingSize);
    const pendingRequests = pendingByListing[item._id] || [];
    const pendingCount = pendingRequests.length;
    const listingStatus = item.listingStatus || "draft";

    return (
      <View style={styles.listingCard}>
        {/* Listing Status Badge */}
        <View
          style={[
            styles.listingStatusBadge,
            listingStatus === "active" && styles.listingStatusActive,
            listingStatus === "draft" && styles.listingStatusDraft,
            listingStatus === "inactive" && styles.listingStatusInactive,
          ]}
        >
          <Text style={styles.listingStatusText}>
            {listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1)}
          </Text>
        </View>

        {/* Pending Badge */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingBadge}
            onPress={() =>
              navigation.navigate("BookingDetails", {
                bookingId: pendingRequests[0]._id,
              })
            }
          >
            <Icon name="clock" size="xs" color={COLORS.white} />
            <Text style={styles.pendingBadgeText}>
              {pendingCount} Pending Request{pendingCount > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        )}
        {/* Image/Icon */}
        <View style={styles.listingImage}>
          {item.images?.[0] ? (
            <View style={styles.imagePlaceholder}>
              <Icon name="parking" size="2xl" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="parking" size="2xl" color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.listingContent}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.listingAddressRow}>
            <Icon name="mapMarker" size="xs" color={COLORS.text.secondary} />
            <Text style={styles.listingAddress} numberOfLines={1}>
              {item.location?.address}
            </Text>
          </View>

          <View style={styles.listingMeta}>
            <Text style={styles.listingSize}>
              {sizeInfo?.icon} {sizeInfo?.label}
            </Text>
            <Text style={styles.listingPrice}>₹{item.pricePerHour}/hr</Text>
          </View>

          <View style={styles.listingStats}>
            <View style={styles.statRow}>
              <Icon name="star" size="xs" color={COLORS.accent} />
              <Text style={styles.statText}>
                {item.rating?.toFixed(1) || "New"}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Icon name="calendar" size="xs" color={COLORS.text.secondary} />
              <Text style={styles.statText}>
                {item.totalBookings || 0} bookings
              </Text>
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <TouchableOpacity
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "available"
                  ? COLORS.secondary + "20"
                  : COLORS.gray[200],
            },
          ]}
          onPress={() => toggleStatus(item)}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "available"
                    ? COLORS.secondary
                    : COLORS.gray[500],
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "available"
                    ? COLORS.secondary
                    : COLORS.gray[600],
              },
            ]}
          >
            {item.status}
          </Text>
        </TouchableOpacity>

        {/* Pending Requests Action Button */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.viewRequestsButton}
            onPress={() =>
              navigation.navigate("BookingDetails", {
                bookingId: pendingRequests[0]._id,
              })
            }
          >
            <Icon name="clipboard" size="sm" color={COLORS.white} />
            <Text style={styles.viewRequestsText}>
              View {pendingCount} Request{pendingCount > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("EditListing", { parkingId: item._id })
            }
          >
            <Icon name="edit" size="sm" color={COLORS.primary} />
            <Text style={styles.actionButtonText}> Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="trash" size="sm" color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Logo */}
      <Header
        showLogo={true}
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate("AddListing")}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="home" size="4xl" color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>No listings yet</Text>
              <Text style={styles.emptySubtext}>Start earning by listing your parking space</Text>
              <TouchableOpacity
                style={styles.addListingButton}
                onPress={() => navigation.navigate("AddListing")}
              >
                <Text style={styles.addListingText}>Add Your First Listing</Text>
              </TouchableOpacity>
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
  addButton: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  listingImage: {
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  imageIcon: {
    fontSize: 48,
  },
  listingContent: {
    marginBottom: 12,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  listingAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  listingAddress: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginLeft: 4,
    flex: 1,
  },
  listingMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  listingSize: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  listingStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
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
    fontWeight: "500",
    color: COLORS.gray[700],
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 16,
    backgroundColor: COLORS.error + "10",
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: "center",
  },
  addListingButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  addListingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  pendingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  pendingBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  listingStatusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.gray[400],
    zIndex: 1,
  },
  listingStatusActive: {
    backgroundColor: COLORS.secondary,
  },
  listingStatusDraft: {
    backgroundColor: COLORS.gray[500],
  },
  listingStatusInactive: {
    backgroundColor: COLORS.error,
  },
  listingStatusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  viewRequestsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  viewRequestsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default MyListingsScreen;
