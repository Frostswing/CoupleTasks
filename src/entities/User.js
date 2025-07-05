import { 
  getCurrentUser, 
  getUserProfile, 
  findUserByEmail, 
  checkIfSharing, 
  getDataSource 
} from '../services/userService';

export class User {
  constructor(data) {
    this.id = data.id || null;
    this.email = data.email || '';
    this.full_name = data.full_name || data.name || '';
    this.partner_email = data.partner_email || data.sharingWith || null;
    this.shared_space_id = data.shared_space_id || data.sharedSpaceId || null;
    this.created_at = data.created_at || data.createdAt || new Date().toISOString();
  }

  static async me() {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No user is currently logged in');
      }

      const profileResult = await getUserProfile(currentUser.uid);
      if (!profileResult.success) {
        throw new Error(profileResult.error);
      }

      const sharingStatus = await checkIfSharing(currentUser.uid);
      
      let partnerEmail = null;
      if (sharingStatus.success && sharingStatus.isSharing && sharingStatus.sharingWith) {
        partnerEmail = sharingStatus.sharingWith.profile.email;
      }

      return new User({
        id: currentUser.uid,
        email: currentUser.email,
        full_name: profileResult.profile.name,
        partner_email: partnerEmail,
        shared_space_id: sharingStatus.sharedSpaceId,
        created_at: profileResult.profile.createdAt
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await findUserByEmail(email);
      if (!result.success) {
        throw new Error(result.error);
      }

      return new User({
        id: result.userId,
        email: result.user.email,
        full_name: result.user.name,
        created_at: result.user.createdAt
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async getDataSource() {
    try {
      const result = await getDataSource(this.id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    } catch (error) {
      console.error('Error getting data source:', error);
      throw error;
    }
  }
} 