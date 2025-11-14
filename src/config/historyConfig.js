// History Configuration Settings

export const HISTORY_CONFIG = {
  // How many months to keep history data
  RETENTION_MONTHS: 6,
  
  // How many suggestions to show in autocomplete
  MAX_SUGGESTIONS: 8,
  
  // Minimum characters to trigger search
  MIN_SEARCH_CHARS: 1,
  
  // Debounce delay for search (ms)
  SEARCH_DEBOUNCE: 300,
  
  // How many items to show in recent history widgets
  WIDGET_RECENT_ITEMS: 5,
  
  // Days to look back for recent history
  WIDGET_RECENT_DAYS: 7,
  
  // Smart suggestions settings
  SMART_SUGGESTIONS: {
    ENABLED: true,
    MAX_ITEMS: 5,
    
    // Time-based suggestions
    MORNING_HOURS: [6, 11],
    EVENING_HOURS: [17, 20],
    WEEKEND_SUGGESTIONS: true,
  },
  
  // Export settings
  EXPORT: {
    MAX_DAYS: 365, // Maximum days to export
    INCLUDE_ANALYTICS: true,
    FORMAT: 'json',
  },
  
  // Collection names in Firestore
  COLLECTIONS: {
    SHOPPING_HISTORY: 'shopping_history',
    TASK_HISTORY: 'task_history',
    USER_SUGGESTIONS: 'user_suggestions',
    ANALYTICS: 'analytics',
  },
  
  // Frequency thresholds for popular items
  POPULARITY_THRESHOLDS: {
    HIGH: 10,    // 10+ times = very popular
    MEDIUM: 5,   // 5+ times = popular
    LOW: 2,      // 2+ times = somewhat popular
  },
  
  // UI Customization
  UI: {
    SHOW_FREQUENCY_BADGES: true,
    SHOW_SMART_SUGGESTIONS: true,
    SHOW_RECENT_HISTORY_WIDGET: true,
    ANIMATE_SUGGESTIONS: true,
  }
};

// Helper functions for configuration
export const getRetentionDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - HISTORY_CONFIG.RETENTION_MONTHS);
  return date;
};

export const isWeekend = () => {
  const dayOfWeek = new Date().getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

export const getCurrentTimeCategory = () => {
  const hour = new Date().getHours();
  const { MORNING_HOURS, EVENING_HOURS } = HISTORY_CONFIG.SMART_SUGGESTIONS;
  
  if (hour >= MORNING_HOURS[0] && hour <= MORNING_HOURS[1]) {
    return 'morning';
  } else if (hour >= EVENING_HOURS[0] && hour <= EVENING_HOURS[1]) {
    return 'evening';
  } else {
    return 'day';
  }
};

export const getPopularityLevel = (frequency) => {
  const { HIGH, MEDIUM, LOW } = HISTORY_CONFIG.POPULARITY_THRESHOLDS;
  
  if (frequency >= HIGH) return 'high';
  if (frequency >= MEDIUM) return 'medium';
  if (frequency >= LOW) return 'low';
  return 'new';
};

// Localized messages in Hebrew
export const HISTORY_MESSAGES = {
  LOADING: 'טוען...',
  NO_HISTORY: 'אין היסטוריה עדיין',
  NO_SUGGESTIONS: 'אין הצעות',
  EXPORT_SUCCESS: 'ההיסטוריה יוצאה בהצלחה',
  EXPORT_ERROR: 'שגיאה בייצוא ההיסטוריה',
  CLEANUP_SUCCESS: 'ההיסטוריה נוקתה בהצלחה',
  CLEANUP_ERROR: 'שגיאה בניקוי ההיסטוריה',
  SMART_SUGGESTION_BADGE: 'הצעה חכמה',
  POPULAR_ITEM_BADGE: 'פופולרי',
  RECENT_SHOPPING: 'נקנה לאחרונה',
  RECENT_TASKS: 'הושלם לאחרונה',
  TIMES_USED: 'פעמים',
  THIS_WEEK: 'השבוע',
  THIS_MONTH: 'החודש',
  ALL_TIME: 'בסך הכל',
};

export default HISTORY_CONFIG; 