import { Task } from '../entities/Task';
import { TaskTemplate } from '../entities/TaskTemplate';
import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, parseISO, format, endOfDay, differenceInDays } from 'date-fns';
import syncIndicatorService from './syncIndicatorService';

/**
 * Service for automatically generating tasks from templates
 */
class TaskGenerationService {
  constructor() {
    this.isGenerating = false; // Lock to prevent concurrent generation
    this.lastGenerationTime = null; // Track when generation last ran
  }
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
      case 'times_per_week':
        // Calculate days between occurrences based on times per week
        const timesPerWeek = Math.min(Math.max(1, template.frequency_interval || 1), 7);
        const daysBetween = this.calculateDaysBetweenForTimesPerWeek(timesPerWeek);
        nextDate = addDays(baseDate, daysBetween);
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
   * Calculate days between occurrences for times_per_week frequency
   * Smart scheduling: distributes tasks evenly across the week
   */
  calculateDaysBetweenForTimesPerWeek(timesPerWeek) {
    // Map times per week to days between occurrences
    // This creates a pattern that distributes tasks evenly
    const scheduleMap = {
      1: 7,   // Once a week = every 7 days
      2: 3,   // Twice a week = every 3-4 days (alternating)
      3: 2,   // Three times = every 2-3 days
      4: 2,   // Four times = every 1-2 days
      5: 1,   // Five times = every 1-2 days
      6: 1,   // Six times = every day (with one day off)
      7: 1,   // Seven times = every day
    };
    
    return scheduleMap[timesPerWeek] || 7;
  }

  /**
   * Generate all dates for times_per_week frequency within a date range
   * Returns an array of dates distributed evenly across weeks
   * @param {number} timesPerWeek - Number of times per week (1-7)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Array<number>} selectedDays - Optional array of day numbers (0-6, 0=Sunday) to use specific days
   */
  generateDatesForTimesPerWeek(timesPerWeek, startDate, endDate, selectedDays = null) {
    const dates = [];
    const timesPerWeekNum = Math.min(Math.max(1, timesPerWeek), 7);
    let currentDate = startOfDay(startDate);
    const end = endOfDay(endDate);
    
    // If specific days are selected (for 2-7 times/week), use those days
    if (selectedDays && Array.isArray(selectedDays) && selectedDays.length > 0 && selectedDays.length === timesPerWeekNum) {
      // Generate dates for each week within the range
      while (currentDate <= end) {
        // Check each selected day in the current week
        for (const dayOfWeek of selectedDays) {
          // Find the date of this day in the current week
          const currentDayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
          let daysToAdd = dayOfWeek - currentDayOfWeek;
          
          // If the day is earlier in the week, move to next week
          if (daysToAdd < 0) {
            daysToAdd += 7;
          }
          
          const targetDate = addDays(currentDate, daysToAdd);
          
          // Only add if within range
          if (targetDate >= startDate && targetDate <= end) {
            dates.push(new Date(targetDate));
          }
        }
        
        // Move to next week
        currentDate = addDays(currentDate, 7);
        
        // Safety check
        if (dates.length > 200) break;
      }
      
      // Sort and remove duplicates
      return dates
        .sort((a, b) => a - b)
        .filter((date, index, self) => 
          index === self.findIndex(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
        );
    }
    
    // Fallback to smart scheduling if no specific days selected
    // Calculate base interval
    const daysBetween = this.calculateDaysBetweenForTimesPerWeek(timesPerWeekNum);
    
    // For 2 times/week, alternate between 3 and 4 days
    // For 3 times/week, alternate between 2 and 3 days
    // For 4 times/week, alternate between 1 and 2 days
    // For 5 times/week, alternate between 1 and 2 days
    // For 6 times/week, mostly 1 day with occasional 2 days
    let dayOffset = 0;
    let useAlternate = false;
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      
      let nextDays;
      if (timesPerWeekNum === 2) {
        // Alternate between 3 and 4 days
        nextDays = useAlternate ? 4 : 3;
        useAlternate = !useAlternate;
      } else if (timesPerWeekNum === 3) {
        // Alternate between 2 and 3 days
        nextDays = useAlternate ? 3 : 2;
        useAlternate = !useAlternate;
      } else if (timesPerWeekNum === 4) {
        // Alternate between 1 and 2 days
        nextDays = useAlternate ? 2 : 1;
        useAlternate = !useAlternate;
      } else if (timesPerWeekNum === 5) {
        // Mostly 1 day, occasionally 2 days
        nextDays = (dayOffset % 5 === 0) ? 2 : 1;
      } else if (timesPerWeekNum === 6) {
        // Mostly 1 day, occasionally 2 days
        nextDays = (dayOffset % 6 === 0) ? 2 : 1;
      } else {
        // 1 or 7 times/week: use fixed interval
        nextDays = daysBetween;
      }
      
      currentDate = addDays(currentDate, nextDays);
      dayOffset++;
      
      // Safety check to prevent infinite loops
      if (dates.length > 100) break;
    }
    
    return dates.filter(d => d <= end);
  }

