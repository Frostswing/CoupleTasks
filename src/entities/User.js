import { database } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  update, 
  query, 
  orderByChild,
  equalTo 
} from 'firebase/database';
import { getCurrentUser } from '../services/userService';
import { DB_PATHS } from '../firebase/database-schema';
import { validateData, sanitizeData, addTimestamps, handleDatabaseError } from '../firebase/database-utils';
import { createSharedSpace, migrateToSharedSpace, removeSharing } from '../firebase/database-init';

export class User {
  constructor(data) {
    this.uid = data.uid || '';
    this.email = data.email || '';
    this.full_name = data.full_name || data.name || '';
    this.name = data.name || data.full_name || ''; // legacy support
    this.partner_email = data.partner_email || null;
    this.shared_space_id = data.shared_space_id || null;
    this.sharing_with = data.sharing_with || null;
    this.language_preference = data.language_preference || 'he';
    this.timezone = data.timezone || 'Asia/Jerusalem';
    this.avatar_url = data.avatar_url || null;
    this.created_at = data.created_at || data.createdAt || null;
    this.updated_at = data.updated_at || data.updatedAt || null;
  }

  // Get current user profile
  static async me() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const profileRef = ref(database, DB_PATHS.userProfile(currentUser.uid));
      const snapshot = await get(profileRef);
      
      if (!snapshot.exists()) {
        throw new Error('User profile not found');
      }

      return new User({ uid: currentUser.uid, ...snapshot.val() });
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  // Update current user's profile
  static async updateMyUserData(updates) {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Validate the updates
      const validation = validateData('user_profile', updates);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitizedUpdates = sanitizeData(updates);
      const timestampedUpdates = addTimestamps(sanitizedUpdates, true);

      await update(ref(database, DB_PATHS.userProfile(currentUser.uid)), timestampedUpdates);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        return null;
      }

      const users = usersSnapshot.val();
      let foundUser = null;
      let foundUserId = null;

      Object.entries(users).forEach(([userId, userData]) => {
        if (userData.profile && userData.profile.email === email.toLowerCase()) {
          foundUser = userData.profile;
          foundUserId = userId;
        }
      });

      if (foundUser) {
        return new User({ uid: foundUserId, ...foundUser });
      }

      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Link with partner
  static async linkPartner(partnerEmail) {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Find partner by email
      const partner = await User.findByEmail(partnerEmail);
      if (!partner) {
        throw new Error('Partner not found. Make sure they have registered with this email.');
      }

      if (partner.uid === currentUser.uid) {
        throw new Error('Cannot link with yourself');
      }

      // Check if already linked
      const currentUserProfile = await User.me();
      if (currentUserProfile.partner_email === partnerEmail) {
        throw new Error('Already linked with this partner');
      }

      // Create shared space
      const result = await createSharedSpace(
        currentUser.uid, 
        partner.uid, 
        currentUser.email, 
        partnerEmail
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Migrate current user's data to shared space
      await migrateToSharedSpace(currentUser.uid, result.sharedSpaceId);

      return { success: true, sharedSpaceId: result.sharedSpaceId };
    } catch (error) {
      console.error('Error linking partner:', error);
      throw error;
    }
  }

  // Unlink from partner
  static async unlinkPartner() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const currentUserProfile = await User.me();
      if (!currentUserProfile.sharing_with) {
        throw new Error('Not currently linked with a partner');
      }

      // Remove sharing relationship
      const result = await removeSharing(currentUser.uid, currentUserProfile.sharing_with);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true };
    } catch (error) {
      console.error('Error unlinking partner:', error);
      throw error;
    }
  }

  // Get sharing status
  static async getSharingStatus() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { isSharing: false };
      }

      const profile = await User.me();
      
      if (!profile.sharing_with || !profile.shared_space_id) {
        return { isSharing: false };
      }

      // Get partner information
      const partner = await User.getById(profile.sharing_with);
      
      return {
        isSharing: true,
        partner: partner,
        sharedSpaceId: profile.shared_space_id
      };
    } catch (error) {
      console.error('Error getting sharing status:', error);
      return { isSharing: false, error: error.message };
    }
  }

  // Get user by ID
  static async getById(userId) {
    try {
      const profileRef = ref(database, DB_PATHS.userProfile(userId));
      const snapshot = await get(profileRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return new User({ uid: userId, ...snapshot.val() });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Update language preference
  static async updateLanguage(language) {
    try {
      if (!['he', 'en'].includes(language)) {
        throw new Error('Invalid language. Must be "he" or "en"');
      }

      return await User.updateMyUserData({ language_preference: language });
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }

  // Update profile picture
  static async updateAvatar(avatarUrl) {
    try {
      return await User.updateMyUserData({ avatar_url: avatarUrl });
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getMyStats() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // This would typically involve querying tasks, shopping items, etc.
      // For now, we'll return basic stats
      const profile = await User.me();
      
      return {
        memberSince: profile.created_at,
        isSharing: !!profile.sharing_with,
        language: profile.language_preference,
        lastUpdated: profile.updated_at
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return handleDatabaseError(error, 'getting user stats');
    }
  }

  // Delete user account (soft delete)
  static async deleteAccount() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // If sharing, unlink first
      const sharingStatus = await User.getSharingStatus();
      if (sharingStatus.isSharing) {
        await User.unlinkPartner();
      }

      // Mark profile as deleted instead of actually deleting
      await User.updateMyUserData({
        deleted_at: new Date().toISOString(),
        email: `deleted_${currentUser.uid}@example.com`
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Instance methods
  async update(updates) {
    try {
      const validation = validateData('user_profile', updates);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitizedUpdates = sanitizeData(updates);
      const timestampedUpdates = addTimestamps(sanitizedUpdates, true);

      await update(ref(database, DB_PATHS.userProfile(this.uid)), timestampedUpdates);
      
      // Update local instance
      Object.assign(this, timestampedUpdates);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user instance:', error);
      throw error;
    }
  }

  // Get display name
  get displayName() {
    return this.full_name || this.name || this.email.split('@')[0];
  }

  // Check if user is sharing
  get isSharing() {
    return !!this.sharing_with && !!this.shared_space_id;
  }

  // Get user initials for avatar
  get initials() {
    const name = this.displayName;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Convert to JSON
  toJSON() {
    return {
      uid: this.uid,
      email: this.email,
      full_name: this.full_name,
      name: this.name,
      partner_email: this.partner_email,
      shared_space_id: this.shared_space_id,
      sharing_with: this.sharing_with,
      language_preference: this.language_preference,
      timezone: this.timezone,
      avatar_url: this.avatar_url,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
} 