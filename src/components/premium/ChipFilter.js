import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PressableScale from "./PressableScale";

export default function ChipFilter({ options, value, onChange, style }) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <PressableScale key={opt.value} onPress={() => onChange(opt.value)}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.textInverse : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
  },
  chip: {
    paddingHorizontal: SPACING.m + 2,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    ...TYPOGRAPHY.label,
    fontWeight: "600",
  },
});
