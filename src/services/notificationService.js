import * as Notifications from 'expo-notifications';
import { Task } from '../entities/Task';
import taskSchedulingService from './taskSchedulingService';
import { differenceInHours, addHours } from 'date-fns';

/**
 * Service for managing task notifications
 * 
 * IMPORTANT: As of Expo SDK 53, push notifications are NOT supported in Expo Go on Android/iOS.
 * This service uses LOCAL scheduled notifications, which should work in Expo Go.
 * However, for full notification support and reliability, create a development build:
 * 
 * 1. Install EAS CLI: npm install -g eas-cli
 * 2. Run: eas build --profile development --platform android
 * 3. Install the development build on your device
 * 
 * See documentation/NOTIFICATIONS.md for more details.
 */
class NotificationService {
  constructor() {
    this.notificationHandlers = [];
    this.isInitialized = false;
  }

  /**
   * Check if notifications are supported in the current environment
   */
  isSupported() {
    // In Expo Go, local notifications should work, but push notifications don't
    // This service uses local scheduled notifications, which should work
    return true;
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permissions
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

      // Configure notification handler
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
      console.error('Error initializing notifications:', error);
      // Gracefully handle errors - notifications may not work in Expo Go
      console.warn('Notifications may not be fully supported in Expo Go. For full support, use a development build.');
      return false;
    }
  }

  /**
   * Schedule a notification for a task
   */
  async scheduleTaskNotification(task) {
    try {
      if (!this.isSupported()) {
        console.warn('Notifications not supported in current environment');
        return null;
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return null;
        }
      }

      const notificationTime = taskSchedulingService.calculateNotificationTime(task);
      if (!notificationTime) {
        return null;
      }

      // Cancel existing notification for this task if any
      await this.cancelTaskNotification(task.id);

      // Don't schedule if notification time is in the past
      if (notificationTime < new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: `${task.title} is due soon`,
          data: { taskId: task.id },
          sound: true,
        },
        trigger: notificationTime,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      // Gracefully handle errors - may fail in Expo Go
      console.warn('Notification scheduling failed. This may be due to Expo Go limitations. Use a development build for full support.');
      return null;
    }
  }

  /**
   * Cancel notification for a task
   */
  async cancelTaskNotification(taskId) {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel notifications for this task
      for (const notification of scheduledNotifications) {
        if (notification.content?.data?.taskId === taskId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Schedule notifications for all pending tasks
   */
  async scheduleAllTaskNotifications() {
    try {
      const tasks = await Task.filter({ 
        is_archived: { '$ne': true },
        status: { '$ne': 'completed' }
      });

      const scheduled = [];
      for (const task of tasks) {
        if (task.due_date && task.due_time) {
          const notificationId = await this.scheduleTaskNotification(task);
          if (notificationId) {
            scheduled.push({ taskId: task.id, notificationId });
          }
        }
      }

      return scheduled;
    } catch (error) {
      console.error('Error scheduling all notifications:', error);
      return [];
    }
  }

  /**
   * Update notification when task is modified
   */
  async updateTaskNotification(task) {
    try {
      await this.cancelTaskNotification(task.id);
      
      if (task.status === 'completed' || task.is_archived) {
        return;
      }

      if (task.due_date && task.due_time) {
        await this.scheduleTaskNotification(task);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }
}

export default new NotificationService();

