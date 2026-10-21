const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// @firebase/auth is nested under firebase; point Metro at the RN build entry.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@firebase/auth": path.resolve(
    __dirname,
    "node_modules/firebase/node_modules/@firebase/auth"
  ),
};

// -----------------------------------------------------------------------------
// Firebase / Expo SDK 53: allow ".cjs" files and use classic Node "exports"
// resolution so Firebase sub‑packages are bundled correctly.
// -----------------------------------------------------------------------------
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}

// Disable the new, stricter "package.json exports" resolution until every
// dependency (Firebase, React‑Native‑WebView, etc.) ships full export maps.
config.resolver.unstable_enablePackageExports = false;

// -----------------------------------------------------------------------------
// That's it – export the tweaked config.
// -----------------------------------------------------------------------------
module.exports = config;
