import { Task } from '../entities/Task';
import { addHours, addWeeks, parseISO, format, isBefore, isAfter, startOfDay, differenceInHours } from 'date-fns';

/**
 * Service for task scheduling and date calculations
 */
class TaskSchedulingService {
  /**
   * Group tasks by time urgency
   */
  groupTasksByUrgency(tasks) {
    const now = new Date();
    const today = startOfDay(now);
    const weekFromNow = addHours(today, 24 * 7);
    const twoWeeksFromNow = addHours(today, 24 * 14);

    const grouped = {
      overdue: [],
      today: [],
      thisWeek: [],
      comingSoon: [],
      later: []
    };

    tasks.forEach(task => {
      if (task.status === 'completed' || task.is_archived) {
        return;
      }

      // Check if deferred
      if (task.defer_until) {
        const deferDate = parseISO(task.defer_until);
        if (isAfter(deferDate, today)) {
          // Still deferred
          if (isBefore(deferDate, weekFromNow)) {
            grouped.thisWeek.push(task);
          } else if (isBefore(deferDate, twoWeeksFromNow)) {
            grouped.comingSoon.push(task);
          } else {
            grouped.later.push(task);
          }
          return;
        }
      }

      if (!task.due_date) {
        grouped.later.push(task);
        return;
      }

      const dueDate = parseISO(task.due_date);
      const dueDateStart = startOfDay(dueDate);

      if (isBefore(dueDateStart, today)) {
        grouped.overdue.push(task);
      } else if (dueDateStart.getTime() === today.getTime()) {
        grouped.today.push(task);
      } else if (isBefore(dueDateStart, weekFromNow)) {
        grouped.thisWeek.push(task);
      } else if (isBefore(dueDateStart, twoWeeksFromNow)) {
        grouped.comingSoon.push(task);
      } else {
        grouped.later.push(task);
      }
    });

    // Sort each group by due date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return parseISO(a.due_date) - parseISO(b.due_date);
      });
    });

    return grouped;
  }

  /**
   * Get tasks for a specific date range
   */
  getTasksForDateRange(tasks, startDate, endDate) {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = startOfDay(parseISO(task.due_date));
      return (taskDate.getTime() >= start.getTime() && taskDate.getTime() <= end.getTime());
    });
  }

  /**
   * Calculate notification time for a task
   */
  calculateNotificationTime(task) {
    if (!task.due_date || !task.due_time) {
      return null;
    }

    try {
      const dueDate = parseISO(task.due_date);
      const [hours, minutes] = task.due_time.split(':').map(Number);
      const dueDateTime = new Date(dueDate);
      dueDateTime.setHours(hours, minutes, 0, 0);

      const offsetHours = task.notification_offset_hours || 6;
      const notificationTime = addHours(dueDateTime, -offsetHours);

      return notificationTime;
    } catch (error) {
      console.error('Error calculating notification time:', error);
      return null;
    }
  }

  /**
   * Check if a task needs a notification now
   */
  shouldSendNotification(task) {
    const notificationTime = this.calculateNotificationTime(task);
    if (!notificationTime) {
      return false;
    }

    const now = new Date();
    const timeDiff = differenceInHours(notificationTime, now);

    // Send notification if we're within 1 hour of the notification time
    return timeDiff >= 0 && timeDiff <= 1;
  }

  /**
   * Move task to a new date (for calendar drag-and-drop)
   */
  async moveTaskToDate(taskId, newDate) {
    try {
      const dateString = format(newDate, 'yyyy-MM-dd');
      await Task.update(taskId, {
        due_date: dateString,
        scheduled_date: dateString,
        updated_date: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error moving task to date:', error);
      throw error;
    }
  }

  /**
   * Defer a task
   */
  async deferTask(taskId, deferUntilDate) {
    try {
      const task = await Task.getById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const dateString = format(deferUntilDate, 'yyyy-MM-dd');
      await Task.update(taskId, {
        defer_until: dateString,
        defer_count: (task.defer_count || 0) + 1,
        updated_date: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error deferring task:', error);
      throw error;
    }
  }

  /**
   * Get week start and end dates
   */
  getWeekRange(date = new Date()) {
    const start = startOfDay(date);
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(start.setDate(diff));
    const weekEnd = addHours(weekStart, 24 * 6);
    
    return { start: weekStart, end: weekEnd };
  }

  /**
   * Get month start and end dates
   */
  getMonthRange(date = new Date()) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: startOfDay(start), end: startOfDay(end) };
  }

  /**
   * Postpone a biweekly task to next week
   * Moves the task 1 week forward and updates recurrence to continue from the new date
   */
  async postponeBiweeklyTask(taskId) {
    try {
      const task = await Task.getById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Only allow postponing biweekly tasks
      if (task.recurrence_rule !== 'biweekly') {
        throw new Error('Can only postpone biweekly tasks');
      }

      if (!task.due_date) {
        throw new Error('Task must have a due date to postpone');
      }

      const currentDueDate = parseISO(task.due_date);
      const newDueDate = addWeeks(currentDueDate, 1); // Move to next week
      const newDueDateString = format(newDueDate, 'yyyy-MM-dd');

      // Store the original date before postponing (for tracking)
      const postponedFromDate = task.postponed_from_date || task.due_date;

      await Task.update(taskId, {
        due_date: newDueDateString,
        postponed_from_date: postponedFromDate, // Track original date
        postponed_date: format(new Date(), 'yyyy-MM-dd'), // Track when postponed
        updated_date: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error postponing biweekly task:', error);
      throw error;
    }
  }
}

export default new TaskSchedulingService();

