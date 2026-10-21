import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CATEGORY_COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function TaskTemplateCard({ template, onEdit, onDelete, onToggleActive }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const categoryStyle = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.other;

  const getFrequencyText = () => {
    if (template.frequency_type === 'custom' && template.frequency_custom) {
      return template.frequency_custom;
    }
    
    const interval = template.frequency_interval || 1;
    const type = template.frequency_type || 'weekly';
    
    switch (type) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly':
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      default:
        return type;
    }
  };

  return (
    <View style={[
      styles.container,
      !template.is_active && styles.inactiveContainer
    ]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {template.template_name}
            </Text>
            {!template.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
          
          {template.auto_generate && (
            <View style={styles.autoBadge}>
              <Icon name="auto-awesome" size={12} color={colors.success} />
              <Text style={styles.autoText}>Auto</Text>
            </View>
          )}
        </View>

        {template.description && (
          <Text style={styles.description} numberOfLines={2}>
            {template.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
            <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
              {template.category}
            </Text>
          </View>

          <View style={styles.meta}>
            <Icon name="repeat" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{getFrequencyText()}</Text>
          </View>

          {template.estimated_duration && (
            <View style={styles.meta}>
              <Icon name="schedule" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{template.estimated_duration}</Text>
            </View>
          )}

          {template.assigned_to && (
            <View style={styles.meta}>
              <Icon name="person" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{template.assigned_to}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {onToggleActive && (
          <TouchableOpacity
            onPress={() => onToggleActive(template)}
            style={styles.actionButton}
          >
            <Icon
              name={template.is_active ? "pause-circle-filled" : "play-circle-filled"}
              size={24}
              color={template.is_active ? colors.warning : colors.success}
            />
          </TouchableOpacity>
        )}
        
        {onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(template)}
            style={styles.actionButton}
          >
            <Icon name="edit" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(template)}
            style={styles.actionButton}
          >
            <Icon name="delete" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  inactiveContainer: {
    opacity: 0.6,
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
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inactiveBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  autoText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.success,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
  },
});
}

