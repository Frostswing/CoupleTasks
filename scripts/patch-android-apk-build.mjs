/**
 * Post-prebuild patches for release APK: ARM ABIs only + debug keystore signing on release.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const gradlePropsPath = path.join(root, "android", "gradle.properties");
const buildGradlePath = path.join(root, "android", "app", "build.gradle");

if (!existsSync(gradlePropsPath)) {
  console.error("android/gradle.properties not found — run expo prebuild first");
  process.exit(1);
}

let gradleProps = readFileSync(gradlePropsPath, "utf8");
if (gradleProps.includes("reactNativeArchitectures=")) {
  gradleProps = gradleProps.replace(
    /reactNativeArchitectures=.*/,
    "reactNativeArchitectures=armeabi-v7a,arm64-v8a"
  );
} else {
  gradleProps += "\nreactNativeArchitectures=armeabi-v7a,arm64-v8a\n";
}
writeFileSync(gradlePropsPath, gradleProps);
console.log("✓ gradle.properties: armeabi-v7a + arm64-v8a only");

if (existsSync(buildGradlePath)) {
  let buildGradle = readFileSync(buildGradlePath, "utf8");
  if (!buildGradle.includes('abiFilters "armeabi-v7a", "arm64-v8a"')) {
    buildGradle = buildGradle.replace(
      /versionName "[^"]+"\s*\n(\s*)\}/,
      `versionName "${
        buildGradle.match(/versionName "([^"]+)"/)?.[1] ?? "1.2.0"
      }"
$1    ndk {
$1        abiFilters "armeabi-v7a", "arm64-v8a"
$1    }
$1}`
    );
  }
  if (!buildGradle.includes("signingConfig signingConfigs.debug")) {
    buildGradle = buildGradle.replace(
      /release\s*\{[^}]*signingConfig[^}]*\}/m,
      `release {
            signingConfig signingConfigs.debug
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            crunchPngs (findProperty('android.enablePngCrunchInReleaseBuilds')?.toBoolean() ?: true)
        }`
    );
  } else if (!/release\s*\{[\s\S]*?signingConfig signingConfigs\.debug/.test(buildGradle)) {
    buildGradle = buildGradle.replace(
      /(release\s*\{)/,
      `$1
            signingConfig signingConfigs.debug`
    );
  }
  writeFileSync(buildGradlePath, buildGradle);
  console.log("✓ app/build.gradle: ARM ABIs + release signed with debug.keystore");
}
