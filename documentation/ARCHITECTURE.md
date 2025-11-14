# CoupleTasks - System Architecture

## Overview
CoupleTasks is a React Native mobile application built with Expo, designed to help couples manage household tasks, shopping lists, and inventory together in real-time.

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** React Native (0.79.5)
- **Platform:** Expo (~53.0.8)
- **Language:** JavaScript (ES6+)
- **Navigation:** React Navigation 7 with Drawer Navigator
- **State Management:** React Hooks (useState, useEffect, useCallback, useReducer)
- **UI Components:** Native React Native components
- **Icons:** react-native-vector-icons (Material Icons)
- **Internationalization:** i18n-js with English and Hebrew support

### Backend
- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Auth with AsyncStorage persistence
- **Additional Storage:** Firestore (initialized but not actively used)
- **Local Storage:** AsyncStorage (@react-native-async-storage)

### Development Tools
- **Package Manager:** npm
- **Bundler:** Metro (Expo default)
- **Date Handling:** date-fns

---

## 📂 Project Structure

```
CoupleTasks/
├── App.js                          # Root component with auth flow
├── index.js                        # Entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── metro.config.js                 # Metro bundler config
│
├── assets/                         # Static assets (images, icons)
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
│
├── documentation/                  # Project documentation
│   ├── ARCHITECTURE.md            # This file
│   ├── CODE_REVIEW_AND_IMPROVEMENTS.md
│   ├── CONVERSION_SUMMARY.md
│   └── HISTORY_SYSTEM_README.md
│
├── NewData/                       # Legacy/prototype components (not in use)
│
└── src/                           # Source code
    ├── components/                # Reusable UI components
    │   ├── common/               # Shared components
    │   │   ├── AutoCompleteInput.js
    │   │   ├── CategorySelector.js
    │   │   ├── RecentHistoryWidget.js
    │   │   └── UnitSelector.js
    │   ├── history/
    │   │   └── HistoryStatsCard.js
    │   ├── inventory/
    │   │   └── AddInventoryItemDialog.js
    │   ├── shopping/
    │   │   ├── AddShoppingItemDialog.js
    │   │   └── ShoppingItemCard.js
    │   └── Tasks/
    │       ├── EditTaskDialog.js
    │       ├── TaskCard.js
    │       ├── TaskFilters.js
    │       └── TaskForm.js
    │
    ├── config/                    # Configuration files
    │   └── historyConfig.js      # History system configuration
    │
    ├── constants/                 # App constants
    │   └── categories.js         # Task/item categories
    │
    ├── entities/                  # Data models (Active Record pattern)
    │   ├── InventoryItem.js      # Inventory item model
    │   ├── ShoppingListItem.js   # Shopping list item model
    │   ├── Task.js               # Task model
    │   └── User.js               # User model (partial implementation)
    │
    ├── firebase/                  # Firebase configuration and utilities
    │   ├── config.js             # Firebase initialization
    │   ├── database-init.js      # Database initialization utilities
    │   ├── database-migration.js # Data migration utilities
    │   ├── database-schema.js    # Schema definitions
    │   └── database-utils.js     # Database helper functions
    │
    ├── localization/              # Internationalization
    │   ├── i18n.js               # i18n configuration
    │   └── translations/
    │       ├── en.json           # English translations
    │       └── he.json           # Hebrew translations
    │
    ├── navigation/                # Navigation configuration
    │   └── DrawerNavigator.js    # Main drawer navigation setup
    │
    ├── screens/                   # Screen components
    │   ├── AddTaskScreen.js      # Task creation screen
    │   ├── ArchiveScreen.js      # Archive viewer
    │   ├── AuthScreen.js         # Authentication (login/register)
    │   ├── DashboardScreen.js    # Main dashboard
    │   ├── HistoryScreen.js      # Task history
    │   ├── InventoryScreen.js    # Inventory management
    │   ├── LanguageSelectionScreen.js  # Language picker
    │   ├── SettingsScreen.js     # User settings
    │   ├── SharingScreen.js      # Partner linking
    │   ├── ShoppingListScreen.js # Shopping list management
    │   ├── ShoppingModeScreen.js # Shopping mode
    │   └── TasksScreen.js        # Tasks screen (legacy?)
    │
    └── services/                  # Business logic services
        ├── googleAuthService.js   # Google authentication
        ├── historyService.js     # Task history tracking
        ├── shoppingListService.js # Shopping list operations
        ├── taskService.js        # Task operations (deprecated)
        └── userService.js        # User operations
```

---

## 🔄 Data Flow Architecture

