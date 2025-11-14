import { firestore, database } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  setDoc,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { getCurrentUser, getDataSource } from './userService';

// Collections names
const COLLECTIONS = {
  SHOPPING_HISTORY: 'shopping_history',
  TASK_HISTORY: 'task_history',
  USER_SUGGESTIONS: 'user_suggestions'
};

// Save shopping item to history with timeout protection
export const saveShoppingItemToHistory = async (item) => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    // Add timeout to prevent hanging (5 seconds max)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('History save timeout')), 5000)
    );

    const savePromise = (async () => {
      const historyData = {
        user_id: user.uid,
        item_name: item.name.toLowerCase().trim(),
        display_name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        created_at: serverTimestamp(),
        frequency: 1
      };

      // Add to shopping history collection
      await addDoc(collection(firestore, COLLECTIONS.SHOPPING_HISTORY), historyData);

      // Update user suggestions
      await updateUserSuggestion(user.uid, 'shopping', item.name);
      
      console.log('✅ Shopping item saved to history:', item.name);
    })();

    await Promise.race([savePromise, timeoutPromise]);
  } catch (error) {
    // Don't throw - this is non-critical, just log the error
    console.warn('⚠️ Could not save shopping item to history (non-critical):', error.message || error);
  }
};

// Save completed task to history
export const saveTaskToHistory = async (task) => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const historyData = {
      user_id: user.uid,
      task_title: task.title.toLowerCase().trim(),
      display_title: task.title,
      category: task.category,
      priority: task.priority,
      completed_at: serverTimestamp(),
      frequency: 1
    };

    // Add to task history collection
    await addDoc(collection(firestore, COLLECTIONS.TASK_HISTORY), historyData);

    // Update user suggestions
    await updateUserSuggestion(user.uid, 'tasks', task.title);
    
    console.log('✅ Task saved to history:', task.title);
  } catch (error) {
    console.error('❌ Error saving task to history:', error);
  }
};

