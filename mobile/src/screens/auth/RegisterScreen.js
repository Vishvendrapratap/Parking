import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../constants/config";
import Icon from "../../components/Icon";

const RegisterScreen = ({ navigation, route }) => {
  const { sendOTP } = useAuth();
  // Pre-fill phone if coming from login redirect
  const prefilledPhone = route.params?.phone || "";
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(prefilledPhone);
  const [role, setRole] = useState("seeker");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!phone || phone.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    // Format phone with country code
    const formattedPhone = `+91${phone}`;
    const result = await sendOTP(formattedPhone, true); // true = registration
    setLoading(false);

    if (result.success) {
      navigation.navigate("OTP", { 
        phone: formattedPhone, 
        name: name.trim(),
        email: email.trim() || undefined,
        role: role,
        isRegistration: true 
      });
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrowLeft" size="md" color={COLORS.primary} />
              <Text style={styles.backButtonText}> Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our parking community</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.label}>I want to:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "seeker" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("seeker")}
              >
                <Icon
                  name="search"
                  size="xl"
                  color={role === "seeker" ? COLORS.primary : COLORS.gray[400]}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === "seeker" && styles.roleTextActive,
                  ]}
                >
                  Find Parking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "owner" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("owner")}
              >
                <Icon
                  name="home"
                  size="xl"
                  color={role === "owner" ? COLORS.primary : COLORS.gray[400]}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === "owner" && styles.roleTextActive,
                  ]}
                >
                  List My Space
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.gray[400]}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={COLORS.gray[400]}
                  value={phone}
                  onChangeText={(text) =>
                    setPhone(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending OTP..." : "Continue"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.otpNote}>
              We'll send a 6-digit verification code to your phone
            </Text>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  roleTextActive: {
    color: COLORS.primary,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    overflow: "hidden",
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    backgroundColor: COLORS.gray[100],
    borderRightWidth: 1,
    borderRightColor: COLORS.gray[200],
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  otpNote: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: "center",
    marginTop: 8,
  },
});

export default RegisterScreen;

