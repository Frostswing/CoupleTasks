import React, { useState, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { parseISO } from "date-fns";
import { User as UserEntity } from "../../entities/User";
import InlineSelector from "../common/InlineSelector";

const { width } = Dimensions.get('window');

export default function EventForm({ event, onSubmit, onCancel, title = "Create New Event" }) {
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

  const eventTypeOptions = [
    { label: 'Informational - Just letting you know', value: 'informational' },
    { label: 'Invitation - Want to know if you can join', value: 'invitation' },
    { label: 'Solo OK - Going alone is fine', value: 'solo_ok' },
  ];


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="event" size={24} color="#14B8A6" />
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
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
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
                <Icon name="calendar-today" size={20} color="#6B7280" />
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
                <Icon name="access-time" size={20} color="#6B7280" />
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
              placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
              style={styles.submitButtonContainer}
            >
              <LinearGradient
                colors={["#14B8A6", "#06B6D4", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, styles.submitButton]}
              >
                <Text style={styles.submitButtonText}>
                  {event ? 'Update Event' : 'Create Event'}
                </Text>
              </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

