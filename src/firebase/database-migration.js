import { database } from './config';
import { ref, get, set, update, remove } from 'firebase/database';
import { DB_PATHS, DEFAULT_DATA } from './database-schema';

const MIGRATIONS = {
  '1.0.0': {
    description: 'Initial database setup with categories and units',
    migrate: async () => {
      // Initialize categories and units
      const updates = {};
      updates[DB_PATHS.categories] = DEFAULT_DATA.categories;
      updates[DB_PATHS.units] = DEFAULT_DATA.units;
      updates['app_metadata/last_migration'] = new Date().toISOString();
      
      await update(ref(database), updates);
      console.log('✅ Migration 1.0.0 completed');
    }
  },
  
  '1.1.0': {
    description: 'Add location field to inventory items',
    migrate: async () => {
      // This would add location field to existing inventory items
      console.log('✅ Migration 1.1.0 completed (placeholder)');
    }
  }
};

// Run database migrations
export const runMigrations = async () => {
  try {
    console.log('🔄 Checking for database migrations...');
    
    const currentVersionRef = ref(database, DB_PATHS.dbVersion);
    const versionSnapshot = await get(currentVersionRef);
    const currentVersion = versionSnapshot.exists() ? versionSnapshot.val() : '0.0.0';
    
    console.log(`Current database version: ${currentVersion}`);
    
    const migrationVersions = Object.keys(MIGRATIONS).sort();
    let migrationsRun = 0;
    
    for (const version of migrationVersions) {
      if (compareVersions(version, currentVersion) > 0) {
        console.log(`🔄 Running migration ${version}: ${MIGRATIONS[version].description}`);
        await MIGRATIONS[version].migrate();
        await set(currentVersionRef, version);
        migrationsRun++;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('✅ Database is up to date');
    } else {
      console.log(`✅ Completed ${migrationsRun} migrations`);
    }
    
    return { success: true, migrationsRun };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// Compare version strings
const compareVersions = (a, b) => {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  
  return 0;
};

// Backup user data
export const backupUserData = async (userId) => {
  try {
    console.log(`🔄 Creating backup for user: ${userId}`);
    
    const userData = {};
    
    // Backup user profile
    const profileSnapshot = await get(ref(database, DB_PATHS.userProfile(userId)));
    if (profileSnapshot.exists()) {
      userData.profile = profileSnapshot.val();
    }
    
    // Backup user tasks
    const tasksSnapshot = await get(ref(database, DB_PATHS.userTasks(userId)));
    if (tasksSnapshot.exists()) {
      userData.tasks = tasksSnapshot.val();
    }
    
    // Backup user shopping list
    const shoppingSnapshot = await get(ref(database, DB_PATHS.userShopping(userId)));
    if (shoppingSnapshot.exists()) {
      userData.shopping_list_items = shoppingSnapshot.val();
    }
    
    // Backup user inventory
    const inventorySnapshot = await get(ref(database, DB_PATHS.userInventory(userId)));
    if (inventorySnapshot.exists()) {
      userData.inventory_items = inventorySnapshot.val();
    }
    
    const backupData = {
      userId,
      timestamp: new Date().toISOString(),
      data: userData
    };
    
    // Store backup in special backup location
    await set(ref(database, `backups/users/${userId}/${Date.now()}`), backupData);
    
    console.log('✅ User backup completed');
    return { success: true, backup: backupData };
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return { success: false, error: error.message };
  }
};

// Restore user data from backup
export const restoreUserData = async (userId, backupTimestamp) => {
  try {
    console.log(`🔄 Restoring user data: ${userId} from ${backupTimestamp}`);
    
    const backupRef = ref(database, `backups/users/${userId}/${backupTimestamp}`);
    const backupSnapshot = await get(backupRef);
    
    if (!backupSnapshot.exists()) {
      throw new Error('Backup not found');
    }
    
    const backup = backupSnapshot.val();
    const userData = backup.data;
    
    const updates = {};
    
    if (userData.profile) {
      updates[DB_PATHS.userProfile(userId)] = userData.profile;
    }
    
    if (userData.tasks) {
      updates[DB_PATHS.userTasks(userId)] = userData.tasks;
    }
    
    if (userData.shopping_list_items) {
      updates[DB_PATHS.userShopping(userId)] = userData.shopping_list_items;
    }
    
    if (userData.inventory_items) {
      updates[DB_PATHS.userInventory(userId)] = userData.inventory_items;
    }
    
    await update(ref(database), updates);
    
    console.log('✅ User data restored');
    return { success: true };
  } catch (error) {
    console.error('❌ Restore failed:', error);
    return { success: false, error: error.message };
  }
};

// Clean up old data
export const cleanupOldData = async () => {
  try {
    console.log('🔄 Starting cleanup of old data...');
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days ago
    
    let itemsDeleted = 0;
    
    // Clean up old backups (keep only last 10 backups per user)
    const backupsRef = ref(database, 'backups/users');
    const backupsSnapshot = await get(backupsRef);
    
    if (backupsSnapshot.exists()) {
      const userBackups = backupsSnapshot.val();
      
      for (const [userId, backups] of Object.entries(userBackups)) {
        const backupEntries = Object.entries(backups).sort((a, b) => b[0] - a[0]); // Sort by timestamp desc
        
        if (backupEntries.length > 10) {
          // Delete old backups
          for (let i = 10; i < backupEntries.length; i++) {
            await remove(ref(database, `backups/users/${userId}/${backupEntries[i][0]}`));
            itemsDeleted++;
          }
        }
      }
    }
    
    // TODO: Clean up old archived items across all shared spaces and user spaces
    // This would require iterating through all shared spaces and user spaces
    
    console.log(`✅ Cleanup completed. Deleted ${itemsDeleted} old items`);
    return { success: true, itemsDeleted };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

// Database health check and repair
export const repairDatabase = async () => {
  try {
    console.log('🔄 Running database repair...');
    
    let repairsRun = 0;
    
    // Repair 1: Ensure all users have required profile fields
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      
      for (const [userId, userData] of Object.entries(users)) {
        if (userData.profile) {
          const updates = {};
          let needsUpdate = false;
          
          // Ensure required fields exist
          if (!userData.profile.created_at) {
            updates[`users/${userId}/profile/created_at`] = new Date().toISOString();
            needsUpdate = true;
          }
          
          if (!userData.profile.updated_at) {
            updates[`users/${userId}/profile/updated_at`] = new Date().toISOString();
            needsUpdate = true;
          }
          
          if (!userData.profile.language_preference) {
            updates[`users/${userId}/profile/language_preference`] = 'he';
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            await update(ref(database), updates);
            repairsRun++;
          }
        }
      }
    }
    
    // Repair 2: Ensure app metadata exists
    const categoriesSnapshot = await get(ref(database, DB_PATHS.categories));
    if (!categoriesSnapshot.exists()) {
      await set(ref(database, DB_PATHS.categories), DEFAULT_DATA.categories);
      repairsRun++;
    }
    
    const unitsSnapshot = await get(ref(database, DB_PATHS.units));
    if (!unitsSnapshot.exists()) {
      await set(ref(database, DB_PATHS.units), DEFAULT_DATA.units);
      repairsRun++;
    }
    
    console.log(`✅ Database repair completed. ${repairsRun} repairs made`);
    return { success: true, repairsRun };
  } catch (error) {
    console.error('❌ Database repair failed:', error);
    return { success: false, error: error.message };
  }
};

// Export analytics data
export const exportAnalytics = async () => {
  try {
    console.log('🔄 Exporting analytics data...');
    
    const analytics = {
      timestamp: new Date().toISOString(),
      users: {
        total: 0,
        active: 0,
        sharing: 0
      },
      tasks: {
        total: 0,
        completed: 0,
        byCategory: {}
      },
      shopping: {
        total: 0,
        purchased: 0,
        byCategory: {}
      },
      inventory: {
        total: 0,
        lowStock: 0,
        byCategory: {}
      }
    };
    
    // Count users
    const usersSnapshot = await get(ref(database, 'users'));
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      analytics.users.total = Object.keys(users).length;
      
      Object.values(users).forEach(userData => {
        if (userData.profile) {
          if (userData.profile.sharing_with) {
            analytics.users.sharing++;
          }
          // Consider user active if updated in last 30 days
          const lastUpdate = new Date(userData.profile.updated_at || 0);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if (lastUpdate > thirtyDaysAgo) {
            analytics.users.active++;
          }
        }
      });
    }
    
    // Count shared spaces data
    const sharedSnapshot = await get(ref(database, 'shared'));
    if (sharedSnapshot.exists()) {
      const sharedSpaces = sharedSnapshot.val();
      
      Object.values(sharedSpaces).forEach(space => {
        // Count tasks
        if (space.tasks) {
          Object.values(space.tasks).forEach(task => {
            analytics.tasks.total++;
            if (task.status === 'completed') {
              analytics.tasks.completed++;
            }
            analytics.tasks.byCategory[task.category] = 
              (analytics.tasks.byCategory[task.category] || 0) + 1;
          });
        }
        
        // Count shopping items
        if (space.shopping_list_items) {
          Object.values(space.shopping_list_items).forEach(item => {
            analytics.shopping.total++;
            if (item.is_purchased) {
              analytics.shopping.purchased++;
            }
            analytics.shopping.byCategory[item.category] = 
              (analytics.shopping.byCategory[item.category] || 0) + 1;
          });
        }
        
        // Count inventory items
        if (space.inventory_items) {
          Object.values(space.inventory_items).forEach(item => {
            analytics.inventory.total++;
            if (item.current_amount < item.minimum_amount) {
              analytics.inventory.lowStock++;
            }
            analytics.inventory.byCategory[item.category] = 
              (analytics.inventory.byCategory[item.category] || 0) + 1;
          });
        }
      });
    }
    
    console.log('✅ Analytics export completed');
    return { success: true, analytics };
  } catch (error) {
    console.error('❌ Analytics export failed:', error);
    return { success: false, error: error.message };
  }
}; 