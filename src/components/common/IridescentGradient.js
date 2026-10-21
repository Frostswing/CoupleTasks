import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENT_STOPS } from "../../constants/theme";

/**
 * Iridescent gradient component with turquoise → cyan → blue → purple colors
 * Creates a beautiful shimmering effect
 */
export default function IridescentGradient({
  children,
  style,
  variant = "default", // default, subtle, vibrant, card, header
  ...props
}) {
  const stops = GRADIENT_STOPS.iridescent;
  const gradientColors = stops[variant] || stops.default;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
