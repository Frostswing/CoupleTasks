// Firebase Realtime Database Schema for CoupleTasks
// מבנה מסד הנתונים של CoupleTasks

export const DATABASE_SCHEMA = {
  // User profiles and authentication data
  users: {
    "{userId}": {
      profile: {
        email: "string",
        full_name: "string", 
        name: "string", // legacy support
        partner_email: "string|null",
        shared_space_id: "string|null",
        sharing_with: "string|null", // partner user ID
        created_at: "ISO string",
        updated_at: "ISO string",
        language_preference: "string", // 'he' | 'en'
        avatar_url: "string|null",
        timezone: "string"
      },
      // Legacy individual user data (before sharing)
      tasks: {
        "{taskId}": "Task object"
      },
      shopping_list_items: {
        "{itemId}": "ShoppingListItem object"  
      },
      inventory_items: {
        "{itemId}": "InventoryItem object"
      }
    }
  },

  // Shared spaces for couples
  shared: {
    "{sharedSpaceId}": { // format: "userId1_userId2" (alphabetically sorted)
      members: {
        "{userId1}": true,
        "{userId2}": true
      },
      created_at: "ISO string",
      updated_at: "ISO string",
      
      // Shared tasks
      tasks: {
        "{taskId}": {
          id: "string",
          title: "string",
          description: "string|null",
          status: "pending|in_progress|completed",
          priority: "low|medium|high",
          category: "string", // household, personal, work, shopping, etc.
          assigned_to: "email",
          created_by: "userId",
          updated_by: "userId|null",
          due_date: "YYYY-MM-DD|null",
          due_time: "HH:MM|null",
          recurrence_rule: "none|daily|weekly|monthly",
          next_due_date: "YYYY-MM-DD|null",
          subtasks: [
            {
              text: "string",
              is_completed: "boolean"
            }
          ],
          is_archived: "boolean",
          archived_date: "ISO string|null",
          completion_date: "ISO string|null",
          created_date: "ISO string",
          updated_date: "ISO string",
          tags: ["string"],
          location: "string|null",
          notes: "string|null"
        }
      },

      // Shared shopping list
      shopping_list_items: {
        "{itemId}": {
          id: "string",
          name: "string",
          category: "produce|dairy|meat|grains|snacks|beverages|frozen|household|personal_care|baby|pharmacy|other",
          quantity: "number",
          unit: "pieces|kg|grams|liters|ml|packages|bottles|cans|boxes|bags",
          is_purchased: "boolean",
          is_archived: "boolean",
          icon_url: "string|null",
          price: "number|null",
          brand: "string|null",
          notes: "string|null",
          added_by: "userId",
          created_by: "userId", 
          updated_by: "userId|null",
          auto_added: "boolean", // added automatically from inventory
          created_date: "ISO string",
          updated_date: "ISO string",
          purchased_date: "ISO string|null",
          archived_date: "ISO string|null"
        }
      },

      // Shared inventory
      inventory_items: {
        "{itemId}": {
          id: "string",
          name: "string",
          category: "produce|dairy|meat|grains|snacks|beverages|frozen|household|personal_care|baby|pharmacy|other",
          current_amount: "number",
          minimum_amount: "number",
          unit: "pieces|kg|grams|liters|ml|packages|bottles|cans|boxes|bags",
          icon_url: "string|null",
          location: "string|null", // fridge, pantry, bathroom, etc.
          expiry_date: "YYYY-MM-DD|null",
          last_purchased: "ISO string|null",
          purchase_frequency: "number", // days between purchases
          brand: "string|null",
          price: "number|null",
          barcode: "string|null",
          created_by: "userId",
          updated_by: "userId|null",
          created_date: "ISO string",
          updated_date: "ISO string",
          tags: ["string"]
        }
      },

      // Shopping sessions/trips
      shopping_sessions: {
        "{sessionId}": {
          id: "string",
          name: "string", // "Shopping at Rami Levy - March 15"
          store_name: "string|null",
          started_by: "userId",
          started_at: "ISO string",
          completed_at: "ISO string|null",
          total_items: "number",
          purchased_items: "number",
          total_cost: "number|null",
          items: {
            "{itemId}": {
              shopping_list_item_id: "string",
              name: "string",
              quantity: "number",
              unit: "string",
              category: "string",
              purchased: "boolean",
              price: "number|null"
            }
          }
        }
      }
    }
  },

  // App-wide settings and metadata
  app_metadata: {
    database_version: "string",
    last_migration: "ISO string",
    categories: {
      "{categoryId}": {
        id: "string",
        name_he: "string",
        name_en: "string", 
        icon: "string",
        color: "string",
        order: "number"
      }
    },
    units: {
      "{unitId}": {
        id: "string",
        name_he: "string",
        name_en: "string",
        short_name_he: "string",
        short_name_en: "string",
        type: "weight|volume|count|length"
      }
    }
  },

  // Analytics and usage data (optional)
  analytics: {
    daily_stats: {
      "{YYYY-MM-DD}": {
        active_users: "number",
        tasks_created: "number",
        tasks_completed: "number",
        shopping_items_added: "number",
        shopping_items_purchased: "number"
      }
    },
    user_activity: {
      "{userId}": {
        last_active: "ISO string",
        tasks_created: "number",
        tasks_completed: "number",
        login_count: "number",
        features_used: ["string"]
      }
    }
  }
};

