import React from "react";
import { Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "./PressableScale";
import { getHeroGradient } from "../../constants/theme";

export default function GradientButton({ label, onPress, compact, loading, disabled, style }) {
  const { isDark } = useAppTheme();
  const stops = getHeroGradient(isDark);

  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={style}>
      <LinearGradient
        colors={stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, compact && styles.btnCompact, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textInverse} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.l,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCompact: {
    paddingVertical: SPACING.s + 2,
    paddingHorizontal: SPACING.l,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.textInverse,
  },
  disabled: {
    opacity: 0.55,
  },
});
