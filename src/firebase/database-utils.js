import { VALIDATION_RULES } from './database-schema';

// Validation utilities
export const validateData = (type, data) => {
  const rules = VALIDATION_RULES[type];
  if (!rules) {
    return { valid: false, errors: [`No validation rules found for type: ${type}`] };
  }

  const errors = [];

  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`);
      return;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return;
    }

    // Check data type
    if (rule.type && typeof value !== rule.type) {
      errors.push(`Field '${field}' must be of type ${rule.type}`);
      return;
    }

    // Check string length
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Field '${field}' must be at least ${rule.minLength} characters long`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Field '${field}' must be no more than ${rule.maxLength} characters long`);
      }
    }

    // Check number range
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`Field '${field}' must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`Field '${field}' must be no more than ${rule.max}`);
      }
    }

    // Check enum values
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`Field '${field}' must be one of: ${rule.enum.join(', ')}`);
    }

    // Check format
    if (rule.format) {
      switch (rule.format) {
        case 'email':
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            errors.push(`Field '${field}' must be a valid email address`);
          }
          break;
        case 'date':
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(value)) {
            errors.push(`Field '${field}' must be in YYYY-MM-DD format`);
          }
          break;
        case 'time':
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(value)) {
            errors.push(`Field '${field}' must be in HH:MM format`);
          }
          break;
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Sanitize data before saving
export const sanitizeData = (data) => {
  const sanitized = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) {
      return; // Skip undefined values
    }

    if (value === null) {
      sanitized[key] = null;
      return;
    }

    if (typeof value === 'string') {
      // Trim whitespace and prevent XSS
      sanitized[key] = value.trim().replace(/[<>]/g, '');
    } else if (typeof value === 'number') {
      // Ensure finite numbers
      sanitized[key] = isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeData(item) : item
      );
    } else if (typeof value === 'object') {
      // Recursively sanitize objects
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

// Add timestamps to data
export const addTimestamps = (data, isUpdate = false) => {
  const now = new Date().toISOString();
  
  if (isUpdate) {
    return {
      ...data,
      updated_date: now
    };
  } else {
    return {
      ...data,
      created_date: now,
      updated_date: now
    };
  }
};

// Generate unique IDs
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Format user data for database
export const formatUserForDB = (user) => {
  return sanitizeData({
    email: user.email?.toLowerCase(),
    full_name: user.displayName || user.name || user.full_name || 'User',
    uid: user.uid
  });
};

// Format task data for database
export const formatTaskForDB = (taskData, userId) => {
  const sanitized = sanitizeData(taskData);
  const formatted = addTimestamps(sanitized, !!taskData.id);
  
  return {
    ...formatted,
    created_by: userId,
    updated_by: userId,
    is_archived: formatted.is_archived || false,
    subtasks: formatted.subtasks || [],
    tags: formatted.tags || []
  };
};

// Format shopping item for database
export const formatShoppingItemForDB = (itemData, userId) => {
  const sanitized = sanitizeData(itemData);
  const formatted = addTimestamps(sanitized, !!itemData.id);
  
  return {
    ...formatted,
    created_by: userId,
    updated_by: userId,
    is_purchased: formatted.is_purchased || false,
    is_archived: formatted.is_archived || false,
    auto_added: formatted.auto_added || false
  };
};

// Format inventory item for database
export const formatInventoryItemForDB = (itemData, userId) => {
  const sanitized = sanitizeData(itemData);
  const formatted = addTimestamps(sanitized, !!itemData.id);
  
  return {
    ...formatted,
    created_by: userId,
    updated_by: userId,
    current_amount: Number(formatted.current_amount) || 0,
    minimum_amount: Number(formatted.minimum_amount) || 1,
    purchase_frequency: Number(formatted.purchase_frequency) || 0,
    tags: formatted.tags || []
  };
};

// Error handling utilities
export const handleDatabaseError = (error, operation = 'database operation') => {
  console.error(`Database error during ${operation}:`, error);
  
  let userMessage = 'אירעה שגיאה במסד הנתונים';
  
  if (error.code) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        userMessage = 'אין הרשאה לבצע פעולה זו';
        break;
      case 'NETWORK_ERROR':
        userMessage = 'בעיית רשת - אנא בדקו את החיבור לאינטרנט';
        break;
      case 'QUOTA_EXCEEDED':
        userMessage = 'חרגתם ממכסת השימוש';
        break;
      case 'UNAVAILABLE':
        userMessage = 'השירות אינו זמין כרגע';
        break;
      default:
        userMessage = 'אירעה שגיאה לא צפויה';
    }
  }
  
  return {
    success: false,
    error: error.message || error,
    userMessage,
    code: error.code
  };
};

// Batch operations utility
export const createBatchUpdate = () => {
  const updates = {};
  
  return {
    add: (path, data) => {
      updates[path] = data;
    },
    remove: (path) => {
      updates[path] = null;
    },
    getUpdates: () => updates,
    isEmpty: () => Object.keys(updates).length === 0,
    size: () => Object.keys(updates).length
  };
};

// Data transformation utilities
export const transformTaskForUI = (task) => {
  return {
    ...task,
    subtasks: task.subtasks || [],
    tags: task.tags || [],
    completedSubtasks: (task.subtasks || []).filter(st => st.is_completed).length,
    totalSubtasks: (task.subtasks || []).length,
    progress: task.subtasks?.length > 0 
      ? (task.subtasks.filter(st => st.is_completed).length / task.subtasks.length * 100)
      : 0
  };
};

export const transformShoppingItemForUI = (item) => {
  return {
    ...item,
    displayQuantity: `${item.quantity} ${item.unit}`,
    isAutoAdded: item.auto_added || false
  };
};

export const transformInventoryItemForUI = (item) => {
  return {
    ...item,
    isLowStock: item.current_amount < item.minimum_amount,
    stockPercentage: item.minimum_amount > 0 
      ? (item.current_amount / item.minimum_amount * 100)
      : 100,
    needsRestocking: item.current_amount <= item.minimum_amount * 0.5
  };
};

// Search and filter utilities
export const createSearchFilter = (searchTerm) => {
  const term = searchTerm.toLowerCase().trim();
  return (item) => {
    return item.name?.toLowerCase().includes(term) ||
           item.title?.toLowerCase().includes(term) ||
           item.description?.toLowerCase().includes(term) ||
           item.category?.toLowerCase().includes(term);
  };
};

export const createCategoryFilter = (category) => {
  return category === 'all' ? () => true : (item) => item.category === category;
};

export const createStatusFilter = (status) => {
  return status === 'all' ? () => true : (item) => item.status === status;
};

// Analytics utilities
export const calculateTaskStats = (tasks) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'completed'
    ).length,
    byCategory: {},
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length
    }
  };

  // Calculate by category
  tasks.forEach(task => {
    stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
  });

  return stats;
};

export const calculateShoppingStats = (items) => {
  return {
    total: items.length,
    purchased: items.filter(i => i.is_purchased).length,
    pending: items.filter(i => !i.is_purchased && !i.is_archived).length,
    archived: items.filter(i => i.is_archived).length,
    autoAdded: items.filter(i => i.auto_added).length,
    byCategory: items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {})
  };
};

export const calculateInventoryStats = (items) => {
  return {
    total: items.length,
    lowStock: items.filter(i => i.current_amount < i.minimum_amount).length,
    outOfStock: items.filter(i => i.current_amount === 0).length,
    wellStocked: items.filter(i => i.current_amount >= i.minimum_amount * 2).length,
    byCategory: items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {})
  };
}; 