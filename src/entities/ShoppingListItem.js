import { database, storage } from '../firebase/config';
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
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { getCurrentUser, getDataSource } from '../services/userService';
import { autoDetectCategory, getDefaultUnitForCategory } from '../constants/categories';
import { saveShoppingItemToHistory } from '../services/historyService';

export class ShoppingListItem {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.category = data.category || 'other';
    this.quantity = data.quantity || 1;
    this.unit = data.unit || 'pieces';
    this.is_purchased = data.is_purchased || false;
    this.icon_url = data.icon_url || '';
    this.image_url = data.image_url || '';
    this.link = data.link || '';
    this.notes = data.notes || '';
    this.added_by = data.added_by || '';
    this.auto_added = data.auto_added || false;
    this.is_archived = data.is_archived || false;
    this.created_date = data.created_date || data.createdAt || new Date().toISOString();
    this.updated_date = data.updated_date || data.updatedAt || new Date().toISOString();
  }

  static async create(itemData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to create shopping items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      // Check if there's an archived product/item with the same name (case-insensitive)
      // Shopping list items represent actual products (e.g., "Milk", "Bread", "Cheese")
      // If found, restore the archived product instead of creating a duplicate product entry
      const itemNameLower = itemData.name.toLowerCase().trim();
      const allItems = await this.filter({});
      const archivedItem = allItems.find(item => 
        item.is_archived && 
        item.name.toLowerCase().trim() === itemNameLower
      );

      if (archivedItem) {
        console.log(`ShoppingListItem.create: Found archived product "${itemData.name}", restoring it instead of creating duplicate`);
        // Restore the archived product (unarchive it) - this is the same product that was previously purchased
        await this.update(archivedItem.id, {
          is_archived: false,
          is_purchased: false,
          quantity: itemData.quantity || archivedItem.quantity || 1,
          category: itemData.category || archivedItem.category,
          unit: itemData.unit || archivedItem.unit,
          updated_date: new Date().toISOString()
        });
        // Return the restored product/item
        return await this.getById(archivedItem.id);
      }

      // Check if there's already an active (non-archived) product/item with the same name
      // This prevents duplicate products in the shopping list
      const activeItem = allItems.find(item => 
        !item.is_archived && 
        item.name.toLowerCase().trim() === itemNameLower
      );

      if (activeItem) {
        console.log(`ShoppingListItem.create: Found active product "${itemData.name}", updating quantity instead of creating duplicate`);
        // Update quantity for the existing product instead of creating a duplicate product entry
        await this.update(activeItem.id, {
          quantity: (activeItem.quantity || 0) + (itemData.quantity || 1),
          updated_date: new Date().toISOString()
        });
        return await this.getById(activeItem.id);
      }

      // No existing item found, create new one
      const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`);
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
        quantity: itemData.quantity || 1,
        unit: defaultUnit,
        is_purchased: false,
        auto_added: itemData.auto_added || false,
        is_archived: false
      };

      await set(newItemRef, itemWithDefaults);
      return new ShoppingListItem({ id: newItemRef.key, ...itemWithDefaults });
    } catch (error) {
      console.error('Error creating shopping item:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to get shopping items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemRef = ref(database, `${dataSource.path}/shopping_list_items/${id}`);
      const snapshot = await get(itemRef);
      
      if (snapshot.exists()) {
        return new ShoppingListItem({ id: snapshot.key, ...snapshot.val() });
      }
      return null;
    } catch (error) {
      console.error('Error getting shopping item:', error);
      throw error;
    }
  }

  static async update(id, updates, options = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to update shopping items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemRef = ref(database, `${dataSource.path}/shopping_list_items/${id}`);
      
      console.log(`ShoppingListItem.update: Updating item ${id} at path ${dataSource.path}/shopping_list_items/${id}`);
      
      await update(itemRef, {
        ...updates,
        updated_date: new Date().toISOString(),
        updated_by: user.uid
      });
      
      console.log(`ShoppingListItem.update: Update completed for ${id}`);

      // Auto-update inventory and save to history when item is purchased
      // Skip if skipInventoryUpdate option is true (to prevent double updates)
      if (updates.is_purchased === true && !options.skipInventoryUpdate && !updates.is_archived) {
        console.log(`ShoppingListItem.update: Auto-updating inventory for ${id}`);
        const item = await this.getById(id);
        if (item) {
          await this.updateInventory(item);
          // Save to history for future suggestions
          await saveShoppingItemToHistory(item);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating shopping item:', error);
      throw error;
    }
  }

  static async updateInventory(shoppingItem) {
    try {
      const { InventoryItem } = await import('./InventoryItem');
      
      // Find existing inventory item with the same name
      const existingItems = await InventoryItem.filter({ name: shoppingItem.name });
      
      if (existingItems.length > 0) {
        // Update existing inventory
        const inventoryItem = existingItems[0];
        const newAmount = inventoryItem.current_amount + shoppingItem.quantity;
        
        await InventoryItem.update(inventoryItem.id, {
          current_amount: newAmount,
          last_purchased: new Date().toISOString()
        });
      } else {
        // Create new inventory item
        await InventoryItem.create({
          name: shoppingItem.name,
          category: shoppingItem.category,
          current_amount: shoppingItem.quantity,
          minimum_amount: 1,
          unit: shoppingItem.unit,
          last_purchased: new Date().toISOString(),
          icon_url: shoppingItem.icon_url
        });
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  }

  static async delete(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to delete shopping items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      // Get the item first to check for image_url
      const itemRef = ref(database, `${dataSource.path}/shopping_list_items/${id}`);
      const snapshot = await get(itemRef);
      const itemData = snapshot.val();

      // Delete image from Firebase Storage if it exists
      if (itemData && itemData.image_url) {
        try {
          // Extract filename from the storage URL
          // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...
          const imageUrl = itemData.image_url;
          const urlMatch = imageUrl.match(/\/o\/([^?]+)/);
          if (urlMatch) {
            const encodedPath = urlMatch[1];
            // Decode the path (Firebase Storage URLs are URL-encoded)
            const decodedPath = decodeURIComponent(encodedPath);
            const imageRef = storageRef(storage, decodedPath);
            await deleteObject(imageRef);
            console.log('Deleted image from storage:', decodedPath);
          }
        } catch (imageError) {
          // Log but don't fail the delete operation if image deletion fails
          console.error('Error deleting image from storage:', imageError);
        }
      }

      // Delete the item from database
      await remove(itemRef);
      return true;
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      throw error;
    }
  }

  static async filter(filters = {}, orderField = 'created_date', orderDirection = 'desc') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to filter shopping items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`);
      const snapshot = await get(itemsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      let items = Object.entries(data).map(([id, itemData]) => 
        new ShoppingListItem({ id, ...itemData })
      );

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value['$ne']) {
          // Handle not equal queries
          items = items.filter(item => item[key] !== value['$ne']);
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
      console.error('Error filtering shopping items:', error);
      throw error;
    }
  }

  static async list(orderField = 'created_date') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to list shopping items');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`);
      const snapshot = await get(itemsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      let items = Object.entries(data).map(([id, itemData]) => 
        new ShoppingListItem({ id, ...itemData })
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
      console.error('Error listing shopping items:', error);
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

        const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`);
        
        const unsubscribeFunc = onValue(
          itemsRef,
          (snapshot) => {
            const data = snapshot.val() || {};
            let items = Object.entries(data).map(([id, itemData]) => 
              new ShoppingListItem({ id, ...itemData })
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
            console.error('Error in shopping item listener:', error);
            callback([]);
          }
        );

        unsubscribe = unsubscribeFunc;
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up shopping item listener:', error);
      return () => {};
    }
  }
} 