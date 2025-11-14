/**
 * Validation utilities for form inputs
 */

/**
 * Validation rule functions
 */
export const validators = {
  /**
   * Check if value is required
   */
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },
  
  /**
   * Validate email format
   */
  email: (value) => {
    if (!value) return null; // Use required validator for required emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email address';
    }
    return null;
  },
  
  /**
   * Check minimum length
   */
  minLength: (min) => (value) => {
    if (!value) return null; // Use required validator for required fields
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  
  /**
   * Check maximum length
   */
  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },
  
  /**
   * Check if passwords match
   */
  passwordMatch: (password) => (value) => {
    if (!value) return null;
    if (value !== password) {
      return 'Passwords do not match';
    }
    return null;
  },
  
  /**
   * Validate password strength
   */
  passwordStrength: (value) => {
    if (!value) return null;
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  },
  
  /**
   * Check if value is a number
   */
  number: (value) => {
    if (!value && value !== 0) return null;
    if (isNaN(value)) {
      return 'Must be a number';
    }
    return null;
  },
  
  /**
   * Check minimum value
   */
  min: (min) => (value) => {
    if (value === null || value === undefined) return null;
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },
  
  /**
   * Check maximum value
   */
  max: (max) => (value) => {
    if (value === null || value === undefined) return null;
    const numValue = Number(value);
    if (isNaN(numValue) || numValue > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },
  
  /**
   * Check if value is in allowed list
   */
  oneOf: (allowedValues) => (value) => {
    if (!value) return null;
    if (!allowedValues.includes(value)) {
      return `Must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
  },
  
  /**
   * Validate date format
   */
  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return null;
  },
  
  /**
   * Check if date is in the future
   */
  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    if (date <= new Date()) {
      return 'Date must be in the future';
    }
    return null;
  },
  
  /**
   * Check if date is in the past
   */
  pastDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    if (date >= new Date()) {
      return 'Date must be in the past';
    }
    return null;
  }
};

/**
 * Validate form values against rules
 * @param {Object} values - Form values object
 * @param {Object} rules - Validation rules object
 * @returns {Object} Errors object with field names as keys
 * 
 * @example
 * const rules = {
 *   email: [validators.required, validators.email],
 *   password: [validators.required, validators.minLength(6)],
 *   confirmPassword: [validators.required, validators.passwordMatch(values.password)]
 * };
 * 
 * const errors = validateForm(values, rules);
 */
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, validatorFns]) => {
    const value = values[field];
    const fieldValidators = Array.isArray(validatorFns) ? validatorFns : [validatorFns];
    
    // Skip validation if field is not in values and not required
    if (value === undefined && !fieldValidators.includes(validators.required)) {
      return;
    }
    
    for (const validator of fieldValidators) {
      if (typeof validator !== 'function') {
        console.warn(`Invalid validator for field ${field}:`, validator);
        continue;
      }
      
      const error = validator(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error
      }
    }
  });
  
  return errors;
};

/**
 * Validate a single field
 * @param {*} value - Field value
 * @param {Array|Function} validators - Validator function(s)
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (value, validators) => {
  const validatorFns = Array.isArray(validators) ? validators : [validators];
  
  for (const validator of validatorFns) {
    if (typeof validator !== 'function') {
      console.warn('Invalid validator:', validator);
      continue;
    }
    
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  
  return null;
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object from validateForm
 * @returns {boolean} True if form has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Common validation rule sets for common form types
 */
export const commonRules = {
  email: [validators.required, validators.email],
  password: [validators.required, validators.passwordStrength],
  passwordConfirm: (password) => [validators.required, validators.passwordMatch(password)],
  name: [validators.required, validators.minLength(2), validators.maxLength(100)],
  title: [validators.required, validators.minLength(3), validators.maxLength(200)],
  description: [validators.maxLength(1000)],
  quantity: [validators.required, validators.number, validators.min(0)],
  date: [validators.required, validators.date]
};

