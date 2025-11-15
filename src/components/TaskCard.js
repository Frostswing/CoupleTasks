import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const TaskCard = ({ task, onStatusChange, onEdit, onSubtaskToggle, currentUser }) => {
  const getCategoryColor = (category) => {
    const colors = {
      household: '#14B8A6',
      errands: '#06B6D4',
      planning: '#F59E0B',
      finance: '#10B981',
      health: '#EF4444',
      social: '#EC4899',
      personal: '#6366F1',
      other: '#6B7280',
    };
    return colors[category] || colors.other;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#6B7280',
      in_progress: '#F59E0B',
      completed: '#10B981',
    };
    return colors[status] || colors.pending;
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      household: 'בית',
      errands: 'סידורים',
      planning: 'תכנון',
      finance: 'כספים',
      health: 'בריאות',
      social: 'חברתי',
      personal: 'אישי',
      other: 'אחר',
    };
    return names[category] || category;
  };

  const getPriorityDisplayName = (priority) => {
    const names = {
      low: 'נמוכה',
      medium: 'בינונית',
      high: 'גבוהה',
    };
    return names[priority] || priority;
  };

  const getStatusDisplayName = (status) => {
    const names = {
      pending: 'ממתין',
      in_progress: 'בביצוע',
      completed: 'הושלם',
    };
    return names[status] || status;
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const isAssignedToMe = task.assigned_to === currentUser?.email;

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.category) }]}>
            <Text style={styles.categoryText}>{getCategoryDisplayName(task.category)}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{getPriorityDisplayName(task.priority)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(task)}>
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{task.title}</Text>
      
      {task.description && (
        <Text style={styles.description}>{task.description}</Text>
      )}

      {task.due_date && (
        <View style={styles.dueDateContainer}>
          <Text style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
            📅 {new Date(task.due_date).toLocaleDateString('he-IL')}
            {task.due_time && ` ⏰ ${task.due_time}`}
          </Text>
        </View>
      )}

      {task.assigned_to && (
        <View style={styles.assignedContainer}>
          <Text style={[styles.assignedTo, isAssignedToMe && styles.assignedToMe]}>
            👤 {isAssignedToMe ? 'שלי' : task.assigned_to}
          </Text>
        </View>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <View style={styles.subtasksContainer}>
          <Text style={styles.subtasksTitle}>משימות משנה:</Text>
          {task.subtasks.map((subtask, index) => (
            <TouchableOpacity
              key={index}
              style={styles.subtaskItem}
              onPress={() => onSubtaskToggle(task.id, index, !subtask.is_completed)}
            >
              <View style={[styles.subtaskCheckbox, subtask.is_completed && styles.subtaskChecked]} />
              <Text style={[styles.subtaskText, subtask.is_completed && styles.subtaskCompletedText]}>
                {subtask.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getStatusDisplayName(task.status)}</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {task.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => onStatusChange(task, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>התחל</Text>
            </TouchableOpacity>
          )}
          
          {task.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => onStatusChange(task, 'completed')}
            >
              <Text style={styles.actionButtonText}>סיום</Text>
            </TouchableOpacity>
          )}
          
          {task.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => onStatusChange(task, 'completed')}
            >
              <Text style={styles.actionButtonText}>סיום</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'right',
  },
  dueDateContainer: {
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  overdueDueDate: {
    color: '#EF4444',
    fontWeight: '600',
  },
  assignedContainer: {
    marginBottom: 8,
  },
  assignedTo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  assignedToMe: {
    color: '#14B8A6',
    fontWeight: '600',
  },
  subtasksContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  subtasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  subtaskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginLeft: 8,
  },
  subtaskChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textAlign: 'right',
  },
  subtaskCompletedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  startButton: {
    backgroundColor: '#F59E0B',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TaskCard; 