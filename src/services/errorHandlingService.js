import { Alert } from 'react-native';
import i18n from '../localization/i18n';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, code, userMessage) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

/**
 * Error codes used throughout the application
 */
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FIREBASE_ERROR: 'FIREBASE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * Centralized error handling function
 * @param {Error|AppError} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'updateTask', 'loginUser')
 * @param {Object} options - Additional options
 * @param {boolean} options.showAlert - Whether to show alert to user (default: true)
 * @param {Function} options.onError - Custom error callback
 */
export const handleError = (error, context = '', options = {}) => {
  const { showAlert = true, onError } = options;
  
  // Log error with context
  console.error(`[${context || 'Unknown'}]`, error);
  
  let userMessage = i18n.t('common.unknownError', { defaultValue: 'An unknown error occurred' });
  let errorCode = ErrorCodes.UNKNOWN_ERROR;
  
  // Handle AppError instances
  if (error instanceof AppError) {
    userMessage = error.userMessage || i18n.t(`errors.${error.code}`, { defaultValue: error.message });
    errorCode = error.code;
  } 
  // Handle Firebase errors
  else if (error?.code) {
    errorCode = mapFirebaseErrorCode(error.code);
    userMessage = getFirebaseErrorMessage(error.code, error.message);
  }
  // Handle network errors
  else if (error?.message?.includes('network') || error?.message?.includes('Network')) {
    errorCode = ErrorCodes.NETWORK_ERROR;
    userMessage = i18n.t('errors.networkError', { defaultValue: 'Network error. Please check your connection.' });
  }
  // Handle generic errors
  else if (error?.message) {
    userMessage = error.message;
  }
  
  // Show alert to user if requested
  if (showAlert) {
    Alert.alert(
      i18n.t('common.error', { defaultValue: 'Error' }),
      userMessage
    );
  }
  
  // Call custom error handler if provided
  if (onError) {
    onError(error, errorCode, userMessage);
  }
  
  // Return error info for further processing if needed
  return {
    code: errorCode,
    message: error.message || userMessage,
    userMessage,
    originalError: error
  };
};

/**
 * Map Firebase error codes to application error codes
 */
const mapFirebaseErrorCode = (firebaseCode) => {
  const codeMap = {
    'auth/user-not-found': ErrorCodes.AUTH_REQUIRED,
    'auth/wrong-password': ErrorCodes.AUTH_REQUIRED,
    'auth/email-already-in-use': ErrorCodes.VALIDATION_ERROR,
    'auth/invalid-email': ErrorCodes.VALIDATION_ERROR,
    'auth/weak-password': ErrorCodes.VALIDATION_ERROR,
    'PERMISSION_DENIED': ErrorCodes.PERMISSION_DENIED,
    'NETWORK_ERROR': ErrorCodes.NETWORK_ERROR,
    'UNAVAILABLE': ErrorCodes.NETWORK_ERROR
  };
  
  return codeMap[firebaseCode] || ErrorCodes.FIREBASE_ERROR;
};

/**
 * Get user-friendly error message for Firebase errors
 */
const getFirebaseErrorMessage = (code, defaultMessage) => {
  const errorMessages = {
    'auth/user-not-found': i18n.t('auth.userNotFound', { defaultValue: 'User not found' }),
    'auth/wrong-password': i18n.t('auth.wrongPassword', { defaultValue: 'Incorrect password' }),
    'auth/email-already-in-use': i18n.t('auth.emailAlreadyInUse', { defaultValue: 'Email already in use' }),
    'auth/invalid-email': i18n.t('auth.invalidEmail', { defaultValue: 'Invalid email address' }),
    'auth/weak-password': i18n.t('auth.weakPassword', { defaultValue: 'Password is too weak' }),
    'PERMISSION_DENIED': i18n.t('errors.permissionDenied', { defaultValue: 'Permission denied' }),
    'NETWORK_ERROR': i18n.t('errors.networkError', { defaultValue: 'Network error. Please check your connection.' }),
    'UNAVAILABLE': i18n.t('errors.serviceUnavailable', { defaultValue: 'Service is temporarily unavailable' })
  };
  
  return errorMessages[code] || defaultMessage || i18n.t('common.unknownError', { defaultValue: 'An unknown error occurred' });
};

/**
 * Show success message to user
 * @param {string} message - Success message
 * @param {string} title - Optional title (defaults to 'Success')
 */
export const showSuccess = (message, title = null) => {
  Alert.alert(
    title || i18n.t('common.success', { defaultValue: 'Success' }),
    message
  );
};

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Optional cancel callback
 */
export const showConfirmation = (message, title, onConfirm, onCancel = null) => {
  Alert.alert(
    title || i18n.t('common.confirm', { defaultValue: 'Confirm' }),
    message,
    [
      {
        text: i18n.t('common.cancel', { defaultValue: 'Cancel' }),
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: i18n.t('common.confirm', { defaultValue: 'Confirm' }),
        style: 'destructive',
        onPress: onConfirm
      }
    ]
  );
};

