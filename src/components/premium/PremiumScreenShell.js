import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "../../context/ThemeContext";
import {
  screenBackgroundStyle,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  COLORS,
  getHeroGradient,
} from "../../constants/theme";
import { SkeletonList } from "./Skeleton";
import PremiumFab from "./PremiumFab";

/**
 * Premium layout shell: gradient hero, stat chips, layered content, skeleton loading, optional FAB.
 */
export default function PremiumScreenShell({
  title,
  subtitle,
  heroStats,
  heroSlot,
  children,
  loading,
  loadingLabel,
  scroll = true,
  contentStyle,
  edges = ["bottom"],
  refreshControl,
  fab,
  noHorizontalPadding,
}) {
  const { colors, isDark } = useAppTheme();
  const gradient = getHeroGradient(isDark);

  if (loading) {
    return (
      <SafeAreaView style={[styles.fill, screenBackgroundStyle(colors)]} edges={edges}>
        <View style={styles.heroWrap}>
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <SkeletonLinePlaceholder colors={colors} />
          </LinearGradient>
        </View>
        <SkeletonList rows={5} />
        {loadingLabel ? (
          <Text style={[styles.loadingCaption, { color: colors.textSecondary }]}>{loadingLabel}</Text>
        ) : null}
      </SafeAreaView>
    );
  }

  const bodyPadding = noHorizontalPadding ? styles.bodyFlush : styles.body;

  const heroBlock = title ? (
    <View style={styles.heroWrap}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        {heroStats?.length ? (
          <View style={styles.statsRow}>
            {heroStats.map((stat) => (
              <View key={stat.label} style={styles.statPill}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {heroSlot}
      </LinearGradient>
    </View>
  ) : null;

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.fill, screenBackgroundStyle(colors)]} edges={edges}>
        {heroBlock}
        <View style={[styles.fill, bodyPadding, contentStyle]}>{children}</View>
        {fab ? <PremiumFab {...fab} /> : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.fill, screenBackgroundStyle(colors)]} edges={edges}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.scrollEnd, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {heroBlock}
        <View style={bodyPadding}>{children}</View>
      </ScrollView>
      {fab ? <PremiumFab {...fab} /> : null}
    </SafeAreaView>
  );
}

function SkeletonLinePlaceholder({ colors }) {
  return (
    <View style={{ gap: SPACING.s }}>
      <View style={[styles.sk, { width: "55%", backgroundColor: COLORS.overlayOnPrimary }]} />
      <View style={[styles.sk, { width: "80%", height: 12, backgroundColor: COLORS.overlayOnPrimary }]} />
    </View>
  );
}

export function PremiumHeroProgress({ progress, label }) {
  const pct = Math.min(1, Math.max(0, progress));
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      {label ? <Text style={styles.progressLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollEnd: {
    paddingBottom: SPACING.xxxl + 56,
  },
  heroWrap: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
  },
  hero: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  heroTitle: {
    ...TYPOGRAPHY.displayMedium,
    fontSize: 26,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.body.fontSize,
    lineHeight: TYPOGRAPHY.body.lineHeight,
    fontWeight: TYPOGRAPHY.body.fontWeight,
    color: COLORS.heroTextMuted,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
    marginTop: SPACING.l,
  },
  statPill: {
    backgroundColor: COLORS.overlayOnPrimary,
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    minWidth: 72,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textInverse,
    fontSize: 18,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    lineHeight: TYPOGRAPHY.caption.lineHeight,
    color: COLORS.heroTextMuted,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  bodyFlush: {
    paddingHorizontal: 0,
  },
  loadingCaption: {
    textAlign: "center",
    marginTop: SPACING.l,
    ...TYPOGRAPHY.bodySmall,
  },
  sk: {
    height: 22,
    borderRadius: RADIUS.s,
    opacity: 0.5,
  },
  progressWrap: {
    marginTop: SPACING.l,
    gap: SPACING.s,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlayOnPrimary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.textInverse,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    lineHeight: TYPOGRAPHY.caption.lineHeight,
    color: COLORS.heroTextMuted,
    fontWeight: "600",
  },
});
