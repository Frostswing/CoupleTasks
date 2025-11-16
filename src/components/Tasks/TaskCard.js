import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format } from "date-fns";

const { width } = Dimensions.get('window');

const categoryColors = {
  household: { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
  errands: { bg: '#DCFCE7', text: '#16A34A', border: '#86EFAC' },
  planning: { bg: '#E6FFFA', text: '#0D9488', border: '#7DD3FC' },
  finance: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  health: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  social: { bg: '#FCE7F3', text: '#EC4899', border: '#F9A8D4' },
  personal: { bg: '#E0E7FF', text: '#6366F1', border: '#A5B4FC' },
  other: { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' }
};

const priorityColors = {
  low: { bg: '#F3F4F6', text: '#6B7280' },
  medium: { bg: '#FED7AA', text: '#EA580C' },
  high: { bg: '#FEE2E2', text: '#DC2626' }
};

export default function TaskCard({ task, onStatusChange, onEdit, onSubtaskToggle, currentUser }) {
  const isAssignedToMe = task.assigned_to === currentUser?.email;
  const isCompleted = task.status === 'completed';
  
  const allSubtasksCompleted = task.subtasks?.every(st => st.is_completed) ?? true;
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return { name: 'check-circle', color: '#16A34A' };
      case 'in_progress':
        return { name: 'schedule', color: '#3B82F6' };
      default:
        return { name: 'radio-button-unchecked', color: '#9CA3AF' };
    }
  };

  const getAssignedUserInitials = (email) => {
    if (!email) return '?';
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const handleMainTaskToggle = () => {
    if (!allSubtasksCompleted) {
      return;
    }
    onStatusChange(task, 'completed');
  };

  const statusIcon = getStatusIcon();
  const categoryStyle = categoryColors[task.category] || categoryColors.other;
  const priorityStyle = priorityColors[task.priority] || priorityColors.medium;

  return (
    <View style={[
      styles.container,
      isAssignedToMe && styles.assignedToMe
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleMainTaskToggle}
            disabled={!allSubtasksCompleted}
            style={[
              styles.statusButton,
              !allSubtasksCompleted && styles.disabledButton
            ]}
          >
            <Icon
              name={statusIcon.name}
              size={20}
              color={!allSubtasksCompleted ? '#D1D5DB' : statusIcon.color}
            />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{task.title}</Text>
            
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: categoryStyle.bg }]}>
                <Text style={[styles.badgeText, { color: categoryStyle.text }]}>
                  {task.category}
                </Text>
              </View>
              
              <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
                <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
                  {task.priority}
                </Text>
              </View>
              
              {isAssignedToMe && (
                <View style={[styles.badge, { backgroundColor: '#E6FFFA' }]}>
                  <Icon name="favorite" size={12} color="#0D9488" />
                  <Text style={[styles.badgeText, { color: '#0D9488', marginLeft: 4 }]}>
                    For you
                  </Text>
                </View>
              )}
              
              {task.recurrence_rule !== 'none' && (
                <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="repeat" size={12} color="#2563EB" />
                  <Text style={[styles.badgeText, { color: '#2563EB', marginLeft: 4 }]}>
                    {task.recurrence_rule === 'biweekly' ? 'Biweekly' : task.recurrence_rule.charAt(0).toUpperCase() + task.recurrence_rule.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getAssignedUserInitials(task.assigned_to)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => onEdit(task)}
            style={styles.editButton}
          >
            <Icon name="edit" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      {task.description && (
        <Text style={styles.description}>{task.description}</Text>
      )}

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <View style={styles.subtasksContainer}>
          {task.subtasks.map((subtask, index) => (
            <View key={index} style={styles.subtaskRow}>
              <TouchableOpacity
                onPress={() => onSubtaskToggle(task.id, index, !subtask.is_completed)}
                style={styles.subtaskCheckbox}
              >
                <Icon
                  name={subtask.is_completed ? 'check-box' : 'check-box-outline-blank'}
                  size={16}
                  color={subtask.is_completed ? '#16A34A' : '#9CA3AF'}
                />
              </TouchableOpacity>
              <Text style={[
                styles.subtaskText,
                subtask.is_completed && styles.completedSubtaskText
              ]}>
                {subtask.title}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Due Date and Time */}
      {(task.due_date || task.due_time) && (
        <View style={styles.dueDateContainer}>
          {task.due_date && (
            <View style={styles.dueDateItem}>
              <Icon name="event" size={16} color="#6B7280" />
              <Text style={styles.dueDateText}>
                Due {format(new Date(task.due_date), 'MMM d, yyyy')}
              </Text>
            </View>
          )}
          {task.due_time && (
            <View style={styles.dueDateItem}>
              <Icon name="schedule" size={16} color="#6B7280" />
              <Text style={styles.dueDateText}>{task.due_time}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedToMe: {
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    padding: 4,
    marginRight: 12,
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  subtasksContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtaskCheckbox: {
    marginRight: 12,
    padding: 4,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  completedSubtaskText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  dueDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 13,
    color: '#6B7280',
  },
}); 