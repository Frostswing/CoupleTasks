import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { User as UserEntity } from "../../entities/User";
import taskGenerationService from "../../services/taskGenerationService";

const categories = [
  { label: 'Household', value: 'household' },
  { label: 'Errands', value: 'errands' },
  { label: 'Planning', value: 'planning' },
  { label: 'Finance', value: 'finance' },
  { label: 'Health', value: 'health' },
  { label: 'Social', value: 'social' },
  { label: 'Personal', value: 'personal' },
  { label: 'Other', value: 'other' },
];

const priorities = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const frequencyTypes = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Times per Week', value: 'times_per_week' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

export default function TaskTemplateForm({ template, onSubmit, onCancel, title = "Create Template" }) {
  const [formData, setFormData] = useState({
    template_name: "",
    description: "",
    category: "household",
    subcategory: "",
    frequency_type: "weekly",
    frequency_interval: 1,
    frequency_custom: "",
    selected_days: null, // Array of day numbers (0-6) for times_per_week
    assigned_to: "",
    estimated_duration: "",
    priority: "medium",
    auto_generate: false,
    generation_offset: 0,
    notification_offset_hours: 6,
    room_location: "",
    is_active: true,
    ...template
  });
  
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showAssignedToPicker, setShowAssignedToPicker] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const me = await UserEntity.me();
      setCurrentUser(me);

      const userList = [{ email: me.email, full_name: me.full_name }];
      if (me.partner_email) {
        userList.push({ email: me.partner_email, full_name: 'Partner' });
      }
      userList.push({ email: 'together', full_name: 'Together' });
      userList.push({ email: 'separately', full_name: 'Separately' });
      
      setUsers(userList);
      
      if (!template && !formData.assigned_to) {
        setFormData(prev => ({ ...prev, assigned_to: me.email }));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleSubmit = () => {
    if (!formData.template_name.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Parse frequency if custom
    if (formData.frequency_type === 'custom' && formData.frequency_custom) {
      const parsed = taskGenerationService.parseFrequency(formData.frequency_custom);
      formData.frequency_type = parsed.frequency_type;
      formData.frequency_interval = parsed.frequency_interval;
      if (parsed.frequency_custom) {
        formData.frequency_custom = parsed.frequency_custom;
      }
    }

    // Validate selected_days for times_per_week (only if days are selected)
    if (formData.frequency_type === 'times_per_week' && formData.frequency_interval >= 2 && formData.frequency_interval <= 7 && formData.selected_days) {
      if (formData.selected_days.length !== formData.frequency_interval) {
        Alert.alert('Validation Error', `Please select exactly ${formData.frequency_interval} day${formData.frequency_interval !== 1 ? 's' : ''} of the week, or leave days unselected.`);
        return;
      }
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderPickerModal = (title, visible, onClose, children) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="check" size={24} color="#14B8A6" />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Template Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Template Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.template_name}
          onChangeText={(value) => handleInputChange('template_name', value)}
          placeholder="e.g., Vacuum robot maintenance"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Optional description"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {categories.find(c => c.value === formData.category)?.label || 'Select Category'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
        {renderPickerModal(
          'Select Category',
          showCategoryPicker,
          () => setShowCategoryPicker(false),
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => {
              handleInputChange('category', value);
              setShowCategoryPicker(false);
            }}
          >
            {categories.map(cat => (
              <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
            ))}
          </Picker>
        )}
      </View>

      {/* Subcategory / Room Location */}
      <View style={styles.section}>
        <Text style={styles.label}>Room/Location</Text>
        <TextInput
          style={styles.input}
          value={formData.room_location}
          onChangeText={(value) => handleInputChange('room_location', value)}
          placeholder="e.g., Kitchen, Living Room"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Frequency */}
      <View style={styles.section}>
        <Text style={styles.label}>Frequency</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowFrequencyPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {formData.frequency_type === 'custom' && formData.frequency_custom
              ? formData.frequency_custom
              : frequencyTypes.find(f => f.value === formData.frequency_type)?.label || 'Select Frequency'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
        
        {formData.frequency_type !== 'custom' && (
          <View style={styles.frequencyInterval}>
            {formData.frequency_type === 'times_per_week' ? (
              <>
                <Text style={styles.label}>Times per week</Text>
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={formData.frequency_interval.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 1;
                    const clamped = Math.min(Math.max(1, num), 7); // Clamp between 1-7
                    handleInputChange('frequency_interval', clamped);
                    
                    // Reset selected_days if times changed and doesn't match
                    if (formData.selected_days && formData.selected_days.length !== clamped) {
                      handleInputChange('selected_days', null);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="1-7"
                  maxLength={1}
                />
                <Text style={styles.label}>(1-7)</Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>Every</Text>
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={formData.frequency_interval.toString()}
                  onChangeText={(value) => handleInputChange('frequency_interval', parseInt(value) || 1)}
                  keyboardType="numeric"
                  placeholder="1"
                />
                <Text style={styles.label}>
                  {formData.frequency_type === 'daily' ? 'day(s)' :
                   formData.frequency_type === 'weekly' ? 'week(s)' :
                   formData.frequency_type === 'monthly' ? 'month(s)' : ''}
                </Text>
              </>
            )}
          </View>
        )}

        {formData.frequency_type === 'custom' && (
          <TextInput
            style={styles.input}
            value={formData.frequency_custom}
            onChangeText={(value) => handleInputChange('frequency_custom', value)}
            placeholder="e.g., Every 2-3 days, Once a month"
            placeholderTextColor="#9CA3AF"
          />
        )}

        {/* Day selector for all frequency types */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Days of Week (Optional)</Text>
          <Text style={styles.subLabel}>
            {formData.frequency_type === 'times_per_week' && formData.frequency_interval >= 2 && formData.frequency_interval <= 7
              ? `Choose ${formData.frequency_interval} day${formData.frequency_interval !== 1 ? 's' : ''} per week`
              : 'Select specific days for this template'}
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
              // For times_per_week with specific interval, enforce limit; otherwise allow any selection
              const isTimesPerWeek = formData.frequency_type === 'times_per_week' && formData.frequency_interval >= 2 && formData.frequency_interval <= 7;
              const canSelect = !isTimesPerWeek || !formData.selected_days || formData.selected_days.length < formData.frequency_interval || isSelected;
              
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                    !canSelect && styles.dayButtonDisabled
                  ]}
                  onPress={() => {
                    if (!canSelect) return;
                    
                    const currentDays = formData.selected_days || [];
                    let newDays;
                    
                    if (isSelected) {
                      // Deselect day
                      newDays = currentDays.filter(d => d !== day);
                    } else {
                      // Select day
                      if (isTimesPerWeek && currentDays.length >= formData.frequency_interval) {
                        // For times_per_week, replace if at max
                        newDays = [day];
                      } else {
                        // Otherwise, just add
                        newDays = [...currentDays, day];
                      }
                    }
                    
                    handleInputChange('selected_days', newDays.length > 0 ? newDays : null);
                  }}
                  disabled={!canSelect}
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
          {formData.frequency_type === 'times_per_week' && formData.frequency_interval >= 2 && formData.frequency_interval <= 7 && formData.selected_days && formData.selected_days.length !== formData.frequency_interval && (
            <Text style={styles.warningText}>
              Please select exactly {formData.frequency_interval} day{formData.frequency_interval !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {renderPickerModal(
          'Select Frequency',
          showFrequencyPicker,
          () => setShowFrequencyPicker(false),
          <Picker
            selectedValue={formData.frequency_type}
            onValueChange={(value) => {
              handleInputChange('frequency_type', value);
              if (value !== 'custom') {
                handleInputChange('frequency_custom', '');
              }
            }}
          >
            {frequencyTypes.map(freq => (
              <Picker.Item key={freq.value} label={freq.label} value={freq.value} />
            ))}
          </Picker>
        )}
      </View>

      {/* Assigned To */}
      <View style={styles.section}>
        <Text style={styles.label}>Assigned To</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowAssignedToPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {users.find(u => u.email === formData.assigned_to)?.full_name || 'Select Person'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
        {renderPickerModal(
          'Assign To',
          showAssignedToPicker,
          () => setShowAssignedToPicker(false),
          <Picker
            selectedValue={formData.assigned_to}
            onValueChange={(value) => {
              handleInputChange('assigned_to', value);
              setShowAssignedToPicker(false);
            }}
          >
            {users.map(user => (
              <Picker.Item key={user.email} label={user.full_name} value={user.email} />
            ))}
          </Picker>
        )}
      </View>

      {/* Estimated Duration */}
      <View style={styles.section}>
        <Text style={styles.label}>Estimated Duration</Text>
        <TextInput
          style={styles.input}
          value={formData.estimated_duration}
          onChangeText={(value) => handleInputChange('estimated_duration', value)}
          placeholder="e.g., 15 minutes, 1 hour"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Priority */}
      <View style={styles.section}>
        <Text style={styles.label}>Priority</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowPriorityPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {priorities.find(p => p.value === formData.priority)?.label || 'Select Priority'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
        {renderPickerModal(
          'Select Priority',
          showPriorityPicker,
          () => setShowPriorityPicker(false),
          <Picker
            selectedValue={formData.priority}
            onValueChange={(value) => {
              handleInputChange('priority', value);
              setShowPriorityPicker(false);
            }}
          >
            {priorities.map(pri => (
              <Picker.Item key={pri.value} label={pri.label} value={pri.value} />
            ))}
          </Picker>
        )}
      </View>

      {/* Auto Generate */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => handleInputChange('auto_generate', !formData.auto_generate)}
        >
          <View style={styles.switchContent}>
            <Text style={styles.label}>Auto-generate tasks</Text>
            <Text style={styles.switchSubtext}>
              Automatically create tasks based on this template
            </Text>
          </View>
          <View style={[
            styles.switch,
            formData.auto_generate && styles.switchActive
          ]}>
            <View style={[
              styles.switchThumb,
              formData.auto_generate && styles.switchThumbActive
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Generation Offset */}
      {formData.auto_generate && (
        <View style={styles.section}>
          <Text style={styles.label}>Create tasks X days before due date</Text>
          <TextInput
            style={[styles.input, styles.numberInput]}
            value={formData.generation_offset.toString()}
            onChangeText={(value) => handleInputChange('generation_offset', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      )}

      {/* Notification Offset */}
      <View style={styles.section}>
        <Text style={styles.label}>Notification (hours before task)</Text>
        <TextInput
          style={[styles.input, styles.numberInput]}
          value={formData.notification_offset_hours.toString()}
          onChangeText={(value) => handleInputChange('notification_offset_hours', parseInt(value) || 6)}
          keyboardType="numeric"
          placeholder="6"
        />
      </View>

      {/* Active Status */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => handleInputChange('is_active', !formData.is_active)}
        >
          <View style={styles.switchContent}>
            <Text style={styles.label}>Active</Text>
            <Text style={styles.switchSubtext}>
              Inactive templates won't generate tasks
            </Text>
          </View>
          <View style={[
            styles.switch,
            formData.is_active && styles.switchActive
          ]}>
            <View style={[
              styles.switchThumb,
              formData.is_active && styles.switchThumbActive
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
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
          <Text style={styles.submitButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  numberInput: {
    width: 100,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  frequencyInterval: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContent: {
    flex: 1,
  },
  switchSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
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
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#14B8A6',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#14B8A6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

