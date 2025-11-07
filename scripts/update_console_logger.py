#!/usr/bin/env python3
"""
Скрипт для замены console.* на TauriLogger в markdown файлах.
Обрабатывает только TypeScript блоки кода.
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

SKIP_FILES = {
    'coding-standards.md',
    'performance.md',
    'communication.md',
    'ai-director-usage.md',
    'telemetry.md',
    'telemetry-tauri-logger.md',
}


def extract_component_name(filepath: Path) -> str:
    """Извлекает имя компонента из пути файла."""
    parts = filepath.stem.replace('-', ' ').title().replace(' ', '')
    return parts or 'Component'


def has_logger_import(block: str) -> bool:
    """Проверяет, есть ли уже импорт logger."""
    return 'createLogger' in block or 'const logger' in block


def add_logger_import(block: str, component_name: str) -> str:
    """Добавляет импорт logger в начало блока."""
    import_lines = f"import {{ createLogger }} from '@/lib/tauri-logger'\nconst logger = createLogger('{component_name}')\n\n"
    return import_lines + block


def replace_console_in_block(block: str) -> Tuple[str, int]:
    """Заменяет console.* на logger.* в блоке кода."""
    replacements = 0

    # Паттерны для замены
    patterns = [
        # console.log с контекстом прогресса/debug -> debugSync
        (r'console\.log\(([^)]*(?:progress|frame|fps|debug|trace)[^)]*)\)', r'logger.debugSync(\1)', 'debug'),
        # остальные console.log -> infoSync
        (r'console\.log\(', r'logger.infoSync(', 'info'),
        # console.error -> errorSync
        (r'console\.error\(', r'logger.errorSync(', 'error'),
        # console.warn -> warnSync
        (r'console\.warn\(', r'logger.warnSync(', 'warn'),
        # console.info -> infoSync
        (r'console\.info\(', r'logger.infoSync(', 'info'),
        # console.debug -> debugSync
        (r'console\.debug\(', r'logger.debugSync(', 'debug'),
    ]

    for pattern, replacement, _ in patterns:
        count = len(re.findall(pattern, block, re.IGNORECASE))
        if count > 0:
            block = re.sub(pattern, replacement, block, flags=re.IGNORECASE)
            replacements += count

    return block, replacements


def process_markdown(content: str, component_name: str) -> Tuple[str, int]:
    """Обрабатывает markdown файл, заменяя console.* в TypeScript блоках."""
    total_replacements = 0

    # Находим все TypeScript блоки
    pattern = r'```typescript\n(.*?)```'

    def process_block(match):
        nonlocal total_replacements
        block = match.group(1)

        # Проверяем, есть ли console.* в блоке
        if not re.search(r'console\.(log|error|warn|info|debug)', block):
            return match.group(0)

        # Если нет импорта logger, добавляем
        if not has_logger_import(block):
            block = add_logger_import(block, component_name)

        # Заменяем console.* на logger.*
        block, replacements = replace_console_in_block(block)
        total_replacements += replacements

        return f'```typescript\n{block}```'

    result = re.sub(pattern, process_block, content, flags=re.DOTALL)
    return result, total_replacements


def process_file(filepath: Path) -> Tuple[bool, int]:
    """Обрабатывает один файл."""
    try:
        content = filepath.read_text(encoding='utf-8')

        # Проверяем наличие console.*
        if not re.search(r'console\.(log|error|warn|info|debug)', content):
            return False, 0

        component_name = extract_component_name(filepath)
        new_content, replacements = process_markdown(content, component_name)

        if replacements > 0:
            filepath.write_text(new_content, encoding='utf-8')
            return True, replacements

        return False, 0
    except Exception as e:
        print(f"❌ Ошибка при обработке {filepath}: {e}", file=sys.stderr)
        return False, 0


def main():
    docs_dir = Path(__file__).parent.parent / 'docs' / 'ru'

    if not docs_dir.exists():
        print(f"❌ Директория не найдена: {docs_dir}", file=sys.stderr)
        sys.exit(1)

    print("="*60)
    print("Замена console.* на TauriLogger")
    print("="*60)
    print()

    md_files = list(docs_dir.rglob('*.md'))
    processed_files = []
    total_replacements = 0

    for filepath in md_files:
        # Пропускаем исключённые файлы
        if filepath.name in SKIP_FILES:
            print(f"⊘ Пропуск: {filepath.name}")
            continue

        modified, count = process_file(filepath)

        if modified:
            rel_path = filepath.relative_to(docs_dir)
            processed_files.append((str(rel_path), count))
            total_replacements += count
            print(f"✓ {filepath.name}: {count} замен")

    # Итоговый отчёт
    print()
    print("="*60)
    print(f"Завершено!")
    print("="*60)
    print(f"Обработано файлов: {len(processed_files)}")
    print(f"Всего замен: {total_replacements}")
    print("="*60)

    if processed_files:
        print("\nОбновлённые файлы:")
        for filename, count in sorted(processed_files):
            print(f"  • {filename}: {count} замен")


if __name__ == '__main__':
    main()
