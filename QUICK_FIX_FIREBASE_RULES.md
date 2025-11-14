# Quick Fix: Apply Firebase Security Rules

## The Problem
You're getting "Permission denied" errors because the Firebase security rules haven't been applied yet.

## Quick Solution (2 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **coupletasks-569bf**

### Step 2: Navigate to Realtime Database Rules
1. Click **Realtime Database** in left sidebar
2. Click **Rules** tab at the top

### Step 3: Copy & Paste Rules
1. Open `firebase-database-rules.json` in this project
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)
3. Paste into Firebase Console rules editor (replace everything)
4. Click **Publish** button

### Step 4: Test
1. Reload your app
2. The "Permission denied" error should be gone
3. Database initialization should work

## What These Rules Do
- ✅ Allow authenticated users to initialize app metadata (categories, units)
- ✅ Allow users to read/write their own data
- ✅ Allow shared spaces between partners
- ✅ Secure - users can't access other users' data

## If Still Getting Errors
1. Make sure you're logged in (check Firebase Console → Authentication)
2. Check Firebase Console → Realtime Database → Rules shows your new rules
3. Try clearing app cache and restarting

---

**That's it!** The rules are already written in `firebase-database-rules.json` - just copy and paste them into Firebase Console.

