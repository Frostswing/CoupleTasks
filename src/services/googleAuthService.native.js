import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider } from "firebase/auth";
import { getGoogleWebClientId, isGoogleSignInConfigured } from "../config/googleAuth";
import { signInWithGoogleCredential, GOOGLE_SIGN_IN_ERROR } from "./googleAuthCore";
import { mapNativeGoogleStatusCode } from "../utils/googleAuthErrors";

export function initializeGoogleSignIn() {
  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    console.warn(
      "Google Sign-In: set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Web OAuth client ID from Firebase / google-services.json)."
    );
    return;
  }
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
}

export async function resolveGoogleRedirectResult() {
  return null;
}

/**
 * @returns {Promise<import('./googleAuthTypes').GoogleSignInResult>}
 */
export async function signInWithGoogle() {
  if (!isGoogleSignInConfigured()) {
    return { success: false, errorKey: GOOGLE_SIGN_IN_ERROR.NOT_CONFIGURED };
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) {
      return { success: false, errorKey: GOOGLE_SIGN_IN_ERROR.GENERIC };
    }
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithGoogleCredential(credential);
  } catch (error) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, cancelled: true, errorKey: GOOGLE_SIGN_IN_ERROR.CANCELLED };
    }
    if (error?.code === statusCodes.IN_PROGRESS) {
      return { success: false, errorKey: GOOGLE_SIGN_IN_ERROR.IN_PROGRESS };
    }
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, errorKey: GOOGLE_SIGN_IN_ERROR.PLAY_SERVICES };
    }
    const errorKey = mapNativeGoogleStatusCode(error?.code) || GOOGLE_SIGN_IN_ERROR.GENERIC;
    return { success: false, errorKey, error };
  }
}
