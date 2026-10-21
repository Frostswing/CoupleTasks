import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "./PressableScale";
import GradientButton from "./GradientButton";

export default function EmptyState({ icon = "inbox", title, message, actionLabel, onAction }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <Icon name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <GradientButton label={actionLabel} onPress={onAction} compact style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.l,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: "center",
    marginBottom: SPACING.s,
  },
  message: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginBottom: SPACING.l,
  },
  cta: {
    marginTop: SPACING.m,
    minWidth: 160,
  },
});
