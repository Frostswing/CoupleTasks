# Firebase Rules Deployment Guide

## Problem
You're getting "PERMISSION DENIED" errors when generating tasks from templates because the Firebase database rules don't allow the new task fields.

## Solution
The rules file has been updated. You need to deploy it to Firebase.

## How to Deploy Rules

### Option 1: Firebase Console (Easiest)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project

2. **Navigate to Realtime Database**
   - Click "Realtime Database" in the left menu
   - Click the "Rules" tab at the top

3. **Copy Updated Rules**
   - Open `firebase-database-rules.json` in your project
   - Copy ALL the contents

4. **Paste and Publish**
   - Paste into the Firebase Console rules editor
   - Click "Publish" button
   - Wait for confirmation

### Option 2: Firebase CLI (If Installed)

```bash
firebase deploy --only database
```

## What Was Fixed

The updated rules now allow:

1. **Task Fields:**
   - `due_date`, `due_time`
   - `estimated_duration`, `actual_duration`
   - `template_id`, `auto_generated`
   - `scheduled_date`
   - `room_location`
   - `defer_count`, `defer_until`
   - `completed_by`
   - `notification_offset_hours`
   - `archived_date`, `completion_date`
   - `subtasks`

2. **Assigned To Field:**
   - Now accepts any string (not just emails)
   - Allows: "both", "either", names, emails

3. **New Paths:**
   - `task_templates` - For task templates
   - `task_table_config` - For task table configurations

## After Deployment

1. **Test the sync again**
   - Go to Task Table screen
   - Tap "Sync" button
   - Should work without permission errors

2. **Verify tasks are created**
   - Check Daily Tasks screen
   - Check Task Planning screen
   - Tasks should appear

## Troubleshooting

### Still Getting Permission Denied?

1. **Verify rules were deployed:**
   - Check Firebase Console → Realtime Database → Rules
   - Make sure the rules show the new field validations

2. **Check you're authenticated:**
   - Make sure you're logged in to the app
   - Check Firebase Console → Authentication

3. **Check data path:**
   - If using shared space, make sure you're a member
   - Check Firebase Console → Realtime Database → Data

### Rules Not Saving?

- Make sure you copied the ENTIRE file
- Don't remove any closing braces `}`
- Firebase will show syntax errors if invalid

---

**Important:** The rules file supports comments (//), which is valid for Firebase but not standard JSON. This is normal and expected.

