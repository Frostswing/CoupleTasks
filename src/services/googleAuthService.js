import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '454424635796-1shld82shvpp46trb6q566crjp48qtf9.apps.googleusercontent.com';

/**
 * Simple Google Sign In for Expo Go
 * Note: This shows a message that Google Sign In requires a custom development build
 */
export const simpleGoogleSignIn = async () => {
  try {
    // For Expo Go, native Google Sign In is not available
    // We'll show an informative message to the user
    return {
      success: false,
      error: 'Google Sign In is not available in Expo Go.\n\nTo use Google Sign In:\n1. Create a development build\n2. Or use email/password authentication\n\nFor now, please sign in with email and password.',
      requiresDevBuild: true
    };
  } catch (error) {
    console.error('Google Sign In error:', error);
    return { 
      success: false, 
      error: 'Google Sign In is not available in this environment' 
    };
  }
};

/**
 * Initialize Google Sign In
 */
export const initializeGoogleSignIn = () => {
  // For Expo Go, we just log that Google Sign In is not available
  console.log('Google Sign In: Native implementation requires custom development build');
};

/**
 * Web-based Google Sign In (works in web browser)
 * This is a fallback for development/testing
 */
export const webGoogleSignIn = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    const result = await AuthSession.startAsync({
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        prompt: 'consent',
      })}`,
      returnUrl: redirectUri,
    });

    if (result.type === 'success') {
      const { code } = result.params;
      
      if (code) {
        // Exchange code for token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        const tokens = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          throw new Error(tokens.error_description || 'Failed to get tokens');
        }

        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        const userInfo = await userResponse.json();
        
        if (!userResponse.ok) {
          throw new Error('Failed to get user info');
        }

        return {
          success: true,
          user: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            verified_email: userInfo.verified_email,
          },
          tokens,
        };
      }
    }
    
    return { success: false, error: 'Authentication was cancelled' };
  } catch (error) {
    console.error('Web Google Sign In error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Legacy method - now just calls simpleGoogleSignIn
 */
export const signInWithGoogle = simpleGoogleSignIn;

// Sign out from Google
export const signOutFromGoogle = async () => {
  try {
    // For Expo Go, there's no direct sign out from the web browser session
    // This function might need to be re-evaluated based on the specific Expo Go setup
    // For now, we'll just return success as there's no direct sign out mechanism
    // in the current web-based implementation.
    return { success: true };
  } catch (error) {
    console.error('Google Sign Out Error:', error);
    return { success: false, error: error.message };
  }
};

// Get current Google user
export const getCurrentGoogleUser = async () => {
  try {
    // For Expo Go, there's no direct current user info from the web browser session
    // This function might need to be re-evaluated based on the specific Expo Go setup
    // For now, we'll just return a placeholder.
    return { success: false, error: 'No user signed in' };
  } catch (error) {
    return { success: false, error: 'No user signed in' };
  }
}; 