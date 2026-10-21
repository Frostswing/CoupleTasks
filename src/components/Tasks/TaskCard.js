import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format } from "date-fns";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, CATEGORY_COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../../constants/theme";

export default function TaskCard({ task, onStatusChange, onEdit, onSubtaskToggle, currentUser }) {
  const isAssignedToMe = task.assigned_to === currentUser?.email;
  const allSubtasksCompleted = task.subtasks?.every((st) => st.is_completed) ?? true;

  const categoryStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.pending;

  const getAssignedUserInitials = (email) => {
    if (!email) return "?";
    return email.split("@")[0].charAt(0).toUpperCase();
  };

  const handleMainTaskToggle = () => {
    if (!allSubtasksCompleted) return;
    onStatusChange(task, "completed");
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <View style={[styles.container, isAssignedToMe && styles.assignedToMe]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleMainTaskToggle}
          disabled={!allSubtasksCompleted}
          style={styles.statusButton}
          activeOpacity={0.7}
        >
          <Icon
            name={statusStyle.icon}
            size={22}
            color={!allSubtasksCompleted ? COLORS.textTertiary : statusStyle.text}
          />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
        </View>

        <TouchableOpacity onPress={() => onEdit(task)} style={styles.editButton}>
          <Icon name="edit" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Badges Row */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: categoryStyle.bg }]}>
          <Text style={[styles.badgeText, { color: categoryStyle.text }]}>
            {task.category}
          </Text>
        </View>

        {task.priority !== "medium" && (
          <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
              {task.priority}
            </Text>
          </View>
        )}

        {task.recurrence_rule && task.recurrence_rule !== "none" && (
          <View style={[styles.badge, { backgroundColor: COLORS.primaryMuted }]}>
            <Icon name="repeat" size={12} color={COLORS.primary} style={{ marginRight: 2 }} />
            <Text style={[styles.badgeText, { color: COLORS.primary }]}>
              {task.recurrence_rule === "biweekly" ? "2 weeks" : task.recurrence_rule}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <View style={styles.subtasksContainer}>
          {task.subtasks.map((subtask, index) => (
            <TouchableOpacity
              key={index}
              style={styles.subtaskRow}
              onPress={() => onSubtaskToggle(task.id, index, !subtask.is_completed)}
              activeOpacity={0.7}
            >
              <Icon
                name={subtask.is_completed ? "check-box" : "check-box-outline-blank"}
                size={18}
                color={subtask.is_completed ? COLORS.success : COLORS.textTertiary}
              />
              <Text
                style={[
                  styles.subtaskText,
                  subtask.is_completed && styles.subtaskCompleted,
                ]}
              >
                {subtask.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Footer Row */}
      <View style={styles.footer}>
        {task.due_date && (
          <View style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}>
            <Icon
              name="event"
              size={14}
              color={isOverdue ? COLORS.error : COLORS.textTertiary}
            />
            <Text style={[styles.dueDateText, isOverdue && styles.dueDateTextOverdue]}>
              {format(new Date(task.due_date), "MMM d")}
            </Text>
          </View>
        )}

        {task.due_time && (
          <View style={styles.dueTime}>
            <Icon name="schedule" size={14} color={COLORS.textTertiary} />
            <Text style={styles.dueTimeText}>{task.due_time}</Text>
          </View>
        )}

        <View style={styles.spacer} />

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getAssignedUserInitials(task.assigned_to)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    ...SHADOWS.xs,
  },
  assignedToMe: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.s,
  },
  statusButton: {
    padding: SPACING.xs,
    marginRight: SPACING.s,
    marginTop: 1,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.s,
  },
  title: {
    ...TYPOGRAPHY.h3,
    lineHeight: 22,
  },
  editButton: {
    padding: SPACING.xs,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.s,
    marginLeft: 30,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    marginLeft: 30,
    marginBottom: SPACING.s,
  },
  subtasksContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.s,
    padding: SPACING.m,
    marginLeft: 30,
    marginBottom: SPACING.s,
    gap: SPACING.s,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtaskText: {
    ...TYPOGRAPHY.bodySmall,
    marginLeft: SPACING.s,
    flex: 1,
  },
  subtaskCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textTertiary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 30,
    gap: SPACING.m,
  },
  dueDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  dueDateOverdue: {},
  dueDateText: {
    ...TYPOGRAPHY.caption,
  },
  dueDateTextOverdue: {
    color: COLORS.error,
    fontWeight: "500",
  },
  dueTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  dueTimeText: {
    ...TYPOGRAPHY.caption,
  },
  spacer: {
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
