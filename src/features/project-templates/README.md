# Project Templates

## Overview / Обзор

**EN:** Project templates system for Timeline Studio. Provides predefined project configurations for different video content types (YouTube, Social Media, Podcasts). Includes template selection, validation, customization, and automatic project structure generation.

**RU:** Система шаблонов проектов для Timeline Studio. Предоставляет предварительно настроенные конфигурации проектов для разных типов видеоконтента (YouTube, соцсети, подкасты). Включает выбор шаблонов, валидацию, настройку и автоматическую генерацию структуры проекта.

## API (Backend Commands)

No direct Tauri backend commands. All logic is client-side.

## Behavior (from tests) / Поведение (из тестов)

### project-template-manager.test.ts
- ✓ should return all templates including built-in and custom
- ✓ should return template by id
- ✓ should return undefined for non-existent id
- ✓ should filter templates by category
- ✓ should filter templates by aspect ratio
- ✓ should search templates by query
- ✓ should return empty array for non-matching query
- ✓ should sort templates by name ascending
- ✓ should sort templates by name descending
- ✓ should add a custom template
- ✓ should throw error when adding template with existing id
- ✓ should delete a custom template
- ✓ should throw error when deleting built-in template
- ✓ should return statistics about templates

### use-project-template.test.tsx
- ✓ should initialize with default values
- ✓ should select template and validate it
- ✓ should clear selection
- ✓ should filter templates
- ✓ should search templates
- ✓ should sort templates
- ✓ should reset filters
- ✓ should validate template
- ✓ should throw error if no template selected
- ✓ should apply template successfully
- ✓ should handle apply template error
- ✓ should not apply invalid template
- ✓ should add custom template
- ✓ should not add invalid custom template
- ✓ should delete custom template
- ✓ should clear selection when deleting selected template
- ✓ should get template by id
- ✓ should preview template
- ✓ should export template
- ✓ should import template

## Structure / Структура

```
project-templates/
├── components/          # UI компоненты
│   ├── template-customizer.tsx
│   ├── template-picker.tsx
│   ├── template-preview.tsx
│   └── template-wizard.tsx
├── hooks/              # React хуки
│   ├── use-project-template.ts
│   └── use-template-picker.ts
├── lib/                # Библиотеки шаблонов
│   ├── podcast-templates.ts
│   ├── social-templates.ts
│   ├── templates.ts
│   └── youtube-templates.ts
├── services/           # Бизнес-логика
│   ├── project-template-manager.ts
│   ├── template-applier.ts
│   └── template-validator.ts
├── types/              # TypeScript типы
│   └── project-template.ts
└── __tests__/          # Тесты (30+ тестов)
```

## Features / Функции

### Template Categories
- **YouTube**: Video, Shorts, Live Stream
- **Social Media**: Instagram, TikTok, Facebook, Twitter
- **Podcasts**: Audio, Video, Interview
- **Commercial**: Ads, Promo
- **Presentation**: Corporate, Educational

### Template Configuration
- Aspect ratios: 16:9, 9:16, 1:1, 4:3
- Project structure: sections, tracks, timings
- Placeholders: intro, outro, content, music, chapters
- Settings: resolution, frame rate, audio config

### Operations
- Select and preview templates
- Filter by category, platform, aspect ratio, duration
- Search by name and description
- Sort by name, duration, category
- Validate template compatibility
- Apply template to project
- Add/delete custom templates
- Export/import templates as JSON

## Dependencies / Зависимости

- Depends on:
  - `@/features/project-settings` - для типов проекта
  - `@/lib/tauri-logger` - для логирования
- Used by:
  - Мастер создания проектов
  - Настройки проекта
  - AI Director (для автоматической настройки)

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/project-templates/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Загрузка встроенных шаблонов проектов | ⏳ Planned | - | 🔴 High |
| Фильтрация по категории (YouTube, Social Media, Podcasts) | ⏳ Planned | - | 🔴 High |
| Фильтрация по соотношению сторон (16:9, 9:16, 1:1) | ⏳ Planned | - | 🟡 Medium |
| Поиск шаблонов по названию и описанию | ⏳ Planned | - | 🟡 Medium |
| Сортировка шаблонов (название, длительность) | ⏳ Planned | - | 🟢 Low |
| Выбор шаблона и отображение превью | ⏳ Planned | - | 🔴 High |
| Валидация совместимости шаблона | ⏳ Planned | - | 🔴 High |
| Применение шаблона к новому проекту | ⏳ Planned | - | 🔴 High |
| Кастомизация параметров шаблона | ⏳ Planned | - | 🟡 Medium |
| Создание кастомного шаблона | ⏳ Planned | - | 🟡 Medium |
| Удаление кастомного шаблона | ⏳ Planned | - | 🟢 Low |
| Экспорт шаблона в JSON | ⏳ Planned | - | 🟢 Low |
| Импорт шаблона из JSON | ⏳ Planned | - | 🟢 Low |
| Wizard создания проекта из шаблона | ⏳ Planned | - | 🟡 Medium |
| Генерация структуры проекта (sections, tracks) | ⏳ Planned | - | 🔴 High |
| Настройка placeholders (intro, outro, music) | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал (загрузка, фильтрация, выбор, валидация, применение, генерация)
- 🟡 Medium - важный функционал (поиск, кастомизация, custom templates, wizard, placeholders)
- 🟢 Low - дополнительный функционал (сортировка, импорт/экспорт, удаление)

### Описание
Project Templates - client-side модуль без Tauri команд. Шаблоны загружаются из статических данных и управляются через ProjectTemplateManager. Критически важно протестировать валидацию совместимости шаблонов и корректность генерации структуры проекта при применении. Необходимо проверить работу wizard для создания новых проектов из шаблонов.
