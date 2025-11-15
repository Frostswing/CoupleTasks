import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format, parseISO } from "date-fns";

export default function EventCard({ event, currentUserId, onPress, onRespond }) {
  const isCreator = event.created_by === currentUserId;
  const hasResponse = event.partner_response !== null;
  
  const getEventTypeIcon = () => {
    switch (event.event_type) {
      case 'invitation':
        return 'question-mark';
      case 'solo_ok':
        return 'person';
      default:
        return 'info';
    }
  };

  const getEventTypeColor = () => {
    switch (event.event_type) {
      case 'invitation':
        return '#F59E0B'; // Orange
      case 'solo_ok':
        return '#14B8A6'; // Turquoise
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'accepted':
        return '#16A34A'; // Green
      case 'declined':
        return '#DC2626'; // Red
      case 'disputed':
        return '#EF4444'; // Red
      case 'acknowledged':
        return '#2563EB'; // Blue
      default:
        return '#F59E0B'; // Orange (pending)
    }
  };

  const getStatusText = () => {
    if (isCreator) {
      if (hasResponse) {
        switch (event.status) {
          case 'accepted':
            return 'Partner accepted';
          case 'declined':
            return 'Partner declined';
          case 'disputed':
            return 'Partner disputed';
          case 'acknowledged':
            return 'Partner acknowledged';
          default:
            return 'Waiting for response';
        }
      } else {
        return 'Waiting for response';
      }
    } else {
      switch (event.status) {
        case 'pending':
          return event.event_type === 'invitation' ? 'Response needed' : 'Tap to acknowledge';
        case 'accepted':
          return 'You accepted';
        case 'declined':
          return 'You declined';
        case 'disputed':
          return 'You disputed';
        case 'acknowledged':
          return 'Acknowledged';
        default:
          return '';
      }
    }
  };

  const formatEventDate = () => {
    if (!event.event_date) return '';
    try {
      const date = typeof event.event_date === 'string' ? parseISO(event.event_date) : event.event_date;
      return format(date, 'MMM dd, yyyy');
    } catch {
      return event.event_date;
    }
  };

  const formatEventTime = () => {
    if (!event.event_time) return '';
    return event.event_time;
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.cardContainer}
    >
      <View style={[styles.card, !isCreator && event.status === 'pending' && event.event_type === 'invitation' && styles.pendingInvitation]}>
        <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${getEventTypeColor()}20` }]}>
          <Icon name={getEventTypeIcon()} size={24} color={getEventTypeColor()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar-today" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatEventDate()}</Text>
            {event.event_time && (
              <>
                <Icon name="access-time" size={14} color="#6B7280" style={styles.metaIcon} />
                <Text style={styles.metaText}>{formatEventTime()}</Text>
              </>
            )}
            {event.location && (
              <>
                <Icon name="place" size={14} color="#6B7280" style={styles.metaIcon} />
                <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
              </>
            )}
          </View>
        </View>
        {!isCreator && event.status === 'pending' && event.event_type === 'invitation' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )}
      </View>

      {event.description && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      {event.notes && (
        <View style={styles.notesContainer}>
          <Icon name="note" size={16} color="#6B7280" />
          <Text style={styles.notes} numberOfLines={2}>
            {event.notes}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {!isCreator && event.status === 'pending' && event.event_type === 'invitation' && (
          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[styles.responseButton, styles.acceptButton]}
              onPress={() => onRespond && onRespond('accepted')}
            >
              <Icon name="check" size={18} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.responseButton, styles.declineButton]}
              onPress={() => onRespond && onRespond('declined')}
            >
              <Icon name="close" size={18} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isCreator && event.status === 'pending' && event.event_type !== 'invitation' && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => onRespond && onRespond('acknowledged')}
          >
            <Icon name="check-circle" size={18} color="#2563EB" />
            <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
      {/* Iridescent border gradient */}
      <LinearGradient
        colors={["#14B8A6", "#06B6D4", "#3B82F6", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBorder}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  pendingInvitation: {
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 12,
  },
  metaIcon: {
    marginLeft: 12,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notes: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#16A34A',
  },
  declineButton: {
    backgroundColor: '#DC2626',
  },
  responseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 4,
  },
  acknowledgeButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
});

