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
├── web-interface/                 # Web-based user management interface
│   ├── src/                       # React source code
│   │   ├── components/           # React components
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Register.jsx      # Registration page
│   │   │   ├── Dashboard.jsx     # User profile dashboard
│   │   │   ├── Auth.css          # Auth component styles
│   │   │   └── Dashboard.css     # Dashboard styles
│   │   ├── firebase/             # Firebase configuration
│   │   │   └── config.js         # Firebase web config
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # Entry point
│   │   ├── index.css             # Global styles
│   │   └── App.css               # App styles
│   ├── Dockerfile                # Docker build configuration
│   ├── docker-compose.yml        # Docker Compose configuration
│   ├── nginx.conf                # Nginx server configuration
│   ├── vite.config.js            # Vite build configuration
│   ├── package.json              # Web dependencies
│   ├── index.html                # HTML template
│   └── README.md                 # Web interface documentation
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
    │   ├── Events/
    │   │   ├── EventCard.js              # Event display card
    │   │   └── EventForm.js              # Event creation/edit form
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
    │   ├── Event.js              # Event model
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
    │   ├── EventsScreen.js       # Events management
    │   ├── HistoryScreen.js       # Task history
    │   ├── ManagementScreen.js    # Management and statistics dashboard
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
        ├── dataSourceCache.js    # Data source caching (5 min expiry)
        ├── eventNotificationService.js # Event notifications (expo-notifications)
        ├── googleAuthService.js   # Google authentication
        ├── historyService.js     # Task history tracking
        ├── imageService.js       # Image picker and Firebase Storage upload
        ├── notificationService.js # Task notifications (expo-notifications)
        ├── shoppingListService.js # Shopping list operations
        ├── taskCache.js          # Task caching service (AsyncStorage, 5 min expiry)
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

### Real-time Data Sync with Caching
```
Screen Component
  ├─> Load cached data (AsyncStorage) → Instant display
  └─> Entity.onSnapshot(callback)
       └─> Firebase onValue listener
            ├─> Update cache with fresh data
            └─> Auto-update component state
                 └─> Re-render UI
```

### Caching Strategy
- **Task Cache:** AsyncStorage-based cache with incremental sync
  - Loads cached tasks immediately on screen mount for instant display
  - **Incremental Sync:** Only fetches tasks that have changed since last sync
    - Checks `hasUpdatesSince()` before fetching
    - If no updates, skips fetch entirely (uses cache)
    - If updates exist, fetches only updated tasks using `getUpdatedSince()`
    - Merges updated tasks with cached tasks
  - Updates cache when fresh data arrives from Firebase
  - Clears cache on task modifications (create/update/delete)
  - Tracks last sync timestamp per user
  - Cache key: `@task_cache_{userId}`, Last sync: `@task_last_sync_{userId}`
- **DataSource Cache:** In-memory cache with 5-minute expiry
  - Prevents repeated calls to getDataSource()
  - Cache key: userId

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
        ├── events/                # Shared events
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
  - Frequency types:
    - Daily (every X days)
    - Weekly (every X weeks) - supports day selection
    - **Biweekly** (every 2 weeks) - supports day selection
    - **Times per Week** (1-7 times per week with smart scheduling)
    - Monthly (every X months)
    - Custom (free-form description)
  - Assignment (specific user, together, separately)
  - Estimated duration
  - Auto-generation settings
  - Generation offset (days before due date)
  - Notification offset (hours before task)
- **Auto-generation**: Automatically create tasks from active templates
  - **Monthly Planning**: Generates tasks for the upcoming 30 days when templates are activated
  - **Smart Generation**: Only generates tasks for missing dates (e.g., if tasks exist for next 20 days, only generates for remaining 10 days)
  - **Background Processing**: Task generation runs in background thread, doesn't block UI
  - **Sync Indicator**: Visual indicator in top-right header shows when tasks are being generated
  - Tasks are generated automatically when:
    - App starts (Daily Tasks or Task Planning screens)
    - Template is activated
    - Template is created/updated with auto_generate enabled
