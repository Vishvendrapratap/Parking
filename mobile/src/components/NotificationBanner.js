import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/config";
import Icon from "./Icon";

const { width } = Dimensions.get("window");

const NotificationBanner = ({
  visible,
  message,
  type = "success", // success, error, info, warning
  title,
  onDismiss,
  onPress,
  duration = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: COLORS.secondary,
          icon: "circleCheck",
        };
      case "error":
        return {
          backgroundColor: COLORS.error,
          icon: "circleXmark",
        };
      case "warning":
        return {
          backgroundColor: COLORS.accent,
          icon: "exclamation",
        };
      case "info":
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: "info",
        };
    }
  };

  if (!visible) return null;

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: typeStyles.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress || handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Icon name={typeStyles.icon} size="xl" color={COLORS.white} />
        </View>
        <View style={styles.textContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Icon name="xmark" size="md" color={COLORS.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.95,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default NotificationBanner;
