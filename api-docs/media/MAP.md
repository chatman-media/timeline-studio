# Timeline Studio - Карта документации

## 📚 Обзор документации

Этот документ содержит полную карту всей документации проекта Timeline Studio, организованную по категориям для удобной навигации.

## 📁 Структура документации

### 🏠 Корневая документация
- [`README.md`](../README.md) - Главный README проекта (обновлен 14.06.2025)
- [`README.ru.md`](../README.ru.md) - Русская версия README (обновлен 14.06.2025)
- [`ROADMAP.md`](ROADMAP.md) - Дорожная карта проекта (обновлено 14.06.2025)
- [`CLAUDE.md`](../CLAUDE.md) - Инструкции для Claude Code AI
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Руководство для контрибьюторов
- [`CHANGELOG.md`](../CHANGELOG.md) - История изменений

### 📂 ai-gen-docs/ - AI-сгенерированная документация

#### 🏗️ Архитектура
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - Общая архитектура приложения

#### 📋 architecture/ - Архитектурные документы
- [`type-mapping-frontend-backend.md`](architecture/type-mapping-frontend-backend.md) - Маппинг типов

#### 🚀 deployment/ - Развертывание
- [`DEPLOYMENT.md`](deployment/DEPLOYMENT.md) - Руководство по развертыванию

#### 🧪 testing/ - Тестирование
- [`TESTING.md`](testing/TESTING.md) - Руководство по тестированию
- [`test-implementation-summary.md`](testing/test-implementation-summary.md) - Сводка реализации тестов
- [`testing-with-real-media.md`](testing/testing-with-real-media.md) - Тестирование с реальными медиафайлами

#### 📡 api/ - API документация
- [`API.md`](api/API.md) - Справочник Tauri команд
- [`api-media-persistence.md`](api/api-media-persistence.md) - API персистентности медиа

#### 💻 development-guides/ - Руководства разработчика
- [`APP-DIRECTORIES.md`](development-guides/APP-DIRECTORIES.md) - Структура директорий приложения
- [`user-guide-media-persistence.md`](development-guides/user-guide-media-persistence.md) - Руководство по персистентности медиа

#### 📄 implementation-plans/ - Планы реализации
- [`video-streaming-architecture.md`](implementation-plans/video-streaming-architecture.md) - Архитектура стриминга
- [`video-loading-optimization.md`](implementation-plans/video-loading-optimization.md) - Оптимизация загрузки
- [`video-loading-optimization-tauri-v2.md`](implementation-plans/video-loading-optimization-tauri-v2.md) - Tauri v2 оптимизация
- [`video-loading-implementation-plan.md`](implementation-plans/video-loading-implementation-plan.md) - План реализации
- [`media-browser-performance-fixes.md`](implementation-plans/media-browser-performance-fixes.md) - Оптимизация браузера
- [`media-import-performance-optimizations.md`](implementation-plans/media-import-performance-optimizations.md) - Оптимизация импорта
- [`media-preview-sizing-improvements.md`](implementation-plans/media-preview-sizing-improvements.md) - Улучшения превью
- [`preview-apply-workflow.md`](implementation-plans/preview-apply-workflow.md) - Workflow превью
- [`media-project-persistence.md`](implementation-plans/media-project-persistence.md) - Персистентность медиа
- [`temp-project-implementation.md`](implementation-plans/temp-project-implementation.md) - Временные проекты

### 🦀 src-tauri/ - Backend документация

#### Модули Rust
- [`src-tauri/src/media/README.md`](../src-tauri/src/media/README.md) - Модуль работы с медиа
- [`src-tauri/src/recognition/README.md`](../src-tauri/src/recognition/README.md) - Модуль распознавания (YOLO)
- [`src-tauri/src/video_compiler/README.md`](../src-tauri/src/video_compiler/README.md) - Модуль компиляции видео
- [`src-tauri/src/video_compiler/DEV.md`](../src-tauri/src/video_compiler/DEV.md) - Руководство разработчика Video Compiler

