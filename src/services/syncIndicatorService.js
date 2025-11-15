/**
 * Service for managing global sync indicator state
 * Allows any component to show/hide sync status
 */
class SyncIndicatorService {
  constructor() {
    this.listeners = new Set();
    this.isSyncing = false;
    this.syncMessage = '';
  }

  /**
   * Subscribe to sync state changes
   * @param {Function} callback - Function called when sync state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    // Immediately call with current state
    callback({ isSyncing: this.isSyncing, message: this.syncMessage });
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Set sync state
   * @param {boolean} isSyncing - Whether sync is in progress
   * @param {string} message - Optional message to display
   */
  setSyncing(isSyncing, message = '') {
    this.isSyncing = isSyncing;
    this.syncMessage = message;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({ isSyncing: this.isSyncing, message: this.syncMessage });
      } catch (error) {
        console.error('Error notifying sync indicator listener:', error);
      }
    });
  }

  /**
   * Get current sync state
   */
  getState() {
    return {
      isSyncing: this.isSyncing,
      message: this.syncMessage
    };
  }
}

export default new SyncIndicatorService();

