export const GOOGLE_SIGN_IN_ERROR = {
  CANCELLED: "cancelled",
  NOT_CONFIGURED: "notConfigured",
  NETWORK: "network",
  PLAY_SERVICES: "playServices",
  IN_PROGRESS: "inProgress",
  ACCOUNT_EXISTS_PASSWORD: "accountExistsPassword",
  POPUP_BLOCKED: "popupBlocked",
  GENERIC: "generic",
};

const NETWORK_CODES = new Set([
  "auth/network-request-failed",
  "auth/timeout",
]);

const NETWORK_MESSAGES = ["network", "failed to fetch", "offline"];

/**
 * @param {unknown} error
 * @returns {string} GOOGLE_SIGN_IN_ERROR value
 */
export function mapGoogleSignInError(error) {
  if (!error) return GOOGLE_SIGN_IN_ERROR.GENERIC;

  const code = error.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return GOOGLE_SIGN_IN_ERROR.CANCELLED;
  }
  if (code === "auth/popup-blocked") {
    return GOOGLE_SIGN_IN_ERROR.POPUP_BLOCKED;
  }
  if (code === "auth/account-exists-with-different-credential") {
    return GOOGLE_SIGN_IN_ERROR.ACCOUNT_EXISTS_PASSWORD;
  }
  if (NETWORK_CODES.has(code)) {
    return GOOGLE_SIGN_IN_ERROR.NETWORK;
  }

  const message = String(error.message || "").toLowerCase();
  if (NETWORK_MESSAGES.some((fragment) => message.includes(fragment))) {
    return GOOGLE_SIGN_IN_ERROR.NETWORK;
  }

  return GOOGLE_SIGN_IN_ERROR.GENERIC;
}

/**
 * @param {string} statusCode - @react-native-google-signin statusCodes
 */
export function mapNativeGoogleStatusCode(statusCode) {
  if (statusCode === "SIGN_IN_CANCELLED") {
    return GOOGLE_SIGN_IN_ERROR.CANCELLED;
  }
  if (statusCode === "IN_PROGRESS") {
    return GOOGLE_SIGN_IN_ERROR.IN_PROGRESS;
  }
  if (statusCode === "PLAY_SERVICES_NOT_AVAILABLE") {
    return GOOGLE_SIGN_IN_ERROR.PLAY_SERVICES;
  }
  return GOOGLE_SIGN_IN_ERROR.GENERIC;
}
