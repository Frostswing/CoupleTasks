# CoupleTasks - System Architecture

## Overview
CoupleTasks is a React Native mobile application built with Expo, designed to help couples manage household tasks, shopping lists, and inventory together in real-time.

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** React Native (0.79.5)
- **Platform:** Expo (~53.0.8)
- **Language:** JavaScript (ES6+)
- **Navigation:** React Navigation 7 (Drawer Navigator with nested Stack Navigator)
- **State Management:** React Hooks (useState, useEffect, useCallback, useReducer)
- **UI Components:** Native React Native components
- **Icons:** react-native-vector-icons (Material Icons)
- **Internationalization:** i18n-js with English and Hebrew support

### Backend
- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Auth with AsyncStorage persistence
- **Storage:** Firebase Storage (for image uploads)
- **Additional Storage:** Firestore (initialized but not actively used)
- **Local Storage:** AsyncStorage (@react-native-async-storage)

### Development Tools
- **Package Manager:** npm
- **Bundler:** Metro (Expo default)
- **Date Handling:** date-fns
- **Notifications:** expo-notifications

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
    │       ├── CalendarView.js           # Calendar component
    │       ├── DailyTaskCard.js          # Simplified task card
    │       ├── EditTaskDialog.js
    │       ├── TaskCard.js               # Detailed task card
    │       ├── TaskFilters.js
    │       ├── TaskForm.js
    │       ├── TaskTemplateCard.js       # Template card
    │       └── TaskTemplateForm.js      # Template form
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
    │   ├── Task.js               # Task model (enhanced with template support)
    │   ├── TaskTemplate.js       # Task template model
    │   ├── TaskTableConfig.js    # Task table configuration model
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
    │   ├── DrawerNavigator.js     # Main drawer navigator with organized menu
    │   └── PlaceholderNavigator.js # Legacy placeholder (deprecated)
    │
    ├── screens/                   # Screen components
    │   ├── HomeScreen.js         # Home screen with quick access
    │   ├── AddTaskScreen.js      # Task creation screen
    │   ├── ArchiveScreen.js      # Archive viewer
    │   ├── AuthScreen.js         # Authentication (login/register)
    │   ├── DashboardScreen.js    # Main dashboard (tasks view)
    │   ├── HistoryScreen.js      # Task history
    │   ├── InventoryScreen.js    # Inventory management
    │   ├── LanguageSelectionScreen.js  # Language picker
    │   ├── SettingsScreen.js     # User settings
    │   ├── SharingScreen.js      # Partner linking
    │   ├── ShoppingListScreen.js # Shopping list management
    │   ├── ShoppingModeScreen.js # Shopping mode
    │   ├── TaskTableScreen.js    # Task table management and Excel import
    │   └── TasksScreen.js        # Tasks screen (legacy?)
    │
    └── services/                  # Business logic services
        ├── googleAuthService.js   # Google authentication
        ├── historyService.js     # Task history tracking
        ├── imageService.js       # Image picker and Firebase Storage upload
        ├── notificationService.js # Task notifications (expo-notifications)
        ├── shoppingListService.js # Shopping list operations
        ├── taskGenerationService.js # Auto-generate tasks from templates
        ├── taskSchedulingService.js # Task scheduling and date calculations
        ├── taskService.js        # Task operations (deprecated)
        ├── taskTableSyncService.js # Sync task table to templates and tasks
        ├── excelImportService.js # Import and parse Excel task tables
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
       └─> User Exists → PlaceholderNavigator → HomeScreen
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
│       │       ├── updated_date
│       │       ├── template_id              # NEW: Reference to template
│       │       ├── auto_generated            # NEW: Was auto-generated?
│       │       ├── scheduled_date            # NEW: When scheduled
│       │       ├── estimated_duration        # NEW: Estimated time
│       │       ├── actual_duration           # NEW: Actual time taken
│       │       ├── room_location             # NEW: Room/area
│       │       ├── defer_count               # NEW: Times deferred
│       │       ├── defer_until                # NEW: Deferred until date
│       │       ├── completed_by               # NEW: Who completed
│       │       └── notification_offset_hours # NEW: Notification timing
│       ├── task_templates/         # NEW: Task templates
│       │   └── {templateId}/
│       │       ├── template_name
│       │       ├── description
│       │       ├── category
│       │       ├── subcategory
│       │       ├── frequency_type            # daily, weekly, monthly, custom
│       │       ├── frequency_interval         # Every X days/weeks/months
│       │       ├── frequency_custom           # Custom frequency description
│       │       ├── assigned_to
│       │       ├── estimated_duration
│       │       ├── priority
│       │       ├── auto_generate              # Auto-create tasks?
│       │       ├── generation_offset          # Days before due date
│       │       ├── notification_offset_hours # Hours before task
│       │       ├── room_location
        │       │       ├── is_active                 # Active template?
        │       │       ├── created_by
        │       │       ├── created_date
        │       │       └── updated_date
        │       ├── task_table_config/     # NEW: Task table configuration
        │       │   └── {configId}/
        │       │       ├── category
        │       │       ├── subcategory
        │       │       ├── task_name
        │       │       ├── current_frequency
        │       │       ├── current_duration
        │       │       ├── current_performer
        │       │       ├── planned_frequency
        │       │       ├── planned_duration
        │       │       ├── planned_performer
        │       │       ├── is_synced
        │       │       ├── last_sync_date
        │       │       ├── created_by
        │       │       ├── created_date
        │       │       └── updated_date
        │       ├── shopping_list_items/   # Personal shopping list
