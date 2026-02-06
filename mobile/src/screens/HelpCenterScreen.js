import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/config";
import Icon from "../components/Icon";

const SUPPORT_EMAIL = "help@parkinguncle.com";

const HelpCenterScreen = ({ navigation }) => {
  const handleEmailPress = async () => {
    const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=ParkingUncle Support Request`;
    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          "Email Not Available",
          `Please send an email to ${SUPPORT_EMAIL}`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Could not open email. Please contact us at ${SUPPORT_EMAIL}`,
        [{ text: "OK" }],
      );
    }
  };

  const faqItems = [
    {
      question: "How do I book a parking space?",
      answer:
        "Search for parking spaces near your destination, select a space that fits your needs, choose your time slot, and confirm your booking. Payment is processed securely through the app.",
    },
    {
      question: "How do I cancel a booking?",
      answer:
        "Go to your Bookings tab, find the booking you want to cancel, and tap 'Cancel Booking'. Refunds are processed according to our cancellation policy: full refund for 24+ hours notice, 50% for 2-24 hours, no refund for less than 2 hours.",
    },
    {
      question: "How do I list my parking space?",
      answer:
        "Switch to Owner mode from your Profile, then tap 'Add Listing' to create a new parking space listing. Provide details about your space, upload photos, set your price, and define availability.",
    },
    {
      question: "How do payments work?",
      answer:
        "Payments are processed securely when you book a space. For owners, earnings are transferred to your linked account after the booking is completed.",
    },
    {
      question: "What if I have an issue with a parking space?",
      answer:
        "You can contact the parking space owner through the in-app chat. If the issue is not resolved, please contact our support team for assistance.",
    },
    {
      question: "How do I update my profile?",
      answer:
        "Go to Profile tab and tap 'Edit Profile' to update your name, phone number, profile picture, and other details.",
    },
    {
      question: "Is my payment information secure?",
      answer:
        "Yes, we use industry-standard encryption and secure payment processors to protect your payment information. We never store your full card details.",
    },
    {
      question: "How do ratings and reviews work?",
      answer:
        "After each completed booking, both seekers and owners can leave ratings and reviews. This helps maintain quality and trust in our community.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevronLeft" size="lg" color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Support Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportIconContainer}>
            <Icon name="mail" size="xl" color={COLORS.white} />
          </View>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportDescription}>
            Our support team is here to help you with any questions or issues.
          </Text>
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailPress}
          >
            <Icon name="mail" size="md" color={COLORS.white} />
            <Text style={styles.emailButtonText}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
          <Text style={styles.responseTime}>
            We typically respond within 24 hours
          </Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksContainer}>
            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            >
              <View style={styles.quickLinkIcon}>
                <Icon name="shield" size="lg" color={COLORS.primary} />
              </View>
              <Text style={styles.quickLinkText}>Privacy Policy</Text>
              <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("TermsOfService")}
            >
              <View style={styles.quickLinkIcon}>
                <Icon name="file" size="lg" color={COLORS.primary} />
              </View>
              <Text style={styles.quickLinkText}>Terms of Service</Text>
              <Icon name="chevronRight" size="sm" color={COLORS.text.light} />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>ParkingUncle</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.copyright}>
            © 2026 ParkingUncle. All rights reserved.
          </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  supportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  supportIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  emailButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  responseTime: {
    fontSize: 13,
    color: COLORS.text.light,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  quickLinksContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    overflow: "hidden",
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  faqItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.text.light,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default HelpCenterScreen;
