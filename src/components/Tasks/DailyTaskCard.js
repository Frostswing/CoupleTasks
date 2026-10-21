import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { CATEGORY_COLORS, COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function DailyTaskCard({
  task,
  onComplete,
  onDefer,
  onPostponeBiweekly,
  onPress,
  currentUser,
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isAssignedToMe = task.assigned_to === currentUser?.email;
  const categoryStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;

  const getDueDateText = () => {
    if (!task.due_date) return null;
    const dueDate = parseISO(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() === today.getTime()) {
      return "Today";
    }
    return format(dueDate, "MMM d");
  };

  const dueDateText = getDueDateText();

  return (
    <View style={[styles.container, isAssignedToMe && styles.assignedToMe]}>
      <TouchableOpacity onPress={() => onComplete(task)} style={styles.checkbox}>
        <Icon name="radio-button-unchecked" size={24} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.content}
        onPress={() => onPress && onPress(task)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
          {dueDateText && <Text style={styles.dueDate}>{dueDateText}</Text>}
        </View>

        <View style={styles.footer}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
            <Text style={[styles.categoryText, { color: categoryStyle.text }]}>{task.category}</Text>
          </View>

          {task.estimated_duration && (
            <View style={styles.duration}>
              <Icon name="schedule" size={14} color={colors.textSecondary} />
              <Text style={styles.durationText}>{task.estimated_duration} min</Text>
            </View>
          )}

          {isAssignedToMe && (
            <View style={styles.assignedBadge}>
              <Icon name="favorite" size={12} color={colors.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        {onPostponeBiweekly && task.recurrence === "biweekly" && (
          <TouchableOpacity onPress={() => onPostponeBiweekly(task)} style={styles.postponeButton}>
            <Icon name="next-week" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {onDefer && (
          <TouchableOpacity onPress={() => onDefer(task)} style={styles.deferButton}>
            <Icon name="schedule" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...SHADOWS.xs,
    },
    assignedToMe: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    checkbox: {
      marginRight: 12,
      padding: 4,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginRight: 8,
    },
    dueDate: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: "500",
    },
    duration: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    assignedBadge: {
      marginLeft: "auto",
    },
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },
    postponeButton: {
      padding: 8,
      marginRight: 4,
    },
    deferButton: {
      padding: 8,
    },
  });
}
