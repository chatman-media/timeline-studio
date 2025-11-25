# Resources

## Overview / Обзор

**EN:** Resource management system for Timeline Studio. Manages effects, filters, transitions, templates, music, and subtitles. Provides centralized state management, resource tracking, and integration with timeline and browser components.

**RU:** Система управления ресурсами для Timeline Studio. Управляет эффектами, фильтрами, переходами, шаблонами, музыкой и субтитрами. Обеспечивает централизованное управление состоянием, отслеживание ресурсов и интеграцию с компонентами таймлайна и браузера.

## 📋 Статус готовности

- ✅ **Машина состояний**: Полностью реализована
- ✅ **Провайдер**: Полностью реализован
- ✅ **Компоненты**: ResourcesPanel реализован
- ✅ **Тесты**: 511 тестов в resources-panel.test.tsx
- ✅ **Интеграция**: Используется в Timeline и Browser

## API (Backend Commands)

No direct Tauri backend commands. Resources are managed client-side through XState machine.

## Behavior (from tests) / Поведение (из тестов)

### resources-panel.test.tsx
- ✓ should render without crashing
- ✓ should render all resource categories
- ✓ should render category icons
- ✓ should display resources with their names
- ✓ should show resource count for categories with resources
- ✓ should display appropriate icons for each resource type
- ✓ should show 'no resources' message for empty categories
- ✓ should handle all empty categories
- ✓ should not show resource count for empty categories
- ✓ should translate template names correctly
- ✓ should translate style template names correctly
- ✓ should show raw names for non-template resources
- ✓ should handle mix of populated and empty categories
- ✓ should have correct CSS classes for styling
- ✓ should render scrollable container
- ✓ should render resource items with proper styling
- ✓ should have proper semantic structure
- ✓ should have readable text sizes
- ✓ should show delete button on hover
- ✓ should call removeResource when delete button is clicked
- ✓ should handle delete button clicks properly

## 🎯 Основные функции

### ✅ Готово

#### Управление состоянием ресурсов
- [x] Машина состояний для управления ресурсами
- [x] Провайдер контекста для доступа к ресурсам
- [x] Типизированные интерфейсы для ресурсов
- [x] Тестовое покрытие логики

#### Категории ресурсов
- [x] **Effects** - видеоэффекты
- [x] **Filters** - фильтры изображения
- [x] **Transitions** - переходы между клипами
- [x] **Templates** - шаблоны проектов
- [x] **Music** - музыкальные ресурсы
- [x] **Subtitles** - субтитры и текстовые ресурсы

#### Интеграция с Timeline
- [x] Отображение ресурсов в TimelineResources
- [x] Группировка по категориям
- [x] Счетчики количества ресурсов
- [x] Иконки для каждого типа ресурса

### ❌ Требует реализации

#### Компоненты управления ресурсами
- [ ] ResourceManager - основной компонент управления
- [ ] ResourceList - список ресурсов по категориям
- [ ] ResourceItem - отдельный элемент ресурса
- [ ] ResourcePreview - предпросмотр ресурса
- [ ] ResourceImport - импорт новых ресурсов

#### Операции с ресурсами
- [ ] Добавление новых ресурсов
- [ ] Удаление ресурсов
- [ ] Редактирование метаданных
- [ ] Группировка и сортировка
- [ ] Поиск по ресурсам

#### Drag & Drop функционал
- [ ] Перетаскивание ресурсов на Timeline
- [ ] Применение эффектов к клипам
- [ ] Добавление переходов между клипами
- [ ] Импорт файлов через drag & drop

#### Предпросмотр и применение
- [ ] Предпросмотр эффектов в реальном времени
- [ ] Настройка параметров ресурсов
- [ ] Применение к выбранным клипам
- [ ] История применения ресурсов

## 🎨 UI/UX требования

### ❌ Требует реализации

#### Основной интерфейс
- [ ] Панель управления ресурсами
- [ ] Категоризированное отображение
- [ ] Поиск и фильтрация
- [ ] Сортировка по различным критериям

#### Элементы ресурсов
- [ ] Превью изображения/иконка
- [ ] Название и описание
- [ ] Метаданные (размер, тип, дата)
- [ ] Индикаторы состояния

#### Интерактивность
- [ ] Drag & drop поддержка
- [ ] Контекстные меню
- [ ] Быстрые действия
- [ ] Клавиатурные сокращения

#### Предпросмотр
- [ ] Модальное окно предпросмотра
- [ ] Настройки параметров
- [ ] Применение к выбранным элементам
- [ ] Сохранение пресетов

## 🔄 Интеграция с другими компонентами

### ✅ Реализовано
- [x] Интеграция с Timeline через TimelineResources
- [x] Доступ через useResources хук
- [x] Типизированные интерфейсы

### ❌ Требует реализации
- [ ] Интеграция с VideoPlayer для предпросмотра
- [ ] Синхронизация с Browser для импорта
- [ ] Связь с Effects/Filters/Transitions компонентами
- [ ] Сохранение в проектных файлах

