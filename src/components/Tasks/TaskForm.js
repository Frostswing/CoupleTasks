import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { User as UserEntity } from "../../entities/User";
import AutoCompleteInput from "../common/AutoCompleteInput";

const { width } = Dimensions.get('window');

export default function TaskForm({ task, onSubmit, onCancel, title = "Create New Task" }) {
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
    ...task
  });
  
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showAssignedToPicker, setShowAssignedToPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

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
      
      // If no assignment and this is a new task, assign to current user
      if (!task && !formData.assigned_to) {
        setFormData(prev => ({ ...prev, assigned_to: me.email }));
      }
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
    handleInputChange('due_date', currentDate);
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
    return date.toLocaleDateString('en-US', {
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
    { label: 'Monthly', value: 'monthly' },
  ];

  const PickerModal = ({ visible, onClose, options, selectedValue, onSelect, title }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={selectedValue}
            onValueChange={(value) => {
              onSelect(value);
              onClose();
            }}
            style={styles.picker}
          >
            {options.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  );

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
                <Icon name="add" size={20} color="#8B5CF6" />
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

          {/* Category, Priority, Assigned To Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.selectButtonText}>
                  {categoryOptions.find(opt => opt.value === formData.category)?.label}
                </Text>
                <Icon name="keyboard-arrow-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Priority</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowPriorityPicker(true)}
              >
                <Text style={styles.selectButtonText}>
                  {priorityOptions.find(opt => opt.value === formData.priority)?.label}
                </Text>
                <Icon name="keyboard-arrow-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Assigned To</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowAssignedToPicker(true)}
              >
                <Text style={styles.selectButtonText}>
                  {users.find(user => user.email === formData.assigned_to)?.full_name || 
                   users.find(user => user.email === formData.assigned_to)?.email || 
                   'Select partner'}
                </Text>
                <Icon name="keyboard-arrow-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recurrence */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recurrence</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowRecurrencePicker(true)}
            >
              <Text style={styles.selectButtonText}>
                {recurrenceOptions.find(opt => opt.value === formData.recurrence_rule)?.label}
              </Text>
              <Icon name="keyboard-arrow-down" size={20} color="#6B7280" />
            </TouchableOpacity>
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
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {task ? 'Update Task' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.due_date || new Date()}
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

      {/* Category Picker */}
      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={categoryOptions}
        selectedValue={formData.category}
        onSelect={(value) => handleInputChange('category', value)}
        title="Select Category"
      />

      {/* Priority Picker */}
      <PickerModal
        visible={showPriorityPicker}
        onClose={() => setShowPriorityPicker(false)}
        options={priorityOptions}
        selectedValue={formData.priority}
        onSelect={(value) => handleInputChange('priority', value)}
        title="Select Priority"
      />

      {/* Assigned To Picker */}
      <PickerModal
        visible={showAssignedToPicker}
        onClose={() => setShowAssignedToPicker(false)}
        options={users.map(user => ({ 
          label: user.full_name || user.email, 
          value: user.email 
        }))}
        selectedValue={formData.assigned_to}
        onSelect={(value) => handleInputChange('assigned_to', value)}
        title="Assign To"
      />

      {/* Recurrence Picker */}
      <PickerModal
        visible={showRecurrencePicker}
        onClose={() => setShowRecurrencePicker(false)}
        options={recurrenceOptions}
        selectedValue={formData.recurrence_rule}
        onSelect={(value) => handleInputChange('recurrence_rule', value)}
        title="Select Recurrence"
      />
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
    color: '#8B5CF6',
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#374151',
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
  submitButton: {
    backgroundColor: '#8B5CF6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  picker: {
    height: 200,
  },
}); 