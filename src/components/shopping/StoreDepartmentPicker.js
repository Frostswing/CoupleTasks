import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import i18n from "../../localization/i18n";
import { STORE_DEPARTMENTS } from "../../constants/storeDepartments";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function StoreDepartmentPicker({ value, onChange, disabled }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {STORE_DEPARTMENTS.map((dept) => {
        const selected = value === dept.id;
        return (
          <TouchableOpacity
            key={dept.id}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => !disabled && onChange(dept.id)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <MaterialIcons
              name={dept.icon}
              size={16}
              color={selected ? COLORS.textInverse : colors.textSecondary}
            />
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {i18n.t(`shopping.storeDepartments.${dept.id}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      gap: SPACING.s,
      paddingVertical: SPACING.xs,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      paddingHorizontal: SPACING.m,
      paddingVertical: SPACING.s,
      borderRadius: RADIUS.full,
      backgroundColor: colors.borderLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      ...TYPOGRAPHY.caption,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    chipTextSelected: {
      color: COLORS.textInverse,
    },
  });
}