│       │   └── {itemId}/
│       │       ├── name
│       │       ├── category
│       │       ├── quantity
│       │       ├── unit
│       │       ├── is_purchased
│       │       ├── is_archived
│       │       ├── image_url        # Firebase Storage URL for attached image
│       │       ├── link             # URL link attached to item
│       │       ├── shopping_trip_date  # Groups items from same shopping trip
│       │       ├── purchased_date
│       │       ├── created_by
│       │       ├── added_by
│       │       ├── created_date
│       │       └── updated_date
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

### 0. **Home Screen**
**Screens:** HomeScreen  
**Features:**
- Welcome screen with app branding
- Quick access cards for all major features:
  - Daily Tasks (large card) - See today's and upcoming tasks
  - Task Planning (small card) - Calendar view for planning
  - Add Task (small card) - Quick task creation
  - Task Table (optional) - Bulk task management via Excel
  - Shopping List (large card) - Manage shopping items
  - Inventory (small card) - Track household items
  - History (small card) - View completion statistics
- Direct navigation to most-used features without opening drawer
- Clean, modern UI with flexible card-based design
- ScrollView support for better mobile experience
- Robust navigation with error handling
- Cards organized in rows: large cards take full width, small cards are side-by-side
- Each card has distinct color scheme for visual clarity
- Serves as the initial route for authenticated users

### 0. **Task Table Management** (NEW)
**Components:** None (screen-only feature)
**Screens:** TaskTableScreen
**Entities:** TaskTableConfig
**Services:** excelImportService, taskTableSyncService

**Features:**
- **Excel Import:** Import household task tables from Excel files in Hebrew format
- **Visual Table Editor:** View and edit task configurations in a clean table format
- **Manual Entry:** Add/edit/delete individual task rows manually
- **Batch Sync:** One-click sync to generate task templates and tasks from entire table
- **Smart Parsing:** Automatically parse Hebrew frequency strings (יומי, שבועי, חודשי, etc.)
- **Duration Parsing:** Parse duration strings (דקות, שעה, רבע שעה, etc.)
- **Performer Parsing:** Parse performer assignments (ביחד, בנפרד, specific names)
- **Category Mapping:** Map Hebrew categories to system categories
- **Auto-cleanup:** Automatically removes old generated tasks before re-syncing
- **Sync Status Tracking:** Track which table rows have been synced
- **Template Generation:** Automatically creates task templates from table rows
- **Task Generation:** Generates initial tasks from templates based on frequency

**Excel Format (Right-to-Left Hebrew):**
```
קטגוריה | תת-קטגוריה | מטלה | מי מבצע | משך המטלה | תדירות | מי מבצע | משך המטלה | תדירות
ניקיון | כללי | ניקוי רצפות | ביחד | רבע שעה | פעם בשבוע | ביחד | חצי שעה | פעם בשבועיים
```

**Use Case:**
Couples can maintain a comprehensive household task table in Excel, import it into the app, and with one click generate recurring tasks for all household responsibilities. Changes to the table can be re-synced to update task templates and generated tasks.

### 1. **Task Management** (Renovated)
**Components:** 
- TaskCard, DailyTaskCard (simplified), TaskForm, EditTaskDialog, TaskFilters
- CalendarView (weekly/monthly calendar)
- TaskTemplateCard, TaskTemplateForm

**Screens:** 
- DailyTasksScreen (NEW - Simple daily view)
- TaskPlanningScreen (NEW - Calendar planning)
- TaskTemplatesScreen (NEW - Template management)
- DashboardScreen (Legacy - kept for compatibility)
- AddTaskScreen

**Entities:** Task, TaskTemplate

