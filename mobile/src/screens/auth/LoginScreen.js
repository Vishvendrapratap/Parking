import React, { useState, useEffect, useRef } from "react";
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
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../constants/config";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const { sendOTP } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wait 2 seconds then slide up the form
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.6,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlePhoneLogin = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    // Format phone with country code
    const formattedPhone = `+91${phone}`;
    const result = await sendOTP(formattedPhone, false); // false = not registration
    setLoading(false);

    if (result.success) {
      if (result.requiresRegistration) {
        // User doesn't exist, redirect to registration with phone pre-filled
        Alert.alert(
          "Account Not Found",
          "No account found with this phone number. Please sign up to continue.",
          [
            {
              text: "Sign Up",
              onPress: () => navigation.navigate("Register", { phone: phone }),
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
      } else {
        navigation.navigate("OTP", { phone: formattedPhone });
      }
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background GIF */}
      <Image
        source={require("../../../assets/promo.gif")}
        style={styles.backgroundGif}
        resizeMode="cover"
      />

      {/* Dark overlay - animates in with form */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents="none"
      />

      {/* Sliding Form */}
      <Animated.View
        style={[
          styles.formContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Parking Uncle</Text>
              <Text style={styles.subtitle}>Find & share parking spaces</Text>
            </View>

            {/* Phone Login Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
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
                onPress={handlePhoneLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.otpNote}>
                We'll send a 6-digit verification code to your phone
              </Text>
            </View>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}> Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundGif: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  formContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.75,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    marginTop: 6,
  },
  form: {
    gap: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginBottom: 8,
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
    marginTop: 24,
    marginBottom: 16,
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

export default LoginScreen;
