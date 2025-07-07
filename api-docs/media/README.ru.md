# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)

</div>

## 🎬 О проекте

### Что такое Timeline Studio?

**Timeline Studio** - это профессиональный видеоредактор нового поколения с AI-интеграцией, который автоматизирует создание контента для социальных сетей. Построенный на современных технологиях (Tauri + Next.js), он сочетает мощность десктопных приложений с удобством веб-интерфейсов.

### 🎯 Ключевые преимущества

- **🤖 82 AI-инструмента Claude** - полная автоматизация видеопроизводства
- **⚡ GPU-ускорение** - аппаратное кодирование NVENC, QuickSync, VideoToolbox
- **🔌 Система плагинов** - расширяйте функциональность без изменения кода
- **🌐 13 языков интерфейса** - полная локализация для глобальной аудитории
- **🔒 Локальная обработка** - ваш контент остается приватным
- **📊 80%+ покрытие тестами** - надежность профессионального уровня

### 🚀 Решаемые задачи

**Одна загрузка → десятки готовых версий:**
- 📱 **TikTok** - вертикальные шортсы с трендовыми эффектами
- 📺 **YouTube** - полные фильмы, короткие ролики, Shorts
- 📸 **Instagram** - Reels, Stories, посты разной длительности
- ✈️ **Telegram** - оптимизированные версии для каналов и чатов

### 💡 Как это работает

> *"Создай видео о моей поездке в Азию для всех соцсетей" - и через минуты у вас готовы варианты: динамичные шортсы для TikTok, атмосферный влог для YouTube, яркие Stories для Instagram. AI подберет лучшие моменты, синхронизирует с музыкой и адаптирует под каждую платформу.*

### ⚡ Почему это меняет всё

- **10x экономия времени** - больше никакой ручной адаптации под каждое видео
- **AI понимает тренды** - знает, что работает в каждой социальной сети
- **Профессиональное качество** - используем те же инструменты, что и крупные студии
- **Модульная архитектура** - легко добавлять новые функции через плагины
- **Open Source** - прозрачность и возможность участия в разработке

