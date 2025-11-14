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
        created_by: user.uid,
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

      const taskRef = ref(database, `${dataSource.path}/tasks/${id}`);
      await update(taskRef, {
        ...updates,
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