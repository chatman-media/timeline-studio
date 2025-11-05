# Команды разработки

Полный справочник по всем доступным командам для разработки Timeline Studio.

## 🚀 Основные команды разработки

### Запуск в режиме разработки
```bash
# Запуск Next.js сервера разработки
bun run dev

# Запуск полного Tauri приложения в режиме разработки  
bun run tauri dev

# Запуск обычного Next.js сервера
bun run start
```

### Сборка проекта
```bash
# Сборка Next.js фронтенда
bun run build

# Сборка с анализом бандла (для codecov)
bun run build:analyze

# Сборка полного Tauri приложения
bun run tauri build
```

## 🧹 Линтинг и форматирование

### JavaScript/TypeScript
```bash
# Проверка JS/TS кода с ESLint
bun run lint

# Автоисправление ESLint ошибок
bun run lint:fix

# Форматирование импортов
bun run format

# Версии для Windows
bun run lint:windows
bun run lint:fix:windows  
bun run format
```

### CSS
```bash
# Проверка CSS с Stylelint
bun run lint:css

# Автоисправление Stylelint ошибок
bun run lint:css:fix
```

### Rust
```bash
# Проверка Rust кода с Clippy
bun run lint:rust

# Автоисправление Clippy ошибок  
bun run lint:rust:fix

# Форматирование Rust кода
bun run format:rust

# Проверка форматирования без изменений
bun run format:rust:check

# Комплексная проверка Rust
bun run check:rust
```

### Комплексные команды
```bash
# Запуск всех проверок и тестов
bun run check:all

# Исправление всех автоисправляемых ошибок
bun run fix:all

# Исправление всех Rust ошибок
bun run fix:rust
```

## 🧪 Тестирование

### Frontend тесты (Vitest)
```bash
# Запуск всех тестов
bun run test

# Запуск только тестов приложения (src/features)
bun run test:app

# Запуск тестов в watch режиме
bun run test:watch

# Запуск тестов с UI интерфейсом
bun run test:ui

# Запуск тестов с покрытием
bun run test:coverage

# Запуск тестов с покрытием для codecov
bun run test:coverage:codecov

# Генерация и отправка отчета о покрытии
bun run test:coverage:report

# Отправка отчета о покрытии
bun run test:coverage:upload
```

### Backend тесты (Rust)
```bash
# Запуск Rust тестов
bun run test:rust

# Запуск Rust тестов в watch режиме
bun run test:rust:watch

# Запуск Rust тестов с покрытием
bun run test:coverage:rust

# Генерация и отправка Rust отчета о покрытии
bun run test:coverage:rust:report
```

### E2E тесты (Playwright)
```bash
# Установка браузеров Playwright
bun run playwright:install

# Запуск всех E2E тестов
bun run test:e2e

# Запуск E2E тестов с UI
bun run test:e2e:ui

# Запуск базового теста импорта медиа
bun run test:e2e:basic

# Запуск тестов с реальными медиафайлами
bun run test:e2e:real

# Запуск интеграционных тестов
bun run test:e2e:integration
```

### Запуск конкретных тестов
```bash
# Тест конкретного файла
bun run test src/features/timeline/__tests__/use-timeline.test.ts

# Тест конкретной функции/компонента
bun run test src/features/effects

# Rust тест конкретного модуля
cd src-tauri && cargo test recognition::
```

## 📚 Документация

```bash
# Генерация API документации
bun run docs

# Генерация документации в watch режиме
bun run docs:watch
```

## 🎨 Промо страница

```bash
# Разработка промо страницы
bun run promo:dev

# Сборка промо страницы
bun run promo:build

# Предпросмотр промо страницы
bun run promo:preview
```

## 🔧 Дополнительные команды

```bash
# Прямой вызов Tauri CLI
bun run tauri [команда]

# Пример: создание иконок
bun run tauri icon path/to/icon.png
```

## ⚡ Быстрые команды для разработчиков

### Ежедневная разработка
```bash
# Быстрый старт разработки
bun run tauri dev

# Проверка всего перед коммитом
bun run check:all

# Быстрое исправление всех ошибок
bun run fix:all
```

### Проверка качества кода
```bash
# Только линтинг без тестов
bun run lint && bun run lint:css && bun run lint:rust

# Только форматирование
bun run format && bun run format:rust

# Только тесты
bun run test && bun run test:rust
```

### Работа с покрытием
```bash
# Полное покрытие (frontend + backend)
bun run test:coverage && bun run test:coverage:rust

# Отправка покрытия в codecov
bun run test:coverage:report && bun run test:coverage:rust:report
```

## 📋 Переменные окружения

### Для разработки
```bash
# Для bundle анализа
ANALYZE=true bun run build

# Для codecov
CODECOV_TOKEN=your_token bun run test:coverage:codecov

# Для интеграционных тестов
INTEGRATION_TEST=true bun run test:e2e:integration
```

### Для Rust
```bash
# Для покрытия Rust
RUSTFLAGS="-Cinstrument-coverage" cargo test
LLVM_PROFILE_FILE="timeline-studio-%p-%m.profraw" cargo test
```

## 🔍 Полезные алиасы

Рекомендуемые алиасы для `.bashrc` или `.zshrc`:

```bash
alias tdev="bun run tauri dev"
alias ttest="bun run test && bun run test:rust"  
alias tlint="bun run check:all"
alias tfix="bun run fix:all"
alias tbuild="bun run tauri build"
```