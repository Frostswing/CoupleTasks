import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS, getFeatureGradient } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "../premium/PressableScale";

const MIN_CARD_HEIGHT = 120;
const ARROW_SIZE = 32;
const TEXT_PAD_RIGHT = ARROW_SIZE + SPACING.m;

export default function GradientQuickActionCard({
  width,
  featureKey,
  icon,
  title,
  subtitle,
  onPress,
}) {
  const { isDark } = useAppTheme();
  const gradient = getFeatureGradient(featureKey, isDark);

  return (
    <PressableScale onPress={onPress} style={width ? { width } : styles.wrapFallback}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, width ? { width: "100%" } : null]}
      >
        <View style={styles.iconBubble}>
          <Icon name={icon} size={28} color={COLORS.heroText} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Icon name="arrow-forward" size={18} color={gradient[0]} />
        </TouchableOpacity>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrapFallback: {
    width: "48%",
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.m,
    paddingBottom: SPACING.l,
    minHeight: MIN_CARD_HEIGHT,
    justifyContent: "flex-start",
    ...SHADOWS.md,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.overlayOnPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.s,
    alignSelf: "flex-start",
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.heroText,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 4,
    paddingRight: TEXT_PAD_RIGHT,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.heroTextMuted,
    fontSize: 12,
    lineHeight: 16,
    paddingRight: TEXT_PAD_RIGHT,
    flexShrink: 1,
  },
  arrowBtn: {
    position: "absolute",
    right: SPACING.m,
    bottom: SPACING.m,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    backgroundColor: COLORS.heroText,
    alignItems: "center",
    justifyContent: "center",
  },
});