// Database paths helper
export const DB_PATHS = {
  // User paths
  userProfile: (userId) => `users/${userId}/profile`,
  userTasks: (userId) => `users/${userId}/tasks`,
  userShopping: (userId) => `users/${userId}/shopping_list_items`,
  userInventory: (userId) => `users/${userId}/inventory_items`,

  // Shared paths
  sharedSpace: (spaceId) => `shared/${spaceId}`,
  sharedTasks: (spaceId) => `shared/${spaceId}/tasks`,
  sharedShopping: (spaceId) => `shared/${spaceId}/shopping_list_items`,
  sharedInventory: (spaceId) => `shared/${spaceId}/inventory_items`,
  sharedSessions: (spaceId) => `shared/${spaceId}/shopping_sessions`,

  // App metadata
  categories: 'app_metadata/categories',
  units: 'app_metadata/units',
  dbVersion: 'app_metadata/database_version'
};

// Validation schemas
export const VALIDATION_RULES = {
  task: {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { maxLength: 1000 },
    status: { enum: ['pending', 'in_progress', 'completed'] },
    priority: { enum: ['low', 'medium', 'high'] },
    category: { required: true, minLength: 1 },
    assigned_to: { required: true, format: 'email' },
    due_date: { format: 'date' },
    due_time: { format: 'time' }
  },
  
  shopping_item: {
    name: { required: true, minLength: 1, maxLength: 100 },
    category: { required: true, enum: ['produce', 'dairy', 'meat', 'grains', 'snacks', 'beverages', 'frozen', 'household', 'personal_care', 'baby', 'pharmacy', 'other'] },
    quantity: { required: true, type: 'number', min: 0.01 },
    unit: { required: true, enum: ['pieces', 'kg', 'grams', 'liters', 'ml', 'packages', 'bottles', 'cans', 'boxes', 'bags'] }
  },

  inventory_item: {
    name: { required: true, minLength: 1, maxLength: 100 },
    category: { required: true, enum: ['produce', 'dairy', 'meat', 'grains', 'snacks', 'beverages', 'frozen', 'household', 'personal_care', 'baby', 'pharmacy', 'other'] },
    current_amount: { required: true, type: 'number', min: 0 },
    minimum_amount: { required: true, type: 'number', min: 0 },
    unit: { required: true, enum: ['pieces', 'kg', 'grams', 'liters', 'ml', 'packages', 'bottles', 'cans', 'boxes', 'bags'] }
  },

  user_profile: {
    email: { required: true, format: 'email' },
    full_name: { required: true, minLength: 1, maxLength: 100 },
    partner_email: { format: 'email' }
  }
};

