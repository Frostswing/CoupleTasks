import React from "react";
import { View, StyleSheet } from "react-native";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function PremiumCard({ children, style, padded = true, elevated }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        elevated ? SHADOWS.md : SHADOWS.sm,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.l,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  padded: {
    padding: SPACING.l,
  },
});
