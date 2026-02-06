import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { getMyBookings, updateBookingStatus } from "../../api/services";
import { usePendingRequests } from "../../contexts/PendingRequestsContext";
import { COLORS } from "../../constants/config";
import Icon from "../../components/Icon";
import Header from "../../components/Header";

const PendingRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const { refreshPendingCount, decrementPendingCount } = usePendingRequests();

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
      refreshPendingCount();
    }, [])
  );

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const result = await getMyBookings({ status: "pending", role: "owner" });
      setRequests(result.data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingRequests();
    refreshPendingCount();
    setRefreshing(false);
  };

  const handleApprove = (booking) => {
    Alert.alert(
      "Approve Request",
      `Approve booking request from ${booking.seeker?.name || "Seeker"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setActionLoading(booking._id);
              await updateBookingStatus(booking._id, "confirmed");
              setRequests(requests.filter((r) => r._id !== booking._id));
              decrementPendingCount();
              Alert.alert("Success", "Booking approved successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to approve booking");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (booking) => {
    Alert.alert(
      "Reject Request",
      `Reject booking request from ${booking.seeker?.name || "Seeker"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(booking._id);
              await updateBookingStatus(booking._id, "rejected");
              setRequests(requests.filter((r) => r._id !== booking._id));
              decrementPendingCount();
              Alert.alert("Success", "Booking rejected");
            } catch (error) {
              Alert.alert("Error", "Failed to reject booking");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }) => {
    const isProcessing = actionLoading === item._id;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => navigation.navigate("BookingDetails", { bookingId: item._id })}
        disabled={isProcessing}
      >
        {/* Parking Space Info */}
        <View style={styles.parkingInfo}>
          {item.parkingSpace?.images?.[0] ? (
            <Image
              source={{ uri: item.parkingSpace.images[0] }}
              style={styles.parkingImage}
            />
          ) : (
            <View style={styles.parkingImagePlaceholder}>
              <Icon name="parking" size="xl" color={COLORS.gray[400]} />
            </View>
          )}
          <View style={styles.parkingDetails}>
            <Text style={styles.parkingTitle} numberOfLines={1}>
              {item.parkingSpace?.title || "Parking Space"}
            </Text>
            <Text style={styles.parkingAddress} numberOfLines={1}>
              {item.parkingSpace?.address?.street || "Address not available"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Seeker Info */}
        <View style={styles.seekerInfo}>
          <View style={styles.seekerAvatar}>
            {item.seeker?.profilePicture ? (
              <Image
                source={{ uri: item.seeker.profilePicture }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.seeker?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
          </View>
          <View style={styles.seekerDetails}>
            <Text style={styles.seekerName}>{item.seeker?.name || "Unknown"}</Text>
            <Text style={styles.seekerPhone}>
              {item.seeker?.phone || "No phone"}
            </Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size="sm" color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {format(new Date(item.startTime), "MMM d, yyyy")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock" size="sm" color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {format(new Date(item.startTime), "h:mm a")} -{" "}
              {format(new Date(item.endTime), "h:mm a")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="car" size="sm" color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {item.vehicleInfo?.licensePlate || "No plate"} •{" "}
              {item.vehicleInfo?.make || ""} {item.vehicleInfo?.model || ""}
            </Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Total Amount</Text>
          <Text style={styles.priceValue}>₹{item.totalAmount?.toFixed(2)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item)}
              >
                <Icon name="close" size="sm" color={COLORS.error} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item)}
              >
                <Icon name="check" size="sm" color={COLORS.white} />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="clipboard" size="4xl" color={COLORS.gray[300]} />
      </View>
      <Text style={styles.emptyTitle}>No Pending Requests</Text>
      <Text style={styles.emptyText}>
        When someone books your parking space, their request will appear here
        for your approval.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header showLogo={true} />

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Pending Requests</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{requests.length}</Text>
        </View>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  parkingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  parkingImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  parkingImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  parkingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  parkingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: 12,
  },
  seekerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  seekerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  seekerDetails: {
    marginLeft: 12,
  },
  seekerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  seekerPhone: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bookingDetails: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: COLORS.error + "15",
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  approveButton: {
    backgroundColor: COLORS.primary,
  },
  rejectButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: "600",
  },
  approveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default PendingRequestsScreen;
