import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

/** Simple ring using border trick (works on web + native). */
export default function ProgressRing({ progress = 0, size = 56, stroke = 5, label, onHero }) {
  const { colors } = useAppTheme();
  const pct = Math.min(1, Math.max(0, progress));
  const ringColor = onHero
    ? COLORS.heroText
    : pct >= 1
      ? colors.success
      : colors.primary;
  const trackColor = onHero ? COLORS.heroTextSubtle : colors.borderLight;
  const labelColor = onHero ? COLORS.heroText : colors.text;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: trackColor,
          },
        ]}
      />
      <View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: ringColor,
            borderTopColor: pct > 0.25 ? ringColor : "transparent",
            borderRightColor: pct > 0.5 ? ringColor : "transparent",
            borderBottomColor: pct > 0.75 ? ringColor : "transparent",
            borderLeftColor: pct >= 1 ? ringColor : "transparent",
            transform: [{ rotate: "-45deg" }],
          },
        ]}
      />
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  arc: {
    position: "absolute",
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    fontSize: 13,
  },
});
