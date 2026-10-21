import {
  mapGoogleSignInError,
  mapNativeGoogleStatusCode,
  GOOGLE_SIGN_IN_ERROR,
} from "../src/utils/googleAuthErrors.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(
  mapGoogleSignInError({ code: "auth/popup-closed-by-user" }) === GOOGLE_SIGN_IN_ERROR.CANCELLED,
  "popup closed"
);
assert(
  mapGoogleSignInError({ code: "auth/account-exists-with-different-credential" }) ===
    GOOGLE_SIGN_IN_ERROR.ACCOUNT_EXISTS_PASSWORD,
  "account exists"
);
assert(
  mapGoogleSignInError({ code: "auth/network-request-failed" }) === GOOGLE_SIGN_IN_ERROR.NETWORK,
  "network code"
);
assert(
  mapGoogleSignInError({ message: "Network error when attempting to fetch." }) ===
    GOOGLE_SIGN_IN_ERROR.NETWORK,
  "network message"
);
assert(mapNativeGoogleStatusCode("SIGN_IN_CANCELLED") === GOOGLE_SIGN_IN_ERROR.CANCELLED, "native cancel");

console.log("✓ google auth error mapping");
