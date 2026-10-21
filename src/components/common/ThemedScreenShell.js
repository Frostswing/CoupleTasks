import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../context/ThemeContext";
import { screenBackgroundStyle, SPACING, TYPOGRAPHY } from "../../constants/theme";

/**
 * Shared loading + scroll shell for secondary screens (theme-aware).
 */
export function ThemedScreenShell({
  loading,
  loadingLabel,
  children,
  scroll = true,
  contentStyle,
  edges = ["bottom"],
}) {
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <SafeAreaView style={[styles.fill, screenBackgroundStyle(colors)]} edges={edges}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          {loadingLabel ? (
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{loadingLabel}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.fill, screenBackgroundStyle(colors)]} edges={edges}>
        <View style={[styles.fill, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.fill, screenBackgroundStyle(colors)]} edges={edges}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ThemedSection({ title, subtitle, children, style }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text> : null}
      {subtitle ? (
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

export function themedCard(colors) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: SPACING.l,
  };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.l,
    ...TYPOGRAPHY.body,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.m,
  },
});
