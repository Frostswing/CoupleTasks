# Firebase Storage Troubleshooting

## Current Issue
Getting `storage/unknown` error when trying to upload images.

## Simplified Rules (Try These First)
The rules in `storage.rules` are now super simple - any authenticated user can upload images to `shopping-items/` folder.

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /shopping-items/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024  // Max 5MB
        && request.resource.contentType.matches('image/.*');  // Only images
      allow delete: if request.auth != null;
    }
  }
}
```

## Steps to Fix

### 1. Check if Storage is Enabled
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `coupletasks-569bf`
3. Click **Storage** in left sidebar
4. If you see "Get Started", click it to enable Storage
5. Choose production mode
6. Keep default location

### 2. Publish the Rules
1. In Storage, click **Rules** tab
2. Copy the contents from `storage.rules`
3. Paste into the editor
4. Click **Publish**
5. Wait for confirmation

### 3. Check Storage Bucket
1. In Storage, click **Files** tab
2. Verify bucket URL is: `gs://coupletasks-569bf.firebasestorage.app` or `gs://coupletasks-569bf.appspot.com`
3. Both are the same bucket, different URL formats

### 4. Test Upload Again
After publishing rules, try uploading an image from the app.

## If Still Failing

### Check Error Logs
The app now logs detailed error info:
- Error code
- Error message  
- Server response

Look for these in the console logs when upload fails.

### Verify CORS
If you see CORS errors:
1. Storage should allow CORS by default for same-project requests
2. If needed, configure CORS via `gsutil` (requires Google Cloud SDK)

### Check Network
1. Verify device has internet connection
2. Check if Firebase services are accessible
3. Try on different network

### Alternative: Try Web Upload
To test if rules work, try uploading directly via Firebase Console:
1. Go to Storage → Files
2. Click "Upload file"
3. Select an image
4. If this works, the issue is in the app code, not rules

## Current App Configuration
- Storage bucket: `coupletasks-569bf.appspot.com`
- Upload path: `shopping-items/{userId}_{timestamp}.jpg`
- Content type: `image/jpeg`
- Max size: 5MB
- Metadata: Custom metadata with owner/partner info

## Next Steps After Basic Upload Works
Once basic uploads work, we can add:
1. Ownership validation (check userId in filename)
2. Partner access (check custom metadata for partner ID)
3. Better security rules

For now, the simplified rules just require authentication and validate file size/type.

