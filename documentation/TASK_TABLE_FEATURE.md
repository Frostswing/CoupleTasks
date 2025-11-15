# Task Table Feature

## Overview

The Task Table feature allows couples to manage household tasks in a structured table format, import task configurations from Excel files, and automatically generate recurring tasks from the table with a single sync operation.

## Purpose

This feature is designed for couples who want to:
- Organize household responsibilities in a comprehensive table
- Plan current and future task distributions
- Bulk import tasks from Excel spreadsheets
- Automatically generate recurring tasks without manual template creation
- Re-sync task configurations when household responsibilities change

## Key Features

### 1. Excel Import
- Import task tables from `.xlsx` or `.xls` files
- Supports Hebrew column headers (right-to-left)
- Automatically parses frequency, duration, and performer information
- Handles complex Hebrew frequency patterns

### 2. Visual Table Editor
- View all configured tasks in a clean, organized list
- Color-coded categories for easy identification
- See both current and planned task configurations side-by-side
- Edit or delete individual tasks

### 3. Manual Task Entry
- Add tasks manually without importing Excel
- Full form with all fields: category, subcategory, task name, frequencies, durations, performers
- Supports both current situation and planned changes

### 4. One-Click Sync
- Sync button generates:
  - Task templates for each table row
  - Initial tasks based on frequency settings
- Automatically cleans up old generated tasks before creating new ones
- Marks synced rows for tracking

### 5. Smart Parsing

#### Frequency Parsing (Hebrew & English)
- **Daily:** יומיומי, יומי, כל יום, daily
- **Every X Days:** פעם ב-3 ימים, every 3 days
- **Weekly:** פעם בשבוע, שבועי, weekly
- **Every X Weeks:** פעם בשבועיים, every 2 weeks
- **Monthly:** פעם בחודש, חודשי, monthly
- **Custom:** מתי שמתמלא, לפי הצורך, as needed

#### Duration Parsing
- **Minutes:** 5 דקות, 10 minutes
- **Quarter Hour:** רבע שעה
- **Half Hour:** חצי שעה
- **Hours:** שעה, 2 שעות
- **Hour and Half:** שעה וחצי
- **Two Hours:** שעתיים

#### Performer Parsing
- **Together:** ביחד, together
- **Separately:** בנפרד, separate
- **Specific Person:** עדן הבן, עדן הבת, or any custom name

## Excel File Format

### Expected Columns (Right-to-Left in Hebrew, 10 columns)

| הערות | תדירות | משך המטלה | מי מבצע | תדירות | משך המטלה | מי מבצע | מטלה | תת-קטגוריה | קטגוריה |
|-------|--------|-----------|---------|--------|-----------|---------|------|------------|---------|
| Notes | Frequency (Planned) | Duration (Planned) | Performer (Planned) | Frequency (Current) | Duration (Current) | Performer (Current) | Task Name | Subcategory | Category |

**Note:** The system uses the **Planned** columns (columns 1, 2, 3) for generating tasks. Current columns (4, 5, 6) are for documentation only. Notes (column 0) are stored but not used for task generation.

### Example Excel Data

```
קטגוריה    תת-קטגוריה    מטלה                    מי מבצע (נוכחי)    משך המטלה (נוכחי)    תדירות (נוכחי)              מי מבצע (תכנון)    משך המטלה (תכנון)    תדירות (תכנון)    הערות
ניקיון     כללי          שטיפת רצפה              עדן הבן            רבע שעה              פעם בשבוע                   ביחד               חצי שעה            פעם בשבועיים
כביסה      כללי          הפעלת מכונה             עדן הבן            חמש דקות             מתי שמתמלא                  ביחד               חמש דקות           מתי שמתמלא
תחזוקה שוטפת  כללי       קניות                  עדן הבן            שעה וחצי             פעמיים בשבוע                ביחד               שעתיים             פעם בשבועיים
```

### Supported Categories

The system maps Hebrew categories to internal categories:

| Hebrew Category | System Category |
|----------------|-----------------|
| ניקיון | cleaning |
| כביסה | laundry |
| תחזוקה שוטפת | maintenance |
| רכב | vehicle |
| חיות מחמד | pets |
| תשלומים וכלכלה | finance |
| אוכל | food |

Other categories default to "household".

## How to Use

### Step 1: Prepare Excel File

1. Create an Excel file with the format shown above
2. Include Hebrew column headers
3. Fill in tasks with:
   - Category (קטגוריה)
   - Subcategory (תת-קטגוריה)
   - Task name (מטלה)
   - Current and planned frequencies, durations, and performers
4. Save as `.xlsx` or `.xls`

### Step 2: Import to App

1. Navigate to **Task Table** from the drawer menu
2. Tap **Import Excel** button
3. Select your Excel file from device storage
4. Wait for import confirmation
5. Review imported tasks in the table

### Step 3: Edit if Needed

- Tap **Edit** icon on any task row to modify
- Tap **Add** button to add new tasks manually
- Tap **Delete** icon to remove tasks
- Use **Clear All Data** to start fresh

### Step 4: Sync to Tasks

