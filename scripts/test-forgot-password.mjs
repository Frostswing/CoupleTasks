import {
  validateResetEmail,
  RESET_EMAIL_ERROR,
  mapFirebaseResetSendError,
  shouldObfuscateResetSuccess,
  getAuthLanguageCode,
  normalizeResetEmail,
  RESET_SEND_ERROR,
} from "../src/utils/passwordReset.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// normalizeResetEmail
assert(normalizeResetEmail("  a@b.co  ") === "a@b.co", "trim email");
assert(normalizeResetEmail(null) === "", "null email");

// validateResetEmail
let v = validateResetEmail("");
assert(!v.ok && v.reason === RESET_EMAIL_ERROR.MISSING, "missing email");

v = validateResetEmail("not-an-email");
assert(!v.ok && v.reason === RESET_EMAIL_ERROR.INVALID, "invalid email");

v = validateResetEmail("user@example.com");
assert(v.ok, "valid email");

// getAuthLanguageCode
assert(getAuthLanguageCode("he") === "he", "he locale");
assert(getAuthLanguageCode("he-IL") === "he", "he-IL locale");
assert(getAuthLanguageCode("en-US") === "en", "en locale");
assert(getAuthLanguageCode(undefined) === "en", "default en");

// shouldObfuscateResetSuccess
assert(shouldObfuscateResetSuccess({ code: "auth/user-not-found" }), "user-not-found obfuscated");
assert(!shouldObfuscateResetSuccess({ code: "auth/too-many-requests" }), "too-many-requests not obfuscated");

// mapFirebaseResetSendError
assert(
  mapFirebaseResetSendError({ code: "auth/invalid-email" }) === RESET_SEND_ERROR.INVALID_EMAIL,
  "invalid-email mapping"
);
assert(
  mapFirebaseResetSendError({ code: "auth/too-many-requests" }) === RESET_SEND_ERROR.TOO_MANY_REQUESTS,
  "too-many-requests mapping"
);
assert(
  mapFirebaseResetSendError({ code: "auth/network-request-failed" }) === RESET_SEND_ERROR.NETWORK,
  "network code mapping"
);
assert(
  mapFirebaseResetSendError({ message: "Network error when attempting to fetch resource." }) ===
    RESET_SEND_ERROR.NETWORK,
  "network message mapping"
);
assert(mapFirebaseResetSendError({ code: "auth/internal-error" }) === RESET_SEND_ERROR.GENERIC, "generic mapping");

console.log("✓ forgot-password validation and error mapping");
