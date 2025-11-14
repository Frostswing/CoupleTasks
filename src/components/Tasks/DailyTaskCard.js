import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format, parseISO } from "date-fns";

const categoryColors = {
  household: { bg: '#DBEAFE', text: '#2563EB' },
  errands: { bg: '#DCFCE7', text: '#16A34A' },
  planning: { bg: '#F3E8FF', text: '#9333EA' },
  finance: { bg: '#FEF3C7', text: '#D97706' },
  health: { bg: '#FEE2E2', text: '#DC2626' },
  social: { bg: '#FCE7F3', text: '#EC4899' },
  personal: { bg: '#E0E7FF', text: '#6366F1' },
  other: { bg: '#F3F4F6', text: '#6B7280' }
};

export default function DailyTaskCard({ task, onComplete, onDefer, currentUser }) {
  const isAssignedToMe = task.assigned_to === currentUser?.email;
  const categoryStyle = categoryColors[task.category] || categoryColors.other;
  
  const getDueDateText = () => {
    if (!task.due_date) return null;
    const dueDate = parseISO(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (due.getTime() === today.getTime()) {
      return 'Today';
    }
    return format(dueDate, 'MMM d');
  };

  const dueDateText = getDueDateText();

  return (
    <View style={[
      styles.container,
      isAssignedToMe && styles.assignedToMe
    ]}>
      <TouchableOpacity
        onPress={() => onComplete(task)}
        style={styles.checkbox}
      >
        <Icon
          name="radio-button-unchecked"
          size={24}
          color="#9CA3AF"
        />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          {dueDateText && (
            <Text style={styles.dueDate}>{dueDateText}</Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
            <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
              {task.category}
            </Text>
          </View>
          
          {task.estimated_duration && (
            <View style={styles.duration}>
              <Icon name="schedule" size={14} color="#6B7280" />
              <Text style={styles.durationText}>{task.estimated_duration}</Text>
            </View>
          )}
          
          {isAssignedToMe && (
            <View style={styles.assignedBadge}>
              <Icon name="favorite" size={12} color="#9333EA" />
            </View>
          )}
        </View>
      </View>
      
      {onDefer && (
        <TouchableOpacity
          onPress={() => onDefer(task)}
          style={styles.deferButton}
        >
          <Icon name="schedule" size={20} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assignedToMe: {
    borderLeftWidth: 3,
    borderLeftColor: '#9333EA',
  },
  checkbox: {
    marginRight: 12,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  assignedBadge: {
    marginLeft: 'auto',
  },
  deferButton: {
    padding: 8,
    marginLeft: 8,
  },
});

