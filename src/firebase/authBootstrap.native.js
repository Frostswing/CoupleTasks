import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "@firebase/auth/dist/rn/index.js";

/**
 * Native Firebase Auth with AsyncStorage persistence (survives app restarts).
 */
export function createAuth(app) {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Hot reload / already initialized
    return getAuth(app);
  }
}