- **Day Selection for Weekly/Biweekly**:
  - Weekly templates can specify which days of the week tasks should occur
  - Biweekly templates (frequency_interval: 2) can specify days that repeat every 2 weeks
  - Selected days are stored as an array of day numbers (0-6, where 0=Sunday)
  - Tasks are generated for the selected days at the specified interval
- **Smart Scheduling for Times per Week**:
  - 1 time/week = every 7 days
  - 2 times/week = alternates between 3-4 days apart
  - 3 times/week = alternates between 2-3 days apart
  - 4 times/week = alternates between 1-2 days apart
  - 5 times/week = mostly every 1 day, occasionally 2 days
  - 6 times/week = mostly every day with occasional skip
  - 7 times/week = every day
- Templates can be activated/deactivated
- Edit templates and generated tasks independently
- **Export/Import Templates** (Web Interface):
  - Export all templates to JSON file for backup or sharing
  - Import templates from JSON file to create new templates
  - Export removes internal IDs and metadata (created_by, created_date, updated_date)
  - Import validates template data (frequency_type, category, priority, etc.)
  - Import creates new templates (does not overwrite existing ones)
  - Supports partial imports with error reporting for invalid templates
  - File format: JSON array of template objects

#### Enhanced Task Features
- Template reference (`template_id`) - Link tasks to templates
- Auto-generated flag - Track which tasks were auto-created
- Scheduled date - When task was scheduled
- Estimated vs actual duration tracking
- Room/location field
- Defer functionality with defer count tracking
- Completed by tracking
- Configurable notification offset (default: 6 hours before)
- **Postpone Biweekly Tasks**: Special feature for biweekly recurring tasks
  - Allows postponing a biweekly task to next week (1 week forward)
  - When postponed, the task's `due_date` is moved forward by 1 week
  - Tracks original date (`postponed_from_date`) and postpone date (`postponed_date`)
  - Future instances continue from the postponed date, maintaining the biweekly pattern
  - Available in both mobile app (DailyTaskCard) and web interface
  - When completing a postponed biweekly task, the next instance is calculated from the postponed date, ensuring the recurrence pattern continues correctly
- **Automatic Archiving**: Tasks are automatically archived when marked as completed
  - Sets `is_archived: true`, `archived_date`, `completion_date`, and `completed_by`
  - Happens automatically in `Task.update()` when status changes to 'completed'
- **Automatic Cleanup**: Archived tasks older than 60 days are automatically deleted
  - Runs on app start (Daily Tasks screen)
  - Prevents database bloat by removing old completed tasks
  - Tasks are permanently deleted after 60 days in archive

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

### 4.1. **User Authentication Service**
**Service:** userService  
**Functions:**
- `registerUser(email, password, name)` - Register new user with email/password
- `loginUser(email, password)` - Sign in existing user
- `logoutUser()` - Sign out current user
- `resetPassword(email)` - Send password reset email via Firebase Auth
  - Validates email format
  - Uses Firebase `sendPasswordResetEmail`
  - Returns success/error status
- `subscribeToAuthChanges(callback)` - Listen to auth state changes
- `getCurrentUser()` - Get currently authenticated user

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

### 7. **Events Management** (NEW)
**Components:** EventCard, EventForm  
**Screens:** EventsScreen  
**Entity:** Event  
**Service:** eventNotificationService  
**Features:**
- **Event Types:**
  - **Informational** - Just informing partner (optional acknowledgment)
  - **Invitation** - Asking if partner wants to join (requires response)
  - **Solo OK** - Going alone is fine, but partner can acknowledge
- **Response Statuses:**
  - `pending` - Waiting for partner response (invitations)
  - `acknowledged` - Partner saw and acknowledged
  - `accepted` - Partner accepted invitation
  - `declined` - Partner declined invitation
  - `disputed` - Partner disputed/disagreed
- **Event Details:**
  - Title, description, and notes (for context)
  - Event date and time
  - Duration (optional)
  - Category (social, work, personal, family, health, travel, other)
  - Location (optional)
- **Notifications:**
  - Immediate notification for invitation-type events
  - Partner receives notification when invited to an event
  - Notification cancelled when partner responds
