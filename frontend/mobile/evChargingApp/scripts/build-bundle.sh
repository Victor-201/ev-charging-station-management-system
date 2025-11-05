#!/bin/bash

# Build production bundle for faster app startup
# This creates a pre-bundled JavaScript file that doesn't need Metro

echo "📦 Building iOS production bundle..."

cd "$(dirname "$0")/.."

# Build the bundle
npx react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios \
  --reset-cache

echo "✅ Bundle created at ios/main.jsbundle"
echo "💡 Now build and run the app in Xcode for instant startup!"
echo "   The app will use the pre-built bundle instead of Metro"
