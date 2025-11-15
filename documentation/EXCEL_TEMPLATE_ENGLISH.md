# Excel Template Guide - English Version

## Quick Start

Create an Excel file with **exactly 10 columns** in this order (left to right):

| Column | Field Name | Required | Description | Example |
|--------|------------|----------|-------------|---------|
| A | Notes | No | Additional notes/comments | "Check garage first" |
| B | Frequency (Planned) | **Yes** | How often task should be done | "weekly", "daily", "once a week" |
| C | Duration (Planned) | No | How long task takes | "15 minutes", "half hour" |
| D | Performer (Planned) | No | Who will do it | "together", "person1", "person2" |
| E | Frequency (Current) | No | Current frequency (documentation) | "weekly", "daily" |
| F | Duration (Current) | No | Current duration (documentation) | "15 minutes" |
| G | Performer (Current) | No | Who currently does it (documentation) | "together", "person1" |
| H | Task Name | **Yes** | Name of the task | "Clean floors", "Take out trash" |
| I | Subcategory | No | Room or area | "Kitchen", "Bathroom", "General" |
| J | Category | No | Main category | "Cleaning", "Laundry", "Maintenance" |

**Important:** Only columns B, C, D (Planned) and H (Task Name) are used for generating tasks. Other columns are for documentation.

## Sample Excel File

Here's a complete example you can copy:

```
Notes | Frequency (Planned) | Duration (Planned) | Performer (Planned) | Frequency (Current) | Duration (Current) | Performer (Current) | Task Name | Subcategory | Category
------|---------------------|-------------------|---------------------|---------------------|-------------------|---------------------|-----------|-------------|----------
      | weekly              | 30 minutes        | together            | weekly              | 15 minutes        | person1             | Clean floors | Kitchen | Cleaning
      | daily               | 5 minutes         | person1             | daily               | 5 minutes         | person1             | Take out trash | General | Cleaning
      | weekly              | 1 hour            | together            | weekly              | 1 hour            | together            | Grocery shopping | General | Maintenance
      | monthly             | 20 minutes        | together            | monthly             | 20 minutes        | together            | Change bed sheets | Bedroom | Cleaning
      | as needed           | 10 minutes        | person1             | as needed           | 10 minutes        | person1             | Empty recycling | Kitchen | Cleaning
```

## Column-by-Column Guide

### Column A: Notes (Optional)
- **Purpose:** Additional comments or reminders
- **Example:** "Check garage first", "Use eco-friendly products"
- **Can be empty:** Yes

