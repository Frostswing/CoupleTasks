import * as XLSX from 'xlsx';
import { TaskTableConfig } from '../entities/TaskTableConfig';

/**
 * Service for importing Excel files containing household task tables
 * Format expected (from right to left in Hebrew):
 * קטגוריה | תת-קטגוריה | מטלה | מי מבצע | משך המטלה | תדירות | מי מבצע | משך המטלה | תדירות
 */
class ExcelImportService {
  /**
   * Parse Excel file and return array of task configurations
   */
  async parseExcelFile(fileUri) {
    try {
      // Read file as base64
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Parse the data
            const tasks = this.parseExcelData(jsonData);
            resolve(tasks);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(blob);
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw error;
    }
  }

  /**
   * Parse Excel data array into task configurations
   * Expected columns (Hebrew, right-to-left):
   * 0: תדירות (current frequency)
   * 1: משך המטלה (current duration)
   * 2: מי מבצע (current performer)
   * 3: תדירות (planned frequency)
   * 4: משך המטלה (planned duration)
   * 5: מי מבצע (planned performer)
   * 6: מטלה (task name)
   * 7: תת-קטגוריה (subcategory)
   * 8: קטגוריה (category)
   */
  parseExcelData(data) {
    if (!data || data.length < 2) {
      throw new Error('Excel file is empty or invalid');
    }

    const tasks = [];
    
    // Skip header row (index 0) and process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[6]) {
        continue;
      }

      const task = {
        category: this.cleanValue(row[8]),
        subcategory: this.cleanValue(row[7]),
        task_name: this.cleanValue(row[6]),
        planned_performer: this.cleanValue(row[5]),
        planned_duration: this.cleanValue(row[4]),
        planned_frequency: this.cleanValue(row[3]),
        current_performer: this.cleanValue(row[2]),
        current_duration: this.cleanValue(row[1]),
        current_frequency: this.cleanValue(row[0])
      };

      // Only add if task has a name
      if (task.task_name) {
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Clean and normalize cell values
   */
  cleanValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  /**
   * Import Excel file and save to database
   */
  async importToDatabase(fileUri) {
    try {
      // Parse Excel file
      const tasks = await this.parseExcelFile(fileUri);
      
      if (tasks.length === 0) {
        throw new Error('No valid tasks found in Excel file');
      }

      // Clear existing configurations before import
      await TaskTableConfig.deleteAll();

      // Create new configurations
      const createPromises = tasks.map(task => TaskTableConfig.create(task));
      const results = await Promise.all(createPromises);

      return {
        success: true,
        count: results.length,
        tasks: results
      };
    } catch (error) {
      console.error('Error importing Excel to database:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse frequency string to determine task template frequency settings
   * Returns: { frequency_type, frequency_interval, frequency_custom }
   */
  parseFrequencyString(frequencyStr) {
    if (!frequencyStr) {
      return { frequency_type: 'custom', frequency_interval: 1, frequency_custom: '' };
    }

    const freq = frequencyStr.toLowerCase().trim();
    
    // Daily patterns (יומיומי, כל יום, daily)
    if (freq.includes('יומיומי') || freq.includes('יומי') || freq === 'כל יום' || freq.includes('daily')) {
      return { frequency_type: 'daily', frequency_interval: 1, frequency_custom: '' };
    }
    
    // Every X days (פעם ב-X ימים, every X days)
    const daysMatch = freq.match(/פעם\s*ב[־\-]?(\d+)\s*ימים?|every\s*(\d+)\s*days?|(\d+)\s*ימים?/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1] || daysMatch[2] || daysMatch[3]);
      return { frequency_type: 'daily', frequency_interval: days, frequency_custom: '' };
    }
    
    // Weekly patterns (פעם בשבוע, weekly)
    const weekMatch = freq.match(/פעם\s*ב[־\-]?(\d+)?\s*שבוע|שבועי|weekly|week/i);
    if (weekMatch) {
      const weeks = weekMatch[1] ? parseInt(weekMatch[1]) : 1;
      return { frequency_type: 'weekly', frequency_interval: weeks, frequency_custom: '' };
    }
    
    // Monthly patterns (פעם בחודש, monthly)
    const monthMatch = freq.match(/פעם\s*ב[־\-]?(\d+)?\s*חודש|חודשי|monthly|month/i);
    if (monthMatch) {
      const months = monthMatch[1] ? parseInt(monthMatch[1]) : 1;
      return { frequency_type: 'monthly', frequency_interval: months, frequency_custom: '' };
    }

    // When full/empty (מתי שמתמלא)
    if (freq.includes('מתי ש') || freq.includes('לפי הצורך') || freq.includes('as needed')) {
      return { frequency_type: 'custom', frequency_interval: 1, frequency_custom: frequencyStr };
    }
    
    // Custom/unknown pattern
    return { frequency_type: 'custom', frequency_interval: 1, frequency_custom: frequencyStr };
  }

  /**
   * Parse duration string to minutes
   * Returns estimated duration in minutes
   */
  parseDurationString(durationStr) {
    if (!durationStr) {
      return null;
    }

    const duration = durationStr.toLowerCase().trim();
    
    // Minutes patterns (דקה, דקות, minutes)
    const minutesMatch = duration.match(/(\d+)\s*דקות?|(\d+)\s*min/i);
    if (minutesMatch) {
      return parseInt(minutesMatch[1] || minutesMatch[2]);
    }
    
    // Quarter hour (רבע שעה)
    if (duration.includes('רבע') && duration.includes('שעה')) {
      return 15;
    }
    
    // Half hour (חצי שעה)
    if (duration.includes('חצי') && duration.includes('שעה')) {
      return 30;
    }
    
    // Hour patterns (שעה, hours)
    const hoursMatch = duration.match(/(\d+)\s*שעות?|(\d+)\s*hour/i);
    if (hoursMatch) {
      return parseInt(hoursMatch[1] || hoursMatch[2]) * 60;
    }

    // Hour and half (שעה וחצי)
    if (duration.includes('שעה') && duration.includes('חצי')) {
      return 90;
    }

    // Two hours (שעתיים)
    if (duration.includes('שעתיים')) {
      return 120;
    }

    return null;
  }

  /**
   * Parse performer string to determine assignment
   * Returns: user identifier or 'both', 'either', etc.
   */
  parsePerformerString(performerStr, user1Name = 'עדן הבן', user2Name = 'עדן הבת') {
    if (!performerStr) {
      return '';
    }

    const performer = performerStr.trim();
    
    // Together (ביחד)
    if (performer.includes('ביחד') || performer.toLowerCase().includes('together')) {
      return 'both';
    }
    
    // Separate (בנפרד)
    if (performer.includes('בנפרד') || performer.toLowerCase().includes('separate')) {
      return 'either';
    }
    
    // Check for user names
    if (performer.includes(user1Name)) {
      return user1Name;
    }
    
    if (performer.includes(user2Name)) {
      return user2Name;
    }
    
    return performer;
  }
}

export default new ExcelImportService();