  /**
   * Update all tasks generated from a template when the template is edited
   * Only updates pending and in_progress tasks to avoid modifying completed work
   * @param {string} templateId - ID of the template that was updated
   * @param {Object} templateUpdates - The updated template data
   */
  async updateTasksFromTemplate(templateId, templateUpdates) {
    try {
      console.log(`🔄 Updating tasks from template ${templateId}...`);
      
      // Get all tasks with this template_id
      const allTasks = await Task.filter({ 
        template_id: templateId,
        is_archived: { '$ne': true } 
      });

      // Only update pending and in_progress tasks
      const tasksToUpdate = allTasks.filter(task => 
        task.status === 'pending' || task.status === 'in_progress'
      );

      if (tasksToUpdate.length === 0) {
        console.log(`  No pending/in_progress tasks to update for template ${templateId}`);
        return { updated: 0 };
      }

      console.log(`  Found ${tasksToUpdate.length} tasks to update`);

      // Map template fields to task fields
      // Only update fields that are actually present in the updates
      const taskUpdates = {};
      
      if (templateUpdates.template_name !== undefined) {
        taskUpdates.title = templateUpdates.template_name;
      }
      if (templateUpdates.description !== undefined) {
        taskUpdates.description = templateUpdates.description;
      }
      if (templateUpdates.category !== undefined) {
        taskUpdates.category = templateUpdates.category;
      }
      if (templateUpdates.priority !== undefined) {
        taskUpdates.priority = templateUpdates.priority;
      }
      if (templateUpdates.assigned_to !== undefined) {
        taskUpdates.assigned_to = templateUpdates.assigned_to;
      }
      if (templateUpdates.estimated_duration !== undefined) {
        taskUpdates.estimated_duration = templateUpdates.estimated_duration;
      }
      if (templateUpdates.room_location !== undefined) {
        taskUpdates.room_location = templateUpdates.room_location;
      }
      if (templateUpdates.notification_offset_hours !== undefined) {
        taskUpdates.notification_offset_hours = templateUpdates.notification_offset_hours;
      }

      // Skip if no actual updates to apply
      if (Object.keys(taskUpdates).length === 0) {
        console.log(`  No task fields to update for template ${templateId}`);
        return { updated: 0 };
      }

      // Add updated_date to track when task was synced
      taskUpdates.updated_date = new Date().toISOString();

      // Update all tasks in parallel (but in batches to avoid overwhelming Firebase)
      const BATCH_SIZE = 10;
      let updatedCount = 0;

      for (let i = 0; i < tasksToUpdate.length; i += BATCH_SIZE) {
        const batch = tasksToUpdate.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(task => Task.update(task.id, taskUpdates))
        );
        updatedCount += batch.length;
        console.log(`  Updated ${updatedCount}/${tasksToUpdate.length} tasks...`);
      }

      console.log(`✅ Updated ${updatedCount} tasks from template ${templateId}`);
      return { updated: updatedCount };
    } catch (error) {
      console.error(`❌ Error updating tasks from template ${templateId}:`, error);
      throw error;
    }
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
   * @param {Object} template - The task template
   * @param {Date|null|undefined} dueDate - Explicit due date. If undefined, auto-calculates. If provided (even if future), always generates.
   */
  async generateTaskFromTemplate(template, dueDate = undefined) {
    try {
      // Check if dueDate was explicitly provided (not undefined)
      const explicitDueDate = dueDate !== undefined;
      
      // Calculate due date if not provided
      if (!explicitDueDate || !dueDate) {
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

      // Only check future date restriction if dueDate was auto-calculated
      // If explicitly provided, always generate (for initial sync, calendar planning, etc.)
      if (!explicitDueDate) {
        const today = startOfDay(new Date());
        const scheduled = startOfDay(scheduledDate);
        
        if (isAfter(scheduled, today)) {
          // Too early to generate - will be generated later
          return null;
        }
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
   * Generate tasks for the upcoming month (30 days) from all active templates
   * This ensures tasks are always planned ahead
   * Runs in background - returns immediately, actual generation happens async
   * Prevents concurrent runs - if already generating, skips
   */
  async generateTasksForUpcomingMonth() {
    // Prevent concurrent generation runs
    if (this.isGenerating) {
      console.log('Task generation already in progress, skipping...');
      return Promise.resolve([]);
    }

    // Throttle: Don't generate more than once per minute
    const now = Date.now();
    if (this.lastGenerationTime && (now - this.lastGenerationTime) < 60000) {
      console.log('Task generation throttled (less than 1 minute since last run)');
      return Promise.resolve([]);
    }

    // Start generation in background - don't block UI
    this._generateTasksInBackground().catch(error => {
      console.error('Background task generation error:', error);
      syncIndicatorService.setSyncing(false);
      this.isGenerating = false;
    });
    
    // Return immediately
    return Promise.resolve([]);
  }

  /**
   * Internal method that does the actual generation in background
   * @private
   */
  async _generateTasksInBackground() {
    // Set lock
    this.isGenerating = true;
    this.lastGenerationTime = Date.now();
    
    try {
      syncIndicatorService.setSyncing(true, 'Generating tasks...');
      
      const templates = await TaskTemplate.filter({ 
        auto_generate: true,
        is_active: true 
      });

      if (templates.length === 0) {
        syncIndicatorService.setSyncing(false);
        this.isGenerating = false;
        return [];
      }

      const today = startOfDay(new Date());
      const targetEndDate = addDays(today, 30);
      
      // Get all existing tasks to avoid duplicates
      const allTasks = await Task.filter({ is_archived: { '$ne': true } });
      const existingTaskDates = new Set();
      
      // Track farthest date for each template
      const templateFarthestDates = new Map();
      
      // Create a map of existing tasks by template_id and due_date
      // Also track the farthest date tasks exist for each template
      allTasks.forEach(task => {
        if (task.template_id && task.due_date) {
          const key = `${task.template_id}_${task.due_date}`;
          existingTaskDates.add(key);
          
          // Track farthest date
          const taskDate = parseISO(task.due_date);
          const currentFarthest = templateFarthestDates.get(task.template_id);
          if (!currentFarthest || taskDate > currentFarthest) {
            templateFarthestDates.set(task.template_id, taskDate);
          }
        }
      });

      const generatedTasks = [];
      let processedTemplates = 0;

      for (const template of templates) {
        try {
          // Determine start date: use farthest existing date or today
          const farthestDate = templateFarthestDates.get(template.id);
          const startDate = farthestDate && farthestDate > today 
            ? addDays(farthestDate, 1) // Start from day after farthest
            : today;
          
          // Only generate if we need to fill gaps (smart generation)
          if (startDate <= targetEndDate) {
            syncIndicatorService.setSyncing(true, `Generating ${template.template_name}...`);
            
            const tasksForTemplate = await this.generateTasksForTemplateInRange(
              template,
              startDate,
              targetEndDate,
              existingTaskDates
            );
            generatedTasks.push(...tasksForTemplate);
            
            // Update existingTaskDates for next template
            tasksForTemplate.forEach(task => {
              if (task.due_date) {
                const key = `${template.id}_${task.due_date}`;
                existingTaskDates.add(key);
              }
            });
          }
          
          processedTemplates++;
          syncIndicatorService.setSyncing(true, `${processedTemplates}/${templates.length} templates`);
          
          // Small delay to keep UI responsive
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Error generating tasks for template ${template.id}:`, error);
        }
      }

      console.log(`✅ Generated ${generatedTasks.length} tasks for upcoming month (${generatedTasks.length > 0 ? 'new tasks created' : 'all tasks already exist'})`);
      syncIndicatorService.setSyncing(false);
      this.isGenerating = false;
      return generatedTasks;
    } catch (error) {
      console.error('Error generating tasks for upcoming month:', error);
      syncIndicatorService.setSyncing(false);
      this.isGenerating = false;
      throw error;
    }
  }

  /**
   * Generate all tasks for a template within a date range
   */
  async generateTasksForTemplateInRange(template, startDate, endDate, existingTaskDates = null) {
    const generatedTasks = [];
    
    // If no existing dates set provided, create one
    if (!existingTaskDates) {
      const allTasks = await Task.filter({ 
        template_id: template.id,
        is_archived: { '$ne': true } 
      });
      existingTaskDates = new Set();
      allTasks.forEach(task => {
        if (task.due_date) {
          existingTaskDates.add(task.due_date);
        }
      });
    }

    let datesToGenerate = [];
    
    if (template.frequency_type === 'times_per_week') {
      // Use smart scheduling for times_per_week, with selected days if provided
      datesToGenerate = this.generateDatesForTimesPerWeek(
        template.frequency_interval || 1,
        startDate,
        endDate,
        template.selected_days || null
      );
    } else {
      // For other frequency types, calculate dates sequentially
      let currentDate = new Date(startDate);
      const maxIterations = 100; // Safety limit
      let iterations = 0;
      
      // Find last completed task to start from
      const existingTasks = await Task.filter({ template_id: template.id });
      const completedTasks = existingTasks
        .filter(t => t.status === 'completed' && t.completion_date)
        .sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date));
      
      const lastCompletedDate = completedTasks.length > 0 
        ? completedTasks[0].completion_date 
        : null;
      
      // Start from today or last completed date, whichever is later
      if (lastCompletedDate) {
        const lastDate = parseISO(lastCompletedDate);
        if (lastDate > currentDate) {
          currentDate = lastDate;
        }
      }
      
      while (currentDate <= endDate && iterations < maxIterations) {
        // Only add dates that are in the future range
        if (currentDate >= startDate) {
          datesToGenerate.push(new Date(currentDate));
        }
        
        // Calculate next date based on template frequency
        const nextDate = this.calculateNextDueDate(template, format(currentDate, 'yyyy-MM-dd'));
        currentDate = nextDate;
        iterations++;
      }
    }

    // Generate tasks for each date
    let skippedCount = 0;
    for (const date of datesToGenerate) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const taskKey = `${template.id}_${dateStr}`;
      
      // Skip if task already exists
      if (existingTaskDates.has(taskKey)) {
        skippedCount++;
        continue;
      }

      try {
        const task = await this.generateTaskFromTemplate(template, date);
        if (task) {
          generatedTasks.push(task);
          existingTaskDates.add(taskKey);
        }
      } catch (error) {
        console.error(`Error generating task for template ${template.id} on ${dateStr}:`, error);
        // Don't throw - continue with other dates
      }
    }

    if (skippedCount > 0) {
      console.log(`  Skipped ${skippedCount} existing tasks for template "${template.template_name}"`);
    }

    return generatedTasks;
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

