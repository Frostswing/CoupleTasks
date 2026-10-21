import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function PremiumTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  error,
}) {
  const { colors } = useAppTheme();
  const borderColor = error ? colors.error : colors.border;
  return (
    <View style={styles.group}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor,
            color: colors.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
      />
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: SPACING.l,
  },
  label: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.s,
    fontWeight: "600",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m + 2,
    fontSize: 16,
  },
  error: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
});