// Update user suggestion frequency
const updateUserSuggestion = async (userId, type, name) => {
  try {
    const suggestionId = `${userId}_${type}_${name.toLowerCase().trim()}`;
    const suggestionRef = doc(firestore, COLLECTIONS.USER_SUGGESTIONS, suggestionId);
    
    await setDoc(suggestionRef, {
      user_id: userId,
      type: type, // 'shopping' or 'tasks'
      name: name.toLowerCase().trim(),
      display_name: name,
      frequency: increment(1),
      last_used: serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error('❌ Error updating user suggestion:', error);
  }
};

// Get shopping suggestions
export const getShoppingSuggestions = async (searchText, limit_count = 10) => {
  try {
    const user = getCurrentUser();
    if (!user || !searchText.trim()) return [];

    const searchTerm = searchText.toLowerCase().trim();
    
    // Query user suggestions for shopping items
    const q = query(
      collection(firestore, COLLECTIONS.USER_SUGGESTIONS),
      where('user_id', '==', user.uid),
      where('type', '==', 'shopping'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name'),
      orderBy('frequency', 'desc'),
      limit(limit_count)
    );

    const querySnapshot = await getDocs(q);
    const suggestions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      suggestions.push({
        id: doc.id,
        name: data.display_name,
        frequency: data.frequency,
        lastUsed: data.last_used
      });
    });

    // Also get recent shopping history
    const historyQuery = query(
      collection(firestore, COLLECTIONS.SHOPPING_HISTORY),
      where('user_id', '==', user.uid),
      where('item_name', '>=', searchTerm),
      where('item_name', '<=', searchTerm + '\uf8ff'),
      orderBy('item_name'),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const historySnapshot = await getDocs(historyQuery);
    const historyItems = [];
    
    historySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!suggestions.find(s => s.name.toLowerCase() === data.item_name)) {
        historyItems.push({
          id: doc.id,
          name: data.display_name,
          category: data.category,
          unit: data.unit,
          quantity: data.quantity,
          isFromHistory: true
        });
      }
    });

    // Also get archived shopping items from Realtime Database that start with the same letter
    const archivedItems = [];
    try {
      const dataSource = await getDataSource(user.uid);
      if (dataSource.success) {
        const archivedItemsRef = ref(database, `${dataSource.path}/shopping_list_items`);
        const archivedSnapshot = await get(archivedItemsRef);
        
        if (archivedSnapshot.exists()) {
          const archivedData = archivedSnapshot.val() || {};
          const firstLetter = searchTerm.charAt(0).toLowerCase();
          
          Object.entries(archivedData).forEach(([id, item]) => {
            // Check if item is archived and starts with the same letter
            if (item.is_archived && item.name && item.name.toLowerCase().startsWith(firstLetter)) {
              const itemNameLower = item.name.toLowerCase();
              // Check if it's not already in suggestions or history
              const alreadyExists = suggestions.find(s => s.name.toLowerCase() === itemNameLower) ||
                                   historyItems.find(h => h.name.toLowerCase() === itemNameLower);
              
              if (!alreadyExists) {
                archivedItems.push({
                  id: id,
                  name: item.name,
                  category: item.category || 'other',
                  unit: item.unit || 'pieces',
                  quantity: item.quantity || 1,
                  isFromArchive: true
                });
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error getting archived items for suggestions:', error);
    }

    // Combine all suggestions, prioritizing history and archived items
    const allSuggestions = [...suggestions, ...historyItems, ...archivedItems];
    
    // Remove duplicates and limit results
    const uniqueSuggestions = [];
    const seenNames = new Set();
    
    for (const suggestion of allSuggestions) {
      const nameLower = suggestion.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower);
        uniqueSuggestions.push(suggestion);
      }
    }
    
    return uniqueSuggestions.slice(0, limit_count);
  } catch (error) {
    console.error('❌ Error getting shopping suggestions:', error);
    return [];
  }
};

// Get task suggestions
export const getTaskSuggestions = async (searchText, limit_count = 10) => {
  try {
    const user = getCurrentUser();
    if (!user || !searchText.trim()) return [];

    const searchTerm = searchText.toLowerCase().trim();
    
    // Query user suggestions for tasks
    const q = query(
      collection(firestore, COLLECTIONS.USER_SUGGESTIONS),
      where('user_id', '==', user.uid),
      where('type', '==', 'tasks'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name'),
      orderBy('frequency', 'desc'),
      limit(limit_count)
    );

    const querySnapshot = await getDocs(q);
    const suggestions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      suggestions.push({
        id: doc.id,
        title: data.display_name,
        frequency: data.frequency,
        lastUsed: data.last_used
      });
    });

    // Also get recent task history
    const historyQuery = query(
      collection(firestore, COLLECTIONS.TASK_HISTORY),
      where('user_id', '==', user.uid),
      where('task_title', '>=', searchTerm),
      where('task_title', '<=', searchTerm + '\uf8ff'),
      orderBy('task_title'),
      orderBy('completed_at', 'desc'),
      limit(5)
    );

    const historySnapshot = await getDocs(historyQuery);
    const historyItems = [];
    
    historySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!suggestions.find(s => s.title.toLowerCase() === data.task_title)) {
        historyItems.push({
          id: doc.id,
          title: data.display_title,
          category: data.category,
          priority: data.priority,
          isFromHistory: true
        });
      }
    });

    return [...suggestions, ...historyItems].slice(0, limit_count);
  } catch (error) {
    console.error('❌ Error getting task suggestions:', error);
    return [];
  }
};

