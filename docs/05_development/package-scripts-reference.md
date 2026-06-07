# Справочник команд package.json

Полный справочник всех доступных npm/bun скриптов в Timeline Studio с актуальным описанием.

## 📊 Статистика команд

**Всего команд**: 54  
**Основных**: 8  
**Линтинг**: 12  
**Тестирование**: 20  
**Прочих**: 14  

## 🚀 Основные команды разработки

### Запуск приложения
| Команда | Описание | Когда использовать |
|---------|----------|--------------------|
| `bun run dev` | Запуск Next.js с turbopack | Только фронтенд разработка |
| `bun run tauri dev` | Запуск полного Tauri приложения | Полная разработка с backend |
| `bun run start` | Запуск production Next.js сервера | Тестирование production build |

### Сборка
| Команда | Описание | Когда использовать |
|---------|----------|--------------------|
| `bun run build` | Сборка Next.js без линтинга | Быстрая сборка фронтенда |
| `bun run build:analyze` | Сборка с анализом бандла | Анализ размера бандла для CI |
| `bun run tauri build` | Полная сборка Tauri приложения | Создание релизной версии |

### Утилиты
| Команда | Описание | Когда использовать |
|---------|----------|--------------------|
| `bun run tauri` | Прямой вызов Tauri CLI | Tauri-специфичные команды |

## 🧹 Линтинг и форматирование (12 команд)

### JavaScript/TypeScript
| Команда | Описание | Автоисправление |
|---------|----------|-----------------|
| `bun run lint` | ESLint проверка TS/JS | ❌ |
| `bun run lint:fix` | ESLint с автоисправлением | ✅ |
| `bun run lint:windows` | ESLint для Windows | ❌ |
| `bun run lint:fix:windows` | ESLint автоисправление для Windows | ✅ |
| `bun run format` | Форматирование импортов | ✅ |
| `bun run format` | Форматирование импортов для Windows | ✅ |

### CSS
| Команда | Описание | Автоисправление |
|---------|----------|-----------------|
| `bun run lint:css` | Stylelint проверка CSS | ❌ |
| `bun run lint:css:fix` | Stylelint с автоисправлением | ✅ |

### Rust
| Команда | Описание | Автоисправление |
|---------|----------|-----------------|
| `bun run lint:rust` | Clippy проверка Rust кода | ❌ |
| `bun run lint:rust:fix` | Clippy с автоисправлением | ✅ |
| `bun run format:rust` | rustfmt форматирование | ✅ |
| `bun run format:rust:check` | Проверка форматирования (CI) | ❌ |

### Комплексные команды
| Команда | Описание | Что включает |
|---------|----------|--------------|
| `bun run check:all` | Все проверки + тесты | lint + lint:css + format + check:rust + test + test:rust |
| `bun run check:rust` | Все проверки Rust | lint:rust + format:rust:check |
| `bun run check:workspaces` | Проверки JS workspace shells | packages/core + packages/domains + packages/adapters + packages/ui + apps/desktop + apps/cli |
| `bun run check:boundaries:baseline` | Baseline gate для модульных границ | падает только при росте total/severity/edge counts |
| `bun run fix:all` | Все автоисправления | lint:css:fix + format + fix:rust |
| `bun run fix:rust` | Все автоисправления Rust | format:rust + lint:rust:fix |

## 🧪 Тестирование (20 команд)

### Frontend тесты (Vitest)
| Команда | Описание | Область |
|---------|----------|---------|
| `bun run test` | Все frontend тесты | Все *.test.ts файлы |
| `bun run test:app` | Только тесты приложения | src/features только |
| `bun run test:watch` | Тесты в watch режиме | Изменения в коде |
| `bun run test:ui` | Тесты с UI интерфейсом | Vitest UI |
| `bun run test:coverage` | Тесты с покрытием | Coverage отчет |
| `bun run test:coverage:codecov` | Покрытие для codecov | С CODECOV_TOKEN |
| `bun run test:coverage:report` | Генерация + отправка | test:coverage + upload |
| `bun run test:coverage:upload` | Только отправка | scripts/upload-coverage.sh |

### Backend тесты (Rust)
| Команда | Описание | Область |
|---------|----------|---------|
| `bun run test:rust` | Все Rust тесты | cargo test |
| `bun run test:rust:watch` | Rust тесты в watch | cargo watch -x test |
| `bun run test:coverage:rust` | Rust покрытие | cargo llvm-cov |
| `bun run test:coverage:rust:report` | Rust покрытие + отправка | llvm-cov + upload |

