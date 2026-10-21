import { checkFirebaseStatus } from "../firebase/config";
import { auth } from "../firebase/config";

const isAuthReady = () => {
  const status = checkFirebaseStatus();
  if (!status.authInitialized) return false;
  try {
    return typeof auth.onAuthStateChanged === "function";
  } catch {
    return false;
  }
};

export const waitForAuth = (maxRetries = 10, interval = 500) =>
  new Promise((resolve, reject) => {
    const status = checkFirebaseStatus();
    if (!status.appInitialized) {
      reject(new Error("Firebase app is not initialized"));
      return;
    }

    let retries = 0;
    const checkAuth = () => {
      if (isAuthReady()) {
        resolve(true);
        return;
      }
      retries += 1;
      if (retries >= maxRetries) {
        reject(new Error(`Auth service not ready after ${maxRetries} retries`));
        return;
      }
      setTimeout(checkAuth, interval);
    };
    checkAuth();
  });