// Default data for new installations
export const DEFAULT_DATA = {
  categories: {
    produce: { id: 'produce', name_he: 'פירות וירקות', name_en: 'Produce', icon: 'eco', color: '#4CAF50', order: 1 },
    dairy: { id: 'dairy', name_he: 'חלב וגבינות', name_en: 'Dairy', icon: 'local-bar', color: '#2196F3', order: 2 },
    meat: { id: 'meat', name_he: 'בשר ודגים', name_en: 'Meat & Fish', icon: 'restaurant', color: '#F44336', order: 3 },
    grains: { id: 'grains', name_he: 'דגנים וקמח', name_en: 'Grains', icon: 'grain', color: '#FF9800', order: 4 },
    snacks: { id: 'snacks', name_he: 'חטיפים וממתקים', name_en: 'Snacks', icon: 'cake', color: '#E91E63', order: 5 },
    beverages: { id: 'beverages', name_he: 'משקאות', name_en: 'Beverages', icon: 'local-drink', color: '#00BCD4', order: 6 },
    frozen: { id: 'frozen', name_he: 'מוקפאים', name_en: 'Frozen', icon: 'ac-unit', color: '#9C27B0', order: 7 },
    household: { id: 'household', name_he: 'חומרי ניקוי', name_en: 'Household', icon: 'cleaning-services', color: '#607D8B', order: 8 },
    personal_care: { id: 'personal_care', name_he: 'טיפוח אישי', name_en: 'Personal Care', icon: 'face', color: '#795548', order: 9 },
    baby: { id: 'baby', name_he: 'מוצרי תינוקות', name_en: 'Baby Products', icon: 'child-care', color: '#FFEB3B', order: 10 },
    pharmacy: { id: 'pharmacy', name_he: 'בית מרקחת', name_en: 'Pharmacy', icon: 'medical-services', color: '#8BC34A', order: 11 },
    other: { id: 'other', name_he: 'אחר', name_en: 'Other', icon: 'category', color: '#9E9E9E', order: 12 }
  },

  units: {
    pieces: { id: 'pieces', name_he: 'יחידות', name_en: 'Pieces', short_name_he: 'יח׳', short_name_en: 'pcs', type: 'count' },
    kg: { id: 'kg', name_he: 'קילוגרם', name_en: 'Kilogram', short_name_he: 'ק״ג', short_name_en: 'kg', type: 'weight' },
    grams: { id: 'grams', name_he: 'גרם', name_en: 'Grams', short_name_he: 'גר׳', short_name_en: 'g', type: 'weight' },
    liters: { id: 'liters', name_he: 'ליטר', name_en: 'Liters', short_name_he: 'ל׳', short_name_en: 'L', type: 'volume' },
    ml: { id: 'ml', name_he: 'מיליליטר', name_en: 'Milliliters', short_name_he: 'מ״ל', short_name_en: 'ml', type: 'volume' },
    packages: { id: 'packages', name_he: 'אריזות', name_en: 'Packages', short_name_he: 'אריז׳', short_name_en: 'pkg', type: 'count' },
    bottles: { id: 'bottles', name_he: 'בקבוקים', name_en: 'Bottles', short_name_he: 'בק׳', short_name_en: 'btl', type: 'count' },
    cans: { id: 'cans', name_he: 'קופסאות שימורים', name_en: 'Cans', short_name_he: 'קופ׳', short_name_en: 'can', type: 'count' },
    boxes: { id: 'boxes', name_he: 'קופסאות', name_en: 'Boxes', short_name_he: 'קופ׳', short_name_en: 'box', type: 'count' },
    bags: { id: 'bags', name_he: 'שקיות', name_en: 'Bags', short_name_he: 'שק׳', short_name_en: 'bag', type: 'count' }
  }
}; 