import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { usePartnerMode } from "../../context/HouseholdPartnerContext";

export default function EventCard({ event, currentUserId, onPress, onRespond }) {
  const { colors } = useAppTheme();
  const { isPartnered } = usePartnerMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      case "invitation":
        return colors.warning;
      case "solo_ok":
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case "accepted":
        return colors.success;
      case "declined":
      case "disputed":
        return colors.error;
      case "acknowledged":
        return colors.primary;
      default:
        return colors.warning;
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
      <View
        style={[
          styles.card,
          !isCreator &&
            event.status === "pending" &&
            event.event_type === "invitation" &&
            styles.pendingInvitation,
        ]}
      >
        <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${getEventTypeColor()}20` }]}>
          <Icon name={getEventTypeIcon()} size={24} color={getEventTypeColor()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar-today" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatEventDate()}</Text>
            {event.event_time && (
              <>
                <Icon name="access-time" size={14} color={colors.textSecondary} style={styles.metaIcon} />
                <Text style={styles.metaText}>{formatEventTime()}</Text>
              </>
            )}
            {event.location && (
              <>
                <Icon name="place" size={14} color={colors.textSecondary} style={styles.metaIcon} />
                <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
              </>
            )}
          </View>
        </View>
        {isPartnered &&
          !isCreator &&
          event.status === "pending" &&
          event.event_type === "invitation" && (
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
          <Icon name="note" size={16} color={colors.textSecondary} />
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
        
        {isPartnered &&
          !isCreator &&
          event.status === "pending" &&
          event.event_type === "invitation" && (
          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[styles.responseButton, styles.acceptButton]}
              onPress={() => onRespond && onRespond('accepted')}
            >
              <Icon name="check" size={18} color={COLORS.textInverse} />
              <Text style={styles.responseButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.responseButton, styles.declineButton]}
              onPress={() => onRespond && onRespond('declined')}
            >
              <Icon name="close" size={18} color={COLORS.textInverse} />
              <Text style={styles.responseButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isCreator && event.status === 'pending' && event.event_type !== 'invitation' && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => onRespond && onRespond('acknowledged')}
          >
            <Icon name="check-circle" size={18} color={colors.primary} />
            <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
      <View style={styles.accentBorder} />
    </TouchableOpacity>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    position: "relative",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...SHADOWS.sm,
  },
  accentBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  pendingInvitation: {
    backgroundColor: colors.warningMuted,
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
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.warning,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.borderLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
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
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error,
  },
  responseButtonText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: "600",
  },
  acknowledgeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    gap: 4,
  },
  acknowledgeButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
});
}

