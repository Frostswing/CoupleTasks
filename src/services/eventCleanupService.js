import { Event } from '../entities/Event';
import { differenceInDays, parseISO, isPast } from 'date-fns';

/**
 * Service for cleaning up old archived events
 * Automatically archives past events and deletes events that have been archived for more than 60 days
 */
class EventCleanupService {
  /**
   * Archive past events (events where event_date has passed)
   * @returns {Promise<{success: boolean, archivedCount: number, error?: string}>}
   */
  async archivePastEvents() {
    try {
      console.log('📅 Archiving past events...');
      
      // Get all non-archived events
      const allEvents = await Event.filter({ is_archived: { '$ne': true } });
      
      if (allEvents.length === 0) {
        console.log('✅ No events found');
        return { success: true, archivedCount: 0 };
      }

      const now = new Date();
      const eventsToArchive = allEvents.filter(event => {
        if (!event.event_date) {
          return false;
        }
        
        // Parse event date
        const eventDate = typeof event.event_date === 'string' 
          ? parseISO(event.event_date) 
          : new Date(event.event_date);
        
        // Check if event date has passed (including time if available)
        if (event.event_time) {
          const [hours, minutes] = event.event_time.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);
        } else {
          // If no time, consider it past if the date is before today
          eventDate.setHours(23, 59, 59, 999);
        }
        
        return isPast(eventDate);
      });

      if (eventsToArchive.length === 0) {
        console.log('✅ No past events to archive');
        return { success: true, archivedCount: 0 };
      }

      console.log(`📦 Found ${eventsToArchive.length} events to archive`);

      // Archive events in batches
      const batchSize = 10;
      let archivedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < eventsToArchive.length; i += batchSize) {
        const batch = eventsToArchive.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (event) => {
            try {
              await Event.update(event.id, {
                is_archived: true,
                archived_date: new Date().toISOString()
              });
              archivedCount++;
            } catch (error) {
              console.error(`Error archiving event ${event.id}:`, error);
              errorCount++;
            }
          })
        );
      }

      console.log(`✅ Archiving completed: ${archivedCount} events archived, ${errorCount} errors`);
      
      return {
        success: errorCount === 0,
        archivedCount,
        errorCount
      };
    } catch (error) {
      console.error('❌ Error during event archiving:', error);
      return {
        success: false,
        archivedCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Clean up archived events older than 60 days
   * @param {number} daysOld - Number of days after which to delete (default: 60)
   * @returns {Promise<{success: boolean, deletedCount: number, error?: string}>}
   */
  async cleanupOldArchivedEvents(daysOld = 60) {
    try {
      console.log(`🧹 Starting cleanup of archived events older than ${daysOld} days...`);
      
      // Get all archived events
      const allEvents = await Event.filter({ is_archived: true });
      
      if (allEvents.length === 0) {
        console.log('✅ No archived events found');
        return { success: true, deletedCount: 0 };
      }

      const now = new Date();
      const eventsToDelete = allEvents.filter(event => {
        if (!event.archived_date) {
          // If no archived_date, use event_date as fallback
          if (event.event_date) {
            const eventDate = typeof event.event_date === 'string' 
              ? parseISO(event.event_date) 
              : new Date(event.event_date);
            return differenceInDays(now, eventDate) > daysOld;
          }
          // If neither exists, skip (shouldn't happen, but safety check)
          return false;
        }
        return differenceInDays(now, new Date(event.archived_date)) > daysOld;
      });

      if (eventsToDelete.length === 0) {
        console.log('✅ No events older than 60 days found');
        return { success: true, deletedCount: 0 };
      }

      console.log(`🗑️ Found ${eventsToDelete.length} events to delete`);

      // Delete events in batches to avoid overwhelming the database
      const batchSize = 10;
      let deletedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < eventsToDelete.length; i += batchSize) {
        const batch = eventsToDelete.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (event) => {
            try {
              await Event.delete(event.id);
              deletedCount++;
            } catch (error) {
              console.error(`Error deleting event ${event.id}:`, error);
              errorCount++;
            }
          })
        );
      }

      console.log(`✅ Cleanup completed: ${deletedCount} events deleted, ${errorCount} errors`);
      
      return {
        success: errorCount === 0,
        deletedCount,
        errorCount
      };
    } catch (error) {
      console.error('❌ Error during event cleanup:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Run automatic archiving and cleanup (called on app start or periodically)
   */
  async runAutomaticCleanup() {
    try {
      // First archive past events
      await this.archivePastEvents();
      
      // Then cleanup old archived events
      const result = await this.cleanupOldArchivedEvents(60);
      return result;
    } catch (error) {
      console.error('Error in automatic event cleanup:', error);
      return { success: false, deletedCount: 0, error: error.message };
    }
  }
}

export default new EventCleanupService();

