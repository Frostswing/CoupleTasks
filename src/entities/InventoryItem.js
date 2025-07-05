import { database } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue, 
  query, 
  orderByChild,
  equalTo,
  orderByKey
} from 'firebase/database';
import { getCurrentUser, getDataSource } from '../services/userService';
import { autoDetectCategory, getDefaultUnitForCategory } from '../constants/categories';

export class InventoryItem {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.category = data.category || 'other';
    this.current_amount = data.current_amount || 0;
    this.minimum_amount = data.minimum_amount || 1;
    this.unit = data.unit || 'pieces';
    this.icon_url = data.icon_url || '';
    this.last_purchased = data.last_purchased || null;
    this.purchase_frequency = data.purchase_frequency || 0;
    this.created_date = data.created_date || data.createdAt || new Date().toISOString();
    this.updated_date = data.updated_date || data.updatedAt || new Date().toISOString();
  }

  static async create(itemData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to create inventory items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemsRef = ref(database, `${dataSource.path}/inventory_items`);
      const newItemRef = push(itemsRef);

      // Auto-detect category if not provided
      const detectedCategory = itemData.category || autoDetectCategory(itemData.name);
      
      // Auto-set unit based on category if not provided
      const defaultUnit = itemData.unit || getDefaultUnitForCategory(detectedCategory);

      const itemWithDefaults = {
        ...itemData,
        created_by: user.uid,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        category: detectedCategory,
        current_amount: itemData.current_amount || 0,
        minimum_amount: itemData.minimum_amount || 1,
        unit: defaultUnit,
        purchase_frequency: itemData.purchase_frequency || 0
      };

      await set(newItemRef, itemWithDefaults);
      return new InventoryItem({ id: newItemRef.key, ...itemWithDefaults });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to get inventory items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemRef = ref(database, `${dataSource.path}/inventory_items/${id}`);
      const snapshot = await get(itemRef);
      
      if (snapshot.exists()) {
        return new InventoryItem({ id: snapshot.key, ...snapshot.val() });
      }
      return null;
    } catch (error) {
      console.error('Error getting inventory item:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to update inventory items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemRef = ref(database, `${dataSource.path}/inventory_items/${id}`);
      await update(itemRef, {
        ...updates,
        updated_date: new Date().toISOString(),
        updated_by: user.uid
      });

      // Check if item needs to be auto-added to shopping list
      if (updates.current_amount !== undefined) {
        const item = await this.getById(id);
        if (item && item.current_amount < item.minimum_amount) {
          await this.autoAddToShoppingList(item);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  static async autoAddToShoppingList(inventoryItem) {
    try {
      const { ShoppingListItem } = await import('./ShoppingListItem');
      
      // Check if item is already in shopping list
      const existingItems = await ShoppingListItem.filter({
        name: inventoryItem.name,
        is_purchased: false,
        is_archived: false
      });
      
      if (existingItems.length === 0) {
        // Add to shopping list
        await ShoppingListItem.create({
          name: inventoryItem.name,
          category: inventoryItem.category,
          quantity: inventoryItem.minimum_amount - inventoryItem.current_amount,
          unit: inventoryItem.unit,
          auto_added: true,
          icon_url: inventoryItem.icon_url
        });
      }
    } catch (error) {
      console.error('Error auto-adding to shopping list:', error);
    }
  }

  static async autoAddLowStockItems() {
    try {
      const user = getCurrentUser();
      if (!user) return;

      const allItems = await this.list();
      const lowStockItems = allItems.filter(item => 
        item.current_amount < item.minimum_amount
      );

      for (const item of lowStockItems) {
        await this.autoAddToShoppingList(item);
      }

      return lowStockItems.length;
    } catch (error) {
      console.error('Error auto-adding low stock items:', error);
      return 0;
    }
  }

  static async delete(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to delete inventory items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemRef = ref(database, `${dataSource.path}/inventory_items/${id}`);
      await remove(itemRef);
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  static async filter(filters = {}, orderField = 'created_date', orderDirection = 'desc') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to filter inventory items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemsRef = ref(database, `${dataSource.path}/inventory_items`);
      const snapshot = await get(itemsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      let items = Object.entries(data).map(([id, itemData]) => 
        new InventoryItem({ id, ...itemData })
      );

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value['$ne']) {
          // Handle not equal queries
          items = items.filter(item => item[key] !== value['$ne']);
        } else if (value && typeof value === 'object' && value['$in']) {
          // Handle "in" queries for arrays
          items = items.filter(item => value['$in'].includes(item[key]));
        } else if (value !== undefined && value !== null && value !== '') {
          items = items.filter(item => item[key] === value);
        }
      });

      // Apply sorting
      const sortField = orderField.startsWith('-') ? orderField.substring(1) : orderField;
      const sortDirection = orderField.startsWith('-') ? 'desc' : orderDirection;
      
      items.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
        
        if (sortDirection === 'desc') {
          return bValue > aValue ? 1 : (bValue < aValue ? -1 : 0);
        } else {
          return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        }
      });

      return items;
    } catch (error) {
      console.error('Error filtering inventory items:', error);
      throw error;
    }
  }

  static async getByCategory() {
    try {
      const allItems = await this.list();
      const byCategory = {};
      
      allItems.forEach(item => {
        if (!byCategory[item.category]) {
          byCategory[item.category] = [];
        }
        byCategory[item.category].push(item);
      });

      return byCategory;
    } catch (error) {
      console.error('Error grouping by category:', error);
      return {};
    }
  }

  static async list(orderField = 'created_date') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to list inventory items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemsRef = ref(database, `${dataSource.path}/inventory_items`);
      const snapshot = await get(itemsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      let items = Object.entries(data).map(([id, itemData]) => 
        new InventoryItem({ id, ...itemData })
      );

      // Apply sorting
      const sortField = orderField.startsWith('-') ? orderField.substring(1) : orderField;
      const sortDirection = orderField.startsWith('-') ? 'desc' : 'asc';
      
      items.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
        
        if (sortDirection === 'desc') {
          return bValue > aValue ? 1 : (bValue < aValue ? -1 : 0);
        } else {
          return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        }
      });

      return items;
    } catch (error) {
      console.error('Error listing inventory items:', error);
      throw error;
    }
  }

  static onSnapshot(callback, filters = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        callback([]);
        return () => {};
      }

      let unsubscribe = () => {};

      getDataSource(user.uid).then((dataSource) => {
        if (!dataSource.success) {
          console.error('Error getting data source:', dataSource.error);
          callback([]);
          return;
        }

        const itemsRef = ref(database, `${dataSource.path}/inventory_items`);
        
        const unsubscribeFunc = onValue(
          itemsRef,
          (snapshot) => {
            const data = snapshot.val() || {};
            let items = Object.entries(data).map(([id, itemData]) => 
              new InventoryItem({ id, ...itemData })
            );

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value && typeof value === 'object' && value['$ne']) {
                items = items.filter(item => item[key] !== value['$ne']);
              } else if (value !== undefined && value !== null && value !== '') {
                items = items.filter(item => item[key] === value);
              }
            });

            callback(items);
          },
          (error) => {
            console.error('Error in inventory item listener:', error);
            callback([]);
          }
        );

        unsubscribe = unsubscribeFunc;
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up inventory item listener:', error);
      return () => {};
    }
  }
} 