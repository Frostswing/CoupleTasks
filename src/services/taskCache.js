/**
 * Task caching service using AsyncStorage
 * Provides fast local access to tasks while maintaining real-time updates
 * Implements incremental sync - only fetches tasks that have changed
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@task_cache_';
const CACHE_TIMESTAMP_KEY = '@task_cache_timestamp';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LAST_SYNC_KEY_PREFIX = '@task_last_sync_';

/**
 * Get cache key for a user
 */
const getCacheKey = (userId) => `${CACHE_KEY_PREFIX}${userId}`;
const getLastSyncKey = (userId) => `${LAST_SYNC_KEY_PREFIX}${userId}`;

/**
 * Get the latest updated_date from tasks
 */
const getLatestUpdateTime = (tasks) => {
  if (!tasks || tasks.length === 0) return null;
  
  const timestamps = tasks
    .map(t => t.updated_date)
    .filter(Boolean)
    .map(date => new Date(date).getTime())
    .filter(time => !isNaN(time));
  
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
};

/**
 * Save tasks to cache with last sync timestamp
 */
export const cacheTasks = async (userId, tasks) => {
  try {
    if (!userId) return;
    
    const cacheKey = getCacheKey(userId);
    const lastSyncKey = getLastSyncKey(userId);
    const latestUpdate = getLatestUpdateTime(tasks);
    
    const cacheData = {
      tasks: tasks,
      timestamp: Date.now(),
      lastSyncTimestamp: latestUpdate || new Date().toISOString()
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(lastSyncKey, latestUpdate || new Date().toISOString());
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error caching tasks:', error);
  }
};

/**
 * Get cached tasks if available and not expired
 * Returns both tasks and last sync timestamp
 */
export const getCachedTasks = async (userId) => {
  try {
    if (!userId) return null;
    
    const cacheKey = getCacheKey(userId);
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const parsed = JSON.parse(cachedData);
    const age = Date.now() - parsed.timestamp;
    
    // Return cached tasks if not expired
    if (age < CACHE_EXPIRY_MS) {
      return {
        tasks: parsed.tasks,
        lastSyncTimestamp: parsed.lastSyncTimestamp || getLatestUpdateTime(parsed.tasks)
      };
    }
    
    // Cache expired, remove it
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(getLastSyncKey(userId));
    return null;
  } catch (error) {
    console.error('Error getting cached tasks:', error);
    return null;
  }
};

/**
 * Get last sync timestamp for incremental updates
 */
export const getLastSyncTimestamp = async (userId) => {
  try {
    if (!userId) return null;
    
    const lastSyncKey = getLastSyncKey(userId);
    const timestamp = await AsyncStorage.getItem(lastSyncKey);
    return timestamp || null;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return null;
  }
};

/**
 * Clear task cache for a user
 */
export const clearTaskCache = async (userId = null) => {
  try {
    if (userId) {
      const cacheKey = getCacheKey(userId);
      const lastSyncKey = getLastSyncKey(userId);
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(lastSyncKey);
    } else {
      // Clear all task caches
      const keys = await AsyncStorage.getAllKeys();
      const taskCacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      const lastSyncKeys = keys.filter(key => key.startsWith(LAST_SYNC_KEY_PREFIX));
      await AsyncStorage.multiRemove([...taskCacheKeys, ...lastSyncKeys]);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.error('Error clearing task cache:', error);
  }
};

/**
 * Check if cache exists and is valid
 */
export const hasValidCache = async (userId) => {
  try {
    if (!userId) return false;
    
    const cacheKey = getCacheKey(userId);
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) return false;
    
    const parsed = JSON.parse(cachedData);
    const age = Date.now() - parsed.timestamp;
    
    return age < CACHE_EXPIRY_MS;
  } catch (error) {
    return false;
  }
};

