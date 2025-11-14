import { Task } from '../entities/Task';
import { TaskTemplate } from '../entities/TaskTemplate';
import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, parseISO, format } from 'date-fns';

/**
 * Service for automatically generating tasks from templates
 */
class TaskGenerationService {
  /**
   * Calculate the next due date based on template frequency
   */
  calculateNextDueDate(template, lastCompletedDate = null) {
    const baseDate = lastCompletedDate ? parseISO(lastCompletedDate) : new Date();
    let nextDate = baseDate;

    switch (template.frequency_type) {
      case 'daily':
        nextDate = addDays(baseDate, template.frequency_interval || 1);
        break;
      case 'weekly':
        nextDate = addWeeks(baseDate, template.frequency_interval || 1);
        break;
      case 'monthly':
        nextDate = addMonths(baseDate, template.frequency_interval || 1);
        break;
      case 'custom':
        // For custom frequencies, try to parse common patterns
        // This is a simplified parser - can be enhanced
        if (template.frequency_custom) {
          const custom = template.frequency_custom.toLowerCase();
          if (custom.includes('יום') || custom.includes('day')) {
            const match = custom.match(/(\d+)/);
            const days = match ? parseInt(match[1]) : 1;
            nextDate = addDays(baseDate, days);
          } else if (custom.includes('שבוע') || custom.includes('week')) {
            const match = custom.match(/(\d+)/);
            const weeks = match ? parseInt(match[1]) : 1;
            nextDate = addWeeks(baseDate, weeks);
          } else if (custom.includes('חודש') || custom.includes('month')) {
            const match = custom.match(/(\d+)/);
            const months = match ? parseInt(match[1]) : 1;
            nextDate = addMonths(baseDate, months);
          }
        }
        break;
      default:
        nextDate = addDays(baseDate, 7); // Default to weekly
    }

    return nextDate;
  }

  /**
   * Check if a task should be generated for a template
   */
  shouldGenerateTask(template, existingTasks = []) {
    if (!template.auto_generate || !template.is_active) {
      return false;
    }

    // Check if there's already a pending task for this template
    const hasPendingTask = existingTasks.some(
      task => 
        task.template_id === template.id && 
        task.status !== 'completed' && 
        !task.is_archived
    );

    if (hasPendingTask) {
      return false;
    }

    return true;
  }

  /**
   * Generate a task from a template
   */
  async generateTaskFromTemplate(template, dueDate = null) {
    try {
      // Calculate due date if not provided
      if (!dueDate) {
        // Find last completed task from this template
        const existingTasks = await Task.filter({ template_id: template.id });
        const completedTasks = existingTasks
          .filter(t => t.status === 'completed' && t.completion_date)
          .sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date));
        
        const lastCompletedDate = completedTasks.length > 0 
          ? completedTasks[0].completion_date 
          : null;
        
        dueDate = this.calculateNextDueDate(template, lastCompletedDate);
      }

      // Apply generation offset (create task X days before due date)
      const scheduledDate = addDays(dueDate, -template.generation_offset || 0);

      // Only create if scheduled date is today or in the past
      const today = startOfDay(new Date());
      const scheduled = startOfDay(scheduledDate);
      
      if (isAfter(scheduled, today)) {
        // Too early to generate - will be generated later
        return null;
      }

      const taskData = {
        title: template.template_name,
        description: template.description || '',
        category: template.category,
        priority: template.priority || 'medium',
        assigned_to: template.assigned_to || '',
        due_date: format(dueDate, 'yyyy-MM-dd'),
        estimated_duration: template.estimated_duration,
        room_location: template.room_location,
        template_id: template.id,
        auto_generated: true,
        scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
        notification_offset_hours: template.notification_offset_hours || 6,
        status: 'pending',
      };

      const task = await Task.create(taskData);
      return task;
    } catch (error) {
      console.error('Error generating task from template:', error);
      throw error;
    }
  }

  /**
   * Generate tasks for all active templates
   */
  async generateTasksForAllTemplates() {
    try {
      const templates = await TaskTemplate.filter({ 
        auto_generate: true,
        is_active: true 
      });

      const allTasks = await Task.filter({ is_archived: { '$ne': true } });
      
      const generatedTasks = [];

      for (const template of templates) {
        if (this.shouldGenerateTask(template, allTasks)) {
          try {
            const task = await this.generateTaskFromTemplate(template);
            if (task) {
              generatedTasks.push(task);
            }
          } catch (error) {
            console.error(`Error generating task for template ${template.id}:`, error);
          }
        }
      }

      return generatedTasks;
    } catch (error) {
      console.error('Error generating tasks for all templates:', error);
      throw error;
    }
  }

  /**
   * Generate a task from template manually (for calendar planning)
   */
  async generateTaskForDate(template, targetDate) {
    try {
      const dueDate = parseISO(targetDate);
      const task = await this.generateTaskFromTemplate(template, dueDate);
      return task;
    } catch (error) {
      console.error('Error generating task for date:', error);
      throw error;
    }
  }

  /**
   * Parse frequency string from Hebrew/English to structured format
   * Helper function for importing templates
   */
  parseFrequency(frequencyString) {
    if (!frequencyString) {
      return { frequency_type: 'weekly', frequency_interval: 1 };
    }

    const freq = frequencyString.toLowerCase().trim();
    
    // Daily patterns
    if (freq.includes('יומי') || freq.includes('daily') || freq === 'כל יום') {
      return { frequency_type: 'daily', frequency_interval: 1 };
    }
    
    // Every X days
    const everyDaysMatch = freq.match(/כל\s*(\d+)\s*יום|every\s*(\d+)\s*days?|(\d+)\s*יום|(\d+)\s*days?/i);
    if (everyDaysMatch) {
      const days = parseInt(everyDaysMatch[1] || everyDaysMatch[2] || everyDaysMatch[3] || everyDaysMatch[4]);
      return { frequency_type: 'daily', frequency_interval: days };
    }
    
    // Weekly patterns
    if (freq.includes('שבוע') || freq.includes('week')) {
      const weekMatch = freq.match(/(\d+)/);
      const weeks = weekMatch ? parseInt(weekMatch[1]) : 1;
      return { frequency_type: 'weekly', frequency_interval: weeks };
    }
    
    // Monthly patterns
    if (freq.includes('חודש') || freq.includes('month')) {
      const monthMatch = freq.match(/(\d+)/);
      const months = monthMatch ? parseInt(monthMatch[1]) : 1;
      return { frequency_type: 'monthly', frequency_interval: months };
    }
    
    // Default to custom if can't parse
    return { 
      frequency_type: 'custom', 
      frequency_interval: 1,
      frequency_custom: frequencyString 
    };
  }
}

export default new TaskGenerationService();

