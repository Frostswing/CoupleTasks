/**
 * Password reset validation and Firebase error mapping (pure, testable).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RESET_EMAIL_ERROR = {
  MISSING: "missing",
  INVALID: "invalid",
};

export const RESET_SEND_ERROR = {
  INVALID_EMAIL: "invalidEmail",
  TOO_MANY_REQUESTS: "tooManyRequests",
  NETWORK: "network",
  GENERIC: "generic",
};

/** Firebase codes that should still show the generic success UI (no account enumeration). */
const OBFUSCATED_SUCCESS_CODES = new Set([
  "auth/user-not-found",
  "auth/invalid-user-token",
]);

const NETWORK_MESSAGE_FRAGMENTS = [
  "network",
  "failed to fetch",
  "network-request-failed",
  "offline",
];

/**
 * @param {string} locale - i18n locale (e.g. en, he-IL)
 * @returns {'en'|'he'}
 */
export function getAuthLanguageCode(locale) {
  if (!locale || typeof locale !== "string") return "en";
  const base = locale.split("-")[0].toLowerCase();
  return base === "he" ? "he" : "en";
}

export function normalizeResetEmail(email) {
  if (email == null) return "";
  return String(email).trim();
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateResetEmail(email) {
  const normalized = normalizeResetEmail(email);
  if (!normalized) {
    return { ok: false, reason: RESET_EMAIL_ERROR.MISSING };
  }
  if (!EMAIL_REGEX.test(normalized)) {
    return { ok: false, reason: RESET_EMAIL_ERROR.INVALID };
  }
  return { ok: true };
}

export function shouldObfuscateResetSuccess(error) {
  const code = error?.code;
  return typeof code === "string" && OBFUSCATED_SUCCESS_CODES.has(code);
}

/**
 * @param {unknown} error
 * @returns {string} One of RESET_SEND_ERROR values
 */
export function mapFirebaseResetSendError(error) {
  const code = error?.code;
  if (code === "auth/invalid-email") {
    return RESET_SEND_ERROR.INVALID_EMAIL;
  }
  if (code === "auth/too-many-requests") {
    return RESET_SEND_ERROR.TOO_MANY_REQUESTS;
  }

  const message = String(error?.message || "").toLowerCase();
  if (code === "auth/network-request-failed") {
    return RESET_SEND_ERROR.NETWORK;
  }
  if (NETWORK_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))) {
    return RESET_SEND_ERROR.NETWORK;
  }

  return RESET_SEND_ERROR.GENERIC;
}
