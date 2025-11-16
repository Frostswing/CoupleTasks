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
import AutoCompleteInput from "../common/AutoCompleteInput";
import InlineSelector from "../common/InlineSelector";

const { width } = Dimensions.get('window');

export default function TaskForm({ task, onSubmit, onCancel, title = "Create New Task" }) {
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
    selected_days: null, // Array of day numbers (0-6, 0=Sunday)
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
      
      // Don't auto-assign - let user choose (including "none")
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
    // Auto-fill task data from suggestion
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
    // Ensure we store as Date object
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
    
    // Handle string dates from Firebase (ISO format)
    let dateObj;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Select date';
    }
    
    // Check if date is valid
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="favorite" size={24} color="#EC4899" />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details about this task..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Subtasks */}
          <View style={styles.inputGroup}>
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
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeSubtask(index)}
                >
                  <Icon name="delete" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addSubtaskRow}>
              <TextInput
                style={[styles.input, styles.subtaskInput]}
                placeholder="Add a new sub-task..."
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.addSubtaskButton} onPress={addSubtask}>
                <Icon name="add" size={20} color="#14B8A6" />
                <Text style={styles.addSubtaskButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date and Time Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.due_date)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Due Time</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="access-time" size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {formData.due_time || 'Select time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <InlineSelector
            label="Category"
            options={categoryOptions}
            selectedValue={formData.category}
            onSelect={(value) => handleInputChange('category', value)}
            multiColumn={true}
          />

          {/* Priority */}
          <View style={styles.inputGroup}>
            <InlineSelector
              label="Priority"
              options={priorityOptions}
              selectedValue={formData.priority}
              onSelect={(value) => handleInputChange('priority', value)}
              multiColumn={true}
            />
          </View>

          {/* Assigned To */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assigned To</Text>
            <InlineSelector
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
            />
          </View>

          {/* Recurrence */}
          <InlineSelector
            label="Recurrence"
            options={recurrenceOptions}
            selectedValue={formData.recurrence_rule}
            onSelect={(value) => handleInputChange('recurrence_rule', value)}
            multiColumn={true}
          />

          {/* Day Selection */}
          {(formData.recurrence_rule === 'weekly' || formData.recurrence_rule === 'biweekly') && (
          <View style={styles.inputGroup}>
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
                        // Deselect day
                        newDays = currentDays.filter(d => d !== day);
                      } else {
                        // Select day
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
                  {task ? 'Update Task' : 'Create Task'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={(() => {
            if (!formData.due_date) return new Date();
            // Convert string to Date if needed
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
    backgroundColor: '#FEF2F2',
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
  thirdWidth: {
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
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
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
    padding: 8,
    borderRadius: 8,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  addSubtaskButtonText: {
    color: '#14B8A6',
    fontWeight: '600',
    marginLeft: 4,
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
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
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