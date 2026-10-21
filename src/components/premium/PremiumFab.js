import React from "react";
import { StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { getHeroGradient } from "../../constants/theme";
import PressableScale from "./PressableScale";

export default function PremiumFab({ icon = "add", onPress, disabled, style, accessibilityLabel }) {
  const { isDark } = useAppTheme();
  const stops = getHeroGradient(isDark);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.wrap, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <LinearGradient colors={stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        <Icon name={icon} size={26} color={COLORS.textInverse} />
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: SPACING.xl,
    bottom: SPACING.xl,
    zIndex: 20,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.lg,
  },
});
