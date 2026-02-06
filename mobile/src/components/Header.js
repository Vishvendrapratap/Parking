import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/config";
import Icon from "./Icon";

const Header = ({
  title,
  showLogo = true,
  showBack = false,
  onBack,
  rightComponent,
  navigation,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left side - Back button or Logo icon */}
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrowLeft" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          ) : showLogo ? (
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {/* Center - Brand name or Title */}
        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.brandName}>Parking Uncle</Text>
          ) : title ? (
            <Text style={styles.title}>{title}</Text>
          ) : null}
        </View>

        {/* Right side - Optional component */}
        <View style={styles.right}>{rightComponent}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  left: {
    flex: 1,
    alignItems: "flex-start",
  },
  center: {
    flex: 2,
    alignItems: "center",
  },
  right: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  brandName: {
    fontSize: 24,
    fontFamily: "LotusEater",
    color: COLORS.white,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  backButton: {
    padding: 4,
  },
});

export default Header;