### E2E тесты (Playwright)
| Команда | Описание | Область |
|---------|----------|---------|
| `bun run playwright:install` | Установка браузеров | Playwright browsers |
| `bun run test:e2e` | Все E2E тесты | Все *.spec.ts в e2e/ |
| `bun run test:e2e:ui` | E2E с UI | Playwright UI |
| `bun run test:e2e:basic` | Базовый тест импорта | media-import-basic.spec.ts |
| `bun run test:e2e:real` | Тесты с реальными файлами | media-import-real-files.spec.ts |
| `bun run test:e2e:integration` | Интеграционные тесты | INTEGRATION_TEST=true |
| `bun run test:e2e:video-compilation` | Тесты компиляции видео | video-compilation-workflow.spec.ts |
| `bun run test:e2e:gpu` | Тесты GPU ускорения | gpu-acceleration.spec.ts |
| `bun run test:e2e:caching` | Тесты кеширования | caching-workflow.spec.ts |
| `bun run test:e2e:video-all` | Все видео тесты | Комплексный набор видео тестов |

## 🔧 Biome (альтернативный линтер, 5 команд)

| Команда | Описание | Что делает |
|---------|----------|------------|
| `bun run lint` | Проверка с Biome | Линтинг + форматирование |
| `bun run lint:fix` | Автоисправление | --write флаг |
| `bun run format` | Только форматирование | Форматирование кода |
| `bun run lint` | Только линтинг | Проверка правил |
| `bun run lint:fix` | Автоисправление линтинга | --write для линтинга |

## 📚 Документация (2 команды)

| Команда | Описание | Выход |
|---------|----------|-------|
| `bun run docs` | Генерация TypeDoc | ./docs/ директория |
| `bun run docs:watch` | Документация в watch | Автообновление при изменениях |

## 🎨 Промо страница (3 команды)

| Команда | Описание | Где выполнять |
|---------|----------|---------------|
| `bun run promo:dev` | Разработка промо | cd promo && bun run dev |
| `bun run promo:build` | Сборка промо | cd promo && bun run build |
| `bun run promo:preview` | Предпросмотр промо | cd promo && bun run preview |

## 📋 Использование команд по задачам

### 🔥 Ежедневная разработка
```bash
# Запуск разработки
bun run tauri dev

# Проверка перед коммитом
bun run check:all

# Быстрое исправление ошибок
bun run fix:all
```

### 🧪 Тестирование
```bash
# Все тесты
bun run test && bun run test:rust

# Только новые тесты
bun run test:watch

# Покрытие для отправки
bun run test:coverage:report && bun run test:coverage:rust:report

# Специализированные E2E тесты
bun run test:e2e:video-all  # Все видео функции
bun run test:e2e:gpu        # GPU ускорение
bun run test:e2e:caching    # Система кеширования
```

### 🚀 Подготовка к релизу
```bash
# Полная проверка
bun run check:all

# Сборка с анализом
bun run build:analyze

# Финальная сборка
bun run tauri build
```

### 🔍 Отладка проблем
```bash
# Только линтинг (без тестов)
bun run lint && bun run lint:css && bun run lint:rust

# Только форматирование
bun run format && bun run format:rust

# Конкретный модуль
bun run test src/features/timeline
```

## 🎯 Команды по частоте использования

### Очень часто (ежедневно)
- `bun run tauri dev`
- `bun run test`
- `bun run lint:fix`

### Часто (еженедельно)
- `bun run check:all`
- `bun run test:rust`
- `bun run fix:all`

### Средне (перед релизом)
- `bun run build:analyze`
- `bun run test:e2e`
- `bun run docs`

### Редко (настройка/CI)
- `bun run playwright:install`
- `bun run biome:*`
- `bun run promo:*`

## ⚠️ Важные замечания

### Windows пользователи
- Используйте команды с суффиксом `:windows` если обычные не работают
- Команды `format` и `lint:fix:windows` обходят проблемы с путями

### CI/CD
- `build:analyze` требует переменную `CODECOV_TOKEN`
- `test:e2e:integration` требует `INTEGRATION_TEST=true`
- `test:coverage:codecov` использует токен codecov

### Производительность
- Biome команды работают значительно быстрее ESLint
- `test:watch` эффективнее для итеративной разработки
- `check:rust` быстрее чем отдельно `lint:rust` + `format:rust:check`
