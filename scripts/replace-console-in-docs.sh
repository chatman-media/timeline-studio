#!/bin/bash

# Скрипт для замены console.* на TauriLogger в markdown документах
# Использует sed для замены паттернов

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
total_files=0
processed_files=0
total_replacements=0

# Директория с документацией
DOCS_DIR="/Users/aleksandrkireev/Apps/timeline-studio/docs/ru"

# Файлы для пропуска
SKIP_FILES=(
    "coding-standards.md"
    "performance.md"
    "communication.md"
    "ai-director-usage.md"
    "telemetry.md"
    "telemetry-tauri-logger.md"
)

# Функция проверки, нужно ли пропустить файл
should_skip() {
    local filename=$(basename "$1")
    for skip in "${SKIP_FILES[@]}"; do
        if [ "$filename" == "$skip" ]; then
            return 0
        fi
    done
    return 1
}

# Функция для подсчета вхождений console.* в файле
count_console_calls() {
    local file="$1"
    grep -o "console\.\(log\|error\|warn\|info\|debug\)" "$file" 2>/dev/null | wc -l | tr -d ' '
}

# Функция для обработки одного файла
process_file() {
    local file="$1"
    local count_before=$(count_console_calls "$file")

    if [ "$count_before" -eq 0 ]; then
        return
    fi

    echo -e "${YELLOW}Обработка:${NC} $(basename "$file")"

    # Создаем временный файл
    local temp_file="${file}.tmp"

    # Копируем исходный файл
    cp "$file" "$temp_file"

    # Замены для разных случаев console.*

    # 1. console.log(...) -> logger.debugSync(...) / logger.infoSync(...)
    # Для прогресса и debug информации используем debugSync
    sed -i '' 's/console\.log(\(.*progress.*\))/logger.debugSync(\1)/gI' "$temp_file"
    sed -i '' 's/console\.log(\(.*frame.*\))/logger.debugSync(\1)/gI' "$temp_file"
    sed -i '' 's/console\.log(\(.*fps.*\))/logger.debugSync(\1)/gI' "$temp_file"
    sed -i '' 's/console\.log(\(.*debug.*\))/logger.debugSync(\1)/gI' "$temp_file"
    sed -i '' 's/console\.log(\(.*trace.*\))/logger.debugSync(\1)/gI' "$temp_file"

    # Для остальных случаев используем infoSync
    sed -i '' 's/console\.log(/logger.infoSync(/g' "$temp_file"

    # 2. console.error(...) -> logger.errorSync(...)
    sed -i '' 's/console\.error(/logger.errorSync(/g' "$temp_file"

    # 3. console.warn(...) -> logger.warnSync(...)
    sed -i '' 's/console\.warn(/logger.warnSync(/g' "$temp_file"

    # 4. console.info(...) -> logger.infoSync(...)
    sed -i '' 's/console\.info(/logger.infoSync(/g' "$temp_file"

    # 5. console.debug(...) -> logger.debugSync(...)
    sed -i '' 's/console\.debug(/logger.debugSync(/g' "$temp_file"

    local count_after=$(count_console_calls "$temp_file")
    local replacements=$((count_before - count_after))

    if [ "$replacements" -gt 0 ]; then
        mv "$temp_file" "$file"
        echo -e "${GREEN}✓${NC} Заменено: $replacements вхождений"
        ((processed_files++))
        ((total_replacements+=replacements))
    else
        rm "$temp_file"
    fi
}

# Главная функция
main() {
    echo "======================================"
    echo "Замена console.* на TauriLogger"
    echo "======================================"
    echo ""

    # Находим все markdown файлы
    while IFS= read -r -d '' file; do
        ((total_files++))

        # Проверяем, нужно ли пропустить
        if should_skip "$file"; then
            echo -e "${YELLOW}⊘${NC} Пропуск: $(basename "$file")"
            continue
        fi

        # Обрабатываем файл
        process_file "$file"

    done < <(find "$DOCS_DIR" -name "*.md" -type f -print0)

    # Итоговый отчет
    echo ""
    echo "======================================"
    echo -e "${GREEN}Завершено!${NC}"
    echo "======================================"
    echo "Всего файлов: $total_files"
    echo "Обработано: $processed_files"
    echo "Всего замен: $total_replacements"
    echo "======================================"
}

# Запуск
main
