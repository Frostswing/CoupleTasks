import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS, getFeatureGradient } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "../premium/PressableScale";

export default function GradientQuickActionCard({
  featureKey,
  icon,
  title,
  subtitle,
  onPress,
}) {
  const { isDark } = useAppTheme();
  const gradient = getFeatureGradient(featureKey, isDark);

  return (
    <PressableScale onPress={onPress} style={styles.wrap}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconBubble}>
          <Icon name={icon} size={28} color={COLORS.heroText} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={onPress} activeOpacity={0.85}>
          <Icon name="arrow-forward" size={18} color={gradient[0]} />
        </TouchableOpacity>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "48%",
    flexGrow: 1,
    minWidth: "46%",
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.l,
    minHeight: 132,
    ...SHADOWS.md,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.overlayOnPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.m,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.heroText,
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.heroTextMuted,
    fontSize: 12,
    flex: 1,
  },
  arrowBtn: {
    position: "absolute",
    right: SPACING.m,
    bottom: SPACING.m,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.heroText,
    alignItems: "center",
    justifyContent: "center",
  },
});
