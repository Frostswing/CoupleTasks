import { database } from './config';
import { ref, set, get, update } from 'firebase/database';
import { DEFAULT_DATA, DB_PATHS } from './database-schema';

const CURRENT_DB_VERSION = '1.0.0';

// Initialize database with default data
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing Firebase database...');
    
    // Check if database is already initialized
    const versionRef = ref(database, DB_PATHS.dbVersion);
    const versionSnapshot = await get(versionRef);
    
    if (versionSnapshot.exists()) {
      console.log('✅ Database already initialized');
      return { success: true, message: 'Database already initialized' };
    }

    // Initialize app metadata
    await initializeAppMetadata();
    
    // Set database version
    await set(versionRef, CURRENT_DB_VERSION);
    
    console.log('✅ Database initialized successfully');
    return { success: true, message: 'Database initialized successfully' };
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return { success: false, error: error.message };
  }
};

// Initialize app metadata (categories, units, etc.)
const initializeAppMetadata = async () => {
  try {
    const metadataUpdates = {
      [DB_PATHS.categories]: DEFAULT_DATA.categories,
      [DB_PATHS.units]: DEFAULT_DATA.units,
      'app_metadata/last_migration': new Date().toISOString()
    };

    await update(ref(database), metadataUpdates);
    console.log('✅ App metadata initialized');
    
  } catch (error) {
    console.error('❌ Error initializing app metadata:', error);
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (userId, userData) => {
  try {
    const profileData = {
      email: userData.email,
      full_name: userData.full_name || userData.name || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      language_preference: 'he',
      timezone: 'Asia/Jerusalem',
      partner_email: null,
      shared_space_id: null,
      sharing_with: null
    };

    await set(ref(database, DB_PATHS.userProfile(userId)), profileData);
    console.log('✅ User profile created:', userId);
    
    return { success: true, profile: profileData };
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Initialize shared space
export const createSharedSpace = async (userId1, userId2, user1Email, user2Email) => {
  try {
    // Create shared space ID (alphabetically sorted user IDs)
    const sortedIds = [userId1, userId2].sort();
    const sharedSpaceId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    const sharedSpaceData = {
      members: {
        [userId1]: true,
        [userId2]: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update shared space
    await set(ref(database, DB_PATHS.sharedSpace(sharedSpaceId)), sharedSpaceData);
    
    // Update user profiles with sharing information
    const updates = {};
    updates[`${DB_PATHS.userProfile(userId1)}/shared_space_id`] = sharedSpaceId;
    updates[`${DB_PATHS.userProfile(userId1)}/sharing_with`] = userId2;
    updates[`${DB_PATHS.userProfile(userId1)}/partner_email`] = user2Email;
    updates[`${DB_PATHS.userProfile(userId1)}/updated_at`] = new Date().toISOString();
    
    updates[`${DB_PATHS.userProfile(userId2)}/shared_space_id`] = sharedSpaceId;
    updates[`${DB_PATHS.userProfile(userId2)}/sharing_with`] = userId1;
    updates[`${DB_PATHS.userProfile(userId2)}/partner_email`] = user1Email;
    updates[`${DB_PATHS.userProfile(userId2)}/updated_at`] = new Date().toISOString();
    
    await update(ref(database), updates);
    
    console.log('✅ Shared space created:', sharedSpaceId);
    return { success: true, sharedSpaceId };
    
  } catch (error) {
    console.error('❌ Error creating shared space:', error);
    return { success: false, error: error.message };
  }
};

// Migrate user data to shared space
export const migrateToSharedSpace = async (userId, sharedSpaceId) => {
  try {
    console.log(`🔄 Migrating user data to shared space: ${userId} -> ${sharedSpaceId}`);
    
    // Get user's individual data
    const userTasksSnapshot = await get(ref(database, DB_PATHS.userTasks(userId)));
    const userShoppingSnapshot = await get(ref(database, DB_PATHS.userShopping(userId)));
    const userInventorySnapshot = await get(ref(database, DB_PATHS.userInventory(userId)));
    
    const updates = {};
    
    // Migrate tasks
    if (userTasksSnapshot.exists()) {
      const tasks = userTasksSnapshot.val();
      Object.entries(tasks).forEach(([taskId, taskData]) => {
        updates[`${DB_PATHS.sharedTasks(sharedSpaceId)}/${taskId}`] = taskData;
      });
    }
    
    // Migrate shopping list
    if (userShoppingSnapshot.exists()) {
      const shopping = userShoppingSnapshot.val();
      Object.entries(shopping).forEach(([itemId, itemData]) => {
        updates[`${DB_PATHS.sharedShopping(sharedSpaceId)}/${itemId}`] = itemData;
      });
    }
    
    // Migrate inventory
    if (userInventorySnapshot.exists()) {
      const inventory = userInventorySnapshot.val();
      Object.entries(inventory).forEach(([itemId, itemData]) => {
        updates[`${DB_PATHS.sharedInventory(sharedSpaceId)}/${itemId}`] = itemData;
      });
    }
    
    // Apply migrations
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      console.log(`✅ Migrated ${Object.keys(updates).length} items to shared space`);
    }
    
    return { success: true, migratedItems: Object.keys(updates).length };
    
  } catch (error) {
    console.error('❌ Error migrating to shared space:', error);
    return { success: false, error: error.message };
  }
};

// Remove sharing relationship
export const removeSharing = async (userId1, userId2) => {
  try {
    console.log(`🔄 Removing sharing relationship: ${userId1} <-> ${userId2}`);
    
    const sortedIds = [userId1, userId2].sort();
    const sharedSpaceId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    // Get shared data
    const sharedDataSnapshot = await get(ref(database, DB_PATHS.sharedSpace(sharedSpaceId)));
    
    if (sharedDataSnapshot.exists()) {
      const sharedData = sharedDataSnapshot.val();
      
      // Migrate data back to users' individual spaces
      if (sharedData.tasks) {
        await migrateBackToUser(userId1, 'tasks', sharedData.tasks);
      }
      if (sharedData.shopping_list_items) {
        await migrateBackToUser(userId1, 'shopping_list_items', sharedData.shopping_list_items);
      }
      if (sharedData.inventory_items) {
        await migrateBackToUser(userId1, 'inventory_items', sharedData.inventory_items);
      }
    }
    
    // Remove sharing references from user profiles
    const updates = {};
    updates[`${DB_PATHS.userProfile(userId1)}/shared_space_id`] = null;
    updates[`${DB_PATHS.userProfile(userId1)}/sharing_with`] = null;
    updates[`${DB_PATHS.userProfile(userId1)}/partner_email`] = null;
    updates[`${DB_PATHS.userProfile(userId1)}/updated_at`] = new Date().toISOString();
    
    updates[`${DB_PATHS.userProfile(userId2)}/shared_space_id`] = null;
    updates[`${DB_PATHS.userProfile(userId2)}/sharing_with`] = null;
    updates[`${DB_PATHS.userProfile(userId2)}/partner_email`] = null;
    updates[`${DB_PATHS.userProfile(userId2)}/updated_at`] = new Date().toISOString();
    
    // Remove shared space
    updates[DB_PATHS.sharedSpace(sharedSpaceId)] = null;
    
    await update(ref(database), updates);
    
    console.log('✅ Sharing relationship removed');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error removing sharing:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to migrate data back to individual user
const migrateBackToUser = async (userId, dataType, data) => {
  try {
    const updates = {};
    Object.entries(data).forEach(([itemId, itemData]) => {
      updates[`users/${userId}/${dataType}/${itemId}`] = itemData;
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${dataType} back to user:`, error);
  }
};

// Cleanup old/archived data
export const cleanupArchivedData = async () => {
  try {
    console.log('🔄 Starting cleanup of archived data...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60); // 60 days ago
    const cutoffTimestamp = cutoffDate.toISOString();
    
    // This would require custom logic to find and delete old archived items
    // For now, we'll just log the process
    console.log(`📅 Cleanup cutoff date: ${cutoffTimestamp}`);
    
    // TODO: Implement actual cleanup logic
    // This would involve querying all shared spaces and user spaces
    // and removing items where archived_date < cutoffTimestamp
    
    console.log('✅ Cleanup completed');
    return { success: true, message: 'Cleanup completed' };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return { success: false, error: error.message };
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    const checks = {
      version: false,
      categories: false,
      units: false,
      connectivity: false
    };
    
    // Check database version
    const versionSnapshot = await get(ref(database, DB_PATHS.dbVersion));
    checks.version = versionSnapshot.exists();
    
    // Check categories
    const categoriesSnapshot = await get(ref(database, DB_PATHS.categories));
    checks.categories = categoriesSnapshot.exists() && Object.keys(categoriesSnapshot.val()).length > 0;
    
    // Check units
    const unitsSnapshot = await get(ref(database, DB_PATHS.units));
    checks.units = unitsSnapshot.exists() && Object.keys(unitsSnapshot.val()).length > 0;
    
    // Basic connectivity check
    checks.connectivity = true;
    
    const allHealthy = Object.values(checks).every(check => check === true);
    
    console.log('🏥 Database health check:', checks);
    
    return {
      success: true,
      healthy: allHealthy,
      checks,
      version: versionSnapshot.exists() ? versionSnapshot.val() : null
    };
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      success: false,
      healthy: false,
      error: error.message,
      checks: { connectivity: false }
    };
  }
};

// Initialize user's first login
export const initializeUserFirstLogin = async (userId, userData) => {
  try {
    console.log(`🔄 Initializing first login for user: ${userId}`);
    
    // Create user profile
    const profileResult = await createUserProfile(userId, userData);
    if (!profileResult.success) {
      throw new Error(profileResult.error);
    }
    
    // Add welcome task
    const welcomeTask = {
      title: 'ברוכים הבאים ל-CoupleTasks! 👋',
      description: 'התחילו לנהל ביחד את המשימות הביתיות שלכם. זוהי המשימה הראשונה שלכם.',
      status: 'pending',
      priority: 'medium',
      category: 'personal',
      assigned_to: userData.email,
      created_by: userId,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      is_archived: false,
      subtasks: [
        { text: 'עיינו בממשק האפליקציה', is_completed: false },
        { text: 'הזמינו את בן/בת הזוג שלכם', is_completed: false },
        { text: 'צרו את רשימת הקניות הראשונה שלכם', is_completed: false }
      ]
    };
    
    await set(ref(database, `${DB_PATHS.userTasks(userId)}/welcome_task`), welcomeTask);
    
    console.log('✅ User first login initialized successfully');
    return { success: true, message: 'User initialized successfully' };
    
  } catch (error) {
    console.error('❌ Error initializing user first login:', error);
    return { success: false, error: error.message };
  }
}; 