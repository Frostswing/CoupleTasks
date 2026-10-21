import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

/**
 * Inline selector component - displays all options as selectable buttons
 */
export default function InlineSelector({ 
  options, 
  selectedValue, 
  onSelect, 
  label,
  multiColumn = false 
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                multiColumn && styles.optionButtonMultiColumn,
                isSelected && styles.optionButtonSelected,
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Icon name="check-circle" size={20} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  optionButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    justifyContent: "center",
    marginHorizontal: 4,
    marginBottom: 8,
  },
  optionButtonMultiColumn: {
    width: '46%',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
}
