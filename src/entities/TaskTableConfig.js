import { database } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue 
} from 'firebase/database';
import { getCurrentUser, getDataSource } from '../services/userService';

/**
 * TaskTableConfig Entity
 * Stores household task table configuration that can be synced to generate tasks
 */
export class TaskTableConfig {
  constructor(data) {
    this.id = data.id || null;
    this.category = data.category || '';
    this.subcategory = data.subcategory || '';
    this.task_name = data.task_name || '';
    // Current frequency columns (עדן הבן)
    this.current_performer = data.current_performer || '';
    this.current_duration = data.current_duration || '';
    this.current_frequency = data.current_frequency || '';
    // Planned frequency columns (עדן הבת)
    this.planned_performer = data.planned_performer || '';
    this.planned_duration = data.planned_duration || '';
    this.planned_frequency = data.planned_frequency || '';
    // Notes/comments
    this.notes = data.notes || '';
    // Metadata
    this.created_by = data.created_by || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = data.updated_date || new Date().toISOString();
    this.is_synced = data.is_synced || false; // Has this row been synced to create tasks?
    this.last_sync_date = data.last_sync_date || null;
  }

  static async create(configData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to create task table config');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const configRef = ref(database, `${dataSource.path}/task_table_config`);
      const newConfigRef = push(configRef);

      const configWithDefaults = {
        ...configData,
        created_by: user.uid,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        is_synced: false
      };

      await set(newConfigRef, configWithDefaults);
      return new TaskTableConfig({ id: newConfigRef.key, ...configWithDefaults });
    } catch (error) {
      console.error('Error creating task table config:', error);
      throw error;
    }
  }

  static async list(sortBy = '-created_date') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to list task table config');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const configRef = ref(database, `${dataSource.path}/task_table_config`);
      const snapshot = await get(configRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const configs = [];
      snapshot.forEach((childSnapshot) => {
        configs.push(new TaskTableConfig({
          id: childSnapshot.key,
          ...childSnapshot.val()
        }));
      });

      // Sort by category and subcategory for display
      return configs.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        if (a.subcategory !== b.subcategory) {
          return a.subcategory.localeCompare(b.subcategory);
        }
        return a.task_name.localeCompare(b.task_name);
      });
    } catch (error) {
      console.error('Error listing task table config:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to update task table config');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const configRef = ref(database, `${dataSource.path}/task_table_config/${id}`);
      await update(configRef, {
        ...updates,
        updated_date: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating task table config:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to delete task table config');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const configRef = ref(database, `${dataSource.path}/task_table_config/${id}`);
      await remove(configRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting task table config:', error);
      throw error;
    }
  }

  static async deleteAll() {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to delete all task table config');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const configRef = ref(database, `${dataSource.path}/task_table_config`);
      await remove(configRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting all task table config:', error);
      throw error;
    }
  }

  static async markAsSynced(id) {
    try {
      return await TaskTableConfig.update(id, {
        is_synced: true,
        last_sync_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking task table config as synced:', error);
      throw error;
    }
  }

  static async markAllAsUnsynced() {
    try {
      const configs = await TaskTableConfig.list();
      const updatePromises = configs.map(config => 
        TaskTableConfig.update(config.id, { is_synced: false })
      );
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error marking all configs as unsynced:', error);
      throw error;
    }
  }

  static onSnapshot(callback, filters = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to listen to task table config');
      }

      getDataSource(user.uid).then((dataSource) => {
        if (!dataSource.success) {
          console.error('Error getting data source:', dataSource.error);
          return;
        }

        const configRef = ref(database, `${dataSource.path}/task_table_config`);
        const unsubscribe = onValue(configRef, (snapshot) => {
          if (!snapshot.exists()) {
            callback([]);
            return;
          }

          const configs = [];
          snapshot.forEach((childSnapshot) => {
            const config = new TaskTableConfig({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
            configs.push(config);
          });

          // Sort by category
          const sorted = configs.sort((a, b) => {
            if (a.category !== b.category) {
              return a.category.localeCompare(b.category);
            }
            if (a.subcategory !== b.subcategory) {
              return a.subcategory.localeCompare(b.subcategory);
            }
            return a.task_name.localeCompare(b.task_name);
          });

          callback(sorted);
        });

        return unsubscribe;
      });
    } catch (error) {
      console.error('Error setting up task table config listener:', error);
      throw error;
    }
  }
}

