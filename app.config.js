const appJson = require("./app.json");

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";

/** iOS reversed client id for Google Sign-In URL scheme */
const iosUrlScheme = googleWebClientId
  ? `com.googleusercontent.apps.${googleWebClientId.replace(".apps.googleusercontent.com", "")}`
  : null;

const plugins = [
  ...(appJson.expo.plugins || []),
  [
    "expo-build-properties",
    {
      android: {
        enableProguardInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
      },
    },
  ],
];
if (iosUrlScheme) {
  plugins.push([
    "@react-native-google-signin/google-signin",
    { iosUrlScheme },
  ]);
} else {
  plugins.push("@react-native-google-signin/google-signin");
}

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      googleWebClientId: googleWebClientId || undefined,
    },
    plugins,
  },
};
