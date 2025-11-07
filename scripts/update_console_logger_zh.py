#!/usr/bin/env python3
"""
Скрипт для замены console.* на TauriLogger в китайских markdown файлах.
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

# Паттерны для китайского языка (разделы "не делай так")
SKIP_PATTERNS = [
    r'不要这样做',  # "Не делай так"
    r'错误示例',    # "Неправильный пример"
    r'不推荐',      # "Не рекомендуется"
]


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


def is_negative_example_block(content: str, block_start: int) -> bool:
    """Проверяет, находится ли блок в разделе 'не делай так'."""
    # Проверяем 200 символов перед блоком
    context = content[max(0, block_start - 200):block_start]

    for pattern in SKIP_PATTERNS:
        if re.search(pattern, context):
            return True

    return False


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
        block_start = match.start()

        # Проверяем, находится ли блок в разделе "не делай так"
        if is_negative_example_block(content, block_start):
            return match.group(0)

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
        print(f"❌ 处理文件时出错 {filepath}: {e}", file=sys.stderr)
        return False, 0


def main():
    docs_dir = Path(__file__).parent.parent / 'docs' / 'zh'

    if not docs_dir.exists():
        print(f"❌ 未找到目录: {docs_dir}", file=sys.stderr)
        sys.exit(1)

    print("="*60)
    print("将 console.* 替换为 TauriLogger")
    print("="*60)
    print()

    # Приоритизация по категориям
    priority_dirs = [
        '04_api_reference',
        '05_development',
        '03_architecture',
    ]

    all_files = []
    for priority_dir in priority_dirs:
        dir_path = docs_dir / priority_dir
        if dir_path.exists():
            all_files.extend(dir_path.rglob('*.md'))

    # Добавляем остальные файлы
    for filepath in docs_dir.rglob('*.md'):
        if filepath not in all_files:
            all_files.append(filepath)

    processed_files = []
    total_replacements = 0

    for filepath in all_files:
        # Пропускаем исключённые файлы
        if filepath.name in SKIP_FILES:
            print(f"⊘ 跳过: {filepath.name}")
            continue

        modified, count = process_file(filepath)

        if modified:
            rel_path = filepath.relative_to(docs_dir)
            processed_files.append((str(rel_path), count))
            total_replacements += count
            print(f"✓ {filepath.name}: {count} 次替换")

    # Итоговый отчёт
    print()
    print("="*60)
    print(f"完成!")
    print("="*60)
    print(f"已处理文件: {len(processed_files)}")
    print(f"总替换数: {total_replacements}")
    print("="*60)

    if processed_files:
        print("\n已更新文件:")
        for filename, count in sorted(processed_files):
            print(f"  • {filename}: {count} 次替换")


if __name__ == '__main__':
    main()