### Authentication Flow
```
App.js
  ├─> Initialize Language
  ├─> Check Firebase Status
  └─> Subscribe to Auth Changes
       ├─> No User → LanguageSelectionScreen → AuthScreen
       └─> User Exists → DrawerNavigator → Dashboard
```

### Data Access Pattern (Active Record)
```
Screen Component
  └─> Entity Class (Task, ShoppingListItem, etc.)
       └─> userService.getDataSource()
            ├─> Shared Space (if partnered)
            └─> Personal Space (if solo)
                 └─> Firebase Realtime Database
```

### Real-time Data Sync
```
Entity.onSnapshot(callback)
  └─> Firebase onValue listener
       └─> Auto-update component state
            └─> Re-render UI
```

---

## 🗄️ Database Schema

### Firebase Realtime Database Structure
```
firebase-root/
├── app_metadata/
│   ├── categories/                # App-wide category definitions
│   ├── units/                     # Measurement units
│   ├── db_version                 # Database schema version
│   └── last_migration             # Last migration timestamp
│
├── users/
│   └── {userId}/
│       ├── profile/
│       │   ├── email
│       │   ├── full_name
│       │   ├── created_at
│       │   ├── updated_at
│       │   ├── language_preference
│       │   ├── timezone
│       │   ├── partner_email
│       │   ├── shared_space_id
│       │   └── sharing_with
│       ├── tasks/                 # User's personal tasks
│       │   └── {taskId}/
│       │       ├── title
│       │       ├── description
│       │       ├── category
│       │       ├── status
│       │       ├── priority
│       │       ├── assigned_to
│       │       ├── due_date
│       │       ├── due_time
│       │       ├── recurrence_rule
│       │       ├── subtasks[]
│       │       ├── is_archived
│       │       ├── created_by
│       │       ├── created_date
│       │       └── updated_date
│       ├── shopping_list_items/   # Personal shopping list
│       ├── inventory_items/       # Personal inventory
│       └── history/               # Task completion history
│
└── shared/
    └── {sharedSpaceId}/           # Format: userId1_userId2 (sorted)
        ├── members/
        │   ├── {userId1}: true
        │   └── {userId2}: true
        ├── created_at
        ├── updated_at
        ├── tasks/                 # Shared tasks
        ├── shopping_list_items/   # Shared shopping list
        ├── inventory_items/       # Shared inventory
        └── history/               # Shared history
```

### Data Source Resolution Logic
1. Check if user has `shared_space_id` in profile
2. If yes → use `shared/{sharedSpaceId}/`
3. If no → use `users/{userId}/`

This allows seamless switching between personal and shared modes.

---

## 🎯 Core Features & Components

### 1. **Task Management**
**Components:** TaskCard, TaskForm, EditTaskDialog, TaskFilters  
**Screens:** DashboardScreen, AddTaskScreen  
**Entity:** Task  
**Features:**
- Create, read, update, delete tasks
- Task categories (household, shopping, personal, etc.)
- Priority levels (low, medium, high)
- Status tracking (pending, in_progress, completed)
- Subtasks with individual completion tracking
- Recurring tasks (daily, weekly, monthly)
- Due date and time
- Task assignment to partner
- Archive completed tasks
- Filter and sort tasks

### 2. **Shopping List**
**Components:** ShoppingItemCard, AddShoppingItemDialog  
**Screens:** ShoppingListScreen, ShoppingModeScreen  
**Entity:** ShoppingListItem  
**Features:**
- Add items with quantity and units
- Category-based organization
- Shopping mode with guided flow
- Purchase tracking
- Auto-add to inventory on purchase
- Mark items as purchased
- Archive completed shopping trips

### 3. **Inventory Management**
**Components:** AddInventoryItemDialog  
**Screens:** InventoryScreen  
**Entity:** InventoryItem  
**Features:**
- Track household items
- Monitor quantities
- Low stock alerts
- Auto-add to shopping list when low
- Category organization
- Expiration date tracking (optional)

### 4. **Partner Sharing**
**Screens:** SettingsScreen, SharingScreen  
**Service:** userService  
**Features:**
- Find partner by email
- Create shared space
- Migrate personal data to shared
- Real-time sync between partners
- Remove sharing relationship

### 5. **History & Analytics**
**Components:** HistoryStatsCard, RecentHistoryWidget  
**Screens:** HistoryScreen  
**Service:** historyService  
**Features:**
- Track completed tasks
- Completion statistics
- Category insights
- Partner contribution tracking

### 6. **Internationalization**
**Screens:** LanguageSelectionScreen  
**Service:** i18n  
**Supported Languages:**
- Hebrew (עברית) - RTL
- English - LTR

