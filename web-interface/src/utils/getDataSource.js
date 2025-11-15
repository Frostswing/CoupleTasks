import { ref, get } from 'firebase/database'
import { database } from '../firebase/config'

/**
 * Get data source path (shared or personal) for web interface
 * @param {string} userId - User ID
 * @returns {Promise} Promise that resolves with data source path
 */
export const getDataSource = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const profileRef = ref(database, `users/${userId}/profile`)
    const snapshot = await get(profileRef)
    
    if (snapshot.exists()) {
      const profile = snapshot.val()
      if (profile.shared_space_id) {
        return { success: true, path: `shared/${profile.shared_space_id}`, isShared: true }
      }
    }
    
    return { success: true, path: `users/${userId}`, isShared: false }
  } catch (error) {
    console.error('Error getting data source:', error)
    return { success: false, error: error.message }
  }
}

