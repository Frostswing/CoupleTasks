import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

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

export default function TaskTemplateCard({ template, onEdit, onDelete, onToggleActive }) {
  const categoryStyle = categoryColors[template.category] || categoryColors.other;

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
              <Icon name="auto-awesome" size={12} color="#16A34A" />
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
            <Icon name="repeat" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{getFrequencyText()}</Text>
          </View>

          {template.estimated_duration && (
            <View style={styles.meta}>
              <Icon name="schedule" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{template.estimated_duration}</Text>
            </View>
          )}

          {template.assigned_to && (
            <View style={styles.meta}>
              <Icon name="person" size={14} color="#6B7280" />
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
              color={template.is_active ? "#F59E0B" : "#16A34A"}
            />
          </TouchableOpacity>
        )}
        
        {onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(template)}
            style={styles.actionButton}
          >
            <Icon name="edit" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(template)}
            style={styles.actionButton}
          >
            <Icon name="delete" size={24} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    color: '#1F2937',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  autoText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#16A34A',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
  },
});

