# Firebase Realtime Database Security Rules

## Overview
This document explains the Firebase Realtime Database security rules for CoupleTasks.

## Rules Structure

### 1. Default Rules
- **Read:** Denied by default
- **Write:** Denied by default
- All paths must explicitly allow access

### 2. User Data (`/users/{userId}`)

#### Read Access
- Users can read their own data
- Users can read their partner's data (if `sharing_with` is set)

#### Write Access
- Users can only write to their own data
- Profile can be created on first login
- Profile email cannot be changed after creation

#### Validation
- **Profile:** Requires `email` and `full_name`
- **Tasks:** Requires `title`, `status`, `created_by`
- **Shopping Items:** Requires `name`, `category`
- **Inventory Items:** Requires `name`, `category`

### 3. Shared Spaces (`/shared/{sharedSpaceId}`)

#### Access
- Only members listed in `members` can read/write
- Members can add themselves during initial creation
- Shared space ID format: `userId1_userId2` (alphabetically sorted)

#### Validation
- Tasks must have `created_by` matching a member ID
- All data follows same validation as user data

### 4. App Metadata (`/app_metadata`)

#### Read Access
- All authenticated users can read metadata

#### Write Access
- **Initialization:** Allowed if data doesn't exist
- **Updates:** Allowed if database version exists (for migrations)
- This allows the app to initialize categories, units, and version on first run

#### Structure
- `database_version`: Current schema version
- `categories`: App-wide category definitions
- `units`: Measurement unit definitions
- `last_migration`: Timestamp of last migration

## Installation Instructions

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `coupletasks-569bf`

### Step 2: Navigate to Realtime Database
1. Click on **Realtime Database** in the left sidebar
2. Click on the **Rules** tab

### Step 3: Copy Rules
1. Copy the entire contents of `firebase-database-rules.json`
2. Paste into the Firebase Console rules editor

### Step 4: Publish Rules
1. Click **Publish** button
2. Confirm the changes

## Testing Rules

### Test Initialization
After publishing rules, test database initialization:
1. Run the app
2. Register a new user
3. Check Firebase Console → Realtime Database → `app_metadata`
4. Should see `database_version`, `categories`, `units` created

### Test User Data
1. Create a task as a logged-in user
2. Verify task appears in `users/{userId}/tasks`
3. Try accessing another user's data (should fail)

### Test Shared Spaces
1. Link two users as partners
2. Verify shared space created in `shared/{sharedSpaceId}`
3. Both users should be able to read/write shared data

## Security Features

### ✅ Implemented
- Authentication required for all operations
- Users can only modify their own data
- Shared space access restricted to members
- Data validation on all writes
- Email format validation
- String length limits
- Type checking

### 🔒 Protection Against
- Unauthorized access to other users' data
- Unauthenticated writes
- Invalid data formats
- SQL injection (not applicable to NoSQL)
- Data corruption through invalid types

## Common Issues

### Issue: "Permission denied" on initialization
**Solution:** Make sure rules allow writing to `app_metadata` when data doesn't exist. The current rules allow this.

### Issue: Can't create user profile
**Solution:** Ensure user is authenticated (`auth != null`) and writing to their own path (`auth.uid == $userId`).

### Issue: Partner can't see shared data
**Solution:** Verify:
1. Shared space exists
2. Both users are in `shared/{spaceId}/members`
3. User's profile has correct `shared_space_id`

## Rule Updates

When updating rules:
1. Test in Firebase Console Rules Playground first
2. Deploy to staging/test database
3. Verify all operations work
4. Deploy to production
5. Monitor for errors

## Migration Notes

If you need to update rules:
1. Keep backward compatibility
2. Add new rules alongside old ones
3. Test thoroughly before removing old rules
4. Document changes in this file

## Support

For issues with security rules:
1. Check Firebase Console → Realtime Database → Rules
2. Use Rules Playground to test specific scenarios
3. Check Firebase Console logs for denied operations
4. Review this documentation

---

**Last Updated:** November 14, 2025  
**Rules Version:** 1.0.0

