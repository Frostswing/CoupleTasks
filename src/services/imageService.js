import * as ImagePicker from 'expo-image-picker';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCurrentUser } from './userService';
import { User } from '../entities/User';

/**
 * Request permissions for image picker
 */
export const requestImagePermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      return { success: false, error: 'Permission to access camera and media library is required' };
    }
  }
  return { success: true };
};

/**
 * Pick an image from the library or take a photo
 */
export const pickImage = async (source = 'library') => {
  try {
    const permissionResult = await requestImagePermissions();
    if (!permissionResult.success) {
      return { success: false, error: permissionResult.error };
    }

    let result;
    // Use MediaType if available, otherwise fall back to MediaTypeOptions or string
    const mediaType = ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || 'images';
    
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaType,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return { success: true, uri: result.assets[0].uri };
    }
    
    return { success: false, error: 'No image selected' };
  } catch (error) {
    console.error('Error picking image:', error);
    return { success: false, error: error.message || 'Failed to pick image' };
  }
};

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (imageUri, folder = 'shopping-items') => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user profile to check for partner
    const userProfile = await User.me();
    const partnerUserId = userProfile.sharing_with || null;

    // Fetch the image blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.uid}_${timestamp}.jpg`;
    const storageRef = ref(storage, `${folder}/${filename}`);

    // Upload the image with metadata including partner info for sharing rules
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        ownerId: user.uid,
        partnerId: partnerUserId || '',
        sharedSpaceId: userProfile.shared_space_id || '',
      },
    };
    
    console.log('Uploading image to:', `${folder}/${filename}`);
    console.log('Metadata:', JSON.stringify(metadata));
    
    await uploadBytes(storageRef, blob, metadata);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('Image upload completed successfully');
    console.log('Download URL:', downloadURL);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.serverResponse || error.customData || 'No additional details');
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to upload image';
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Storage rules not configured. Please publish storage rules in Firebase Console.';
    } else if (error.code === 'storage/canceled') {
      errorMessage = 'Upload was canceled';
    } else if (error.code === 'storage/unknown') {
      errorMessage = 'Storage error. Check Firebase Console Storage rules are published.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Show image picker options (camera or library)
 */
export const showImagePickerOptions = async () => {
  try {
    const permissionResult = await requestImagePermissions();
    if (!permissionResult.success) {
      return { success: false, error: permissionResult.error };
    }

    // Return options for the UI to show action sheet
    return { success: true };
  } catch (error) {
    console.error('Error showing image picker options:', error);
    return { success: false, error: error.message || 'Failed to show image picker' };
  }
};

