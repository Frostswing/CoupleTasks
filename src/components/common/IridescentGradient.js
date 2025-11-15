import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Iridescent gradient component with turquoise → cyan → blue → purple colors
 * Creates a beautiful shimmering effect
 */
export default function IridescentGradient({ 
  children, 
  style,
  variant = "default", // default, subtle, vibrant, card
  ...props 
}) {
  const getGradientColors = () => {
    switch (variant) {
      case "subtle":
        // Subtle: Light turquoise to light cyan
        return ["#E6FFFA", "#CCFBF1", "#B2F5EA"];
      case "vibrant":
        // Vibrant: Turquoise to cyan to blue to purple
        return ["#14B8A6", "#06B6D4", "#3B82F6", "#8B5CF6"];
      case "card":
        // Card: Turquoise to cyan with soft transition
        return ["#14B8A6", "#06B6D4", "#0EA5E9"];
      case "header":
        // Header: Dark turquoise to cyan
        return ["#0D9488", "#14B8A6", "#06B6D4"];
      default:
        // Default: Turquoise to cyan to blue
        return ["#14B8A6", "#06B6D4", "#3B82F6"];
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
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

