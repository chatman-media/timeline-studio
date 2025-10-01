#!/bin/bash
# scripts/migrate-imports.sh
# Скрипт для автоматической миграции импортов к доменной архитектуре

echo "🔄 Миграция импортов к доменной архитектуре..."
echo "================================================"

# Функция для замены импортов в файле
migrate_file_imports() {
    local file="$1"
    echo "Обрабатываем: $file"
    
    # Замена импортов AI провайдеров
    sed -i '' 's|from ".*ai-chat/tools/providers|from "@/domains/ai-core/providers|g' "$file"
    sed -i '' 's|from ".*ai-content-intelligence/shared/providers|from "@/domains/ai-core/providers|g' "$file"
    
    # Замена импортов AI сервисов
    sed -i '' 's|from ".*ai-content-intelligence/shared/services|from "@/domains/ai-services/services|g' "$file"
    sed -i '' 's|from ".*ai-chat/tools/services|from "@/domains/ai-services/services|g' "$file"
    
    # Замена импортов типов
    sed -i '' 's|from ".*ai-content-intelligence/shared/types|from "@/domains/ai-services/types|g' "$file"
    sed -i '' 's|from ".*ai-chat/tools/types|from "@/domains/ai-core/types|g' "$file"
    
    # Замена импортов Whisper
    sed -i '' 's|from ".*transcription/services|from "@/domains/ai-services/services|g' "$file"
    sed -i '' 's|from ".*recognition/services|from "@/domains/ai-services/services|g' "$file"
}

# Поиск и миграция файлов с устаревшими импортами
echo "🔍 Поиск файлов с устаревшими импортами..."

# AI Chat импорты
find src -name "*.ts" -exec grep -l "from.*ai-chat.*tools" {} \; | while read file; do
    migrate_file_imports "$file"
done

# AI Content Intelligence импорты
find src -name "*.ts" -exec grep -l "from.*ai-content-intelligence.*shared" {} \; | while read file; do
    migrate_file_imports "$file"
done

# Transcription импорты
find src -name "*.ts" -exec grep -l "from.*transcription/services" {} \; | while read file; do
    migrate_file_imports "$file"
done

# Recognition импорты
find src -name "*.ts" -exec grep -l "from.*recognition/services" {} \; | while read file; do
    migrate_file_imports "$file"
done

echo ""
echo "✅ Миграция импортов завершена!"
echo "⚠️  Проверьте результаты и запустите тесты для проверки корректности"
