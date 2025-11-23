#!/bin/bash

echo "🔄 Syncing Convex API from web app..."

cd ../tiqn-nextjs
echo "📦 Generating API spec from web app deployment..."
npx convex-helpers ts-api-spec

GENERATED_FILE=$(ls -t convexApi*.ts 2>/dev/null | head -1)

if [ -z "$GENERATED_FILE" ]; then
  echo "❌ Failed to generate API spec"
  exit 1
fi

echo "📋 Copying $GENERATED_FILE to mobile app..."
cp "$GENERATED_FILE" ../tiqn-expo/convex/api.ts

echo "✅ Convex API synced successfully!"
echo "📱 The mobile app now has the latest function types from the web app"