// Get popular items for the user
export const getPopularItems = async (type = 'shopping', limit_count = 20) => {
  try {
    const user = getCurrentUser();
    if (!user) return [];
    
    const q = query(
      collection(firestore, COLLECTIONS.USER_SUGGESTIONS),
      where('user_id', '==', user.uid),
      where('type', '==', type),
      orderBy('frequency', 'desc'),
      limit(limit_count)
    );

    const querySnapshot = await getDocs(q);
    const items = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        name: data.display_name,
        frequency: data.frequency,
        lastUsed: data.last_used,
        type: data.type
      });
    });

    return items;
  } catch (error) {
    console.error('❌ Error getting popular items:', error);
    return [];
  }
};

// Get recent history
export const getRecentHistory = async (type = 'shopping', days = 30, limit_count = 50) => {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let collectionName, dateField;
    if (type === 'shopping') {
      collectionName = COLLECTIONS.SHOPPING_HISTORY;
      dateField = 'created_at';
    } else {
      collectionName = COLLECTIONS.TASK_HISTORY;
      dateField = 'completed_at';
    }
    
    const q = query(
      collection(firestore, collectionName),
      where('user_id', '==', user.uid),
      where(dateField, '>=', Timestamp.fromDate(cutoffDate)),
      orderBy(dateField, 'desc'),
      limit(limit_count)
    );

    const querySnapshot = await getDocs(q);
    const items = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        ...data,
        date: data[dateField]?.toDate() || new Date()
      });
    });

    return items;
  } catch (error) {
    console.error('❌ Error getting recent history:', error);
    return [];
  }
};

// Smart suggestions based on context
export const getSmartSuggestions = async (context = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    const suggestions = [];
    
    // Get suggestions based on day of week
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Weekend suggestions
    if (isWeekend && context.type === 'tasks') {
      const weekendTasks = [
        'ניקוי הבית',
        'כביסה',
        'קניות שבועיות',
        'בישול ארוחת שבת',
        'ארגון הבית'
      ];
      suggestions.push(...weekendTasks.map(task => ({ title: task, isSmartSuggestion: true })));
    }
    
    // Time-based suggestions for shopping
    if (context.type === 'shopping') {
      const hour = new Date().getHours();
      
      if (hour >= 6 && hour <= 11) {
        // Morning suggestions
        suggestions.push(
          { name: 'לחם', category: 'grains', isSmartSuggestion: true },
          { name: 'חלב', category: 'dairy', isSmartSuggestion: true },
          { name: 'ביצים', category: 'dairy', isSmartSuggestion: true }
        );
      } else if (hour >= 17 && hour <= 20) {
        // Evening suggestions
        suggestions.push(
          { name: 'ירקות לסלט', category: 'produce', isSmartSuggestion: true },
          { name: 'בשר לארוחת ערב', category: 'meat', isSmartSuggestion: true }
        );
      }
    }
    
    return suggestions.slice(0, 5);
  } catch (error) {
    console.error('❌ Error getting smart suggestions:', error);
    return [];
  }
};

// Cleanup old history (run periodically)
export const cleanupOldHistory = async () => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    // Keep only last 6 months of history
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    
    // This would typically be done with a cloud function
    // For now, we'll just log it
    console.log('🧹 Cleanup old history - would delete items older than:', cutoffDate);
    
    // TODO: Implement actual cleanup with batch operations
    
  } catch (error) {
    console.error('❌ Error cleaning up old history:', error);
  }
};

// Export shopping history for user
export const exportUserHistory = async () => {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    const [shoppingHistory, taskHistory, suggestions] = await Promise.all([
      getRecentHistory('shopping', 365), // Last year
      getRecentHistory('tasks', 365),
      getPopularItems('shopping', 100)
    ]);

    return {
      userId: user.uid,
      exportDate: new Date().toISOString(),
      shoppingHistory,
      taskHistory,
      suggestions,
      stats: {
        totalShoppingItems: shoppingHistory.length,
        totalTasks: taskHistory.length,
        totalSuggestions: suggestions.length
      }
    };
  } catch (error) {
    console.error('❌ Error exporting user history:', error);
    return null;
  }
}; 