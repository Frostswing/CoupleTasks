import { TaskTableConfig } from '../entities/TaskTableConfig';
import { TaskTemplate } from '../entities/TaskTemplate';
import { Task } from '../entities/Task';
import taskGenerationService from './taskGenerationService';
import excelImportService from './excelImportService';

/**
 * Service for syncing task table configurations to create task templates and tasks
 */
class TaskTableSyncService {
  /**
   * Sync all task table configurations to create templates and tasks
   * This will:
   * 1. Delete all auto-generated tasks from previous syncs
   * 2. Delete all templates created from table
   * 3. Create new templates from table rows
   * 4. Generate initial tasks from templates
   */
  async syncTableToTasks() {
    try {
      // Get all table configurations
      const configs = await TaskTableConfig.list();
      
      if (configs.length === 0) {
        return {
          success: false,
          error: 'No table configurations found. Please import an Excel file first.'
        };
      }

      // Step 1: Delete all auto-generated tasks and table-generated templates
      await this.cleanupExistingGeneratedItems();

      // Step 2: Create templates from table configurations
      const templates = await this.createTemplatesFromConfigs(configs);

      // Step 3: Generate initial tasks from templates (only for active templates)
      const tasksGenerated = await this.generateInitialTasks(templates);

      // Step 4: Mark all configs as synced
      await this.markConfigsAsSynced(configs);

      return {
        success: true,
        templatesCreated: templates.length,
        tasksGenerated: tasksGenerated,
        message: `Successfully synced ${templates.length} templates and generated ${tasksGenerated} tasks`
      };
    } catch (error) {
      console.error('Error syncing table to tasks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete all auto-generated tasks and table-sourced templates
   */
  async cleanupExistingGeneratedItems() {
    try {
      // Get all tasks
      const allTasks = await Task.list();
      
      // Delete tasks that were auto-generated from table (have template_id and auto_generated flag)
      const deleteTaskPromises = allTasks
        .filter(task => task.auto_generated && task.template_id)
        .map(task => Task.delete(task.id));
      
      await Promise.all(deleteTaskPromises);

      // Get all templates and delete those created from table
      // (We'll mark them with a special flag or naming convention)
      const allTemplates = await TaskTemplate.list();
      const deleteTemplatePromises = allTemplates
        .filter(template => template.description && template.description.includes('[FROM_TABLE]'))
        .map(template => TaskTemplate.delete(template.id));
      
      await Promise.all(deleteTemplatePromises);

      console.log(`Cleaned up ${deleteTaskPromises.length} tasks and ${deleteTemplatePromises.length} templates`);
    } catch (error) {
      console.error('Error cleaning up existing items:', error);
      throw error;
    }
  }

  /**
   * Create task templates from table configurations
   */
  async createTemplatesFromConfigs(configs) {
    try {
      const templates = [];

      for (const config of configs) {
        // Determine which frequency to use (prefer planned, fallback to current)
        const frequency = config.planned_frequency || config.current_frequency;
        const duration = config.planned_duration || config.current_duration;
        const performer = config.planned_performer || config.current_performer;

        if (!frequency) {
          console.warn(`Skipping config ${config.id} - no frequency specified`);
          continue;
        }

        // Parse frequency
        const frequencyData = excelImportService.parseFrequencyString(frequency);
        
        // Parse duration
        const estimatedDuration = excelImportService.parseDurationString(duration);

        // Parse performer
        const assignedTo = excelImportService.parsePerformerString(performer);

        // Create template
        const templateData = {
          template_name: config.task_name,
          description: `[FROM_TABLE] ${config.category} - ${config.subcategory}`,
          category: this.mapCategoryToSystem(config.category),
          subcategory: config.subcategory,
          frequency_type: frequencyData.frequency_type,
          frequency_interval: frequencyData.frequency_interval,
          frequency_custom: frequencyData.frequency_custom,
          assigned_to: assignedTo,
          estimated_duration: estimatedDuration,
          priority: this.determinePriority(frequencyData.frequency_type),
          auto_generate: this.shouldAutoGenerate(frequencyData.frequency_type, frequencyData.frequency_custom),
          generation_offset: 0, // Generate on the day
          notification_offset_hours: 6,
          room_location: config.subcategory,
          is_active: true
        };

        const template = await TaskTemplate.create(templateData);
        templates.push(template);
      }

      console.log(`Created ${templates.length} templates from table configs`);
      return templates;
    } catch (error) {
      console.error('Error creating templates from configs:', error);
      throw error;
    }
  }

  /**
   * Generate initial tasks from templates
   */
  async generateInitialTasks(templates) {
    try {
      let tasksGenerated = 0;

      for (const template of templates) {
        if (template.auto_generate && template.is_active) {
          try {
            const task = await taskGenerationService.generateTaskFromTemplate(template);
            if (task) {
              tasksGenerated++;
            }
          } catch (error) {
            console.error(`Error generating task from template ${template.id}:`, error);
          }
        }
      }

      console.log(`Generated ${tasksGenerated} initial tasks`);
      return tasksGenerated;
    } catch (error) {
      console.error('Error generating initial tasks:', error);
      throw error;
    }
  }

  /**
   * Mark all configs as synced
   */
  async markConfigsAsSynced(configs) {
    try {
      const updatePromises = configs.map(config => 
        TaskTableConfig.markAsSynced(config.id)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking configs as synced:', error);
      throw error;
    }
  }

  /**
   * Map Hebrew category to system category
   */
  mapCategoryToSystem(hebrewCategory) {
    const categoryMap = {
      'ניקיון': 'cleaning',
      'כביסה': 'laundry',
      'תחזוקה שוטפת': 'maintenance',
      'רכב': 'vehicle',
      'חיות מחמד': 'pets',
      'תשלומים וכלכלה': 'finance',
      'אוכל': 'food'
    };

    return categoryMap[hebrewCategory] || 'household';
  }

  /**
   * Determine priority based on frequency
   */
  determinePriority(frequencyType) {
    switch (frequencyType) {
      case 'daily':
        return 'high';
      case 'weekly':
        return 'medium';
      case 'monthly':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Determine if task should auto-generate
   * Don't auto-generate for "as needed" or custom frequencies
   */
  shouldAutoGenerate(frequencyType, frequencyCustom) {
    // Don't auto-generate for custom/as-needed tasks
    if (frequencyType === 'custom') {
      const custom = (frequencyCustom || '').toLowerCase();
      if (custom.includes('לפי הצורך') || custom.includes('מתי ש') || custom.includes('as needed')) {
        return false;
      }
    }

    // Auto-generate for daily, weekly, monthly
    return ['daily', 'weekly', 'monthly'].includes(frequencyType);
  }
}

export default new TaskTableSyncService();

