import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { isGoogleSignInConfigured } from "../config/googleAuth";
import {
  completeGoogleSignInFromFirebaseUser,
  signInWithGoogleCredential,
  GOOGLE_SIGN_IN_ERROR,
} from "./googleAuthCore";
import { mapGoogleSignInError } from "../utils/googleAuthErrors";

export function initializeGoogleSignIn() {
  // Web uses Firebase popup/redirect; no extra SDK setup.
}

function isPopupBlockedError(error) {
  const code = error?.code;
  return (
    code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

function isCancelledError(error) {
  const code = error?.code;
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

/**
 * @returns {Promise<import('./googleAuthTypes').GoogleSignInResult>}
 */
export async function signInWithGoogle() {
  if (!isGoogleSignInConfigured()) {
    return { success: false, errorKey: GOOGLE_SIGN_IN_ERROR.NOT_CONFIGURED };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const additional = getAdditionalUserInfo(result);
    return completeGoogleSignInFromFirebaseUser(result.user, Boolean(additional?.isNewUser));
  } catch (error) {
    if (isCancelledError(error)) {
      return { success: false, cancelled: true, errorKey: GOOGLE_SIGN_IN_ERROR.CANCELLED };
    }
    if (isPopupBlockedError(error)) {
      try {
        await signInWithRedirect(auth, provider);
        return { success: false, redirecting: true };
      } catch (redirectError) {
        return {
          success: false,
          errorKey: mapGoogleSignInError(redirectError),
          error: redirectError,
        };
      }
    }

    const credential = GoogleAuthProvider.credentialFromError(error);
    if (credential) {
      return signInWithGoogleCredential(credential);
    }

    return {
      success: false,
      errorKey: mapGoogleSignInError(error),
      error,
    };
  }
}

/**
 * Call on app load after Firebase is ready (web redirect flow).
 */
export async function resolveGoogleRedirectResult() {
  if (!isGoogleSignInConfigured()) {
    return null;
  }
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) {
      return null;
    }
    const additional = getAdditionalUserInfo(result);
    return completeGoogleSignInFromFirebaseUser(result.user, Boolean(additional?.isNewUser));
  } catch (error) {
    return {
      success: false,
      errorKey: mapGoogleSignInError(error),
      error,
    };
  }
}
