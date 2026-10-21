/**
 * OAuth 2.0 Web client ID (Firebase console → Project settings → Your apps → Web app,
 * or google-services.json → oauth_client with client_type 3).
 * Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.local — never commit real values.
 */
export function getGoogleWebClientId() {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }
  return null;
}

export function isGoogleSignInConfigured() {
  return Boolean(getGoogleWebClientId());
}