- **Event Management:**
  - Create, edit, and delete events
  - Real-time sync between partners
  - Events grouped by date (Today, Tomorrow, This Week, Later, Past)
  - Filter by: All, Upcoming, Pending (invitations), Past
  - Visual indicators for pending invitations
  - Quick response buttons (Accept/Decline for invitations, Acknowledge for others)
- **Availability Tracking:**
  - Both partners can see each other's events
  - Clear visibility of when partner is available/busy
  - Helps coordinate schedules and plan together

### 8. **Management & Statistics** (NEW)
**Screens:** ManagementScreen (Mobile/Expo), Management.jsx (Web)  
**Features:**
- **Partner Selection:**
  - View statistics for yourself, your partner, or both (all)
  - Partner selector shows names (falls back to email if name not available)
  - "All" option shows combined statistics for both partners
  - Only visible when partner is linked (for partner option)
- **Comprehensive Statistics (Last 60 Days):**
  - **Overview Cards:**
    - Completed tasks (archived within 60 days)
    - Pending tasks (active, not completed)
    - Overdue tasks (missed/not performed)
    - Completion rate percentage
  - **Detailed Statistics:**
    - Total tasks count
    - Tasks in progress
    - Average completion time (days)
  - **Category Breakdown:**
    - Tasks grouped by category
    - Shows completed, pending, and overdue counts per category
    - Completion rate per category with progress bars
  - **Priority Breakdown:**
    - Tasks grouped by priority (low, medium, high)
    - Shows completed, pending, and overdue counts per priority
    - Completion rate per priority with progress bars
  - **Recent Completions:**
    - List of last 10 completed tasks
    - Shows task title and completion date
  - **Detailed Task Lists:**
    - **Overdue Tasks:** Complete list of all overdue tasks with:
      - Task title and description
      - Due date and days overdue
      - Category and priority badges
      - Sorted by days overdue (most overdue first)
    - **Incomplete Tasks:** List of all pending/in-progress tasks (excluding overdue) with:
      - Task title and description
      - Due date (if set)
      - Category, priority, and status badges
      - Sorted by due date (earliest first), then by priority
- **Archive Integration:**
  - Queries both active and archived tasks
  - Filters archived tasks to last 60 days (matching archive retention policy)
  - Includes tasks that were automatically deleted after 60 days
