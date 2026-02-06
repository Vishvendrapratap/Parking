import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { getMyProfile } from "../api/services";
import { COLORS } from "../constants/config";
import Icon from "../components/Icon";
import Header from "../components/Header";

const ProfileScreen = ({ navigation }) => {
  const { user, logout, switchRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await getMyProfile();
      setProfile(result.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleSwitchRole = async () => {
    const newRole = user?.role === "seeker" ? "owner" : "seeker";
    const result = await switchRole(newRole);
    if (result.success) {
      Alert.alert("Success", `Switched to ${newRole} mode`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayUser = profile || user;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Logo */}
      <Header showLogo={true} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {displayUser?.profilePicture ? (
              <Image
                source={{ uri: displayUser.profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {displayUser?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Icon name="edit" size="sm" color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{displayUser?.name}</Text>
          <Text style={styles.email}>{displayUser?.email}</Text>

          <View style={styles.roleBadge}>
            <View style={styles.roleContent}>
              <Icon
                name={displayUser?.role === "owner" ? "home" : "search"}
                size="sm"
                color={COLORS.primary}
              />
              <Text style={styles.roleText}>
                {displayUser?.role === "owner"
                  ? "Space Owner"
                  : "Parking Seeker"}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statValueRow}>
                <Icon name="star" size="sm" color={COLORS.accent} />
                <Text style={[styles.statValue, { marginLeft: 4 }]}>
                  {displayUser?.rating?.toFixed(1) || "New"}
                </Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {displayUser?.totalReviews || 0}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {displayUser?.totalBookings || 0}
              </Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <View style={styles.menuIcon}>
              <Icon name="user" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSwitchRole}>
            <View style={styles.menuIcon}>
              <Icon name="sync" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>
              Switch to {user?.role === "seeker" ? "Owner" : "Seeker"}
            </Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>

          {user?.role === "owner" && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("My Listings")}
              >
                <View style={styles.menuIcon}>
                  <Icon
                    name="parking"
                    size="lg"
                    color={COLORS.text.secondary}
                  />
                </View>
                <Text style={styles.menuText}>My Listings</Text>
                <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("OwnerDashboard")}
              >
                <View style={styles.menuIcon}>
                  <Icon
                    name="chartBar"
                    size="lg"
                    color={COLORS.text.secondary}
                  />
                </View>
                <Text style={styles.menuText}>Dashboard</Text>
                <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
              </TouchableOpacity>
            </>
          )}

          {user?.role === "seeker" && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Garage")}
            >
              <View style={styles.menuIcon}>
                <Icon name="car" size="lg" color={COLORS.text.secondary} />
              </View>
              <Text style={styles.menuText}>My Garage</Text>
              <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Icon name="creditCard" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Payment Methods</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Icon name="bell" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Icon name="lock" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("HelpCenter")}
          >
            <View style={styles.menuIcon}>
              <Icon name="help" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Help Center</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("TermsOfService")}
          >
            <View style={styles.menuIcon}>
              <Icon name="file" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("PrivacyPolicy")}
          >
            <View style={styles.menuIcon}>
              <Icon name="shield" size="lg" color={COLORS.text.secondary} />
            </View>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.white,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  editAvatarText: {
    fontSize: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  email: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  roleContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray[100],
  },
  menuSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  menuIcon: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.text.light,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.text.light,
    marginTop: 24,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ProfileScreen;