### ⚛️ src/features/ - Frontend документация

#### Основные модули
- [`src/features/timeline/README.md`](../src/features/timeline/README.md) - Timeline редактор
- [`src/features/video-player/README.md`](../src/features/video-player/README.md) - Видео плеер
- [`src/features/browser/README.md`](../src/features/browser/README.md) - Браузер медиа файлов
- [`src/features/export/README.md`](../src/features/export/README.md) - Экспорт видео

#### Эффекты и визуальные элементы
- [`src/features/effects/README.md`](../src/features/effects/README.md) - Визуальные эффекты
- [`src/features/filters/README.md`](../src/features/filters/README.md) - Фильтры
- [`src/features/transitions/README.md`](../src/features/transitions/README.md) - Переходы
- [`src/features/templates/README.md`](../src/features/templates/README.md) - Шаблоны мультикамеры
- [`src/features/style-templates/README.md`](../src/features/style-templates/README.md) - Стильные шаблоны
- [`src/features/subtitles/README.md`](../src/features/subtitles/README.md) - Субтитры

#### Дополнительные модули
- [`src/features/ai-chat/README.md`](../src/features/ai-chat/README.md) - AI ассистент
- [`src/features/resources/README.md`](../src/features/resources/README.md) - Управление ресурсами
- [`src/features/project-settings/README.md`](../src/features/project-settings/README.md) - Настройки проекта
- [`src/features/keyboard-shortcuts/README.md`](../src/features/keyboard-shortcuts/README.md) - Горячие клавиши

### 🧪 Тестирование
- [`src/test/README.md`](../src/test/README.md) - Руководство по тестированию
- Каждый feature содержит `__tests__/` директорию с тестами

## 📊 Статус документации по модулям

### ✅ Полностью документированы
- Video Compiler (backend) - README + DEV.md
- Recognition (backend) - README с примерами
- Timeline (frontend) - подробный README
- Effects/Filters/Transitions - все с примерами

### ⚠️ Требуют обновления
- Export - нужна документация по новому API
- Resources - требует описания drag & drop
- Subtitles - нужны примеры интеграции

### 🔴 Отсутствует документация
- Camera Capture
- Voice Recording
- Music
- Options
- Top Bar

## 🚀 Быстрый старт для разработчиков

1. **Новичкам**: Начните с корневого [`README.md`](../README.md)
2. **Frontend разработка**: См. [`src/features/DEV-README.md`](../src/features/DEV-README.md)
3. **Backend разработка**: См. документацию модулей в `src-tauri/src/*/README.md`
4. **Архитектура**: Изучите [`ARCHITECTURE.md`](ARCHITECTURE.md)
5. **API**: См. [`api/API.md`](api/API.md) для Tauri команд
6. **Тесты**: [`testing/TESTING.md`](testing/TESTING.md)
7. **Деплой**: [`deployment/DEPLOYMENT.md`](deployment/DEPLOYMENT.md)

## 📝 Стандарты документации

### Структура README для feature
```markdown
# Feature Name

## Обзор
Краткое описание функциональности

## Архитектура
- Компоненты
- Хуки
- Сервисы
- Типы

## Использование
Примеры кода

## API
Описание публичного API

## Тестирование
Как запускать тесты

## TODO
Планы развития
```

### Структура README для backend модуля
```markdown
# Module Name

## Обзор
Описание модуля

## Структура
Файлы и их назначение

## API команды
Tauri команды

## Примеры
Примеры использования

## Тестирование
Инструкции по тестированию
```

## 🔄 Обновление документации

При добавлении новой документации:
1. Добавьте ссылку в этот файл в соответствующую категорию
2. Обновите статус в разделе "Статус документации"
3. Следуйте стандартам документации выше
4. Добавьте примеры кода где возможно

---

*Последнее обновление: 14 июня 2025*