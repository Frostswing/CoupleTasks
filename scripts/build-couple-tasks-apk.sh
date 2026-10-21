#!/usr/bin/env bash
# Build signed release APK (debug keystore) with Firebase env from .env.local
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ROOT}/.env.local"
GSERVICES="${ROOT}/google-services.json"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.local — copy .env.example and set Firebase + Google client IDs"
  exit 1
fi
if [[ ! -f "$GSERVICES" ]]; then
  echo "Missing google-services.json at project root (gitignored; download from Firebase)"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/^/export /')
set +a

if [[ ! -f "${ROOT}/src/firebase/config.js" ]]; then
  cp "${ROOT}/src/firebase/config.example.js" "${ROOT}/src/firebase/config.js"
  echo "Created src/firebase/config.js from example (uses EXPO_PUBLIC_* at bundle time)"
fi

export NODE_ENV=development
npm install --no-audit --no-fund

echo "[1/4] expo prebuild (android, clean)..."
npx expo prebuild --platform android --clean

echo "[2/4] patch Android release settings..."
node scripts/patch-android-apk-build.mjs
cp "$GSERVICES" "${ROOT}/android/app/google-services.json"
echo "Using android/app/google-services.json (from project root copy)"

echo "[3/4] assembleRelease..."
cd "${ROOT}/android"
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a

APK_SRC="${ROOT}/android/app/build/outputs/apk/release/app-release.apk"
VERSION="$(node -p "require('${ROOT}/package.json').version")"
OUT="/opt/cursor/artifacts/couple-of-tasks-${VERSION}.apk"
mkdir -p /opt/cursor/artifacts
cp "$APK_SRC" "$OUT"

echo "[4/4] Done: $OUT ($(du -h "$OUT" | awk '{print $1}'))"
