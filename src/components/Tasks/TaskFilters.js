import React, {  useState , useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get('window');

export default function TaskFilters({ 
  filters, 
  onFilterChange, 
  taskCounts,
  currentUser 
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const getMyTasksCount = () => {
    return taskCounts.byAssignee?.[currentUser?.email] || 0;
  };

  const getCompletedCount = () => {
    return taskCounts.byStatus?.completed || 0;
  };

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
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
    { label: 'All Priorities', value: 'all' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ];

  const PickerModal = ({ visible, onClose, options, selectedValue, onSelect, title }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.textSecondary} />
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="filter-list" size={20} color={colors.textSecondary} />
        <Text style={styles.headerTitle}>Filters</Text>
      </View>

      {/* Quick Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickFilters}
        contentContainerStyle={styles.quickFiltersContent}
      >
        <TouchableOpacity
          style={[
            styles.quickFilterButton,
            filters.assigned_to === 'me' ? styles.activeQuickFilter : styles.inactiveQuickFilter
          ]}
          onPress={() => handleFilterChange('assigned_to', filters.assigned_to === 'me' ? 'all' : 'me')}
        >
          <Icon 
            name="favorite" 
            size={16} 
            color={filters.assigned_to === 'me' ? COLORS.textInverse : colors.primary} 
          />
          <Text style={[
            styles.quickFilterText,
            filters.assigned_to === 'me' ? styles.activeQuickFilterText : styles.inactiveQuickFilterText
          ]}>
            My Tasks
          </Text>
          {getMyTasksCount() > 0 && (
            <View style={[
              styles.badge,
              filters.assigned_to === 'me' ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.badgeText,
                filters.assigned_to === 'me' ? styles.activeBadgeText : styles.inactiveBadgeText
              ]}>
                {getMyTasksCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickFilterButton,
            filters.status === 'completed' ? styles.activeQuickFilterCompleted : styles.inactiveQuickFilterCompleted
          ]}
          onPress={() => handleFilterChange('status', filters.status === 'completed' ? 'all' : 'completed')}
        >
          <Icon 
            name="check-circle" 
            size={16} 
            color={filters.status === 'completed' ? COLORS.textInverse : colors.success} 
          />
          <Text style={[
            styles.quickFilterText,
            filters.status === 'completed' ? styles.activeQuickFilterText : styles.inactiveQuickFilterTextCompleted
          ]}>
            Completed
          </Text>
          {getCompletedCount() > 0 && (
            <View style={[
              styles.badge,
              filters.status === 'completed' ? styles.activeBadge : styles.inactiveBadgeCompleted
            ]}>
              <Text style={[
                styles.badgeText,
                filters.status === 'completed' ? styles.activeBadgeText : styles.inactiveBadgeTextCompleted
              ]}>
                {getCompletedCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Detailed Filters */}
      <View style={styles.detailedFilters}>
        {/* Status Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <TouchableOpacity
            style={styles.filterSelector}
            onPress={() => setShowStatusPicker(true)}
          >
            <Text style={styles.filterSelectorText}>
              {statusOptions.find(opt => opt.value === filters.status)?.label}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <TouchableOpacity
            style={styles.filterSelector}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.filterSelectorText}>
              {categoryOptions.find(opt => opt.value === filters.category)?.label}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Priority Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Priority</Text>
          <TouchableOpacity
            style={styles.filterSelector}
            onPress={() => setShowPriorityPicker(true)}
          >
            <Text style={styles.filterSelectorText}>
              {priorityOptions.find(opt => opt.value === filters.priority)?.label}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Picker Modals */}
      <PickerModal
        visible={showStatusPicker}
        onClose={() => setShowStatusPicker(false)}
        options={statusOptions}
        selectedValue={filters.status}
        onSelect={(value) => handleFilterChange('status', value)}
        title="Select Status"
      />

      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={categoryOptions}
        selectedValue={filters.category}
        onSelect={(value) => handleFilterChange('category', value)}
        title="Select Category"
      />

      <PickerModal
        visible={showPriorityPicker}
        onClose={() => setShowPriorityPicker(false)}
        options={priorityOptions}
        selectedValue={filters.priority}
        onSelect={(value) => handleFilterChange('priority', value)}
        title="Select Priority"
      />
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  quickFilters: {
    marginBottom: 16,
  },
  quickFiltersContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  activeQuickFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inactiveQuickFilter: {
    backgroundColor: colors.surface,
    borderColor: colors.errorMuted,
  },
  activeQuickFilterCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  inactiveQuickFilterCompleted: {
    backgroundColor: colors.surface,
    borderColor: colors.successMuted,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  activeQuickFilterText: {
    color: COLORS.textInverse,
  },
  inactiveQuickFilterText: {
    color: colors.primary,
  },
  inactiveQuickFilterTextCompleted: {
    color: colors.success,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  activeBadge: {
    backgroundColor: colors.overlayOnPrimary,
  },
  inactiveBadge: {
    backgroundColor: colors.errorMuted,
  },
  inactiveBadgeCompleted: {
    backgroundColor: colors.successMuted,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeBadgeText: {
    color: COLORS.textInverse,
  },
  inactiveBadgeText: {
    color: colors.primary,
  },
  inactiveBadgeTextCompleted: {
    color: colors.success,
  },
  detailedFilters: {
    gap: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
  },
  filterSelectorText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  picker: {
    height: 200,
  },
});
}