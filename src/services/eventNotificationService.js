import * as Notifications from 'expo-notifications';
import { Event } from '../entities/Event';
import { parseISO, addHours } from 'date-fns';

/**
 * Service for managing event notifications
 * Handles notifications for invitation-type events
 */
class EventNotificationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Check if notifications are supported
   */
  isSupported() {
    return true;
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing event notifications:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for an invitation event
   */
  async scheduleEventNotification(event) {
    try {
      if (!this.isSupported()) {
        return null;
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return null;
        }
      }

      // Only schedule notifications for invitation-type events
      if (event.event_type !== 'invitation') {
        return null;
      }

      // Don't schedule if already sent
      if (event.notification_sent) {
        return null;
      }

      // Schedule immediate notification for invitations
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Event Invitation',
          body: `${event.title} - Your partner wants to know if you can join`,
          data: { 
            eventId: event.id,
            type: 'event_invitation'
          },
          sound: true,
        },
        trigger: null, // Immediate notification
      });

      // Mark as sent
      await Event.update(event.id, { notification_sent: true });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling event notification:', error);
      return null;
    }
  }

  /**
   * Schedule a reminder notification before the event
   */
  async scheduleEventReminder(event, hoursBefore = 24) {
    try {
      if (!this.isSupported()) {
        return null;
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return null;
        }
      }

      if (!event.event_date || !event.event_time) {
        return null;
      }

      // Parse event date and time
      const eventDate = typeof event.event_date === 'string' 
        ? parseISO(event.event_date) 
        : new Date(event.event_date);
      
      const [hours, minutes] = event.event_time.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);

      // Calculate reminder time
      const reminderTime = addHours(eventDate, -hoursBefore);

      // Don't schedule if reminder time is in the past
      if (reminderTime < new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Event Reminder',
          body: `${event.title} is coming up soon`,
          data: { 
            eventId: event.id,
            type: 'event_reminder'
          },
          sound: true,
        },
        trigger: reminderTime,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      return null;
    }
  }

  /**
   * Cancel notification for an event
   */
  async cancelEventNotification(eventId) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content?.data?.eventId === eventId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling event notification:', error);
    }
  }

  /**
   * Schedule notifications for all pending invitation events
   */
  async scheduleAllPendingInvitations() {
    try {
      const events = await Event.filter({ 
        is_archived: { '$ne': true },
        event_type: 'invitation',
        notification_sent: false
      });

      const scheduled = [];
      for (const event of events) {
        // Only schedule if status is pending and notification not sent
        if (event.status === 'pending' && !event.notification_sent) {
          const notificationId = await this.scheduleEventNotification(event);
          if (notificationId) {
            scheduled.push({ eventId: event.id, notificationId });
          }
        }
      }

      return scheduled;
    } catch (error) {
      console.error('Error scheduling pending invitations:', error);
      return [];
    }
  }
}

export default new EventNotificationService();

