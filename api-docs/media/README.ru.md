# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![codecov](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=for-the-badge&label=npm%20downloads)](https://www.npmjs.com/package/timeline-studio)
[![Open Collective](https://img.shields.io/opencollective/all/timeline-studio?style=for-the-badge&label=sponsors)](https://opencollective.com/timeline-studio)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

## 🎬 Обзор проекта

**Timeline Studio** - видеоредактор с AI, который превращает ваши видео, музыку и любимые эффекты в десятки готовых роликов для всех платформ!

### 🚀 Представьте возможности

**Загрузили свои видео, фото, музыку один раз** → получили:
- 📱 **TikTok** - вертикальные шортсы с трендовыми эффектами
- 📺 **YouTube** - полные фильмы, короткие ролики, Shorts
- 📸 **Instagram** - Reels, Stories, посты разной длительности
- ✈️ **Telegram** - оптимизированные версии для каналов и чатов

AI-ассистент сам создаст нужное количество версий под каждую платформу! 🤖

### 💡 Как это работает?

> *"Создай видео о моем путешествии по Азии для всех соцсетей" - и через несколько минут у вас готовы варианты: динамичные шортсы для TikTok, атмосферный влог для YouTube, яркие Stories для Instagram. AI сам подберет лучшие моменты, синхронизирует с музыкой и адаптирует под каждую платформу.*

### ⚡ Почему это меняет всё?

- **Экономия времени в 10 раз** - больше не нужно вручную адаптировать каждое видео
- **AI понимает тренды** - знает, что работает в каждой соцсети
- **Профессиональное качество** - используем те же инструменты, что и большие студии
- **Всё работает локально** - ваш контент остается приватным

![Интерфейс таймлайна #1](/public/screen2.png)

![Интерфейс таймлайна #2](/public/screen4.png)

### Статус проекта (июнь 2025)

**Общая готовность: 58%** ⬆️ (пересчитано с учетом API Keys Management на 100% и 14 новых планируемых модулей)
- **Завершено**: 13 модулей (100% готовности)
- **В разработке**: 7 модулей (45-90% готовности)
- **Планируется**: 4 модуля (30-80% готовности)
- **Новые планируемые**: 14 модулей (0% готовности) - [подробности в planned/](docs-ru/08-roadmap/planned/)

### Ключевые достижения:
- ✅ **Основная архитектура** - Timeline, Video Compiler, Media Management (100%)
- ✅ **API Keys Management** - безопасное хранилище с AES-256-GCM шифрованием (100%)
- ✅ **Recognition** - YOLO v11 распознавание объектов и лиц (100%)
- ✅ **Export** - OAuth интеграция для YouTube/TikTok/Vimeo (100%)
- 🚧 **Effects/Filters/Transitions** - богатая библиотека в процессе (75-80%)
- 🚧 **Timeline AI** - автоматизация с 41 инструментом Claude (90%)

### Текущие задачи:
- 🔄 **OAuth callback обработка** - завершение интеграции социальных сетей
- ⏳ **HTTP валидация API** - тестирование подключений в реальном времени
- ⏳ **Импорт из .env** - миграция существующих ключей

### Следующие шаги:
1. **Интеграция социальных сетей** - полная реализация OAuth flow
2. **Продвинутые эффекты** - завершение библиотеки в стиле Filmora
3. **Timeline AI** - интеллектуальная автоматизация создания видео

## Ключевые возможности

- 🎬 Профессиональный видеомонтаж с многодорожечным таймлайном
- 🖥️ Кроссплатформенность (Windows, macOS, Linux)
- 🚀 GPU-ускоренная обработка видео (NVENC, QuickSync, VideoToolbox)
- 🤖 ИИ-распознавание объектов/лиц (YOLO v11 - ORT исправлен)
- 🎨 30+ переходов, визуальных эффектов и фильтров
- 📝 Продвинутая система субтитров с 12 стилями и анимациями
- 🎵 Многодорожечное аудиоредактирование с эффектами
- 📤 Экспорт в MP4/MOV/WebM с OAuth интеграцией соцсетей
- 🔐 Поддержка OAuth для YouTube/TikTok/Vimeo/Telegram с безопасным хранением токенов
- 📱 Пресеты устройств (iPhone, iPad, Android) для оптимизированного экспорта
- 🧠 Управление состоянием с помощью XState v5
- 🌐 Поддержка интернационализации (11 языков)
- 💾 Умное кэширование и унифицированная система превью
- 🎨 Современный UI с использованием Tailwind CSS v4, shadcn-ui
- 📚 Полная документация с 2400+ тестами (98.8% успешных)

## Начало работы

### Быстрая установка

```bash
# Клонировать и установить
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Запустить в режиме разработки
bun run tauri dev
```

### Требования
- Node.js v18+, Rust, Bun, FFmpeg

📚 **[Полное руководство по установке →](docs-ru/01-getting-started/README.md)**  
🪟 **[Настройка для Windows →](docs-ru/06-deployment/platforms/windows-build.md)**

### Сборка релиза

```bash
bun run tauri build
```

## Документация

### 📚 Основная документация

- 📚 [Обзор документации](docs-ru/README.md) - Полная карта документации
- 🚀 [Начало работы](docs-ru/01-getting-started/README.md) - Установка и первые шаги
- 🏗️ [Руководство по архитектуре](docs-ru/02-architecture/README.md) - Архитектура системы
- 🎯 [Руководство по функциям](docs-ru/03-features/README.md) - Обзор функций и статус
- 📡 [Справочник API](docs-ru/04-api-reference/README.md) - Справочник команд Tauri
- 🧪 [Руководство разработчика](docs-ru/05-development/README.md) - Тестирование и разработка
- 🚀 [Руководство по развертыванию](docs-ru/06-deployment/README.md) - Сборка и развертывание
- 📋 [Пользовательские руководства](docs-ru/07-guides/README.md) - Производительность и лучшие практики
- 🛣️ [Дорожная карта](docs-ru/08-roadmap/README.md) - Дорожная карта разработки
- 🔐 [Настройка OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Интеграция с социальными сетями

### 📋 Документация проекта

- **`src/features/README.md`** - обзор всех функций с приоритетами и статусом
- **Языковые версии**: Доступны на 11 языках через переключатель выше

## Разработка

### Быстрый старт

```bash
# Режим разработки
bun run tauri dev

# Запуск тестов
bun run test && bun run test:rust

# Проверка качества кода
bun run check:all
```

### Основные команды

| Команда | Описание |
|---------|----------|
| `bun run tauri dev` | Запуск полного приложения в разработке |
| `bun run dev` | Запуск только фронтенда |
| `bun run build` | Сборка для продакшена |
| `bun run test` | Запуск тестов фронтенда |
| `bun run test:rust` | Запуск тестов бэкенда |
| `bun run lint` | Проверка качества кода |
| `bun run fix:all` | Автоисправление ошибок кода |

📚 **[Полное руководство разработчика →](docs-ru/05-development/README.md)**

### Статус покрытия тестами

✅ **Тесты фронтенда**: 3,623 прошли
✅ **Тесты бэкенда**: 655 прошли
✅ **Тесты e2e**: 801 прошли
📊 **Всего**: >5000 тестов проходят

## CI/CD и качество кода

### Автоматизированные процессы
- ✅ **Линтинг**: ESLint, Stylelint, Clippy
- ✅ **Тестирование**: Фронтенд (Vitest), Бэкенд (Rust), E2E (Playwright)
- ✅ **Покрытие**: Интеграция с Codecov
- ✅ **Сборка**: Кроссплатформенные сборки

📚 **[Подробное руководство по CI/CD →](docs-ru/06-deployment/README.md)**  
🔧 **[Линтинг и форматирование →](docs-ru/05-development/linting-and-formatting.md)**

## Документация и ресурсы

- 📚 [**Документация API**](https://chatman-media.github.io/timeline-studio/api-docs/) - Автогенерируемая документация TypeScript
- 🚀 [**Промо-страница**](https://chatman-media.github.io/timeline-studio/) - Презентация проекта
- 📖 [**Полная документация**](docs-ru/README.md) - Полное руководство на русском
- 🎬 [**Живая демонстрация**](https://chatman-media.github.io/timeline-studio/) - Попробуйте редактор онлайн

## Дополнительные ресурсы

- [Tauri Documentation](https://v2.tauri.app/start/)
- [XState Documentation](https://xstate.js.org/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Stylelint Documentation](https://stylelint.io/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeDoc Documentation](https://typedoc.org/)
- [ffmpeg Documentation](https://ffmpeg.org/documentation.html)

## Лицензия

MIT License с Commons Clause - бесплатно для личного использования, коммерческое использование требует соглашения.

📄 **[Подробности о лицензии →](docs-ru/10-legal/license.md)** | 📧 **Коммерческая лицензия**: ak.chatman.media@gmail.com

## GitHub Pages

Проект использует GitHub Pages для размещения документации API и промо-страницы:

- **Промо-страница**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Документация API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Обе страницы автоматически обновляются при изменении соответствующих файлов в ветке `main` с помощью GitHub Actions workflows.
