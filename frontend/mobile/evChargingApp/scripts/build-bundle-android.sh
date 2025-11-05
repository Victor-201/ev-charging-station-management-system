#!/bin/bash

# Build production bundle for Android - for faster app startup
# This creates a pre-bundled JavaScript file that doesn't need Metro

echo "📦 Building Android production bundle..."

cd "$(dirname "$0")/.."

# Create assets directory if not exists
mkdir -p android/app/src/main/assets

# Build the bundle
npx react-native bundle \
  --entry-file index.js \
  --platform android \
  --dev false \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/ \
  --reset-cache

echo "✅ Bundle created at android/app/src/main/assets/index.android.bundle"
echo "💡 Now build and run the app for instant startup!"
echo "   The app will use the pre-built bundle instead of Metro"
