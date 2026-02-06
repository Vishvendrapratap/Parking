import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/config";
import Icon from "../components/Icon";

const TermsOfServiceScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 5, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the ParkingUncle mobile application and
            services ("Service"), you agree to be bound by these Terms of
            Service ("Terms"). If you do not agree to these Terms, please do not
            use our Service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            ParkingUncle is a platform that connects parking space seekers with
            parking space owners. We facilitate the booking of parking spaces
            but are not responsible for the actual parking spaces listed on our
            platform.{"\n"}
            {"\n"}
            Our services include:{"\n"}• Searching for available parking spaces
            {"\n"}• Booking parking spaces{"\n"}• Listing parking spaces for
            owners{"\n"}• Communication between seekers and owners{"\n"}•
            Payment processing
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To use our Service, you must create an account. You agree to:{"\n"}•
            Provide accurate and complete information{"\n"}• Maintain the
            security of your account credentials{"\n"}• Notify us immediately of
            any unauthorized access{"\n"}• Be responsible for all activities
            under your account{"\n"}
            {"\n"}
            You must be at least 18 years old to create an account and use our
            services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Conduct</Text>
          <Text style={styles.paragraph}>
            When using our Service, you agree not to:{"\n"}• Violate any
            applicable laws or regulations{"\n"}• Provide false or misleading
            information{"\n"}• Harass, abuse, or harm other users{"\n"}• Use the
            Service for any illegal purposes{"\n"}• Interfere with the proper
            functioning of the Service{"\n"}• Attempt to access other users'
            accounts{"\n"}• Post spam or unauthorized advertisements{"\n"}•
            Circumvent any security measures
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Parking Space Seekers</Text>
          <Text style={styles.paragraph}>
            As a parking space seeker, you agree to:{"\n"}• Provide accurate
            vehicle information{"\n"}• Arrive and depart within your booked time
            slot{"\n"}• Follow the parking space owner's rules and instructions
            {"\n"}• Pay all applicable fees and charges{"\n"}• Not damage the
            parking space or surrounding property{"\n"}• Report any issues or
            damages promptly
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Parking Space Owners</Text>
          <Text style={styles.paragraph}>
            As a parking space owner, you agree to:{"\n"}• Provide accurate
            information about your parking space{"\n"}• Ensure the space is
            available during listed times{"\n"}• Maintain a safe and accessible
            parking space{"\n"}• Have the legal right to rent out the parking
            space{"\n"}• Respond to booking requests in a timely manner{"\n"}•
            Comply with all local laws and regulations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Bookings and Payments</Text>
          <Text style={styles.paragraph}>
            • All bookings are subject to availability{"\n"}• Prices are set by
            parking space owners{"\n"}• A service fee may be added to each
            transaction{"\n"}• Payments are processed through secure third-party
            providers{"\n"}• Refunds are subject to our cancellation policy
            {"\n"}• We reserve the right to suspend accounts with payment issues
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cancellation Policy</Text>
          <Text style={styles.paragraph}>
            • Cancellations made 24+ hours before: Full refund{"\n"}•
            Cancellations made 2-24 hours before: 50% refund{"\n"}•
            Cancellations made less than 2 hours before: No refund{"\n"}•
            No-shows will not receive a refund{"\n"}
            {"\n"}
            Owners who cancel confirmed bookings may be subject to penalties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            ParkingUncle is a platform connecting users and is not responsible
            for:{"\n"}• The condition or safety of parking spaces{"\n"}• Damage
            to vehicles or property{"\n"}• Theft or loss of belongings{"\n"}•
            Disputes between users{"\n"}• Actions of third parties{"\n"}
            {"\n"}
            Our liability is limited to the amount of fees paid to us for the
            specific transaction in question.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless ParkingUncle, its
            affiliates, officers, directors, employees, and agents from any
            claims, damages, losses, or expenses arising from your use of the
            Service or violation of these Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content and materials available through our Service, including
            but not limited to text, graphics, logos, and software, are owned by
            or licensed to ParkingUncle and are protected by intellectual
            property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any
            time for violation of these Terms or for any other reason at our
            discretion. You may also delete your account at any time through the
            app settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may modify these Terms at any time. We will notify you of
            significant changes through the app or via email. Your continued use
            of the Service after changes constitutes acceptance of the modified
            Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with
            the laws of India, without regard to its conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at:
            {"\n"}
            {"\n"}
            Email: help@parkinguncle.com{"\n"}
            {"\n"}
            We are committed to resolving any concerns you may have.
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
  lastUpdated: {
    fontSize: 14,
    color: COLORS.text.light,
    marginBottom: 24,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default TermsOfServiceScreen;
