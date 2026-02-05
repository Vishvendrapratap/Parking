import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOwnerDashboard } from "../../api/services";
import { useAuth } from "../../contexts/AuthContext";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { COLORS } from "../../constants/config";
import Icon from "../../components/Icon";

const { width } = Dimensions.get("window");

const OwnerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const result = await getOwnerDashboard();
      setDashboard(result.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddListing")}
          >
            <Text style={styles.addButtonText}>+ Add Listing</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="parking" size="2xl" color={COLORS.primary} />
            <Text style={styles.statValue}>
              {dashboard?.totalListings || 0}
            </Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="calendar" size="2xl" color={COLORS.primary} />
            <Text style={styles.statValue}>
              {dashboard?.totalBookings || 0}
            </Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="star" size="2xl" color={COLORS.accent} />
            <Text style={styles.statValue}>
              {dashboard?.rating?.toFixed(1) || "N/A"}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View style={styles.earningsTitleRow}>
              <Icon name="money" size="lg" color={COLORS.white} />
              <Text style={styles.earningsTitle}>Earnings</Text>
            </View>
            <Text style={styles.earningsPeriod}>
              {format(startOfMonth(new Date()), "MMM d")} -{" "}
              {format(endOfMonth(new Date()), "MMM d, yyyy")}
            </Text>
          </View>
          <View style={styles.earningsContent}>
            <View style={styles.earningsMain}>
              <Text style={styles.earningsValue}>
                ${dashboard?.monthlyEarnings?.toFixed(2) || "0.00"}
              </Text>
              <Text style={styles.earningsLabel}>This Month</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsSecondary}>
              <Text style={styles.totalEarnings}>
                ${dashboard?.totalEarnings?.toFixed(2) || "0.00"}
              </Text>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Pending Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="clock" size="lg" color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>Pending Requests</Text>
            </View>
          </View>
          {dashboard?.pendingBookings?.length > 0 ? (
            dashboard.pendingBookings.slice(0, 3).map((booking) => (
              <TouchableOpacity
                key={booking._id}
                style={styles.bookingItem}
                onPress={() =>
                  navigation.navigate("BookingDetails", {
                    bookingId: booking._id,
                  })
                }
              >
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>
                    {booking.parkingSpace?.title}
                  </Text>
                  <Text style={styles.bookingDate}>
                    {format(new Date(booking.startTime), "MMM d, h:mm a")}
                  </Text>
                  <Text style={styles.bookingUser}>
                    By {booking.user?.name}
                  </Text>
                </View>
                <View style={styles.bookingActions}>
                  <Text style={styles.bookingPrice}>
                    ${booking.totalPrice?.toFixed(2)}
                  </Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          )}
        </View>

        {/* My Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="home" size="lg" color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>My Listings</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("My Listings")}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboard?.listings?.length > 0 ? (
            dashboard.listings.slice(0, 3).map((listing) => (
              <TouchableOpacity
                key={listing._id}
                style={styles.listingItem}
                onPress={() =>
                  navigation.navigate("EditListing", { parkingId: listing._id })
                }
              >
                <View style={styles.listingImage}>
                  <Icon name="parking" size="xl" color={COLORS.primary} />
                </View>
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <View style={styles.listingAddressRow}>
                    <Icon
                      name="mapMarker"
                      size="xs"
                      color={COLORS.text.secondary}
                    />
                    <Text style={styles.listingAddress} numberOfLines={1}>
                      {listing.location?.address}
                    </Text>
                  </View>
                  <View style={styles.listingMeta}>
                    <Text style={styles.listingPrice}>
                      ${listing.pricePerHour}/hr
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            listing.status === "available"
                              ? COLORS.secondary
                              : COLORS.gray[400],
                        },
                      ]}
                    />
                    <Text style={styles.listingStatus}>{listing.status}</Text>
                  </View>
                </View>
                <Icon name="chevronRight" size="md" color={COLORS.text.light} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No listings yet</Text>
              <TouchableOpacity
                style={styles.addListingButton}
                onPress={() => navigation.navigate("AddListing")}
              >
                <Text style={styles.addListingText}>
                  Add Your First Listing
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="comment" size="lg" color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
            </View>
          </View>
          {dashboard?.recentReviews?.length > 0 ? (
            dashboard.recentReviews.slice(0, 2).map((review) => (
              <View key={review._id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.user?.name}</Text>
                  <View style={styles.reviewRatingRow}>
                    <Icon name="star" size="sm" color={COLORS.accent} />
                    <Text style={styles.reviewRating}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText} numberOfLines={2}>
                  {review.comment}
                </Text>
                <Text style={styles.reviewDate}>
                  {format(new Date(review.createdAt), "MMM d, yyyy")}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
    textAlign: "center",
  },
  earningsCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  earningsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    marginLeft: 8,
  },
  earningsPeriod: {
    fontSize: 12,
    color: COLORS.white + "80",
  },
  earningsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  earningsMain: {
    flex: 1,
  },
  earningsValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.white,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.white + "80",
    marginTop: 4,
  },
  earningsDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.surface + "30",
    marginHorizontal: 20,
  },
  earningsSecondary: {
    alignItems: "flex-end",
  },
  totalEarnings: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  bookingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  bookingDate: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  bookingUser: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  bookingActions: {
    alignItems: "flex-end",
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.warning,
  },
  listingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  listingImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listingIcon: {
    fontSize: 24,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  listingAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  listingAddress: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginLeft: 4,
    flex: 1,
  },
  listingMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  listingStatus: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: "capitalize",
  },
  listingArrow: {
    fontSize: 20,
    color: COLORS.gray[400],
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  reviewRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewRating: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  addListingButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  addListingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 24,
  },
});

export default OwnerDashboardScreen;
