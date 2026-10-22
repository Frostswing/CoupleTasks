import React from "react";
import { View, Text, StyleSheet, I18nManager } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS, getFeatureGradient } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "../premium/PressableScale";

const MIN_CARD_HEIGHT = 152;
const ARROW_SIZE = 28;

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
  const isRTL = I18nManager.isRTL;
  const arrowIcon = isRTL ? "arrow-back" : "arrow-forward";

  return (
    <PressableScale onPress={onPress} style={width ? { width } : styles.wrapFallback}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, width ? { width: "100%" } : null]}
      >
        <View style={[styles.topRow, isRTL && styles.topRowRtl]}>
          <View style={styles.iconBubble}>
            <Icon name={icon} size={26} color={COLORS.heroText} />
          </View>
        </View>

        <Text style={[styles.title, isRTL && styles.rtlText]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]} numberOfLines={2}>
          {subtitle}
        </Text>

        <View style={[styles.footerRow, isRTL && styles.footerRowRtl]}>
          <View style={styles.arrowBtn}>
            <Icon name={arrowIcon} size={16} color={gradient[0]} />
          </View>
        </View>
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
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
    minHeight: MIN_CARD_HEIGHT,
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: SPACING.m,
  },
  topRowRtl: {
    justifyContent: "flex-end",
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.overlayOnPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.heroText,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    marginBottom: SPACING.xs,
    width: "100%",
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.heroTextMuted,
    fontSize: 12,
    lineHeight: 17,
    width: "100%",
    minHeight: 34,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SPACING.m,
  },
  footerRowRtl: {
    justifyContent: "flex-start",
  },
  arrowBtn: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    backgroundColor: COLORS.heroText,
    alignItems: "center",
    justifyContent: "center",
  },
});
