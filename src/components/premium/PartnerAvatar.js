import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

function initialsFromEmail(email) {
  if (!email) return "?";
  const local = email.split("@")[0] || "";
  const parts = local.replace(/[._-]/g, " ").split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export default function PartnerAvatar({ email, size = 28, variant = "primary" }) {
  const { colors } = useAppTheme();
  const bg =
    variant === "partner" ? colors.successMuted : variant === "muted" ? colors.borderLight : colors.primaryMuted;
  const fg = variant === "partner" ? colors.success : colors.primary;

  const label = useMemo(() => initialsFromEmail(email), [email]);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38, color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    color: COLORS.primary,
  },
});
