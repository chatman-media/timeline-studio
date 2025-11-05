# Линтинг и форматирование

[← Назад к руководству разработчика](README.md)

## 📋 Содержание

- [Обзор инструментов](#обзор-инструментов)
- [ESLint (JavaScript/TypeScript)](#eslint-javascripttypescript)
- [Stylelint (CSS)](#stylelint-css)
- [Clippy (Rust)](#clippy-rust)
- [Prettier и форматирование](#prettier-и-форматирование)
- [Biome (альтернатива)](#biome-альтернатива)
- [Pre-commit хуки](#pre-commit-хуки)
- [IDE интеграция](#ide-интеграция)
- [CI/CD проверки](#cicd-проверки)

## 🛠️ Обзор инструментов

Timeline Studio использует несколько инструментов для поддержания качества кода:

| Инструмент | Язык | Назначение | Команда |
|------------|------|------------|---------|
| ESLint | JS/TS | Линтинг и статический анализ | `bun run lint` |
| Stylelint | CSS | Линтинг стилей | `bun run lint:css` |
| Clippy | Rust | Линтинг Rust кода | `bun run lint:rust` |
| Prettier | JS/TS | Форматирование кода | встроен в ESLint |
| rustfmt | Rust | Форматирование Rust | `bun run format:rust` |
| Biome | JS/TS/CSS | Быстрая альтернатива | `bun run lint` |

## 📘 ESLint (JavaScript/TypeScript)

### Конфигурация

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript правила
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Import правила
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'object',
        'type'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    
    // React правила
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
```

### Использование

```bash
# Проверка всех файлов
bun run lint

# Автоисправление
bun run lint:fix

# Конкретный файл или директория
bunx eslint src/features/timeline --fix

# Игнорировать предупреждения
bunx eslint src --quiet
```

### Отключение правил

```typescript
// Отключить для следующей строки
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData()

// Отключить для блока
/* eslint-disable react-hooks/exhaustive-deps */
useEffect(() => {
  // Сложная логика
}, []) // Намеренно пустые зависимости
/* eslint-enable react-hooks/exhaustive-deps */

// Отключить для всего файла
/* eslint-disable @typescript-eslint/no-var-requires */
const config = require('./config')
```

## 🎨 Stylelint (CSS)

### Конфигурация

```javascript
// .stylelintrc.js
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss'
  ],
  rules: {
    // Tailwind специфичные правила
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen']
    }],
    
    // Отключаем конфликтующие с Tailwind правила
    'no-descending-specificity': null,
    'declaration-block-no-duplicate-properties': null,
    
    // Кастомные правила
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'selector-class-pattern': '^[a-z][a-zA-Z0-9-]*$'
  }
}
```

### Использование

```bash
# Проверка CSS файлов
bun run lint:css

# Автоисправление
bun run lint:css:fix

# Конкретный файл
bunx stylelint "src/**/*.css" --fix
```

### CSS-in-JS и Tailwind

```css
/* Игнорировать Tailwind директивы */
/* stylelint-disable */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* stylelint-enable */

/* Использование @apply */
.button {
  /* stylelint-disable-next-line */
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}
```

## 🦀 Clippy (Rust)

### Конфигурация

```toml
# Cargo.toml
[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"

# Разрешаем некоторые педантичные правила
module_name_repetitions = "allow"
must_use_candidate = "allow"
missing_errors_doc = "allow"

# Запрещаем опасные паттерны
unwrap_used = "deny"
expect_used = "warn"
panic = "warn"
todo = "warn"
unimplemented = "warn"
```

### Использование

```bash
# Проверка всего кода
bun run lint:rust

# Автоисправление
bun run lint:rust:fix

# С дополнительными проверками
cd src-tauri
cargo clippy -- -W clippy::all -W clippy::pedantic

# Только ошибки (без предупреждений)
cargo clippy -- -D warnings
```

### Отключение правил в коде

```rust
// Отключить для функции
#[allow(clippy::too_many_arguments)]
fn complex_function(a: i32, b: i32, c: i32, d: i32, e: i32) {
    // ...
}

// Отключить для модуля
#[allow(clippy::module_name_repetitions)]
mod video_processor {
    pub struct VideoProcessor;
    pub struct VideoProcessorConfig;
}

// Отключить для следующей строки
#[allow(clippy::unwrap_used)]
let value = some_option.unwrap(); // Безопасно в тестах
```

## 🎯 Prettier и форматирование

### Конфигурация

```javascript
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Import сортировка

```bash
# Форматирование импортов
bun run format

# Windows версия
bun run format
```

Пример результата:
```typescript
// До
import { useState } from 'react'
import { Button } from '@/components/ui'
import axios from 'axios'
import { useTimeline } from '@/features/timeline'
import './styles.css'

// После
import axios from 'axios'
import { useState } from 'react'

import { Button } from '@/components/ui'
import { useTimeline } from '@/features/timeline'

import './styles.css'
```

### Rust форматирование

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
use_small_heuristics = "Max"
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
```

```bash
# Форматирование Rust кода
bun run format:rust

# Проверка без изменений
bun run format:rust:check

# Конкретный файл
cd src-tauri
rustfmt src/main.rs
```

## ⚡ Biome (альтернатива)

Biome - быстрая альтернатива ESLint + Prettier, написанная на Rust.

### Конфигурация

```json
// biome.json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExtraBooleanCast": "error",
        "noMultipleSpacesInRegularExpressionLiterals": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUndeclaredVariables": "error"
      },
      "style": {
        "noVar": "error",
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### Использование

```bash
# Полная проверка
bun run lint

# С автоисправлением
bun run lint:fix

# Только форматирование
bun run format

# Только линтинг
bun run lint
bun run lint:fix
```

### Преимущества Biome

- **Скорость**: В 10-100 раз быстрее ESLint
- **Единый инструмент**: Заменяет ESLint + Prettier
- **Лучшие сообщения об ошибках**: Подробные объяснения

## 🪝 Pre-commit хуки

### Настройка Husky

```bash
# Установка
bun add -D husky
bunx husky init

# Добавление хука
echo "bun run check:all" > .husky/pre-commit
```

### Lint-staged конфигурация

```javascript
// .lintstagedrc.js
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write'
  ],
  '*.css': [
    'stylelint --fix',
    'prettier --write'
  ],
  '*.rs': [
    'rustfmt --'
  ],
  '*.{json,md}': [
    'prettier --write'
  ]
}
```

### Пропуск хуков

```bash
# Коммит без проверок (использовать осторожно!)
git commit -m "WIP: quick fix" --no-verify

# Или
git commit -m "feat: new feature" -n
```

## 💻 IDE интеграция

### VS Code

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "stylelint.validate": [
    "css",
    "postcss"
  ]
}
```

### WebStorm/IntelliJ

1. **ESLint**: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - Включить "Automatic ESLint configuration"
   - Включить "Run eslint --fix on save"

2. **Prettier**: Settings → Languages & Frameworks → JavaScript → Prettier
   - Указать путь к Prettier
   - Включить "On save"

3. **Rust**: Установить плагин Rust
   - Включить "Format on save" в настройках Rust

## 🚀 CI/CD проверки

### GitHub Actions

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Run ESLint
        run: bun run lint
        
      - name: Run Stylelint
        run: bun run lint:css
        
      - name: Check formatting
        run: bun run format
        
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
          
      - name: Run Clippy
        run: bun run lint:rust
        
      - name: Check Rust formatting
        run: bun run format:rust:check
```

### Локальная проверка перед PR

```bash
# Скрипт для полной проверки
#!/bin/bash
# scripts/pre-pr-check.sh

echo "🔍 Running pre-PR checks..."

echo "📘 Checking TypeScript/JavaScript..."
bun run lint || exit 1

echo "🎨 Checking CSS..."
bun run lint:css || exit 1

echo "🦀 Checking Rust..."
bun run check:rust || exit 1

echo "🧪 Running tests..."
bun run test || exit 1
bun run test:rust || exit 1

echo "✅ All checks passed!"
```

## 📊 Метрики качества

### ESLint отчеты

```bash
# Генерация отчета
bunx eslint src --format json > eslint-report.json

# HTML отчет
bunx eslint src --format html > eslint-report.html
```

### Измерение улучшений

```bash
# До исправлений
bunx eslint src --format compact | wc -l

# После исправлений
bun run lint:fix
bunx eslint src --format compact | wc -l
```

## 🎯 Лучшие практики

### 1. Постепенное внедрение

```javascript
// Начните с предупреждений
rules: {
  'new-rule': 'warn'
}

// После исправления переведите в ошибки
rules: {
  'new-rule': 'error'
}
```

### 2. Командные соглашения

- Обсудите и задокументируйте правила
- Используйте общую конфигурацию
- Регулярно обновляйте правила

### 3. Автоматизация

- Настройте pre-commit хуки
- Используйте CI/CD проверки
- Включите автоформатирование в IDE

### 4. Исключения

```javascript
// .eslintignore
node_modules/
.next/
out/
public/
*.config.js

// .stylelintignore  
node_modules/
.next/
out/
*.min.css
```

## 📚 Дополнительные ресурсы

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Stylelint Rules](https://stylelint.io/user-guide/rules/)
- [Clippy Lints](https://rust-lang.github.io/rust-clippy/master/)
- [Biome Documentation](https://biomejs.dev/)

---

[← Назад к руководству разработчика](README.md) | [Далее: Управление версиями →](version-management.md)