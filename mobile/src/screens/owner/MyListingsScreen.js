import React, { useState, useEffect } from "react";
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
import {
  getMyListings,
  updateParkingSpace,
  deleteParkingSpace,
} from "../../api/services";
import { COLORS, PARKING_SIZES } from "../../constants/config";

const MyListingsScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const result = await getMyListings();
      setListings(result.data || []);
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

    return (
      <View style={styles.listingCard}>
        {/* Image/Icon */}
        <View style={styles.listingImage}>
          {item.images?.[0] ? (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageIcon}>🅿️</Text>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageIcon}>🅿️</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.listingContent}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listingAddress} numberOfLines={1}>
            📍 {item.location?.address}
          </Text>

          <View style={styles.listingMeta}>
            <Text style={styles.listingSize}>
              {sizeInfo?.icon} {sizeInfo?.label}
            </Text>
            <Text style={styles.listingPrice}>${item.pricePerHour}/hr</Text>
          </View>

          <View style={styles.listingStats}>
            <Text style={styles.statText}>
              ⭐ {item.rating?.toFixed(1) || "New"}
            </Text>
            <Text style={styles.statText}>
              📅 {item.totalBookings || 0} bookings
            </Text>
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

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("EditListing", { parkingId: item._id })
            }
          >
            <Text style={styles.actionButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              🗑️
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddListing")}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
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
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyText}>No listings yet</Text>
              <Text style={styles.emptySubtext}>
                Start earning by listing your parking space
              </Text>
              <TouchableOpacity
                style={styles.addListingButton}
                onPress={() => navigation.navigate("AddListing")}
              >
                <Text style={styles.addListingText}>
                  Add Your First Listing
                </Text>
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
    backgroundColor: COLORS.gray[50],
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    color: COLORS.gray[800],
  },
  listingAddress: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
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
  statText: {
    fontSize: 13,
    color: COLORS.gray[600],
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
});

export default MyListingsScreen;
