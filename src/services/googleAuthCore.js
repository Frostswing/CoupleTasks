import {
  GoogleAuthProvider,
  signInWithCredential,
  linkWithCredential,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from "../firebase/config";
import { initializeDatabase, createUserProfile, initializeUserFirstLogin } from "../firebase/database-init";
import { waitForAuth } from "./authReady";
import { GOOGLE_SIGN_IN_ERROR, mapGoogleSignInError } from "../utils/googleAuthErrors";

export { GOOGLE_SIGN_IN_ERROR };

async function ensureUserProfileAfterGoogle(user, isNewUser) {
  if (isNewUser) {
    const profileResult = await initializeUserFirstLogin(user.uid, {
      email: user.email,
      full_name: user.displayName || user.email?.split("@")[0] || "User",
      name: user.displayName || "User",
    });
    if (!profileResult.success) {
      console.error("Google sign-in profile init failed:", profileResult.error);
    }
  } else {
    const profileRef = ref(database, `users/${user.uid}/profile`);
    const profileSnapshot = await get(profileRef);
    if (!profileSnapshot.exists()) {
      await createUserProfile(user.uid, {
        email: user.email,
        full_name: user.displayName || "User",
      });
    }
  }

  initializeDatabase().catch((err) => {
    console.warn("Database initialization failed (non-critical):", err.message);
  });
}

/**
 * @param {import('firebase/auth').OAuthCredential} credential
 */
export async function signInWithGoogleCredential(credential) {
  await waitForAuth();
  try {
    const userCredential = await signInWithCredential(auth, credential);
    const additional = getAdditionalUserInfo(userCredential);
    await ensureUserProfileAfterGoogle(userCredential.user, Boolean(additional?.isNewUser));
    return { success: true, user: userCredential.user };
  } catch (error) {
    if (error?.code === "auth/account-exists-with-different-credential") {
      const email = error.customData?.email;
      const pending =
        GoogleAuthProvider.credentialFromError(error) || credential;
      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email).catch(() => []);
        if (methods.includes("password")) {
          return {
            success: false,
            errorKey: GOOGLE_SIGN_IN_ERROR.ACCOUNT_EXISTS_PASSWORD,
            email,
            pendingCredential: pending,
          };
        }
      }
    }
    return {
      success: false,
      errorKey: mapGoogleSignInError(error),
      error,
    };
  }
}

export async function linkGoogleAfterPasswordLogin(email, password, pendingCredential) {
  await waitForAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await linkWithCredential(userCredential.user, pendingCredential);
    await ensureUserProfileAfterGoogle(userCredential.user, false);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return {
      success: false,
      errorKey: mapGoogleSignInError(error),
      error,
    };
  }
}

/**
 * Web popup/redirect already signed in — only ensure RTDB profile.
 */
export async function completeGoogleSignInFromFirebaseUser(user, isNewUser) {
  await waitForAuth();
  await ensureUserProfileAfterGoogle(user, isNewUser);
  return { success: true, user };
}