1. Review your task table
2. Tap **Sync** button
3. Confirm sync operation
4. App will:
   - Delete all previously auto-generated tasks
   - Create task templates from table rows
   - Generate initial tasks based on frequencies
5. Success message shows templates created and tasks generated

### Step 5: Re-sync When Needed

- Make changes to your Excel file
- Import again (this clears the old table)
- Tap **Sync** to regenerate all tasks
- Old auto-generated tasks are automatically removed

## Technical Details

### Database Schema

Each task table row is stored as a `TaskTableConfig` with:

```javascript
{
  id: string,
  category: string,
  subcategory: string,
  task_name: string,
  current_frequency: string,
  current_duration: string,
  current_performer: string,
  planned_frequency: string,
  planned_duration: string,
  planned_performer: string,
  is_synced: boolean,
  last_sync_date: string,
  created_by: string,
  created_date: string,
  updated_date: string
}
```

### Sync Process

1. **Cleanup Phase:**
   - Fetch all tasks using `Task.getAll()`
   - Filter and delete tasks with `auto_generated: true` and `template_id`
   - Fetch all templates using `TaskTemplate.getAll()`
   - Filter and delete templates with `[FROM_TABLE]` in description

2. **Template Creation:**
   - For each table row:
     - Parse frequency (prefer planned, fallback to current)
     - Parse duration
     - Parse performer
     - Create task template with parsed data
     - Mark template as `[FROM_TABLE]` in description

3. **Task Generation:**
   - For each created template:
     - If `auto_generate` is enabled
     - Generate initial task using `taskGenerationService`
     - Task inherits template settings

4. **Marking Synced:**
   - Update all table rows: `is_synced: true`, `last_sync_date: now`

### Priority Assignment

Based on frequency type:
- **Daily tasks:** High priority
- **Weekly tasks:** Medium priority
- **Monthly tasks:** Medium priority
- **Custom/as-needed:** Low priority

### Auto-Generation Rules

Tasks are auto-generated for:
- Daily frequency
- Weekly frequency
- Monthly frequency

Tasks are NOT auto-generated for:
- Custom frequencies with "לפי הצורך" (as needed)
- Custom frequencies with "מתי ש" (when...)
- Custom frequencies with "as needed"

These require manual creation when needed.

## Use Cases

### Example 1: Weekly Household Chores

Import a table of weekly chores, sync to create:
- Templates for "Clean floors", "Change sheets", "Take out trash"
- Weekly recurring tasks scheduled automatically
- Notifications 6 hours before due time

### Example 2: Shared Responsibilities

Define who does what:
- Some tasks: "Together" (ביחד)
- Some tasks: "Person A" (עדן הבן)
- Some tasks: "Person B" (עדן הבת)
- Some tasks: "Separately" (בנפרד)

### Example 3: Transition Plan

Track current vs. planned task distribution:
- Current: Person A does task X every week
- Planned: Both do task X together every 2 weeks
- Import table with both configurations
- Use planned configuration for sync

### Example 4: Seasonal Adjustments

Re-import and re-sync when seasons change:
- Winter: More frequent car maintenance
- Summer: More frequent plant watering
- Update Excel file, re-import, re-sync

## Tips & Best Practices

1. **Start Simple:** Begin with a small Excel file (10-20 tasks) to test
2. **Use Consistent Naming:** Stick to Hebrew or English frequency patterns
3. **Test Frequencies:** Verify that frequency strings parse correctly
4. **Backup Excel File:** Keep your master Excel file safe for re-imports
5. **Review Before Sync:** Check the table carefully before syncing
6. **Plan Changes:** Use "Current" columns to document existing situation
7. **Use Planned Fields:** Use "Planned" columns for desired changes (these are used for sync)

## Troubleshooting

### Import Issues

**Problem:** Excel import fails
- **Solution:** Check file format (.xlsx or .xls), ensure columns are in correct order

**Problem:** Tasks missing after import
- **Solution:** Verify task name column is not empty, check for hidden rows in Excel

### Parsing Issues

**Problem:** Frequency not recognized
- **Solution:** Use standard patterns listed above, avoid complex custom strings

**Problem:** Duration shows as null
- **Solution:** Use standard duration patterns (דקות, שעה, רבע שעה, etc.)

### Sync Issues

**Problem:** Sync generates no tasks
- **Solution:** Check that planned frequency is filled in, not left empty

**Problem:** Old tasks not deleted
- **Solution:** Ensure old tasks have `auto_generated: true` flag (from previous sync)

## Future Enhancements

Potential future improvements:
- Export table to Excel
- Duplicate detection and merging
- Task history integration
- Multiple table versions
- Template vs. one-time task selection
- Bulk edit operations
- Category templates
- Smart suggestions based on common household tasks

## Related Features

- **Task Templates:** Individual template management
- **Task Generation Service:** Auto-generate tasks from templates
- **Daily Tasks Screen:** View and manage generated tasks
- **Task Planning Screen:** Schedule tasks on calendar

---

**Last Updated:** November 2024  
**Feature Version:** 1.0.0  
**Author:** Development Team

