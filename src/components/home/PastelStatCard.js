import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS, getPastelSurface } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "../premium/PressableScale";

export default function PastelStatCard({
  width,
  pastel = "pink",
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}) {
  const { isDark, colors } = useAppTheme();
  const bg = getPastelSurface(pastel, isDark);

  return (
    <PressableScale onPress={onPress} style={width ? { width } : styles.wrapFallback}>
      <View style={[styles.card, SHADOWS.sm, { backgroundColor: bg, width: width ? "100%" : undefined }]}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? COLORS.overlayOnPrimary : COLORS.surface }]}>
          <Icon name={icon} size={22} color={iconColor || colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        <TouchableOpacity onPress={onPress} style={[styles.arrow, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-forward" size={16} color={iconColor || colors.primary} />
        </TouchableOpacity>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrapFallback: {
    flex: 1,
  },
  card: {
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    minHeight: 108,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.s,
    alignSelf: "flex-start",
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    lineHeight: 18,
    paddingRight: SPACING.xl + 8,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: SPACING.xl + 8,
  },
  arrow: {
    position: "absolute",
    right: SPACING.m,
    bottom: SPACING.m,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
