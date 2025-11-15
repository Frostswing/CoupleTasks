import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

/**
 * Inline selector component that displays all options as selectable buttons
 * Replaces modal-based pickers for better UX
 */
export default function InlineSelector({ 
  options, 
  selectedValue, 
  onSelect, 
  label,
  multiColumn = false 
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.optionsContainer, multiColumn && styles.multiColumn]}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                multiColumn && styles.optionButtonMultiColumn
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
                  <Icon name="check-circle" size={20} color="#14B8A6" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 8,
  },
  multiColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    justifyContent: "center",
  },
  optionButtonSelected: {
    borderColor: "#14B8A6",
    backgroundColor: "#E6FFFA",
  },
  optionButtonMultiColumn: {
    flex: 1,
    minWidth: "48%",
    maxWidth: "48%",
    marginRight: 8,
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  optionTextSelected: {
    color: "#14B8A6",
    fontWeight: "600",
  },
});

