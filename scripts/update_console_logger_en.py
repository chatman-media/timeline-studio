#!/usr/bin/env python3
"""
Script to replace console.* with TauriLogger in English markdown files.
Processes only TypeScript code blocks.
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
    'console-error-summary.md',  # This file is about console errors, keep examples
}


def extract_component_name(filepath: Path) -> str:
    """Extracts component name from file path."""
    parts = filepath.stem.replace('-', ' ').title().replace(' ', '')
    return parts or 'Component'


def has_logger_import(block: str) -> bool:
    """Checks if logger import already exists."""
    return 'createLogger' in block or 'const logger' in block


def add_logger_import(block: str, component_name: str) -> str:
    """Adds logger import at the beginning of the block."""
    import_lines = f"import {{ createLogger }} from '@/lib/tauri-logger'\nconst logger = createLogger('{component_name}')\n\n"
    return import_lines + block


def is_negative_example(context: str) -> bool:
    """Checks if this is a negative example (DON'T do this)."""
    negative_markers = [
        '❌',
        '🚫',
        'DON\'T',
        'Don\'t',
        'do not',
        'Bad:',
        'Wrong:',
        'Incorrect:',
        'Anti-pattern:',
        'Before:',  # Often used in before/after comparisons
    ]

    # Check the previous ~200 characters for negative markers
    check_context = context[-200:] if len(context) > 200 else context
    return any(marker.lower() in check_context.lower() for marker in negative_markers)


def replace_console_in_block(block: str) -> Tuple[str, int]:
    """Replaces console.* with logger.* in code block."""
    replacements = 0

    # Patterns for replacement
    patterns = [
        # console.log with progress/debug context -> debugSync
        (r'console\.log\(([^)]*(?:progress|frame|fps|debug|trace)[^)]*)\)', r'logger.debugSync(\1)', 'debug'),
        # other console.log -> infoSync
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
    """Processes markdown file, replacing console.* in TypeScript blocks."""
    total_replacements = 0

    # Find all TypeScript blocks with context
    pattern = r'```typescript\n(.*?)```'

    # Store positions to track context
    matches = list(re.finditer(pattern, content, flags=re.DOTALL))

    offset = 0
    result = content

    for match in matches:
        block = match.group(1)

        # Check if console.* exists in block
        if not re.search(r'console\.(log|error|warn|info|debug)', block):
            continue

        # Get context before the code block to check for negative examples
        context_start = max(0, match.start() - 200)
        context = content[context_start:match.start()]

        # Skip if this is a negative example
        if is_negative_example(context):
            continue

        # If no logger import, add it
        if not has_logger_import(block):
            block = add_logger_import(block, component_name)

        # Replace console.* with logger.*
        block, replacements = replace_console_in_block(block)

        if replacements > 0:
            total_replacements += replacements

            # Rebuild the code block
            new_block = f'```typescript\n{block}```'

            # Calculate actual positions with offset
            start_pos = match.start() + offset
            end_pos = match.end() + offset

            # Replace in result
            result = result[:start_pos] + new_block + result[end_pos:]

            # Update offset for next replacements
            offset += len(new_block) - (match.end() - match.start())

    return result, total_replacements


def process_file(filepath: Path) -> Tuple[bool, int]:
    """Processes a single file."""
    try:
        content = filepath.read_text(encoding='utf-8')

        # Check for console.*
        if not re.search(r'console\.(log|error|warn|info|debug)', content):
            return False, 0

        component_name = extract_component_name(filepath)
        new_content, replacements = process_markdown(content, component_name)

        if replacements > 0:
            filepath.write_text(new_content, encoding='utf-8')
            return True, replacements

        return False, 0
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}", file=sys.stderr)
        return False, 0


def main():
    docs_dir = Path(__file__).parent.parent / 'docs' / 'en'

    if not docs_dir.exists():
        print(f"❌ Directory not found: {docs_dir}", file=sys.stderr)
        sys.exit(1)

    print("="*60)
    print("Replacing console.* with TauriLogger (English docs)")
    print("="*60)
    print()

    md_files = list(docs_dir.rglob('*.md'))
    processed_files = []
    total_replacements = 0

    for filepath in md_files:
        # Skip excluded files
        if filepath.name in SKIP_FILES:
            print(f"⊘ Skipping: {filepath.name}")
            continue

        modified, count = process_file(filepath)

        if modified:
            rel_path = filepath.relative_to(docs_dir)
            processed_files.append((str(rel_path), count))
            total_replacements += count
            print(f"✓ {filepath.name}: {count} replacements")

    # Final report
    print()
    print("="*60)
    print(f"Completed!")
    print("="*60)
    print(f"Files processed: {len(processed_files)}")
    print(f"Total replacements: {total_replacements}")
    print("="*60)

    if processed_files:
        print("\nUpdated files:")
        for filename, count in sorted(processed_files):
            print(f"  • {filename}: {count} replacements")


if __name__ == '__main__':
    main()
