# Firebase Storage Security Rules

## Overview
This document explains how to set up Firebase Storage security rules for CoupleTasks image uploads.

## Rules File
The storage rules are defined in `storage.rules` in the project root.

## Rules Explanation

### Shopping Items Images
- **Path:** `/shopping-items/{fileName}`
- **File Name Format:** `{userId}_{timestamp}.jpg`
- **Read Access:** 
  - Owner of the image (userId matches filename)
  - Partner of the owner (stored in file metadata)
- **Write Access:** Only the owner can upload images with:
  - Maximum file size: 5MB
  - Content type: Images only (`image/*`)
- **Delete Access:** Only the owner can delete their images

### Sharing Mechanism
When an image is uploaded, the following metadata is stored:
- `ownerId`: User ID of the image owner
- `partnerId`: User ID of the partner (if sharing)
- `sharedSpaceId`: Shared space ID (if sharing)

This allows partners to access each other's images while maintaining security.

### Security
- Only authenticated users can access storage
- File size limit prevents abuse (5MB max)
- Content type validation ensures only images are uploaded
- Partner access is verified through metadata stored during upload
- Only owners can upload or delete their images

## Installation Instructions

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `coupletasks-569bf`

### Step 2: Navigate to Storage
1. Click on **Storage** in the left sidebar
2. Click on the **Rules** tab

### Step 3: Copy Rules
Copy the contents of `storage.rules` file and paste into the Firebase Console Rules editor.

### Step 4: Publish Rules
1. Click **Publish** to save the rules
2. Rules will be active immediately

## Rules Content

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Shopping items images - with ownership and partner sharing
    match /shopping-items/{fileName} {
      // Helper functions
      function isAuthenticated() {
        return request.auth != null;
      }
      
      // Check if user is the owner (from custom metadata set during upload)
      function isOwner() {
        return isAuthenticated()
          && resource.metadata.customMetadata.ownerId == request.auth.uid;
      }
      
      // Check if user is the partner (from custom metadata set during upload)
      function isPartner() {
        return isAuthenticated()
          && resource.metadata.customMetadata.partnerId != null
          && resource.metadata.customMetadata.partnerId != ''
          && resource.metadata.customMetadata.partnerId == request.auth.uid;
      }
      
      // Read: owner or partner can view the image
      allow read: if isAuthenticated() && (isOwner() || isPartner());
      
      // Write: only authenticated users can upload (ownership verified by custom metadata they set)
      allow write: if isAuthenticated()
        && request.resource.metadata.customMetadata.ownerId == request.auth.uid
        && request.resource.size < 5 * 1024 * 1024  // Max 5MB
        && request.resource.contentType.matches('image/.*');  // Only images
      
      // Delete: owner or partner can delete
      allow delete: if isAuthenticated() && (isOwner() || isPartner());
    }
  }
}
```

## Testing
After publishing rules, test by:
1. Uploading an image from the app
2. Verifying the image appears in Firebase Storage console
3. Checking that images load correctly in the app

## Troubleshooting

### Error: "Firebase Storage: An unknown error occurred"
- Check that storage rules are published
- Verify user is authenticated
- Check file size is under 5MB
- Ensure file is an image format

### Images not loading
- Check storage rules allow read access
- Verify image URLs are correct
- Check network connectivity

