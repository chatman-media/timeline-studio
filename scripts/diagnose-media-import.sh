#!/bin/bash

# Media Import Diagnostics Script
# Проверяет работоспособность импорта медиа после event-driven миграции

echo "🔍 Media Import Diagnostics"
echo "======================================"
echo ""

# 1. Проверка backend команд
echo "1️⃣ Checking Backend Commands..."
if grep -r "AddImportedMedia" src-tauri/src/state/commands/ > /dev/null; then
  echo "✅ AddImportedMedia command exists"
else
  echo "❌ AddImportedMedia command NOT FOUND"
fi

if grep -r "pub async fn add_media" src-tauri/src/state/commands/media.rs > /dev/null; then
  echo "✅ AddMedia command exists"
else
  echo "❌ AddMedia command NOT FOUND"
fi

echo ""

# 2. Проверка event handlers
echo "2️⃣ Checking Event Handlers..."
if grep -r "ImportedMediaAdded" src/features/browser/machines/resource-backend-event-handlers.ts > /dev/null; then
  echo "✅ ImportedMediaAdded handler exists"
else
  echo "❌ ImportedMediaAdded handler NOT FOUND"
fi

if grep -r "MediaAdded" src/domains/media-management/machines/backend-event-handlers.ts > /dev/null; then
  echo "✅ MediaAdded handler exists"
else
  echo "❌ MediaAdded handler NOT FOUND"
fi

echo ""

# 3. Проверка frontend hooks
echo "3️⃣ Checking Frontend Hooks..."
if [ -f "src/features/media/hooks/use-media-import.ts" ]; then
  echo "✅ use-media-import hook exists"
else
  echo "❌ use-media-import hook NOT FOUND"
fi

if grep -r "useResources" src/features/voice-recording/components/voice-recording-modal.tsx > /dev/null; then
  echo "✅ Audio recording uses useResources"
else
  echo "❌ Audio recording integration MISSING"
fi

echo ""

# 4. Запуск тестов
echo "4️⃣ Running Tests..."
echo "Running media import tests..."
bun run test src/features/media/__tests__/hooks/use-media-import.test.tsx 2>&1 | grep -q "✓"
if [ $? -eq 0 ]; then
  echo "✅ Media import tests PASSED"
else
  echo "❌ Media import tests FAILED"
  echo "Run: bun run test src/features/media/__tests__/hooks/use-media-import.test.tsx"
fi

echo "Running browser adapter tests..."
bun run test src/features/browser/__tests__/adapters/media-adapter.test.tsx 2>&1 | grep -q "✓"
if [ $? -eq 0 ]; then
  echo "✅ Browser adapter tests PASSED"
else
  echo "❌ Browser adapter tests FAILED"
  echo "Run: bun run test src/features/browser/__tests__/adapters/media-adapter.test.tsx"
fi

echo ""

# 5. Проверка типов
echo "5️⃣ Checking Types..."
if [ -f "src/types/generated/tauri-bindings.ts" ]; then
  if grep -r "AddImportedMedia" src/types/generated/tauri-bindings.ts > /dev/null; then
    echo "✅ AddImportedMedia type definition exists"
  else
    echo "⚠️  AddImportedMedia type may need regeneration"
    echo "Run: bun run tauri:bindings"
  fi
else
  echo "⚠️  Type bindings file not found, may need generation"
  echo "Run: bun run tauri:bindings"
fi

echo ""

# 6. Summary
echo "======================================"
echo "📋 Summary"
echo "======================================"
echo ""
echo "Import Flow:"
echo "  1. User selects files via selectMediaFile()"
echo "  2. Files processed by use-media-import hook"
echo "  3. AddImportedMedia command → imported_media storage"
echo "  4. UpdateImportedMedia command → metadata updates"
echo "  5. ImportedMediaAdded event → Browser UI updates"
echo "  6. User clicks checkmark → move_to_media_pool()"
echo "  7. AddMedia command → media_pool storage"
echo "  8. MediaAdded event → Resources panel updates"
echo ""
echo "✅ Two-stage import process (by design)"
echo ""

# 7. Troubleshooting guide
echo "🔧 Troubleshooting Guide:"
echo "======================================"
echo ""
echo "If import appears broken:"
echo "  1. Check Browser's 'Imported' tab for files"
echo "  2. Look for green checkmark to move to Resources"
echo "  3. Check browser DevTools console for errors"
echo "  4. Review Tauri logs for command execution"
echo "  5. Run: bun run tauri dev (in debug mode)"
echo ""
echo "Common Issues:"
echo "  - Files in 'Imported' tab but not Resources?"
echo "    → Click green checkmark to move files"
echo "  - No files appear at all?"
echo "    → Check backend logs for AddImportedMedia errors"
echo "  - Audio recording fails?"
echo "    → Check MediaDevices API support in browser"
echo ""
echo "======================================"
echo "Diagnosis complete! ✨"
