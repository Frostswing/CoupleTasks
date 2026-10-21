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
  KeyboardAvoidingView,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { parseISO } from "date-fns";
import { User as UserEntity } from "../../entities/User";
import AutoCompleteInput from "../common/AutoCompleteInput";
import InlineSelector from "../common/InlineSelector";

const { width } = Dimensions.get('window');

export default function TaskForm({ task, onSubmit, onCancel, title = "Create New Task" }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Convert task dates from strings to Date objects if needed
  const normalizeTaskData = (taskData) => {
    if (!taskData) return {};
    
    const normalized = { ...taskData };
    
    // Convert due_date from string to Date if needed
    if (normalized.due_date) {
      if (typeof normalized.due_date === 'string') {
        normalized.due_date = parseISO(normalized.due_date);
      }
    }
    
    return normalized;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "household",
    priority: "medium",
    assigned_to: "",
    due_date: null,
    due_time: "",
    recurrence_rule: "none",
    subtasks: [],
    selected_days: null,
    ...normalizeTaskData(task)
  });
  
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const me = await UserEntity.me();
      setCurrentUser(me);

      const userList = [me];

      if (me.partner_email) {
        const partnerResults = await UserEntity.filter({ email: me.partner_email });
        if (partnerResults.length > 0) {
          userList.push(partnerResults[0]);
        }
      }
      
      setUsers(userList);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title,
      category: suggestion.category || prev.category,
      priority: suggestion.priority || prev.priority
    }));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      handleInputChange('subtasks', [
        ...(formData.subtasks || []),
        { title: newSubtask.trim(), is_completed: false }
      ]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index) => {
    handleInputChange('subtasks', (formData.subtasks || []).filter((_, i) => i !== index));
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.due_date;
    setShowDatePicker(Platform.OS === 'ios');
    handleInputChange('due_date', currentDate ? new Date(currentDate) : null);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      handleInputChange('due_time', `${hours}:${minutes}`);
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
    { label: 'Household', value: 'household' },
    { label: 'Errands', value: 'errands' },
    { label: 'Planning', value: 'planning' },
    { label: 'Finance', value: 'finance' },
    { label: 'Health', value: 'health' },
    { label: 'Social', value: 'social' },
    { label: 'Personal', value: 'personal' },
    { label: 'Other', value: 'other' },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ];

  const recurrenceOptions = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Biweekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="favorite" size={24} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Task Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Task Title</Text>
          <AutoCompleteInput
            style={styles.input}
            placeholder="What needs to be done?"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            onSelectSuggestion={handleTaskSuggestion}
            type="tasks"
            maxSuggestions={6}
            showSmartSuggestions={true}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about this task..."
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Subtasks */}
        <View style={styles.section}>
          <Text style={styles.label}>Sub-tasks</Text>
          {formData.subtasks?.map((subtask, index) => (
            <View key={index} style={styles.subtaskRow}>
              <TextInput
                style={[styles.input, styles.subtaskInput]}
                value={subtask.title}
                onChangeText={(text) => {
                  const newSubtasks = [...formData.subtasks];
                  newSubtasks[index].title = text;
                  handleInputChange('subtasks', newSubtasks);
                }}
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeSubtask(index)}
              >
                <Icon name="delete" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addSubtaskRow}>
            <TextInput
              style={[styles.input, styles.subtaskInput]}
              placeholder="Add a new sub-task..."
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity style={styles.addButton} onPress={addSubtask}>
              <Icon name="add" size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color={colors.textSecondary} />
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.due_date)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Due Time</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="access-time" size={20} color={colors.textSecondary} />
                <Text style={styles.dateButtonText}>
                  {formData.due_time || 'Select time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <InlineSelector
            label="Category"
            options={categoryOptions}
            selectedValue={formData.category}
            onSelect={(value) => handleInputChange('category', value)}
            multiColumn={true}
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <InlineSelector
            label="Priority"
            options={priorityOptions}
            selectedValue={formData.priority}
            onSelect={(value) => handleInputChange('priority', value)}
            multiColumn={true}
          />
        </View>

        {/* Assigned To */}
        <View style={styles.section}>
          <InlineSelector
            label="Assigned To"
            options={[
              { label: 'None (Unassigned)', value: '' },
              { label: 'Together (Both Partners)', value: 'together' },
              ...users.map(user => ({ 
                label: user.full_name || user.email, 
                value: user.email 
              }))
            ]}
            selectedValue={formData.assigned_to || ''}
            onSelect={(value) => handleInputChange('assigned_to', value || '')}
            multiColumn={false}
          />
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <InlineSelector
            label="Recurrence"
            options={recurrenceOptions}
            selectedValue={formData.recurrence_rule}
            onSelect={(value) => handleInputChange('recurrence_rule', value)}
            multiColumn={true}
          />
        </View>

        {/* Day Selection */}
        {(formData.recurrence_rule === 'weekly' || formData.recurrence_rule === 'biweekly') && (
          <View style={styles.section}>
            <Text style={styles.label}>Days of Week (Optional)</Text>
            <Text style={styles.subLabel}>
              {formData.recurrence_rule === 'biweekly' 
                ? 'Select specific days for this task (every 2 weeks)'
                : 'Select specific days for this task'}
            </Text>
            <View style={styles.daysContainer}>
              {[
                { day: 0, label: 'Sun' },
                { day: 1, label: 'Mon' },
                { day: 2, label: 'Tue' },
                { day: 3, label: 'Wed' },
                { day: 4, label: 'Thu' },
                { day: 5, label: 'Fri' },
                { day: 6, label: 'Sat' },
              ].map(({ day, label }) => {
                const isSelected = formData.selected_days && formData.selected_days.includes(day);
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                    ]}
                    onPress={() => {
                      const currentDays = formData.selected_days || [];
                      let newDays;
                      
                      if (isSelected) {
                        newDays = currentDays.filter(d => d !== day);
                      } else {
                        newDays = [...currentDays, day];
                      }
                      
                      handleInputChange('selected_days', newDays.length > 0 ? newDays : null);
                    }}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.button, styles.submitButton, styles.submitButtonWrapper]}
          >
            <Text style={styles.submitButtonText}>
              {task ? "Update Task" : "Create Task"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={(() => {
            if (!formData.due_date) return new Date();
            if (typeof formData.due_date === 'string') {
              return parseISO(formData.due_date);
            }
            return formData.due_date instanceof Date ? formData.due_date : new Date(formData.due_date);
          })()}
          mode="date"
          display="default"
          onChange={onDateChange}
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

    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.borderLight,
    color: colors.text,
    minHeight: 48,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.errorMuted,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 8,
    minHeight: 48,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  halfColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.borderLight,
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: COLORS.textInverse,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginHorizontal: -8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  submitButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  submitButton: {
    margin: 0,
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
});
}