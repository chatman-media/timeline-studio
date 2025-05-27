# Timeline Studio

**🌐 Language / Idioma / Langue / Sprache / Язык:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md)

Видеоредактор на базе Tauri, React и XState.

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/website-Promo-brightgreen)](https://chatman-media.github.io/timeline-studio/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![DeepSource](https://app.deepsource.com/gh/chatman-media/timeline-studio.svg/?label=code+coverage&show_trend=true&token=zE1yrrYR6Jl7GK0R74LZx9MJ)](https://app.deepsource.com/gh/chatman-media/timeline-studio/)

## Обзор проекта

Timeline Studio - это настольное приложение для создания и редактирования видео. Приложение использует архитектуру, основанную на конечных автоматах (XState), для управления сложной логикой состояний.

![Интерфейс таймлайна](/public/screen3.png)

## 📊 Статус разработки

### 🎯 Общий прогресс: 85% готово (15/17 features)

```
Компоненты:     16/17 ✅ (94%)
Хуки:           15/17 ✅ (88%)
Сервисы:        16/17 ✅ (94%)
Тесты:          17/17 ✅ (100%) 🎉
Документация:   17/17 ✅ (100%)
```

### 🔥 Критические задачи

- **Timeline** - требует машину состояний, хуки, основную логику
- **Resources** - требует UI компоненты для управления
- **AI Chat** - требует проверки полноты функционала
- **Options** - требует расширения функционала

### ✅ Готовые компоненты

- **VideoPlayer** - полностью функциональный видеоплеер
- **Browser** - браузер медиафайлов с табами
- **Media, Music, Effects, Filters, Transitions, Templates** - все готово
- **AppState, Modals, TopBar, MediaStudio** - базовая инфраструктура

### Ключевые особенности

- 🎬 Создание и редактирование видеопроектов
- 🖥️ Кроссплатформенность (Windows, macOS, Linux)
- 🧠 Управление состоянием с помощью XState v5
- 🌐 Поддержка интернационализации (i18n)
- 🎨 Современный UI с использованием Tailwind CSS v4
- 🔍 Строгий контроль качества кода с помощью ESLint, Stylelint и Clippy
- 📚 Полная документация всех компонентов

## Начало работы

### Предварительные требования

- [Node.js](https://nodejs.org/) (v18 или выше)
- [Rust](https://www.rust-lang.org/tools/install) (последняя стабильная версия)
- [bun](https://bun.sh/) (последняя стабильная версия)

### Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Установите зависимости:

```bash
bun install
```

### Запуск в режиме разработки

```bash
bun tauri dev
```

### Сборка для релиза

```bash
bun tauri build
```

## Структура проекта

```
timeline-studio/
├── src/                  # Исходный код фронтенда (React, Next.js)
│   ├── features/         # Функциональные модули приложения (17 features)
│   │   ├── browser/      ✅ # Браузер медиафайлов с табами
│   │   ├── media/        ✅ # Управление медиафайлами
│   │   ├── video-player/ ✅ # Видеоплеер с элементами управления
│   │   ├── timeline/     ⚠️ # Таймлайн (требует доработки)
│   │   ├── resources/    ⚠️ # Ресурсы (требует UI компоненты)
│   │   ├── ai-chat/      ❓ # AI чат (требует проверки)
│   │   ├── options/      ⚠️ # Панель опций (требует расширения)
│   │   ├── music/        ✅ # Музыкальные файлы
│   │   ├── effects/      ✅ # Видеоэффекты
│   │   ├── filters/      ✅ # Фильтры изображения
│   │   ├── transitions/  ✅ # Переходы между клипами
│   │   ├── subtitles/    ✅ # Субтитры
│   │   ├── templates/    ✅ # Шаблоны проектов
│   │   ├── modals/       ✅ # Модальные окна
│   │   ├── app-state/    ✅ # Глобальное состояние
│   │   ├── top-bar/      ✅ # Верхняя панель
│   │   ├── media-studio/ ✅ # Корневой компонент
│   │   └── README.md     📚 # Обзор всех features
│   ├── i18n/             # Интернационализация
│   ├── types/            # TypeScript типы
│   ├── lib/              # Утилиты и библиотеки
│   └── components/       # Переиспользуемые UI компоненты
├── src-tauri/            # Исходный код бэкенда (Rust)
│   ├── src/              # Rust код
│   └── Cargo.toml        # Конфигурация Rust зависимостей
├── public/               # Статические файлы
├── DEV.md                📚 # Документация для разработчиков
├── README.md             📚 # Английская документация (основная)
├── README.es.md          📚 # Испанская документация
├── README.fr.md          📚 # Французская документация
├── README.de.md          📚 # Немецкая документация
├── README.ru.md          📚 # Русская документация
└── package.json          # Конфигурация Node.js зависимостей
```

## 📚 Документация

### 🗂️ Структура документации

Каждая feature содержит подробную документацию:

- **`{feature}-features.md`** - функциональные требования, статус готовности
- **`{feature}-technical.md`** - техническая архитектура, API, типы данных

### 📋 Ключевые документы

- **`src/features/OVERVIEW.md`** - обзор всех 17 features с приоритетами
- **`DEV.md`** - архитектура приложения, машины состояний, план разработки
- **`README.md`** - общая информация о проекте (английский)
- **`README.es.md`** - испанская версия документации
- **`README.fr.md`** - французская версия документации
- **`README.de.md`** - немецкая версия документации
- **`README.ru.md`** - русская версия документации

## Разработка

### Доступные скрипты

- `bun dev` - Запуск Next.js в режиме разработки
- `bun tauri dev` - Запуск Tauri в режиме разработки
- `bun build` - Сборка Next.js
- `bun tauri build` - Сборка Tauri приложения

#### Линтинг и форматирование

- `bun lint` - Проверка JavaScript/TypeScript кода с помощью ESLint
- `bun lint:fix` - Исправление ошибок ESLint
- `bun lint:css` - Проверка CSS кода с помощью Stylelint
- `bun lint:css:fix` - Исправление ошибок Stylelint
- `bun format:imports` - Форматирование импортов
- `bun lint:rust` - Проверка Rust кода с помощью Clippy
- `bun format:rust` - Форматирование Rust кода с помощью rustfmt
- `bun check:all` - Запуск всех проверок и тестов
- `bun fix:all` - Исправление всех ошибок линтинга

#### Тестирование

- `bun test` - Запуск тестов
- `bun test:app` - Запуск тестов только для компонентов приложения
- `bun test:coverage` - Запуск тестов с отчетом о покрытии
- `bun test:ui` - Запуск тестов с UI интерфейсом
- `bun test:e2e` - Запуск end-to-end тестов с Playwright

### Машины состояний (XState v5)

Проект использует XState v5 для управления сложной логикой состояний.

#### ✅ Реализованные машины состояний (10):

- `appSettingsMachine` - централизованное управление настройками
- `chatMachine` - управление AI чатом
- `modalMachine` - управление модальными окнами
- `playerMachine` - управление видеоплеером
- `resourcesMachine` - управление ресурсами таймлайна
- `musicMachine` - управление музыкальными файлами
- `userSettingsMachine` - пользовательские настройки
- `projectSettingsMachine` - настройки проекта
- `mediaListMachine` - управление списками медиафайлов
- `templateListMachine` - управление шаблонами

#### ❌ Требуют реализации (2):

- `timelineMachine` - **КРИТИЧНО!** Основная машина состояний таймлайна
- `optionsMachine` - управление панелью опций

Подробнее см. в `DEV.md`

### Тестирование

Проект использует Vitest для модульного тестирования. Тесты находятся рядом с тестируемыми файлами с расширением `.test.ts` или `.test.tsx`.

#### 🧪 Статус покрытия тестами: **100% готово** ✅

**124 файла тестов успешно прошли** (1069 тестов + 9 пропущенных = 1078 всего)

**Покрытие ключевых функций тестами:**

- ✅ **Effects** - полное покрытие тестами (хуки, импорт, компоненты)
- ✅ **Filters** - 41 тест (процессор, хуки, функциональность импорта)
- ✅ **Transitions** - 36 тестов (превью, импорт, групповые компоненты)
- ✅ **Templates** - полное покрытие (импорт, метки, компоненты)
- ✅ **Style Templates** - 39 тестов (утилиты, импорт, компоненты загрузки)
- ✅ **Music** - 26 тестов (утилиты, обработка файлов)
- ✅ **Subtitles** - 10 тестов (процессор, стили)
- ✅ **Resources** - 27 тестов (машина состояний, провайдер)
- ✅ **User Settings** - 34 теста (машина, модальные окна, хуки)
- ✅ **Video Player** - полное покрытие (элементы управления, провайдер)
- ✅ **Voice Recording** - 10 тестов (разрешения, устройства, компоненты)
- ✅ **Camera Capture** - полное покрытие
- ✅ **Browser, Timeline, App State** - полное покрытие
- ✅ **Media Studio, Modals, Theme** - полное покрытие тестами

```bash
# Запуск всех тестов
bun test

# Запуск тестов с отчетом о покрытии
bun test:coverage

# Запуск тестов для конкретной функции
bun test src/features/effects
```

## Непрерывная интеграция и развертывание

Проект настроен для использования GitHub Actions для непрерывной интеграции и развертывания. Рабочие процессы:

### Проверка и сборка

- `lint.yml` - Проверка JavaScript/TypeScript, CSS и Rust кода
- `lint-css.yml` - Проверка только CSS кода (запускается при изменении CSS файлов)
- `build.yml` - Сборка проекта
- `check-all.yml` - Запуск всех проверок и тестов

### Развертывание

- `docs.yml` - Генерация и публикация API документации на GitHub Pages
- `deploy-promo.yml` - Сборка и публикация промо-страницы на GitHub Pages

### Конфигурация линтеров

#### Stylelint (CSS)

Проект использует Stylelint для проверки CSS кода. Конфигурация находится в файле `.stylelintrc.json`. Основные особенности:

- Поддержка Tailwind CSS директив
- Игнорирование дублирующихся селекторов для совместимости с Tailwind
- Автоматическое исправление ошибок при сохранении файла (в VS Code)

Для запуска CSS линтера используйте команду:

```bash
bun lint:css
```

Для автоматического исправления ошибок:

```bash
bun lint:css:fix
```

## Документация API

Документация API доступна по адресу: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Для локальной генерации документации используйте команду:

```bash
bun run docs
```

Документация будет доступна в папке `docs/`.

Для разработки документации в режиме реального времени используйте:

```bash
bun run docs:watch
```

Документация автоматически обновляется при изменении исходного кода в ветке `main` с помощью GitHub Actions workflow `docs.yml`.

## Промо-страница

Промо-страница проекта доступна по адресу: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

Исходный код промо-страницы находится в папке `promo/`.

Для локальной разработки промо-страницы используйте команды:

```bash
cd promo
npm install
npm run dev
```

Для сборки промо-страницы:

```bash
cd promo
npm run build
```

Промо-страница автоматически обновляется при изменении файлов в папке `promo/` в ветке `main` с помощью GitHub Actions workflow `deploy-promo.yml`.

## Дополнительные ресурсы

- [Next.js Documentation](https://nextjs.org/docs)
- [Tauri Documentation](https://v2.tauri.app/start/)
- [XState Documentation](https://xstate.js.org/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Stylelint Documentation](https://stylelint.io/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeDoc Documentation](https://typedoc.org/)

## Лицензия

Данный проект распространяется под лицензией MIT с условием Commons Clause.

**Основные условия:**

- **Открытый исходный код**: Вы можете свободно использовать, модифицировать и распространять код в соответствии с условиями лицензии MIT.
- **Ограничение на коммерческое использование**: Commons Clause запрещает "продажу" программного обеспечения без отдельного соглашения с автором.
- **"Продажа"** означает использование функциональности программного обеспечения для предоставления третьим лицам продукта или услуги за плату.

Эта лицензия позволяет:

- Использовать код для личных и некоммерческих проектов
- Изучать и модифицировать код
- Распространять модификации под той же лицензией

Но запрещает:

- Создавать коммерческие продукты или услуги на основе кода без лицензии

Для получения коммерческой лицензии, пожалуйста, свяжитесь с автором: ak.chatman.media@gmail.com

Полный текст лицензии доступен в файле [LICENSE](./LICENSE)

## GitHub Pages

Проект использует GitHub Pages для размещения документации API и промо-страницы:

- **Промо-страница**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Документация API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Обе страницы автоматически обновляются при изменении соответствующих файлов в ветке `main` с помощью GitHub Actions workflows.
