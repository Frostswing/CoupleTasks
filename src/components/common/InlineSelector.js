import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

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
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  optionButton: {
    width: '100%',
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
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
    borderColor: "#14B8A6",
    backgroundColor: "#E6FFFA",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  optionTextSelected: {
    color: "#14B8A6",
    fontWeight: "600",
  },
});