**Services:** taskGenerationService, taskSchedulingService, notificationService

**Features:**

#### Daily Tasks Screen
- **Simple, focused view** showing only relevant tasks
- Tasks automatically grouped by urgency:
  - 🔥 **Overdue** - Missed tasks
  - ⏰ **Today** - Tasks due today
  - 📅 **This Week** - Tasks due in next 7 days
  - 🔜 **Coming Soon** - Tasks due in next 14 days
- Quick actions: Complete, Defer (1, 2, 3, or 7 days)
- Auto-refresh with pull-to-refresh
- Clean, minimal UI focused on "what to do now"

#### Task Planning Screen (Calendar)
- **Weekly view** (default) with toggle to monthly view
- Visual calendar showing all tasks
- Create tasks directly on calendar dates
- Create tasks from templates
- Edit tasks inline
- Drag-and-drop support (planned)
- Task indicators on calendar dates

#### Task Templates System
- **Template-based task generation**
- Create reusable task templates with:
  - Frequency (daily, weekly, monthly, custom)
  - Assignment (specific user, together, separately)
  - Estimated duration
  - Auto-generation settings
  - Generation offset (days before due date)
  - Notification offset (hours before task)
- **Auto-generation**: Automatically create tasks from active templates
- Templates can be activated/deactivated
- Edit templates and generated tasks independently

#### Enhanced Task Features
- Template reference (`template_id`) - Link tasks to templates
- Auto-generated flag - Track which tasks were auto-created
- Scheduled date - When task was scheduled
- Estimated vs actual duration tracking
- Room/location field
- Defer functionality with defer count tracking
- Completed by tracking
- Configurable notification offset (default: 6 hours before)

#### Notifications
- **Automatic notifications** for tasks with due dates and times
- Configurable notification offset per task/template (default: 6 hours)
- Notifications scheduled automatically when tasks are created/updated
- Notifications cancelled when tasks are completed

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
- **Image Attachments:** Attach photos to shopping list items (take photo or choose from library), stored in Firebase Storage, displayed as thumbnails in item cards with full-screen viewer
- **Link Attachments:** Attach URLs/links to shopping list items for reference (e.g., product pages, recipes), displayed as clickable links in item cards
- **Shopping List Archive:** When shopping mode ends, all purchased items are grouped together by `shopping_trip_date` and archived as a complete shopping list with date
- **Smart Suggestions:** When adding items, suggests archived items that start with the same letter
- **Archive Search:** When typing in the item name field, searches through archived items with Google-like autocomplete (matches items containing the search text anywhere in the name)
- **Auto-fill from Archive:** Clicking on an archived item suggestion auto-fills the form with the item's name, category, unit, quantity, image, and link
- **Archive System:** Purchased items are archived (not deleted) so they can be suggested but don't appear in active shopping list. Images and links are preserved in archived items
- **Priority Ordering:** Archived items matching the search are prioritized in suggestions (items starting with search term appear first, then items containing the search term)

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

### 5. **Archive**
**Screens:** ArchiveScreen  
**Features:**
- **Completed Tasks:** View and restore archived completed tasks
  - Auto-deleted after 60 days
- **Shopping Lists:** View archived shopping lists grouped by date (from completed shopping trips)
  - Shows shopping trip date
  - Displays total items and purchased items count
  - Preview of first 3 items with option to see more
  - Items are grouped by `shopping_trip_date` set when shopping mode ends
  - Auto-deleted after 60 days (items with `shopping_trip_date`)
- **Archived Products:** View individual archived products (for suggestions)
  - **Kept forever** - never auto-deleted (items without `shopping_trip_date`)
  - Used for smart suggestions when adding new items
- Search functionality across all archive sections

### 6. **History & Analytics**
**Components:** HistoryStatsCard, RecentHistoryWidget  
**Screens:** HistoryScreen  
**Service:** historyService  
**Features:**
- Track completed tasks
- Completion statistics
- Category insights
- Partner contribution tracking

### 7. **Internationalization**
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
**Drawer Navigation with Nested Stack Navigator**

The app uses a Drawer Navigator (`DrawerNavigator.js`) that wraps a Stack Navigator for authenticated users. The drawer provides organized access to all screens with a custom-designed menu.

#### Navigation Structure
```
NavigationContainer (App.js)
├── Unauthenticated: Stack Navigator (Auth screen only)
└── Authenticated: Drawer Navigator
    └── Stack Navigator (all authenticated screens)
        ├── Home
        ├── Daily Tasks
        ├── Task Planning
        ├── Task Templates
        ├── Dashboard (All Tasks)
        ├── Add Task
        ├── Shopping List
        ├── Shopping Mode
        ├── Inventory
        ├── Archive
        ├── History
        ├── Settings
        ├── Sharing
        ├── Language
        └── Auth (Profile)
```

