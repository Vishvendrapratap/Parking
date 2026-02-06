import React from "react";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import {
  UnreadMessagesProvider,
  useUnreadMessages,
} from "../contexts/UnreadMessagesContext";
import {
  PendingRequestsProvider,
  usePendingRequests,
} from "../contexts/PendingRequestsContext";
import { COLORS } from "../constants/config";
import { TabIcon } from "../components/Icon";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import OTPScreen from "../screens/auth/OTPScreen";

// Main Screens
import HomeMapScreen from "../screens/HomeMapScreen";
import SearchScreen from "../screens/SearchScreen";
import ParkingDetailsScreen from "../screens/ParkingDetailsScreen";
import BookingScreen from "../screens/BookingScreen";
import BookingConfirmationScreen from "../screens/BookingConfirmationScreen";

// Chat
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";

// Bookings
import BookingsScreen from "../screens/BookingsScreen";
import BookingDetailsScreen from "../screens/BookingDetailsScreen";

// Owner Screens
import OwnerDashboardScreen from "../screens/owner/OwnerDashboardScreen";
import AddListingScreen from "../screens/owner/AddListingScreen";
import EditListingScreen from "../screens/owner/EditListingScreen";
import MyListingsScreen from "../screens/owner/MyListingsScreen";
import PendingRequestsScreen from "../screens/owner/PendingRequestsScreen";

// Seeker Screens
import GarageScreen from "../screens/seeker/GarageScreen";

// Profile
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HelpCenterScreen from "../screens/HelpCenterScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
  </Stack.Navigator>
);

// Seeker Tab Navigator
const SeekerTabs = () => {
  const { unreadCount } = useUnreadMessages();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            badge={route.name === "Chat" ? unreadCount : 0}
          />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Home" component={HomeMapScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Owner Tab Navigator
const OwnerTabs = () => {
  const { unreadCount } = useUnreadMessages();
  const { pendingCount } = usePendingRequests();

  const getBadgeCount = (routeName) => {
    if (routeName === "Chat") return unreadCount;
    if (routeName === "Requests") return pendingCount;
    return 0;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            badge={getBadgeCount(route.name)}
          />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen
        name="My Listings"
        component={MyListingsScreen}
        options={{ tabBarLabel: "Listings" }}
      />
      <Tab.Screen
        name="Requests"
        component={PendingRequestsScreen}
        options={{ tabBarLabel: "Requests" }}
      />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const MainStack = () => {
  const { isOwner } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MainTabs"
        component={isOwner ? OwnerTabs : SeekerTabs}
      />

      {/* Parking Screens */}
      <Stack.Screen name="ParkingDetails" component={ParkingDetailsScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
      />

      {/* Chat Screens */}
      <Stack.Screen name="ChatRoom" component={ChatScreen} />

      {/* Booking Screens */}
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />

      {/* Owner Screens */}
      <Stack.Screen name="AddListing" component={AddListingScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />

      {/* Seeker Screens */}
      <Stack.Screen name="Garage" component={GarageScreen} />

      {/* Profile Screens */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useNavigationContainerRef();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <NotificationProvider navigation={navigationRef}>
        <UnreadMessagesProvider>
          <PendingRequestsProvider>
            {isAuthenticated ? <MainStack /> : <AuthStack />}
          </PendingRequestsProvider>
        </UnreadMessagesProvider>
      </NotificationProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default AppNavigator;