### Column B: Frequency (Planned) ⚠️ REQUIRED FOR SYNC
- **Purpose:** How often the task should be done (used for task generation)
- **Accepted formats:**
  - `daily` or `every day`
  - `weekly` or `once a week` or `every week`
  - `every 2 weeks` or `biweekly`
  - `monthly` or `once a month`
  - `every 2 months` or `every 3 months`
  - `as needed` or `when full` (won't auto-generate tasks)
- **Example:** `weekly`, `daily`, `every 2 weeks`
- **Can be empty:** No (if you want to sync tasks)

### Column C: Duration (Planned) (Optional)
- **Purpose:** How long the task takes
- **Accepted formats:**
  - `5 minutes`, `10 minutes`, `15 minutes`
  - `quarter hour` or `15 min`
  - `half hour` or `30 minutes`
  - `1 hour` or `one hour`
  - `1.5 hours` or `hour and half`
  - `2 hours`
- **Example:** `15 minutes`, `half hour`, `1 hour`
- **Can be empty:** Yes

### Column D: Performer (Planned) (Optional)
- **Purpose:** Who will do the task
- **Accepted values:**
  - `together` - Both people do it together
  - `separate` or `either` - Either person can do it
  - `person1` or any name - Specific person
  - Email address - Specific person by email
- **Example:** `together`, `person1`, `person2`
- **Can be empty:** Yes

### Column E: Frequency (Current) (Optional - Documentation Only)
- **Purpose:** Current frequency (not used for task generation)
- **Same formats as Column B**
- **Can be empty:** Yes

### Column F: Duration (Current) (Optional - Documentation Only)
- **Purpose:** Current duration (not used for task generation)
- **Same formats as Column C**
- **Can be empty:** Yes

### Column G: Performer (Current) (Optional - Documentation Only)
- **Purpose:** Who currently does it (not used for task generation)
- **Same formats as Column D**
- **Can be empty:** Yes

### Column H: Task Name ⚠️ REQUIRED
- **Purpose:** Name of the task
- **Example:** `Clean floors`, `Take out trash`, `Grocery shopping`
- **Can be empty:** No

### Column I: Subcategory (Optional)
- **Purpose:** Room or area
- **Example:** `Kitchen`, `Bathroom`, `Bedroom`, `General`
- **Can be empty:** Yes

### Column J: Category (Optional)
- **Purpose:** Main category
- **Example:** `Cleaning`, `Laundry`, `Maintenance`, `Food`, `Pets`
- **Can be empty:** Yes

## Quick Download Template

**Easiest way:** Download the ready-made CSV template:
- File: `task_table_template.csv` (in documentation folder)
- Open in Excel
- Edit the example rows or add your own
- Save as `.xlsx` format
- Import to app

## Step-by-Step Instructions

### Option 1: Use Template File (Recommended)

1. Open `task_table_template.csv` in Excel
2. Edit the example rows or add your own tasks
3. Save as `.xlsx` format
4. Import to app

### Option 2: Create from Scratch

1. Open Excel or Google Sheets
2. Create a new spreadsheet
3. In row 1, add these headers (one per column, left to right):
   ```
   Notes | Frequency (Planned) | Duration (Planned) | Performer (Planned) | Frequency (Current) | Duration (Current) | Performer (Current) | Task Name | Subcategory | Category
   ```

### 2. Add Your Tasks

Starting from row 2, add one task per row:

**Example Row 1:**
```
[empty] | weekly | 30 minutes | together | weekly | 15 minutes | person1 | Clean floors | Kitchen | Cleaning
```

**Example Row 2:**
```
Check garage | daily | 5 minutes | person1 | daily | 5 minutes | person1 | Take out trash | General | Cleaning
```

### 3. Save File

- Save as `.xlsx` format (Excel 2007+)
- Or `.xls` format (older Excel)

### 4. Import to App

1. Open CoupleTasks app
2. Go to **Task Table** screen
3. Tap **Import Excel**
4. Select your file
5. Review imported tasks
6. Tap **Sync** to generate tasks

## Frequency Reference

### Daily
- `daily`
- `every day`
- `once a day`

### Weekly
- `weekly`
- `once a week`
- `every week`
- `every 1 week`

### Every X Weeks
- `every 2 weeks`
- `every 3 weeks`
- `biweekly` (every 2 weeks)

### Monthly
- `monthly`
- `once a month`
- `every month`
- `every 1 month`

### Every X Months
- `every 2 months`
- `every 3 months`

### Custom/As Needed
- `as needed` - Won't auto-generate tasks
- `when full` - Won't auto-generate tasks
- `on demand` - Won't auto-generate tasks

## Duration Reference

### Minutes
- `5 minutes` or `5 min`
- `10 minutes` or `10 min`
- `15 minutes` or `15 min`
- `20 minutes` or `20 min`
- `30 minutes` or `30 min`

### Hours
- `quarter hour` or `15 minutes`
- `half hour` or `30 minutes`
- `1 hour` or `one hour`
- `1.5 hours` or `hour and half` or `90 minutes`
- `2 hours` or `two hours`

## Performer Reference

### Together
- `together`
- `both`

### Separately
- `separate`
- `either`
- `individually`

### Specific Person
- Any name: `person1`, `person2`, `John`, `Sarah`
- Email address: `john@example.com`

## Common Mistakes to Avoid

1. ❌ **Wrong column order** - Make sure columns are in exact order A-J
2. ❌ **Missing Task Name** - Column H must have a value
3. ❌ **Missing Frequency (Planned)** - Column B must have a value if you want to sync
4. ❌ **Extra columns** - Don't add columns beyond J
5. ❌ **Merged cells** - Don't merge cells in the data rows
6. ❌ **Multiple sheets** - Use only the first sheet
7. ❌ **Empty header row** - Row 1 must have headers

## Troubleshooting

### "No tasks imported"
- Check that Task Name column (H) is not empty
- Check that you have at least 2 rows (header + 1 data row)
- Check file format (.xlsx or .xls)

### "Tasks imported but sync generates 0 tasks"
- Check that Frequency (Planned) column (B) has valid values
- Use standard frequency formats (see Frequency Reference above)
- Tasks with "as needed" won't auto-generate

### "Wrong data in wrong columns"
- Verify column order matches exactly (A=Notes, B=Frequency Planned, etc.)
- Check that you didn't skip any columns
- Make sure headers are in row 1

## Example Complete File

Here's a complete working example:

| Notes | Frequency (Planned) | Duration (Planned) | Performer (Planned) | Frequency (Current) | Duration (Current) | Performer (Current) | Task Name | Subcategory | Category |
|-------|---------------------|-------------------|---------------------|---------------------|-------------------|---------------------|-----------|-------------|----------|
| | weekly | 30 minutes | together | weekly | 15 minutes | person1 | Clean floors | Kitchen | Cleaning |
| Check garage | daily | 5 minutes | person1 | daily | 5 minutes | person1 | Take out trash | General | Cleaning |
| | weekly | 1 hour | together | weekly | 1 hour | together | Grocery shopping | General | Maintenance |
| | monthly | 20 minutes | together | monthly | 20 minutes | together | Change bed sheets | Bedroom | Cleaning |
| | weekly | 15 minutes | together | weekly | 15 minutes | person1 | Wash dishes | Kitchen | Food |
| | as needed | 10 minutes | person1 | as needed | 10 minutes | person1 | Empty recycling | Kitchen | Cleaning |

Copy this table into Excel starting from cell A1, and it should work!

---

**Last Updated:** November 2024  
**Template Version:** 2.0 (English)

