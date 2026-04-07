#!/bin/bash

# ======================================
# WorkOS Mobile Build Script
# ======================================

set -e

PLATFORM=${1:-"all"}  # android | ios | all

echo "🚀 WorkOS Mobile Build"
echo "========================"

# 1. Build React app
echo "📦 Building React app..."
npm run build:mobile
echo "✅ React build done"

# 2. Sync to native platforms
echo "🔄 Syncing to native platforms..."
npx cap sync
echo "✅ Sync done"

# 3. Open platform
if [ "$PLATFORM" = "android" ]; then
  echo "📱 Opening Android Studio..."
  npx cap open android

elif [ "$PLATFORM" = "ios" ]; then
  echo "🍎 Opening Xcode..."
  npx cap open ios

elif [ "$PLATFORM" = "all" ]; then
  echo ""
  echo "✅ Build complete! To open platforms:"
  echo "   Android: npx cap open android"
  echo "   iOS:     npx cap open ios"
fi

echo ""
echo "========================================"
echo "📋 Next Steps:"
echo "========================================"
echo ""
echo "ANDROID (Play Store):"
echo "  1. Open Android Studio: npx cap open android"
echo "  2. Build > Generate Signed Bundle/APK"
echo "  3. Select 'Android App Bundle' (.aab)"
echo "  4. Upload to Google Play Console"
echo ""
echo "iOS (App Store):"
echo "  1. Open Xcode: npx cap open ios"
echo "  2. Product > Archive"
echo "  3. Distribute App > App Store Connect"
echo "  4. Upload to App Store Connect"
echo ""
echo "⚠️  قبل الرفع: غير VITE_API_URL في .env.production لرابط السيرفر الحقيقي"
echo "========================================"
