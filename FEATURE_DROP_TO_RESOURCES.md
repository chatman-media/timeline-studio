# Feature: Drop to Resources Panel

## Overview

Добавлена возможность перетаскивать элементы из браузера медиа **на панель ресурсов** (Resources Panel). Это позволяет пользователю собирать нужные ресурсы в одном месте для последующего использования AI или ручного редактирования.

## Зачем это нужно?

**Раньше:**
- Перетащить файл → сразу на таймлайн
- Нет возможности собрать "коллекцию" для AI

**Теперь:**
- Перетащить файл → на панель ресурсов
- AI видит все ресурсы и может их использовать
- Можно собрать весь материал перед началом монтажа

## Как это работает

### 1. Drag & Drop из браузера

```
Браузер медиа → Берём видео → Тащим на категорию "Media" → Отпускаем
                                    ↓
                        Видео добавляется в панель ресурсов
```

### 2. Поддерживаемые типы

Каждая категория принимает только совместимые типы:

| Категория | Принимает |
|-----------|-----------|
| **Media** | `media` (видео/изображения) |
| **Music** | `music` (аудио треки) |
| **Effects** | `effect` (видео эффекты) |
| **Filters** | `filter` (цветовые фильтры) |
| **Transitions** | `transition` (переходы) |
| **Templates** | `template` (multicam шаблоны) |
| **Style Templates** | `style-template` (анимированные шаблоны) |
| **Subtitles** | `subtitle-style` (стили субтитров) |

### 3. Визуальная обратная связь

**При перетаскивании:**

- 🟦 **Синяя рамка** + "Добавить в [категория]" → Можно дропнуть
- 🟥 **Красная рамка** + "Несовместимый тип" → Нельзя дропнуть
- Backdrop blur на фоне категории
- Upload иконка

**После drop:**
- Ресурс появляется в категории
- Можно перетащить из панели на таймлайн
- Можно удалить кнопкой X

## Реализация

### Новые компоненты

**`ResourceCategoryDropZone`** (`src/features/resources/components/resource-category-drop-zone.tsx`)

Обёртка для каждой категории ресурсов, которая:
- Регистрирует drop target в DragDropManager
- Проверяет совместимость типов
- Показывает визуальный feedback
- Вызывает соответствующий `addXXX` метод

### Обновлённые компоненты

**`ResourcesPanel`** (`src/features/resources/components/resources-panel.tsx`)

- Добавлено поле `acceptedTypes` для каждой категории
- Каждая категория обёрнута в `ResourceCategoryDropZone`
- Добавлен `min-h-[80px]` для лучшего UX при перетаскивании

### API

Использует существующие методы из `ResourcesProvider`:
- `addMedia(file: MediaFile)`
- `addMusic(file: MediaFile)`
- `addEffect(effect: VideoEffect)`
- `addFilter(filter: VideoFilter)`
- `addTransition(transition: Transition)`
- `addTemplate(template: MediaTemplate)`
- `addStyleTemplate(template: StyleTemplate)`
- `addSubtitle(style: SubtitleStyleTemplate)`

## Примеры использования

### Сценарий 1: Подготовка материала для AI монтажа

```
1. Открываешь вкладку "Media"
2. Выбираешь 5 видео из отпуска
3. Перетаскиваешь каждое на категорию "Media" в панели ресурсов
4. Открываешь вкладку "Music"
5. Перетаскиваешь трек на категорию "Music"
6. Открываешь вкладку "Style Templates"
7. Перетаскиваешь "Lower Third" на категорию "Style Templates"
8. Запускаешь AI Director → AI видит все ресурсы и создаёт монтаж
```

### Сценарий 2: Коллекция эффектов для клипа

```
1. Выбираешь несколько эффектов (Blur, Vignette, Color Grading)
2. Перетаскиваешь на категорию "Effects"
3. Теперь можешь быстро применять их на разные клипы
4. Все эффекты в одном месте, не нужно искать в браузере
```

## Технические детали

### Drop Zone регистрация

```typescript
useEffect(() => {
  const dragDropManager = getDragDropManager()

  const dropTarget = {
    id: `resource-category-${categoryId}`,
    accepts: acceptedTypes, // ["media"] | ["music"] | etc
    element: dropZoneRef.current,
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop, // вызывает addMedia/addMusic/etc
  }

  const unregister = dragDropManager.registerDropTarget(dropTarget)
  return () => unregister()
}, [categoryId, acceptedTypes, ...])
```

### Type safety

```typescript
// Только совместимые типы принимаются
acceptedTypes: ["media" as const]  // только media
acceptedTypes: ["effect" as const] // только effect

// В handleDrop автоматически роутится на правильный метод
switch (item.type) {
  case "media": await addMedia(item.data); break
  case "effect": await addEffect(item.data); break
  // ...
}
```

## Архитектура

```
┌─────────────────────────────────────┐
│         Browser                      │
│  (Media/Music/Effects/...)          │
└──────────────┬──────────────────────┘
               │ drag
               ↓
┌─────────────────────────────────────┐
│    ResourceCategoryDropZone         │
│  • Проверка типа                    │
│  • Визуальный feedback              │
│  • handleDrop → addXXX()            │
└──────────────┬──────────────────────┘
               │ addMedia/addMusic/...
               ↓
┌─────────────────────────────────────┐
│      ResourcesProvider               │
│  • Backend команды                  │
│  • State synchronization            │
│  • Resources storage                │
└──────────────┬──────────────────────┘
               │ backend events
               ↓
┌─────────────────────────────────────┐
│         Backend State               │
│  (Tauri/Rust)                       │
└─────────────────────────────────────┘
```

## Преимущества

✅ **Удобство для пользователя**
- Drag & drop интуитивно понятен
- Визуальный feedback
- Организация ресурсов

✅ **Готовность для AI**
- AI видит все собранные ресурсы
- Можно создать "набор" для конкретного проекта
- Меньше ручной работы

✅ **Чистая архитектура**
- Использует существующий DragDropManager
- Не дублирует код
- Type-safe

✅ **Расширяемость**
- Легко добавить новые категории
- Легко изменить accepted types
- Модульная структура

## Тестирование

### Manual testing

1. Перетащить медиафайл на категорию "Media"
2. Перетащить эффект на категорию "Effects"
3. Попробовать перетащить media на "Effects" → должна показаться красная рамка
4. Перетащить несколько ресурсов разных типов
5. Проверить что ресурсы можно перетащить из панели на таймлайн

### Unit tests (TODO)

- `ResourceCategoryDropZone` component tests
- Drop validation tests
- Integration with ResourcesProvider

## Связанные модули

- `@/features/drag-drop` - Глобальная система D&D
- `@/features/resources` - Управление ресурсами
- `@/features/browser` - Источник draggable элементов
- `@/domains/project-management` - Backend state

## Дальнейшие улучшения

- [ ] Drag & drop порядка ресурсов внутри категории
- [ ] Групповое перетаскивание (multiple selection)
- [ ] Показ прогресса при добавлении большого количества файлов
- [ ] Keyboard shortcuts (Del для удаления)
- [ ] Контекстное меню (правая кнопка мыши)
- [ ] Поиск/фильтрация внутри панели ресурсов
