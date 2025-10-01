#!/bin/bash

# Скрипт для миграции импортов в AI Chat tools на domains архитектуру
# Phase 2: Feature Reorganization

echo "🔄 Миграция AI Chat tools импортов на domains архитектуру..."

# Функция для замены импортов в файлах
migrate_imports() {
    local pattern="$1"
    local replacement="$2"
    local description="$3"
    
    echo "📝 $description"
    
    # Найти все TypeScript файлы в ai-chat/tools
    find src/features/ai-chat/tools -name "*.ts" -type f | while read -r file; do
        if grep -q "$pattern" "$file"; then
            echo "  ✏️  Обновляем: $file"
            # Используем sed для замены импортов
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|$pattern|$replacement|g" "$file"
            else
                # Linux
                sed -i "s|$pattern|$replacement|g" "$file"
            fi
        fi
    done
}

# Миграция MediaFile импортов
migrate_imports \
    "from \"@/features/media\"" \
    "from \"@/domains/video-editing/types/media\"" \
    "Миграция MediaFile импортов"

# Миграция Timeline типов
migrate_imports \
    "from \"@/features/timeline/types/timeline\"" \
    "from \"@/domains/video-editing/types/timeline\"" \
    "Миграция Timeline типов"

# Миграция Browser типов
migrate_imports \
    "from \"@/features/browser/types\"" \
    "from \"@/domains/media-management/types\"" \
    "Миграция Browser типов"

# Миграция Resources типов
migrate_imports \
    "from \"@/features/resources/types\"" \
    "from \"@/domains/media-management/types\"" \
    "Миграция Resources типов"

# Миграция Player типов
migrate_imports \
    "from \"@/features/video-player/types\"" \
    "from \"@/domains/video-editing/types\"" \
    "Миграция Player типов"

# Миграция AI Content Intelligence
migrate_imports \
    "from \"@/features/ai-content-intelligence/shared/types\"" \
    "from \"@/domains/ai-services/types\"" \
    "Миграция AI Content Intelligence типов"

# Миграция AI Content Intelligence сервисов
migrate_imports \
    "from \"@/features/ai-content-intelligence/shared/services\"" \
    "from \"@/domains/ai-services/services\"" \
    "Миграция AI Content Intelligence сервисов"

# Миграция Person Identification
migrate_imports \
    "from \"@/features/person-identification/types\"" \
    "from \"@/domains/ai-services/types\"" \
    "Миграция Person Identification типов"

# Миграция Recognition сервисов
migrate_imports \
    "from \"@/features/recognition/services\"" \
    "from \"@/domains/ai-services/services\"" \
    "Миграция Recognition сервисов"

# Миграция Transcription
migrate_imports \
    "from \"@/features/transcription/types\"" \
    "from \"@/domains/ai-services/types/transcription\"" \
    "Миграция Transcription типов"

migrate_imports \
    "from \"@/features/transcription/services\"" \
    "from \"@/domains/ai-services/services\"" \
    "Миграция Transcription сервисов"

echo ""
echo "✅ Миграция импортов завершена!"
echo ""
echo "📊 Статистика:"
echo "   - Обновлены импорты MediaFile → domains/video-editing/types/media"
echo "   - Обновлены импорты Timeline → domains/video-editing/types/timeline"
echo "   - Обновлены импорты Browser → domains/media-management/types"
echo "   - Обновлены импорты AI Services → domains/ai-services"
echo ""
echo "🔍 Проверьте результаты:"
echo "   npx tsc --noEmit | grep -E 'ai-chat/tools'"
echo ""