#### Drawer Menu Organization
The drawer menu is organized into logical sections:

1. **Home** - Quick access to main screen
2. **Tasks Section**
   - Daily Tasks - Today and upcoming tasks
   - Task Planning - Calendar view
   - Task Templates - Template management
   - Task Table - Bulk task import and management
   - All Tasks - Full task dashboard
   - Add Task - Quick task creation
3. **Shopping Section**
   - Shopping List - Manage items
   - Shopping Mode - Guided shopping flow
4. **Other Features**
   - Inventory - Track household items
   - Archive - View archived items
   - History - Completion analytics
5. **Settings Section**
   - Settings - App preferences
   - Partner Sharing - Link with partner
   - Language - Language selection
   - Profile - User profile and auth

#### Drawer Features
- **Custom Drawer Content**: Beautiful custom-designed drawer with sections, icons, and active state highlighting
- **User Info**: Shows user email in drawer header
- **Sign Out**: Sign out button in drawer footer with confirmation dialog
- **Active State**: Highlights currently active screen
- **Material Icons**: Uses Material Icons for all menu items
- **Internationalization**: All drawer labels support English and Hebrew

#### Navigation Implementation Notes
- Drawer Navigator wraps a Stack Navigator for authenticated users
- Unauthenticated users see only the Auth screen (no drawer)
- All screens are accessible via drawer menu items
- Screens can be navigated to programmatically using `navigation.navigate()`
- Drawer can be opened via hamburger menu button in header
- Sign out triggers auth state change, which automatically switches to Auth stack
- Navigation state properly tracks active screen for drawer highlighting

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
- **Storage** - Image file storage for shopping list items
- **Firestore** - Initialized but unused (future?)

### External Services (Planned)
- Analytics (Firebase Analytics / Mixpanel)
- Error Tracking (Sentry)
- Push Notifications (Firebase Cloud Messaging) - Currently using local scheduled notifications

### Notifications
- **Current:** Local scheduled notifications via `expo-notifications`
- **Limitation:** Push notifications not supported in Expo Go (requires development build)
- **See:** [NOTIFICATIONS.md](./NOTIFICATIONS.md) for setup instructions

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
10. ✅ Shopping items archived after purchase (for suggestions)
11. ✅ Smart suggestions from archived items that start with same letter
12. ✅ Shopping lists grouped by date in archive (shopping_trip_date)

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
- [HOME_SCREEN_REDESIGN.md](./HOME_SCREEN_REDESIGN.md) - Home screen redesign documentation (November 2024)
- [TASK_TABLE_FEATURE.md](./TASK_TABLE_FEATURE.md) - Task Table bulk import and sync feature (November 2024)
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

**Last Updated:** December 2024  
**Version:** 2.0.0  
**Maintained By:** Development Team

---

## 🆕 Recent Major Updates (v2.0.0)

### Task System Renovation (December 2024)
- **Daily Tasks Screen**: Simplified view focusing on today and upcoming tasks
- **Task Planning Screen**: Full calendar view with weekly/monthly toggle
- **Task Templates**: Reusable templates with auto-generation
- **Smart Task Generation**: Automatically create tasks from templates based on frequency
- **Notifications**: Configurable task reminders (default: 6 hours before)
- **Enhanced Task Fields**: Template references, scheduling, duration tracking, defer functionality

### Key Improvements
1. **Separation of Concerns**: Daily view for quick actions, calendar for planning
2. **Automation**: Templates reduce manual task creation
3. **Better Organization**: Tasks grouped by urgency automatically
4. **Flexibility**: Both templates and individual tasks are editable
5. **Notifications**: Never miss a task with automatic reminders

### Home Screen Redesign (November 2024)
- **Complete Redesign**: Rebuilt from scratch with focus on robustness and proper navigation
- **6 Quick Access Cards**: Daily Tasks, Task Planning, Add Task, Shopping List, Inventory, History
- **Flexible Layout**: Large cards for primary features, small cards for secondary actions
- **Modern Card Design**: Horizontal card layout with icons, descriptions, and visual hierarchy
- **ScrollView Support**: Scrollable content for better mobile experience
- **Proper Navigation**: Navigates to correct modern screens (DailyTasks, TaskPlanning) instead of outdated Dashboard
- **Error Handling**: Robust navigation with try-catch error handling
- **Visual Clarity**: Each card has unique color scheme matching app's design system
- **Data-Driven**: Cards defined in configuration array for easy maintenance

