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

const PrivacyPolicyScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 5, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to ParkingUncle ("we," "our," or "us"). We are committed to
            protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our mobile
            application and services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.subTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            When you create an account or use our services, we may collect:
            {"\n"}• Name and email address{"\n"}• Phone number{"\n"}• Profile
            picture{"\n"}• Payment information{"\n"}• Vehicle information
            (license plate, make, model, color)
          </Text>

          <Text style={styles.subTitle}>Location Information</Text>
          <Text style={styles.paragraph}>
            With your consent, we collect precise location data to:{"\n"}• Show
            nearby parking spaces{"\n"}• Provide navigation to parking locations
            {"\n"}• Verify parking space locations for owners
          </Text>

          <Text style={styles.subTitle}>Usage Information</Text>
          <Text style={styles.paragraph}>
            We automatically collect information about your use of our app,
            including:{"\n"}• Device information (type, operating system){"\n"}•
            App usage patterns and preferences{"\n"}• Booking history and
            transaction data{"\n"}• Communication logs through our chat feature
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. How We Use Your Information
          </Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:{"\n"}• Provide and improve our
            parking services{"\n"}• Process bookings and payments{"\n"}•
            Communicate with you about your bookings{"\n"}• Send important
            updates and notifications{"\n"}• Ensure safety and security of our
            platform{"\n"}• Comply with legal obligations{"\n"}• Analyze usage
            patterns to improve our services
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We may share your information with:{"\n"}• Parking space owners
            (limited booking details){"\n"}• Payment processors for transaction
            handling{"\n"}• Service providers who assist in app operations{"\n"}
            • Law enforcement when required by law{"\n"}
            {"\n"}
            We do not sell your personal information to third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to
            protect your personal information, including:{"\n"}• Encryption of
            data in transit and at rest{"\n"}• Secure authentication mechanisms
            {"\n"}• Regular security assessments{"\n"}• Access controls and
            monitoring
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:{"\n"}• Access your personal information{"\n"}
            • Correct inaccurate data{"\n"}• Request deletion of your data{"\n"}
            • Opt-out of marketing communications{"\n"}• Withdraw consent for
            location tracking{"\n"}
            {"\n"}
            To exercise these rights, please contact us at help@parkinguncle.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal information for as long as your account is
            active or as needed to provide services. We may retain certain
            information for legal compliance, dispute resolution, and
            enforcement of our agreements.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our services are not intended for individuals under the age of 18.
            We do not knowingly collect personal information from children. If
            you believe we have collected information from a child, please
            contact us immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy or our privacy
            practices, please contact us at:{"\n"}
            {"\n"}
            Email: help@parkinguncle.com{"\n"}
            {"\n"}
            We will respond to your inquiry within a reasonable timeframe.
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
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.secondary,
    marginTop: 12,
    marginBottom: 8,
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

export default PrivacyPolicyScreen;