- **Task Attribution:**
  - Identifies tasks by `assigned_to`, `completed_by`, or `created_by` fields
  - Handles "together" assignments (includes in both partners' stats)
  - Filters tasks based on selected user (myself or partner)
- **Real-time Updates:**
  - Pull-to-refresh functionality
  - Statistics recalculate when tasks change
- **UI Features:**
  - Clean, organized dashboard layout
  - Color-coded statistics (green for completed, yellow for pending, red for overdue)
  - Progress bars for completion rates
  - Responsive design for both mobile and web
  - Empty state when no data available
- **Web Interface:**
  - Full-featured Management page at `/management` route
  - Same filtering capabilities (user and date range)
  - Detailed task lists showing incomplete and overdue tasks
  - Navigation links between Dashboard and Management
  - Responsive web design matching mobile functionality

### 9. **Internationalization**
**Screens:** LanguageSelectionScreen  
**Service:** i18n  
**Supported Languages:**
- Hebrew (עברית) - RTL
- English - LTR

### 9. **Web Interface** (NEW - Complete Feature Set)
**Location:** `/web-interface/`  
**Technology:** React 18, Vite, Docker, Nginx  
**Components:** 
- Login, Register, Dashboard
- TaskTemplates (with Excel-like table editor)
- Tasks (list view with filters)
- TaskPlanning (calendar view)
- ShoppingList
- Inventory
- Archive
- Events
- Management (statistics dashboard)

**Features:**

#### User Authentication
- Login with email/password
- Registration with full name
- Forgot Password functionality
  - Password reset via email
  - Email validation
  - Success/error messaging
- Firebase Auth integration (same project as mobile app)

#### Profile Management
- View user profile (email, name, language, partner email)
- Edit profile information
- Real-time profile updates via Firebase Realtime Database
- Profile creation on first login

#### Task Templates (Excel-like Table Editor) ⭐
- **Table View:** Excel-like spreadsheet interface for managing templates
  - Add/edit/delete templates directly in table cells
  - All template fields editable: name, description, category, frequency, assignment, duration, priority, etc.
  - Inline editing with save/cancel actions
  - Real-time synchronization with Firebase
- **List View:** Card-based view of all templates
- **Features:**
  - Create multiple templates quickly by adding rows
  - Bulk operations (save all, delete multiple)
  - Visual indicators for active/inactive templates
  - Auto-generation toggle per template
  - Frequency types: daily, weekly, times per week, monthly, custom

#### Task Management
- **Tasks List:** View all tasks with filtering
  - Filter by status (all, pending, completed, overdue)
  - Filter by category
  - Complete/delete tasks
  - View task details (due date, assignment, duration, etc.)
- **Task Planning:** Calendar view
  - Monthly calendar display
  - Tasks shown on their due dates
  - Visual indicators for task priority
  - Navigate between months
  - Today highlighting

#### Shopping List
- Add items with quantity
- Mark items as purchased
- Delete items
- Real-time synchronization

#### Inventory
- Track household items
- Set current amounts
- Update quantities inline
- Low stock indicators

#### Archive
- View completed tasks
- View purchased shopping items
- Tabbed interface for different archive types
- Filter by date and type

#### Events
- Create events with date and time
- View all events in card layout
- Delete events
- Event status tracking

#### Management & Statistics
- Comprehensive task analytics
- Partner statistics
- Category breakdowns
- Completion rates

**Routes:**
- `/` - Redirects to login or dashboard
- `/login` - User login page
- `/register` - User registration page
- `/dashboard` - Main dashboard with feature navigation
- `/task-templates` - Task templates with Excel-like table editor ⭐
- `/tasks` - Tasks list view
- `/task-planning` - Calendar planning view
- `/shopping-list` - Shopping list management
- `/inventory` - Inventory tracking
- `/archive` - Archive viewer
- `/events` - Events management
- `/management` - Management and statistics dashboard

**Usage:**
```bash
# Start web interface
cd web-interface
docker compose up --build

# Access at http://localhost:3000
```

**Architecture:**
- React Router DOM for client-side routing
- Firebase Auth for authentication
- Firebase Realtime Database for all data
- Web-compatible entity classes (Task, TaskTemplate, ShoppingListItem, etc.)
- Real-time listeners for live updates
- Protected routes (redirects to login if not authenticated)
- Responsive design for desktop and mobile browsers

**Key Web-Specific Features:**
- **Excel-like Table Editor:** The most important feature - allows users to fill in task templates row by row in a spreadsheet-like interface, making it easy to bulk-create templates with all their features
- **Desktop-Optimized UI:** Larger screens allow for better table editing and data visualization
- **Real-time Sync:** All changes sync in real-time with Firebase, same as mobile app
- **Shared Data:** Uses same Firebase project, so data is shared between web and mobile interfaces

---

## 🔐 Authentication & Security

### Authentication Methods
1. **Email/Password** (Firebase Auth)
   - Registration with full name
   - Login
   - Password reset (Forgot Password)
     - Available on both mobile app and web interface
     - Sends password reset email via Firebase Auth
     - Email validation before sending reset link
     - Success/error feedback to user

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
        ├── Events
        ├── Management
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
   - Events - Manage partner events and availability
   - Management - Comprehensive statistics and analytics dashboard
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
- **Hamburger Menu Button**: Uses `HamburgerMenuButton` component that properly accesses drawer navigation via `useNavigation()` hook and `navigation.getParent()` to get the drawer navigator. Includes fallback mechanisms (`toggleDrawer()`) and error handling to ensure reliable drawer opening
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

### Web Interface
- **React Web App** - User management interface
- **Docker** - Containerized deployment
- **Nginx** - Production web server
- **Same Firebase Project** - Shared authentication and database with mobile app

### Notifications
- **Current:** Local scheduled notifications via `expo-notifications`
- **Limitation:** Push notifications not supported in Expo Go (requires development build)
- **See:** [NOTIFICATIONS.md](./NOTIFICATIONS.md) for setup instructions

---

## 📊 Performance Considerations

### Caching Implementation
- **Task Caching:** Implemented AsyncStorage-based caching with incremental sync
  - Reduces initial load time by showing cached data immediately
  - **Smart Sync:** Only fetches tasks that have changed since last sync
    - Checks for updates before fetching (avoids unnecessary network calls)
    - Fetches only updated tasks, not all tasks
    - Merges updates with cached data efficiently
  - Cache expires after 5 minutes to balance freshness and performance
  - Automatically invalidated on task modifications
  - Significantly improves perceived performance, especially on slow networks
  - Reduces bandwidth usage and Firebase read operations

### Current Issues
1. ~~Auto-refresh polling (30s intervals)~~ ✅ Replaced with real-time listeners
2. Fetching all data then filtering in-memory
3. Multiple state updates causing re-renders
4. No code splitting or lazy loading

### Optimization Strategies
1. ~~Replace polling with real-time listeners~~ ✅ Implemented
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

### Release Process

The project uses automated CI/CD for building and releasing Android APKs via GitHub Actions and EAS Build.

#### Creating a Release

1. **Run the release script:**
   ```bash
   ./scripts/release.sh
   ```

2. **Select version bump type:**
   - `1` - Patch (x.x.X): Bug fixes and minor changes
   - `2` - Minor (x.X.x): New features, backwards compatible
   - `3` - Major (X.x.x): Breaking changes

3. **The script will:**
   - Update version in `package.json` and `app.json`
   - Generate release notes from recent commits
   - Commit the version changes
   - Create a git tag (e.g., `v1.0.1`)
   - Push commits and tag to GitHub

4. **GitHub Actions automatically:**
   - Triggers on tag push
   - Builds Android APK using EAS Build
   - Downloads the APK artifact
   - Creates a GitHub Release with the APK attached
   - Includes auto-generated release notes

#### Required Setup

**GitHub Secrets:**
- `EXPO_TOKEN`: Your Expo access token (get from https://expo.dev/accounts/[your-account]/settings/access-tokens)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

**EAS Configuration:**
- `eas.json`: Contains build profiles (development, preview, production)
- Ensure EAS CLI is installed: `npm install -g eas-cli`
- Login to EAS: `eas login`

#### Build Profiles

- **development**: Development client build for internal testing
- **preview**: Preview APK for internal distribution
- **production**: Production APK for releases (used by CI/CD)

#### Workflow Files

- `.github/workflows/build-and-release.yml`: GitHub Actions workflow for automated builds
- `scripts/release.sh`: Local script for version bumping and release creation
- `eas.json`: EAS Build configuration

For detailed setup instructions, see [RELEASE_SETUP.md](./RELEASE_SETUP.md).

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
13. ✅ Task Planning screen now auto-generates tasks from active templates on load (November 2024)
14. ✅ "Create from Template" modal now shows only active templates using real-time listener (November 2024)
15. ✅ Task Planning screen now uses real-time template updates instead of one-time fetch (November 2024)
16. ✅ Monthly task generation: Active templates automatically generate tasks for upcoming 30 days (December 2024)
17. ✅ Times per Week frequency option added with smart scheduling (1-7 times/week) (December 2024)
18. ✅ Tasks auto-generate when templates are activated or created with auto_generate enabled (December 2024)
19. ✅ Automatic task archiving: Tasks automatically archived when completed (December 2024)
20. ✅ Automatic cleanup: Archived tasks older than 60 days automatically deleted to save storage (December 2024)

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
3. ~~Advanced caching strategy~~ ✅ Implemented (taskCache.js)
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

### Web Interface (December 2024)
- **React Web Application**: Full-featured web interface for user management
- **Docker Deployment**: Containerized with Docker and Docker Compose
- **User Authentication**: Login and registration using Firebase Auth
- **Profile Management**: View and edit user profile (name, language, partner email)
- **Real-time Updates**: Live profile synchronization with Firebase Realtime Database
- **Modern UI**: Clean, responsive design with gradient backgrounds
- **Production Ready**: Nginx server with optimized build and caching

