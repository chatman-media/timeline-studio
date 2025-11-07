#!/usr/bin/env python3
"""
Скрипт для замены console.* на TauriLogger в markdown файлах.
"""

import re
import os
import sys
from pathlib import Path
from typing import List, Tuple

# Файлы, которые нужно пропустить
SKIP_FILES = [
    'coding-standards.md',
    'performance.md',
    'communication.md',
    'ai-director-usage.md',
    'telemetry.md',
    'telemetry-tauri-logger.md',
]

# Паттерны замены
REPLACEMENTS = {
    r'console\.log\(': ('logger.debugSync(', 'logger.infoSync('),
    r'console\.error\(': ('logger.errorSync(',),
    r'console\.warn\(': ('logger.warnSync(',),
    r'console\.info\(': ('logger.infoSync(',),
    r'console\.debug\(': ('logger.debugSync(',),
}


def should_skip_file(filepath: str) -> bool:
    """Проверяет, нужно ли пропустить файл."""
    filename = os.path.basename(filepath)
    return filename in SKIP_FILES


def is_negative_example(lines: List[str], line_num: int, context: int = 3) -> bool:
    """Проверяет, является ли строка примером 'что НЕ делать'."""
    # Проверяем несколько строк до и после
    start = max(0, line_num - context)
    end = min(len(lines), line_num + context)

    context_lines = lines[start:end]
    context_text = ''.join(context_lines).lower()

    # Признаки негативного примера
    negative_markers = ['❌', '// плохо', '// bad', 'не делать', "don't", 'плохо -']

    return any(marker in context_text for marker in negative_markers)


def extract_component_name(filepath: str) -> str:
    """Извлекает имя компонента из пути файла."""
    # Попробуем получить имя из последней части пути
    parts = Path(filepath).stem.split('-')
    # Преобразуем в PascalCase
    return ''.join(word.capitalize() for word in parts)


def add_logger_import(content: str, component_name: str) -> str:
    """Добавляет импорт logger в начало typescript блоков."""
    import_line = f"import {{ createLogger }} from '@/lib/tauri-logger'\nconst logger = createLogger('{component_name}')\n\n"

    # Ищем typescript блоки, которые содержат console.*
    pattern = r'```typescript\n((?:(?!```).)*console\.(?:log|error|warn|info|debug)(?:(?!```).)*)```'

    def add_import_to_block(match):
        block_content = match.group(1)
        # Проверяем, есть ли уже импорт logger
        if 'createLogger' in block_content or 'const logger' in block_content:
            return match.group(0)
        return f'```typescript\n{import_line}{block_content}```'

    return re.sub(pattern, add_import_to_block, content, flags=re.DOTALL)


def replace_console_calls(content: str) -> Tuple[str, int]:
    """Заменяет вызовы console.* на logger.*"""
    replacements_count = 0

    # Заменяем console.log на logger.debugSync или logger.infoSync
    # Используем debugSync для технических деталей, infoSync для важных событий
    def replace_log(match):
        nonlocal replacements_count
        args = match.group(1)

        # Определяем, какой метод использовать
        # Если это прогресс, статистика или debug информация - используем debugSync
        if any(keyword in args.lower() for keyword in ['progress', 'frame', 'fps', 'debug', 'trace']):
            replacements_count += 1
            return f'logger.debugSync({args})'
        else:
            # Для важных событий используем infoSync
            replacements_count += 1
            return f'logger.infoSync({args})'

    content = re.sub(r'console\.log\((.*?)\)', replace_log, content)

    # Остальные методы заменяем напрямую
    for old_pattern, replacements in REPLACEMENTS.items():
        if 'log' in old_pattern:
            continue  # Уже обработали выше

        replacement = replacements[0]
        pattern = old_pattern + r'(.*?)\)'
        count = len(re.findall(pattern, content))
        replacements_count += count
        content = re.sub(pattern, replacement + r'\1)', content)

    return content, replacements_count


def process_file(filepath: str) -> Tuple[bool, int]:
    """Обрабатывает один файл."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Проверяем, есть ли вообще console.*
        if not re.search(r'console\.(log|error|warn|info|debug)', content):
            return False, 0

        # Получаем имя компонента для logger
        component_name = extract_component_name(filepath)

        # Добавляем импорты logger
        content = add_logger_import(content, component_name)

        # Заменяем вызовы console.*
        content, count = replace_console_calls(content)

        # Записываем обратно
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return True, count
    except Exception as e:
        print(f"❌ Ошибка при обработке {filepath}: {e}", file=sys.stderr)
        return False, 0


def main():
    """Главная функция."""
    docs_dir = Path(__file__).parent.parent / 'docs' / 'ru'

    if not docs_dir.exists():
        print(f"❌ Директория не найдена: {docs_dir}", file=sys.stderr)
        sys.exit(1)

    # Находим все markdown файлы
    md_files = list(docs_dir.rglob('*.md'))

    print(f"Найдено {len(md_files)} markdown файлов")
    print("Обработка файлов...")

    processed_files = []
    total_replacements = 0

    for filepath in md_files:
        # Пропускаем исключённые файлы
        if should_skip_file(str(filepath)):
            continue

        modified, count = process_file(str(filepath))

        if modified:
            processed_files.append((str(filepath.relative_to(docs_dir)), count))
            total_replacements += count
            print(f"✓ {filepath.name}: {count} замен")

    # Итоговый отчёт
    print("\n" + "="*60)
    print(f"Обработано файлов: {len(processed_files)}")
    print(f"Всего замен: {total_replacements}")
    print("="*60)

    if processed_files:
        print("\nОбновлённые файлы:")
        for filename, count in sorted(processed_files):
            print(f"  • {filename}: {count} замен")


if __name__ == '__main__':
    main()