---

## 🔐 Authentication & Security

### Authentication Methods
1. **Email/Password** (Firebase Auth)
   - Registration with full name
   - Login
   - Password reset (planned)

2. **Google Sign-In** (Requires Dev Build)
   - Currently shows info message in Expo Go
   - Implemented but requires standalone build

### Security Layers
1. **Firebase Security Rules** (files: `firestore.rules`, `firebase-database-rules.json`)
2. **AsyncStorage Persistence** - Auth tokens stored securely
3. **User Session Management** - Auto-logout on auth state change

### Current Security Issues
⚠️ **Critical:** Firebase API keys exposed in source code  
→ See [CODE_REVIEW_AND_IMPROVEMENTS.md](./CODE_REVIEW_AND_IMPROVEMENTS.md#1-security-exposed-firebase-api-keys)

---

## 🔄 State Management

### Pattern: Local Component State + Firebase Listeners

**No Redux/MobX** - Uses React's built-in state management:
- `useState` - Local component state
- `useEffect` - Side effects and subscriptions
- `useCallback` - Memoized callbacks
- `useReducer` - Complex state (limited use)

### Data Fetching Patterns

#### Pattern 1: One-time Fetch
```javascript
useEffect(() => {
  const loadData = async () => {
    const tasks = await Task.filter({ is_archived: false });
    setTasks(tasks);
  };
  loadData();
}, []);
```

#### Pattern 2: Real-time Listener
```javascript
useEffect(() => {
  const unsubscribe = Task.onSnapshot((tasks) => {
    setTasks(tasks);
  }, { is_archived: { '$ne': true } });
  
  return () => unsubscribe();
}, []);
```

#### Pattern 3: Auto-refresh (Current, but should be replaced)
```javascript
useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## 🎨 UI/UX Architecture

### Design System
- **Color Palette:**
  - Primary: Purple (#8B5CF6)
  - Secondary: Blue (#2563EB)
  - Success: Green (#16A34A)
  - Danger: Red (#DC2626)
  - Warning: Orange (#F59E0B)
  - Background: Light Gray (#F8FAFC)

- **Typography:**
  - System fonts (default)
  - Font sizes: 12-32px
  - Font weights: 400, 600, 700

- **Spacing:**
  - Base unit: 4px
  - Common: 8, 12, 16, 20, 24, 32, 40, 48px

- **Shadows & Elevation:**
  - Cards: elevation 2-4
  - Modals: elevation 8
  - FABs: elevation 6-8

- **Border Radius:**
  - Small: 8px
  - Medium: 12px
  - Large: 16px
  - Round: 20-24px

### Navigation Pattern
**Drawer Navigator** (right-side for RTL support)
- Dashboard (home)
- Add Task
- Shopping List
- Shopping Mode
- Inventory
- Archive
- Settings
- Language
- Profile/Auth

### Component Patterns
1. **Screen Components** - Full-page views
2. **Dialog Components** - Modals for forms
3. **Card Components** - List items
4. **Form Components** - Input collections
5. **Widget Components** - Reusable UI elements

---

## 📱 Platform-Specific Considerations

### iOS
- Safe Area handling with `react-native-safe-area-context`
- Native date/time pickers
- Haptic feedback (planned)

### Android
- Material Design compliance
- Back button handling
- Elevation shadows

### RTL Support
- Hebrew language requires RTL layout
- Handled by `I18nManager.forceRTL()`
- Requires app reload to take effect

---

## 🧪 Testing Strategy (Planned)

### Current State
❌ No tests implemented

### Planned Approach
1. **Unit Tests** - Jest + Testing Library
   - Entity classes
   - Utility functions
   - Services

2. **Integration Tests**
   - Firebase interactions
   - Auth flow
   - Data sync

3. **E2E Tests** - Detox (planned)
   - Critical user flows
   - Cross-platform testing

---

## 🚀 Deployment Architecture

### Development
- **Platform:** Expo Go
- **Hot Reload:** Metro bundler
- **Testing:** Android emulator / iOS simulator

### Production
- **Build:** EAS Build (Expo Application Services)
- **Distribution:** Google Play Store / Apple App Store
- **Updates:** OTA updates via Expo Updates

### Environment Management
**Current:** Single environment (hardcoded)  
**Planned:** 
- Development
- Staging
- Production

---

## 🔗 Integration Points

### Firebase Services
- **Realtime Database** - Primary data store
- **Authentication** - User management
- **Firestore** - Initialized but unused (future?)

### External Services (Planned)
- Analytics (Firebase Analytics / Mixpanel)
- Error Tracking (Sentry)
- Push Notifications (Firebase Cloud Messaging)

---

## 📊 Performance Considerations

### Current Issues
1. Auto-refresh polling (30s intervals)
2. Fetching all data then filtering in-memory
3. Multiple state updates causing re-renders
4. No code splitting or lazy loading

### Optimization Strategies
1. Replace polling with real-time listeners
2. Use Firebase queries for server-side filtering
3. Implement `useMemo` and `useCallback` where appropriate
4. Add pagination for large lists
5. Optimize image loading
6. Reduce bundle size

See [CODE_REVIEW_AND_IMPROVEMENTS.md](./CODE_REVIEW_AND_IMPROVEMENTS.md) for details.

---

## 🔧 Development Workflow

### Setup
```bash
npm install
npm start
```

### Running
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web (limited support)
```

### Common Tasks
- **Clear cache:** `expo start -c`
- **Update dependencies:** `npm update`
- **Check for issues:** `expo doctor`

---

## 📝 Coding Conventions

### File Naming
- Screens: `PascalCase` + `Screen.js` (e.g., `DashboardScreen.js`)
- Components: `PascalCase.js` (e.g., `TaskCard.js`)
- Services: `camelCase` + `Service.js` (e.g., `userService.js`)
- Entities: `PascalCase.js` (e.g., `Task.js`)

### Code Style
- **Indentation:** 2 spaces
- **Quotes:** Double quotes for JSX, single for JS
- **Semicolons:** Yes
- **Trailing commas:** Yes

### Component Structure
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. Component definition
export default function ComponentName({ props }) {
  // 3. State
  const [state, setState] = useState(initial);
  
  // 4. Effects
  useEffect(() => {
    // side effects
  }, []);
  
  // 5. Handlers
  const handleAction = () => {
    // logic
  };
  
  // 6. Render
  return (
    <View>
      <Text>Content</Text>
    </View>
  );
}

// 7. Styles
const styles = StyleSheet.create({
  container: {
    // styles
  }
});
```

---

## 🐛 Known Issues & Technical Debt

### Critical
1. ⚠️ Firebase API keys in source code (SECURITY ISSUE - NOT FIXED YET)
2. ⚠️ Firebase security rules must be applied manually (see QUICK_FIX_FIREBASE_RULES.md)

### Recently Fixed ✅
1. ✅ Navigation white screen bug
2. ✅ Centralized error handling service created
3. ✅ Input validation utility added
4. ✅ Loading states added to async operations
5. ✅ Real-time Firebase listeners replacing polling
6. ✅ Duplicate task service code deprecated
7. ✅ Shopping mode infinite loading fixed
8. ✅ Infinite loop in Dashboard fixed (dependency issues)
9. ✅ Better error messages and UX

### Medium Priority
1. User entity partially implemented (works but could be enhanced)
2. Some in-memory filtering (Firebase query optimization needed)
3. Language switch requires manual app restart
4. Package version warnings (@react-native-async-storage, react-native)

---

## 🔮 Future Architecture Plans

### Short Term
1. Centralize error handling
2. Add TypeScript
3. Implement offline support
4. Add unit tests

### Long Term
1. Microservices architecture for backend
2. GraphQL API layer
3. Advanced caching strategy
4. Real-time collaboration features
5. AI-powered task suggestions

---

## 📚 Related Documentation

- [CODE_REVIEW_AND_IMPROVEMENTS.md](./CODE_REVIEW_AND_IMPROVEMENTS.md) - Detailed improvement suggestions
- [CONVERSION_SUMMARY.md](./CONVERSION_SUMMARY.md) - Web to React Native conversion notes
- [HISTORY_SYSTEM_README.md](./HISTORY_SYSTEM_README.md) - History feature documentation
- [README.md](../README.md) - Project overview

---

## 🤝 Contributing Guidelines

### Before Making Changes
1. Review this architecture document
2. Check [CODE_REVIEW_AND_IMPROVEMENTS.md](./CODE_REVIEW_AND_IMPROVEMENTS.md) for known issues
3. Follow existing code patterns
4. Update documentation if needed

### Code Review Checklist
- [ ] Follows file naming conventions
- [ ] Uses centralized error handling
- [ ] Includes loading states
- [ ] Properly handles async operations
- [ ] No console.logs in production code
- [ ] Internationalization strings in translation files
- [ ] Styles use StyleSheet, not inline
- [ ] Accessibility labels added

---

**Last Updated:** November 14, 2025  
**Version:** 1.0.0  
**Maintained By:** Development Team