![Timeline Interface #1](/public/screen3.png)

## 🏗️ Архитектура

Timeline Studio построен на современной модульной архитектуре:

### Frontend (Next.js 15 + React 19)
- **Feature-based организация** - каждая функция в `/src/features/` самодостаточна
- **State Management** - XState v5 для сложных состояний
- **UI Components** - shadcn/ui + Radix UI + Tailwind CSS v4
- **TypeScript** - строгая типизация и безопасность

### Backend (Rust + Tauri v2)
- **Модульная структура** - Core, Безопасность, Медиа, Компилятор, Плагины
- **Сервисный слой** - DI контейнер, EventBus, Телеметрия
- **FFmpeg интеграция** - продвинутая обработка видео
- **Безопасность** - шифрование API ключей, OAuth, Keychain

📚 **[Подробная архитектура Frontend →](docs/ru/03_architecture/frontend/)**  
📚 **[Подробная архитектура Backend →](docs/ru/03_architecture/backend/)**  
📚 **[Система плагинов →](docs/ru/07_integrations/)**

## 🛠️ Technical Stack Details

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.3 | React framework with App Router |
| **React** | 19.0.0 | UI library with concurrent features |
| **TypeScript** | 5.7.2 | Type safety and DX |
| **XState** | 5.19.0 | State machines for complex logic |
| **Tailwind CSS** | 4.0.0-beta.3 | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Accessible UI primitives |
| **i18next** | 24.2.0 | Internationalization (13 languages) |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | 1.81.0+ | Systems programming language |
| **Tauri** | 2.2.0 | Desktop app framework |
| **FFmpeg** | 6.0+ | Video/audio processing |
| **tokio** | 1.42.0 | Async runtime |
| **serde** | 1.0.217 | Serialization framework |
| **keyring** | 3.6.1 | Secure credential storage |
| **tracing** | 0.1.41 | Structured logging |

### AI & ML Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **ONNX Runtime** | 0.21.0 | ML inference engine |
| **Whisper** | Latest | Speech-to-text |
| **YOLO** | v8/v11 | Object detection |
| **Claude API** | Latest | AI assistant integration |
| **OpenAI API** | Latest | GPT & Whisper models |

### Метрики производительности
- **Время запуска**: < 2 секунд на современном оборудовании
- **Потребление памяти**: ~200MB базово, масштабируется с размером проекта
- **Скорость экспорта**: 2-3x реального времени с GPU ускорением
- **Покрытие тестами**: 80%+ frontend и backend
- **Размер сборки**: ~50MB сжатый установщик

## 🏗️ Статус проекта

**Общая готовность: 94%+** 
**🚀 Alpha версия: 97.5% готова** 🎯

✅ **Завершено**: 55+ модулей (100% готовы) - 30+ frontend + 25+ backend  
🔄 **В работе**: Advanced Timeline Features  
✅ **Smart Montage Planner**: 100% готов - Полная интеграция UI с backend! 🎉  
📋 **Недавно завершено**: Smart Montage Planner, Timeline Integration, Backend Testing  

[→ Подробный Roadmap](docs/ru/10_project_state/)

## 🎯 Ключевые функции

### 🎬 Ядро видеоредактирования
- **Многодорожечный Timeline** - Профессиональный нелинейный монтаж `Stable`
- **GPU ускорение** - поддержка NVENC, QuickSync, VideoToolbox `Stable`
- **100+ переходов** - Библиотека плавных переходов и эффектов `Stable`
- **Пресеты устройств** - Оптимизированный экспорт для iPhone, iPad, Android `Stable`
- **Кроссплатформенность** - поддержка Windows, macOS, Linux `Stable`

### 🤖 AI-функции
- **82 Claude AI инструмента** - Полная платформа автоматизации видео `Beta` 🔥
- **Smart Montage Planner** - AI-планировщик автоматического создания монтажных планов `Stable` ✅
- **Whisper транскрипция** - Преобразование речи в текст с OpenAI/локальными моделями `Beta`
- **Распознавание объектов/лиц** - Детекция и трекинг на основе YOLO `Beta`
- **Анализ сцен** - Автоматическая детекция и классификация сцен `Alpha`
- **Автоматизация workflow** - 10 предустановленных AI workflow монтажа `Beta`

### 🎨 Профессиональные инструменты
- **Продвинутая цветокоррекция** - Колеса, кривые, LUT, скопы `Stable` ✨
- **Fairlight Audio** - Профессиональное микширование и мастеринг `Stable` ✨
- **Система субтитров** - 72 стиля с анимациями `Stable`
- **Визуальные эффекты** - 100+ фильтров и эффектов `Stable`
- **Многодорожечный аудио** - Продвинутое редактирование аудио с эффектами `Stable`

### 📤 Экспорт и интеграция
- **OAuth социальных сетей** - YouTube, TikTok, Vimeo, Telegram `Stable`
- **Оптимизация для платформ** - Автоадаптация для 4 социальных платформ `Beta`
- **Поддержка форматов** - MP4, MOV, WebM с кастомными настройками `Stable`
- **Безопасное хранение токенов** - Интеграция с Keychain для API ключей `Stable`

### 🛠️ Developer Experience
- **Система плагинов** - Расширение функциональности без изменения ядра `Beta`
- **Современный tech stack** - Tauri v2, Next.js 15, React 19 `Stable`
- **TypeScript** - Полная типобезопасность во всей кодовой базе `Stable`
- **80%+ покрытие тестами** - 9,000+ тестов для надежности `Stable`
- **13 языков** - Полная интернационализация `Stable`

## Начало работы

### Быстрая установка

```bash
# Клонирование и установка
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Запуск режима разработки
bun run tauri dev
```

### Требования
- Node.js v18+, Rust, Bun, FFmpeg

### 🚑 Устранение распространенных проблем

#### FFmpeg не найден
```bash
# macOS
brew install ffmpeg
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# Windows - используйте скрипт настройки
./scripts/setup-rust-env-windows.ps1

# Linux
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev
```

#### Ошибки сборки
- **Windows**: Убедитесь что установлена Visual Studio 2022 с C++ tools
- **macOS**: Установите Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Установите build essentials: `sudo apt-get install build-essential`

📚 **[Полное руководство по установке →](docs/ru/02_getting_started/)**  
🪟 **[Настройка Windows →](docs/ru/06_deployment/platforms/)**  
🎥 **[Видео-туториал →](https://www.youtube.com/@chatman-media)**

## 📚 Центр документации

### 🚀 Начало работы
- 📌 [Установка и настройка](docs/ru/02_getting_started/)
- 🎬 [Первый проект](docs/ru/02_getting_started/)
- 🤔 [Структура проекта](docs/ru/01_project_docs/project-structure.md)
- 🪟 [Настройка Windows](docs/ru/06_deployment/platforms/)

### 🏗️ Архитектура
- 📄 [Обзор архитектуры](docs/ru/03_architecture/)
- 🌐 [Frontend архитектура](docs/ru/03_architecture/frontend/)
- ⚙️ [Backend архитектура](docs/ru/03_architecture/backend/)
- 🔄 [State Management](docs/ru/03_architecture/frontend/state-management.md)
- 📡 [Коммуникация](docs/ru/03_architecture/communication.md)

### 🎯 Функции и возможности
- 📈 [Обзор функций](docs/ru/10_advanced_features/)
- 📝 [Описание всех модулей](docs/ru/08_tasks/)
- 🎨 [Цветокоррекция](docs/ru/08_tasks/completed/)
- 🎧 [Fairlight Audio](docs/ru/08_tasks/completed/)

### 👨‍💻 Разработка
- 🧪 [Руководство разработчика](docs/ru/05_development/)
- 🧪 [Тестирование](docs/ru/12_testing/)
- 📡 [API Reference](docs/ru/04_api_reference/)
- 🔌 [Система плагинов](docs/ru/07_integrations/)
- 🔧 [Команды разработки](docs/ru/05_development/)

### 🚀 Развертывание
- 📦 [Сборка приложения](docs/ru/06_deployment/)
- 🤖 [CI/CD настройка](docs/ru/13_ci_cd/)
- 🔐 [OAuth настройка](docs/ru/07_integrations/)
- 📊 [Codecov интеграция](docs/ru/13_ci_cd/codecov-components.md)

### 📚 Дополнительные ресурсы
- 🌟 [Полная документация](docs/ru/)
- 📊 [Прогресс разработки](docs/ru/10_project_state/)
- 🌐 [API документация](https://chatman-media.github.io/timeline-studio/api-docs/)
- 🌐 [Веб-сайт проекта](https://chatman-media.github.io/timeline-studio/)
- 🏗️ [TDF методология](docs/ru/18_marketing_strategies/)

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

📚 **[Полное руководство по разработке →](docs/ru/05_development/)**

## CI/CD и качество кода

### Автоматизированные процессы
- ✅ **Линтинг**: ESLint, Stylelint, Clippy
- ✅ **Тестирование**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Покрытие**: Интеграция с Codecov
- ✅ **Сборка**: Кроссплатформенные сборки

📚 **[Подробное руководство CI/CD →](docs/ru/13_ci_cd/)**  
🔧 **[Линтинг и форматирование →](docs/ru/05_development/linting-and-formatting.md)**

## 👨‍💻 Ресурсы для разработчиков

### Участие в Timeline Studio
- 🤝 **[Руководство по участию](CONTRIBUTING.md)** - Как внести вклад в проект
- 🐛 **[Сообщить об ошибках](https://github.com/chatman-media/timeline-studio/issues)** - Нашли баг? Сообщите нам!
- 💡 **[Запросы функций](https://github.com/chatman-media/timeline-studio/discussions)** - Предложите новые функции

### Разработка плагинов
- 🔌 **[Руководство по системе плагинов](docs/ru/07_integrations/)** - Создавайте собственные плагины
- 🚀 **[Быстрый старт плагинов](docs/ru/05_development/)** - Начните за 5 минут
- 📦 **[Справочник Plugin API](docs/ru/04_api_reference/)** - Полная документация API

### Тестирование и качество
- 🧪 **[Руководство по тестированию](docs/ru/12_testing/)** - Unit, integration, E2E тестирование
- 📊 **[Утилиты тестирования](docs/ru/12_testing/)** - Тестирование аудио и Tauri компонентов
- ✅ **[Стиль кода](CLAUDE.md#code-style-guidelines)** - Стандарты кодирования
- 🔍 **[Руководство по производительности](docs/ru/11_performance/)** - Советы по оптимизации

## 🏗️ Timeline Documentation Framework (TDF)

Timeline Studio создал **Timeline Documentation Framework (TDF)** - инновационную методологию организации технической документации:

✅ **18 специализированных секций** для полного покрытия проекта  
✅ **Билингвальность из коробки** (ru/en структура)  
✅ **Media-First архитектура** для мультимедийных проектов  
✅ **Enterprise-ready организация** с профессиональными стандартами  

**TDF уже используется для:**
- Консалтинг по документации ($5,000-50,000 за проект)
- Сертификационные программы ($500-2,000 за курс)
- Enterprise инструменты ($1,000-10,000/год)

📚 **[Узнать больше о TDF →](docs/ru/18_marketing_strategies/)**

## 🌐 Сообщество и поддержка

### Присоединяйтесь к сообществу
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

### Получить помощь
- 📚 **[FAQ](docs/ru/09_troubleshooting/)** - Часто задаваемые вопросы
- 💬 **[Обсуждения](https://github.com/chatman-media/timeline-studio/discussions)** - Задавайте вопросы, делитесь идеями
- 🐛 **[Трекер ошибок](https://github.com/chatman-media/timeline-studio/issues)** - Сообщайте об ошибках
- 📧 **Поддержка по email** - ak.chatman.media@gmail.com

### Roadmap проекта
- 🗺️ **[Roadmap разработки](docs/ru/10_project_state/)** - Посмотрите, что будет дальше
- ✨ **[Завершенные функции](docs/ru/08_tasks/completed/)** - Недавно выпущенные функции
- 🎯 **[Прогресс Alpha релиза](docs/ru/17_releases/)** - 97.5% готово!
- 📊 **[Статус проекта](#статус-проекта)** - Текущая статистика разработки

### Поддержите проект
- ⭐ **[Поставьте звезду на GitHub](https://github.com/chatman-media/timeline-studio)** - Покажите свою поддержку
- 🤝 **[Внесите вклад](CONTRIBUTING.md)** - Присоединяйтесь к разработке
- 💼 **[Коммерческая лицензия](docs/ru/11_legal/)** - Для бизнес-использования

## Star History
<a href="https://www.star-history.com/#chatman-media/timeline-studio&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
 </picture>
</a>

## Лицензия

MIT License with Commons Clause - бесплатно для личного использования, для коммерческого использования требуется соглашение.

📄 **[Подробности лицензии →](docs/ru/11_legal/)** | 📧 **Коммерческая лицензия**: ak.chatman.media@gmail.com