## 📊 Типы ресурсов

### ✅ Определены в типах
```typescript
interface TimelineResource {
  id: string
  name: string
  type: 'effect' | 'filter' | 'transition' | 'template' | 'music' | 'subtitle'
  category?: string
  thumbnail?: string
  metadata?: Record<string, any>
}
```

### ❌ Требуют расширения
- [ ] Параметры для каждого типа ресурса
- [ ] Настройки применения
- [ ] Пресеты и конфигурации
- [ ] Зависимости между ресурсами

## 🧪 Тестирование

### ✅ Покрыто тестами
- [x] ResourcesMachine - машина состояний
- [x] ResourcesProvider - провайдер контекста
- [x] Логика управления ресурсами

### ❌ Требует тестирования
- [ ] Компоненты управления ресурсами
- [ ] Drag & drop функционал
- [ ] Интеграция с Timeline
- [ ] Предпросмотр и применение

## 📱 Адаптивность

### ❌ Требует реализации
- [ ] Адаптивные размеры элементов
- [ ] Мобильная навигация
- [ ] Сенсорные жесты
- [ ] Оптимизация для планшетов

## 🔧 Техническая реализация

### ✅ Готово
- [x] XState машина состояний
- [x] React Context провайдер
- [x] TypeScript типизация
- [x] Тестовое покрытие

### ❌ Требует реализации
- [ ] React компоненты
- [ ] Хуки для операций с ресурсами
- [ ] Утилиты для работы с файлами
- [ ] Кэширование и оптимизация

## 🎯 Приоритеты реализации

### Высокий приоритет
1. Создание базовых компонентов (ResourceManager, ResourceList)
2. Drag & drop интеграция с Timeline
3. Импорт и управление ресурсами

### Средний приоритет
1. Предпросмотр ресурсов
2. Настройка параметров
3. Поиск и фильтрация

### Низкий приоритет
1. Продвинутые эффекты предпросмотра
2. Социальные функции (рейтинги, комментарии)
3. Облачная синхронизация ресурсов

## 📈 Метрики успеха

### Функциональные метрики
- [ ] Время добавления ресурса < 2 секунд
- [ ] Время применения эффекта < 1 секунды
- [ ] Поддержка 100+ ресурсов без потери производительности

### UX метрики
- [ ] Интуитивность drag & drop операций
- [ ] Быстрота поиска нужного ресурса
- [ ] Удобство предпросмотра и настройки

## Structure / Структура

```
resources/
├── components/                       # UI компоненты
│   └── resources-panel.tsx          # Панель отображения ресурсов
├── machines/                         # State machines
│   └── backend-event-handlers.ts    # Обработчики событий бэкенда
├── services/                         # Сервисы и провайдеры
│   └── resources-provider.tsx       # React Context провайдер
├── config/                           # Конфигурация
│   └── preview-config.ts            # Настройки превью
├── types.ts                          # TypeScript типы
├── index.ts                          # Экспорты модуля
├── README.md                         # Документация
└── __tests__/                        # Тесты (511 тестов)
    └── components/
        └── resources-panel.test.tsx
```

## Dependencies / Зависимости

- Depends on:
  - `xstate` - для state machine
  - `react-i18next` - для интернационализации
  - `lucide-react` - для иконок
  - `@/features/effects` - для типов эффектов
  - `@/features/filters` - для типов фильтров
  - `@/features/transitions` - для типов переходов
  - `@/features/templates` - для типов шаблонов
  - `@/features/style-templates` - для стилевых шаблонов
- Used by:
  - `@/features/timeline` - для отображения ресурсов
  - `@/features/browser` - для управления ресурсами
  - `@/features/media-studio` - для интеграции в редактор

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/resources/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация ResourcesPanel | ⏳ Planned | - | 🔴 High |
| Отображение категорий ресурсов | ⏳ Planned | - | 🔴 High |
| Добавление ресурса в категорию | ⏳ Planned | - | 🔴 High |
| Удаление ресурса через UI | ⏳ Planned | - | 🔴 High |
| Отображение счетчиков ресурсов | ⏳ Planned | - | 🟡 Medium |
| Фильтрация ресурсов по категориям | ⏳ Planned | - | 🟡 Medium |
| Drag & Drop ресурсов на Timeline | ⏳ Planned | - | 🟡 Medium |
| Применение эффектов к клипам | ⏳ Planned | - | 🟡 Medium |
| Применение фильтров к клипам | ⏳ Planned | - | 🟡 Medium |
| Применение переходов между клипами | ⏳ Planned | - | 🟡 Medium |
| Локализация названий ресурсов | ⏳ Planned | - | 🟢 Low |
| Поиск по ресурсам | ⏳ Planned | - | 🟢 Low |
| Сортировка ресурсов | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал управления ресурсами
- 🟡 Medium - функции интеграции с Timeline
- 🟢 Low - дополнительные UI возможности
