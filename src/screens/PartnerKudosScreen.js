import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import PremiumCard from "../components/premium/PremiumCard";
import { usePartnerMode } from "../context/HouseholdPartnerContext";
import { useAppTheme } from "../context/ThemeContext";
import { SPACING, TYPOGRAPHY, COLORS, getFeatureGradient } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "../localization/i18n";

/** Partner-only appreciation hub (reference “Kudos” tab). */
export default function PartnerKudosScreen() {
  const { isPartnered, partnerFirstName } = usePartnerMode();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const gradient = getFeatureGradient("kudos", isDark);

  return (
    <PremiumScreenShell
      title={i18n.t("kudos.title")}
      subtitle={i18n.t("kudos.subtitle", { name: partnerFirstName || i18n.t("home.fallbackName") })}
      heroAccent="kudos"
    >
      <LinearGradient colors={gradient} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Icon name="star" size={40} color={COLORS.heroText} />
        <Text style={styles.heroText}>{i18n.t("kudos.heroLine")}</Text>
      </LinearGradient>
      <PremiumCard>
        <Text style={[styles.body, { color: colors.text }]}>{i18n.t("kudos.body")}</Text>
      </PremiumCard>
    </PremiumScreenShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    heroCard: {
      borderRadius: 20,
      padding: SPACING.xl,
      alignItems: "center",
      gap: SPACING.m,
      marginBottom: SPACING.m,
    },
    heroText: {
      ...TYPOGRAPHY.h2,
      color: COLORS.heroText,
      textAlign: "center",
    },
    body: {
      ...TYPOGRAPHY.body,
      lineHeight: 22,
    },
  });
}
