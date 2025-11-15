import { database } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue, 
  query, 
  orderByChild,
  equalTo,
  orderByKey
} from 'firebase/database';
import { getCurrentUser, getDataSource } from '../services/userService';
import { saveTaskToHistory } from '../services/historyService';

export class Task {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || 'household';
    this.status = data.status || 'pending';
    this.priority = data.priority || 'medium';
    this.assigned_to = data.assigned_to || '';
    this.due_date = data.due_date || null;
    this.due_time = data.due_time || null;
    this.recurrence_rule = data.recurrence_rule || 'none';
    this.subtasks = data.subtasks || [];
    this.is_archived = data.is_archived || false;
    this.archived_date = data.archived_date || null;
    this.completion_date = data.completion_date || null;
    this.created_by = data.created_by || data.createdBy || '';
    this.created_date = data.created_date || data.createdAt || new Date().toISOString();
    this.updated_date = data.updated_date || data.updatedAt || new Date().toISOString();
    // New fields for template system
    this.template_id = data.template_id || null;
    this.auto_generated = data.auto_generated || false;
    this.scheduled_date = data.scheduled_date || null;
    this.estimated_duration = data.estimated_duration || null;
    this.actual_duration = data.actual_duration || null;
    this.room_location = data.room_location || null;
    this.defer_count = data.defer_count || 0;
    this.defer_until = data.defer_until || null;
    this.completed_by = data.completed_by || null;
    this.notification_offset_hours = data.notification_offset_hours || 6; // Default 6 hours before
    this.selected_days = data.selected_days || null; // Array of day numbers (0-6, 0=Sunday) for specific days of week
  }

  static async create(taskData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to create tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`);
      const newTaskRef = push(tasksRef);

      const taskWithDefaults = {
        ...taskData,
        created_by: user.email, // Use email instead of uid to match filtering logic in screens
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'household',
        recurrence_rule: taskData.recurrence_rule || 'none',
        subtasks: taskData.subtasks || [],
        is_archived: false
      };

      await set(newTaskRef, taskWithDefaults);
      return new Task({ id: newTaskRef.key, ...taskWithDefaults });
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to get tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const taskRef = ref(database, `${dataSource.path}/tasks/${id}`);
      const snapshot = await get(taskRef);
      
      if (snapshot.exists()) {
        return new Task({ id: snapshot.key, ...snapshot.val() });
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to update tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      // Automatically archive task when status is set to 'completed'
      const finalUpdates = { ...updates };
      if (updates.status === 'completed') {
        finalUpdates.is_archived = true;
        finalUpdates.archived_date = new Date().toISOString();
        finalUpdates.completion_date = new Date().toISOString();
        // Set completed_by if not already set
        if (!finalUpdates.completed_by) {
          finalUpdates.completed_by = user.email;
        }
      }

      const taskRef = ref(database, `${dataSource.path}/tasks/${id}`);
      await update(taskRef, {
        ...finalUpdates,
        updated_date: new Date().toISOString(),
        updated_by: user.uid
      });

      // Save to history when task is completed
      if (updates.status === 'completed') {
        const task = await this.getById(id);
        if (task) {
          await saveTaskToHistory(task);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to delete tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const taskRef = ref(database, `${dataSource.path}/tasks/${id}`);
      await remove(taskRef);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  static async filter(filters = {}, orderField = 'created_date', orderDirection = 'desc') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to filter tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`);
      const snapshot = await get(tasksRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      let tasks = Object.entries(data).map(([id, taskData]) => 
        new Task({ id, ...taskData })
      );

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value['$ne']) {
          // Handle not equal queries
          tasks = tasks.filter(task => task[key] !== value['$ne']);
        } else if (value !== undefined && value !== null && value !== '') {
          tasks = tasks.filter(task => task[key] === value);
        }
      });

      // Apply sorting
      const sortField = orderField.startsWith('-') ? orderField.substring(1) : orderField;
      const sortDirection = orderField.startsWith('-') ? 'desc' : orderDirection;
      
      tasks.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
        
        if (sortDirection === 'desc') {
          return bValue > aValue ? 1 : (bValue < aValue ? -1 : 0);
        } else {
          return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        }
      });

      return tasks;
    } catch (error) {
      console.error('Error filtering tasks:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to get all tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`);
      const snapshot = await get(tasksRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      return Object.entries(data).map(([id, taskData]) => 
        new Task({ id, ...taskData })
      );
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  }

  /**
   * Check if there are any tasks updated since the given timestamp
   * Returns true if updates exist, false otherwise
   * This is a lightweight check to avoid full fetches when nothing changed
   */
  static async hasUpdatesSince(timestamp) {
    try {
      const user = getCurrentUser();
      if (!user || !timestamp) {
        return true; // If no timestamp, assume updates exist
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        return true; // Assume updates exist if we can't check
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`);
      const snapshot = await get(tasksRef);
      
      if (!snapshot.exists()) {
        return false; // No tasks at all
      }

      const data = snapshot.val() || {};
      const timestampMs = new Date(timestamp).getTime();
      
      // Check if any task has been updated since timestamp
      for (const [id, taskData] of Object.entries(data)) {
        if (taskData.updated_date) {
          const taskUpdateMs = new Date(taskData.updated_date).getTime();
          if (!isNaN(taskUpdateMs) && taskUpdateMs > timestampMs) {
            return true; // Found an update
          }
        }
      }
      
      return false; // No updates found
    } catch (error) {
      console.error('Error checking for updates:', error);
      return true; // On error, assume updates exist to be safe
    }
  }

  /**
   * Get only tasks that have been updated since the given timestamp
   * More efficient than fetching all tasks when only checking for updates
   */
  static async getUpdatedSince(timestamp, filters = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to get updated tasks');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`);
      const snapshot = await get(tasksRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      const timestampMs = new Date(timestamp).getTime();
      
      // Filter tasks updated since timestamp
      let tasks = Object.entries(data)
        .map(([id, taskData]) => new Task({ id, ...taskData }))
        .filter(task => {
          if (!task.updated_date) return false;
          const taskUpdateMs = new Date(task.updated_date).getTime();
          return !isNaN(taskUpdateMs) && taskUpdateMs > timestampMs;
        });

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value['$ne']) {
          tasks = tasks.filter(task => task[key] !== value['$ne']);
        } else if (value !== undefined && value !== null && value !== '') {
          tasks = tasks.filter(task => task[key] === value);
        }
      });

      return tasks;
    } catch (error) {
      console.error('Error getting updated tasks:', error);
      throw error;
    }
  }

  static onSnapshot(callback, filters = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        callback([]);
        return () => {};
      }

      let unsubscribe = () => {};
      let isCancelled = false;

      getDataSource(user.uid).then((dataSource) => {
        // Check if listener was cancelled before setup completed
        if (isCancelled) {
          return;
        }

        if (!dataSource.success) {
          console.error('Error getting data source:', dataSource.error);
          callback([]);
          return;
        }

        const tasksRef = ref(database, `${dataSource.path}/tasks`);
        
        const unsubscribeFunc = onValue(
          tasksRef,
          (snapshot) => {
            // Don't call callback if listener was cancelled
            if (isCancelled) {
              unsubscribeFunc();
              return;
            }

            const data = snapshot.val() || {};
            let tasks = Object.entries(data).map(([id, taskData]) => 
              new Task({ id, ...taskData })
            );

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value && typeof value === 'object' && value['$ne']) {
                tasks = tasks.filter(task => task[key] !== value['$ne']);
              } else if (value !== undefined && value !== null && value !== '') {
                tasks = tasks.filter(task => task[key] === value);
              }
            });

            callback(tasks);
          },
          (error) => {
            if (!isCancelled) {
              console.error('Error in task listener:', error);
              callback([]);
            }
          }
        );

        unsubscribe = unsubscribeFunc;
      }).catch((error) => {
        if (!isCancelled) {
          console.error('Error setting up task listener:', error);
          callback([]);
        }
      });

      return () => {
        isCancelled = true;
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up task listener:', error);
      return () => {};
    }
  }
} 