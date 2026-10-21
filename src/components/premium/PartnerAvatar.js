import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { initialsFromIdentity } from "../../utils/displayName";

export default function PartnerAvatar({
  email,
  fullName,
  size = 28,
  variant = "primary",
}) {
  const { colors } = useAppTheme();
  const bg =
    variant === "partner" ? colors.successMuted : variant === "muted" ? colors.borderLight : colors.primaryMuted;
  const fg = variant === "partner" ? colors.success : colors.primary;

  const label = useMemo(
    () => initialsFromIdentity({ email, fullName }),
    [email, fullName]
  );

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
