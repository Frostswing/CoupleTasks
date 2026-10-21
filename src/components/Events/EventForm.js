import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { usePartnerMode } from "../../context/HouseholdPartnerContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { parseISO } from "date-fns";
import { User as UserEntity } from "../../entities/User";
import InlineSelector from "../common/InlineSelector";

const { width } = Dimensions.get('window');

export default function EventForm({ event, onSubmit, onCancel, title = "Create New Event" }) {
  const { colors } = useAppTheme();
  const { isPartnered } = usePartnerMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const normalizeEventData = (eventData) => {
    if (!eventData) return {};
    
    const normalized = { ...eventData };
    
    if (normalized.event_date) {
      if (typeof normalized.event_date === 'string') {
        normalized.event_date = parseISO(normalized.event_date);
      }
    }
    
    return normalized;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    notes: "",
    event_date: null,
    event_time: "",
    duration: "",
    event_type: "informational",
    category: "social",
    location: "",
    ...normalizeEventData(event)
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('Please enter an event title');
      return;
    }
    if (!formData.event_date) {
      alert('Please select an event date');
      return;
    }
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.event_date;
    setShowDatePicker(Platform.OS === 'ios');
    handleInputChange('event_date', currentDate ? new Date(currentDate) : null);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      handleInputChange('event_time', `${hours}:${minutes}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    
    let dateObj;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Select date';
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Select date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const categoryOptions = [
    { label: 'Social', value: 'social' },
    { label: 'Work', value: 'work' },
    { label: 'Personal', value: 'personal' },
    { label: 'Family', value: 'family' },
    { label: 'Health', value: 'health' },
    { label: 'Travel', value: 'travel' },
    { label: 'Other', value: 'other' },
  ];

  const eventTypeOptions = useMemo(() => {
    const opts = [
      { label: "Informational - Just letting you know", value: "informational" },
      { label: "Solo OK - Going alone is fine", value: "solo_ok" },
    ];
    if (isPartnered) {
      opts.splice(1, 0, {
        label: "Invitation - Want to know if you can join",
        value: "invitation",
      });
    }
    return opts;
  }, [isPartnered]);


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="event" size={24} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What's happening?"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details about this event..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (for context)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional context or notes..."
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Date and Time Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Event Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color={colors.textSecondary} />
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.event_date)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Event Time</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="access-time" size={20} color={colors.textSecondary} />
                <Text style={styles.dateButtonText}>
                  {formData.event_time || 'Select time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (minutes, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60"
              value={formData.duration ? formData.duration.toString() : ''}
              onChangeText={(text) => handleInputChange('duration', text ? parseInt(text) || null : null)}
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Event Type */}
          <InlineSelector
            label="Event Type"
            options={eventTypeOptions}
            selectedValue={formData.event_type}
            onSelect={(value) => handleInputChange('event_type', value)}
          />

          {/* Category and Location Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <InlineSelector
                label="Category"
                options={categoryOptions}
                selectedValue={formData.category}
                onSelect={(value) => handleInputChange('category', value)}
                multiColumn={true}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Where?"
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.button, styles.submitButton, styles.submitButtonContainer]}
            >
              <Text style={styles.submitButtonText}>
                {event ? "Update Event" : "Create Event"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.event_date || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      margin: 8,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    halfWidth: {
      flex: 1,
      marginRight: 8,
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.surface,
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: colors.borderLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    submitButtonContainer: {
      flex: 1,
      borderRadius: 12,
      overflow: "hidden",
    },
    submitButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: COLORS.textInverse,
    },
  });
}

