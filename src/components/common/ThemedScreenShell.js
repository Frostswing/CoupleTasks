import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { SPACING, TYPOGRAPHY } from "../../constants/theme";
import PremiumScreenShell from "../premium/PremiumScreenShell";
import PremiumCard from "../premium/PremiumCard";

/**
 * Theme-aware screen shell — delegates to premium layout (hero, cards, skeletons).
 */
export function ThemedScreenShell(props) {
  return <PremiumScreenShell {...props} />;
}

export function ThemedSection({ title, subtitle, children, style, card }) {
  const { colors } = useAppTheme();
  const inner = (
    <>
      {title ? <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text> : null}
      {subtitle ? (
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {children}
    </>
  );
  if (card) {
    return (
      <View style={[styles.section, style]}>
        <PremiumCard>{inner}</PremiumCard>
      </View>
    );
  }
  return <View style={[styles.section, style]}>{inner}</View>;
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
  section: {
    marginBottom: SPACING.l,
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
