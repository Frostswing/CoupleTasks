import { Task } from '../entities/Task';
import { differenceInDays } from 'date-fns';

/**
 * Service for cleaning up old archived tasks
 * Automatically deletes tasks that have been archived for more than 60 days
 */
class TaskCleanupService {
  /**
   * Clean up archived tasks older than 60 days
   * @param {number} daysOld - Number of days after which to delete (default: 60)
   * @returns {Promise<{success: boolean, deletedCount: number, error?: string}>}
   */
  async cleanupOldArchivedTasks(daysOld = 60) {
    try {
      console.log(`🧹 Starting cleanup of archived tasks older than ${daysOld} days...`);
      
      // Get all archived tasks
      const allTasks = await Task.filter({ is_archived: true });
      
      if (allTasks.length === 0) {
        console.log('✅ No archived tasks found');
        return { success: true, deletedCount: 0 };
      }

      const now = new Date();
      const tasksToDelete = allTasks.filter(task => {
        if (!task.archived_date) {
          // If no archived_date, use completion_date as fallback
          if (task.completion_date) {
            return differenceInDays(now, new Date(task.completion_date)) > daysOld;
          }
          // If neither exists, skip (shouldn't happen, but safety check)
          return false;
        }
        return differenceInDays(now, new Date(task.archived_date)) > daysOld;
      });

      if (tasksToDelete.length === 0) {
        console.log('✅ No tasks older than 60 days found');
        return { success: true, deletedCount: 0 };
      }

      console.log(`🗑️ Found ${tasksToDelete.length} tasks to delete`);

      // Delete tasks in batches to avoid overwhelming the database
      const batchSize = 10;
      let deletedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < tasksToDelete.length; i += batchSize) {
        const batch = tasksToDelete.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (task) => {
            try {
              await Task.delete(task.id);
              deletedCount++;
            } catch (error) {
              console.error(`Error deleting task ${task.id}:`, error);
              errorCount++;
            }
          })
        );
      }

      console.log(`✅ Cleanup completed: ${deletedCount} tasks deleted, ${errorCount} errors`);
      
      return {
        success: errorCount === 0,
        deletedCount,
        errorCount
      };
    } catch (error) {
      console.error('❌ Error during task cleanup:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Run cleanup automatically (called on app start or periodically)
   */
  async runAutomaticCleanup() {
    try {
      const result = await this.cleanupOldArchivedTasks(60);
      return result;
    } catch (error) {
      console.error('Error in automatic cleanup:', error);
      return { success: false, deletedCount: 0, error: error.message };
    }
  }
}

export default new TaskCleanupService();

