# Drag & Drop

## Overview / Обзор

**EN:** Global drag-and-drop management system for Timeline Studio. Provides unified drag-and-drop functionality across all modules (media files, effects, filters, transitions, templates). Uses singleton pattern to coordinate drag operations between different parts of the application.

**RU:** Глобальная система управления drag-and-drop для Timeline Studio. Предоставляет единообразную функциональность перетаскивания для всех модулей (медиа файлы, эффекты, фильтры, переходы, шаблоны). Использует паттерн singleton для координации операций между различными частями приложения.

## API (Backend Commands)

This module is frontend-only and does not use Tauri backend commands.

| Command | Parameters | Description |
|---------|------------|-------------|
| N/A | - | Pure frontend implementation using HTML5 Drag & Drop API |

## Features / Возможности

### Draggable Types / Типы перетаскиваемых объектов
- **media** - Media files (video/audio)
- **music** - Music library items
- **effect** - Video effects
- **filter** - Video filters
- **transition** - Transition effects
- **template** - Multi-camera templates
- **style-template** - Animated intro/outro templates
- **subtitle-style** - Subtitle style presets

### Key Capabilities / Основные возможности
- **Global coordination** - Single manager for all drag operations
- **Type-safe drops** - Drop targets can specify accepted types
- **Ghost image** - Custom preview images during drag
- **Event system** - EventEmitter for cross-module communication
- **Multiple drop targets** - Register multiple drop zones
- **Backward compatibility** - Supports both new unified system and legacy dataTransfer types

## Behavior (from tests) / Поведение (из тестов)

### use-drag-drop.test.ts
- ✓ useDraggable hook creates drag handlers
- ✓ useDraggable calls startDrag when drag starts
- ✓ useDraggable passes correct item data and preview
- ✓ useDropZone hook registers drop target
- ✓ useDropZone accepts specified draggable types
- ✓ useDropZone calls callbacks on drag events (enter, over, leave, drop)
- ✓ useDropZone validates draggable types
- ✓ useDragDropState provides current drag state
- ✓ useDragDropState updates on drag events

### drag-drop-manager.test.ts
- ✓ DragDropManager is singleton
- ✓ startDrag creates drag state
- ✓ startDrag creates ghost image when preview provided
- ✓ startDrag sets dataTransfer with item data
- ✓ startDrag sets legacy dataTransfer types for backward compatibility
- ✓ registerDropTarget adds target to registry
- ✓ findActiveDropTarget identifies correct drop target
- ✓ findActiveDropTarget validates accepted types
- ✓ drag events update current drag state
- ✓ drop event calls target's onDrop callback
- ✓ endDrag clears drag state and removes ghost image
- ✓ EventEmitter events fired for drag lifecycle

## Structure / Структура

```
drag-drop/
├── hooks/
│   └── use-drag-drop.ts    # React hooks for drag & drop
│       ├── useDraggable()  # Make element draggable
│       ├── useDropZone()   # Register drop target
│       └── useDragDropState() # Access current drag state
├── services/
│   └── drag-drop-manager.ts # Global singleton manager
│       ├── DragDropManager class
│       └── Event coordination
├── index.ts                # Public exports
└── __tests__/             # Test suite
    ├── hooks/
    │   └── use-drag-drop.test.ts
    └── services/
        └── drag-drop-manager.test.ts
```

## Dependencies / Зависимости

### Internal Dependencies
- `events` (Node.js EventEmitter) - Event coordination
- No other internal dependencies - standalone module

### External Dependencies
- `react` - Hook implementations
- HTML5 Drag & Drop API - Native browser support

### Used By
- `@/features/browser` - Drag media files to timeline
- `@/features/effects` - Drag effects to clips
- `@/features/filters` - Drag filters to clips
- `@/features/transitions` - Drag transitions between clips
- `@/features/templates` - Drag templates to timeline
- `@/features/style-templates` - Drag style templates
- `@/features/timeline` - Drop target for all items

## Usage Example / Пример использования

### Making an element draggable

```tsx
import { useDraggable } from '@/features/drag-drop'

function MediaFileItem({ file }) {
  const { dragHandlers } = useDraggable({
    type: 'media',
    getData: () => file,
    getPreview: () => ({
      url: file.thumbnail,
      width: 100,
      height: 100
    })
  })

  return (
    <div {...dragHandlers}>
      <img src={file.thumbnail} />
      <span>{file.name}</span>
    </div>
  )
}
```

### Creating a drop zone

```tsx
import { useDropZone } from '@/features/drag-drop'

function TimelineDropZone() {
  const dropZoneRef = useRef<HTMLDivElement>(null)

  useDropZone({
    id: 'timeline-drop',
    accepts: ['media', 'effect', 'filter', 'transition'],
    elementRef: dropZoneRef,
    onDrop: (item, event) => {
      console.log('Dropped item:', item)
      // Add item to timeline
      if (item.type === 'media') {
        addMediaToTimeline(item.data, event.clientX)
      }
    },
    onDragEnter: (item) => {
      console.log('Drag enter:', item.type)
      // Show drop indicator
    },
    onDragLeave: () => {
      // Hide drop indicator
    }
  })

  return <div ref={dropZoneRef} className="timeline-drop-zone" />
}
```

### Accessing drag state

```tsx
import { useDragDropState } from '@/features/drag-drop'

function DragStateIndicator() {
  const { isDragging, currentItem } = useDragDropState()

  if (!isDragging) return null

  return (
    <div className="drag-indicator">
      Dragging: {currentItem?.type}
    </div>
  )
}
```

### Direct manager usage (advanced)

```tsx
import { getDragDropManager } from '@/features/drag-drop'

const manager = getDragDropManager()

// Listen to drag events
manager.on('dragStart', (state) => {
  console.log('Drag started:', state)
})

manager.on('dragEnd', () => {
  console.log('Drag ended')
})

// Manually start drag
manager.startDrag({
  type: 'effect',
  data: effectData
}, dragEvent)
```

## Architecture / Архитектура

### Singleton Pattern
The `DragDropManager` uses singleton pattern to ensure only one instance manages all drag operations:

```typescript
export class DragDropManager extends EventEmitter {
  private static instance: DragDropManager

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager()
    }
    return DragDropManager.instance
  }
}
```

### Event Lifecycle

1. **dragStart** - User initiates drag
   - Create ghost image if preview provided
   - Set dataTransfer data
   - Emit 'dragStart' event

2. **dragOver** - Mouse moves over drop target
   - Find active drop target under cursor
   - Call target's onDragOver callback
   - Update currentX/currentY

3. **dragEnter** - Mouse enters drop target
   - Validate accepted types
   - Call target's onDragEnter callback
   - Update activeDropTarget

4. **dragLeave** - Mouse leaves drop target
   - Call target's onDragLeave callback
   - Clear activeDropTarget

5. **drop** - User releases mouse
   - Call target's onDrop callback
   - Emit 'drop' event
   - Call endDrag()

6. **dragEnd** - Drag operation ends
   - Clear drag state
   - Remove ghost image
   - Emit 'dragEnd' event

### Ghost Image System
Custom drag preview created from preview data:

```typescript
createGhostImage(preview: { url: string, width: number, height: number }) {
  const ghost = document.createElement('div')
  ghost.style.position = 'absolute'
  ghost.style.left = '-9999px'
  ghost.style.backgroundImage = `url(${preview.url})`
  ghost.style.width = `${preview.width}px`
  ghost.style.height = `${preview.height}px`
  document.body.appendChild(ghost)
  this.ghostElement = ghost
}
```

## Backward Compatibility / Обратная совместимость

The manager supports both new unified system and legacy dataTransfer types:

```typescript
// New unified way (recommended)
event.dataTransfer.setData('application/json', JSON.stringify(item))

// Legacy compatibility (for old code)
switch (item.type) {
  case 'media':
    event.dataTransfer.setData('mediaFile', JSON.stringify(item.data))
    break
  case 'effect':
    event.dataTransfer.setData('effect', JSON.stringify(item.data))
    break
  // ... other types
}
```

## Performance / Производительность

- **Singleton pattern** - Single manager instance, minimal memory overhead
- **Event delegation** - Global listeners instead of per-element listeners
- **Lazy ghost creation** - Ghost image only created when preview provided
- **Efficient target lookup** - Map-based drop target registry
- **Cleanup on unmount** - Hooks automatically unregister targets

## Testing / Тестирование

The module has comprehensive test coverage:

```bash
# Run all drag-drop tests
bun run test src/features/drag-drop

# Run specific test file
bun run test src/features/drag-drop/hooks/__tests__/use-drag-drop.test.ts
```

**Note:** 4 SSR-related tests are skipped as Timeline Studio is a Tauri desktop application, not SSR.

## Best Practices / Лучшие практики

1. **Use hooks for components** - `useDraggable` and `useDropZone` for React components
2. **Specify accepted types** - Always define which types a drop zone accepts
3. **Provide preview** - Include preview image for better UX
4. **Clean up listeners** - Hooks handle this automatically
5. **Type validation** - Manager validates types before drop
6. **Error handling** - Handle edge cases in onDrop callbacks

## Migration from Legacy System / Миграция со старой системы

If you have old code using direct dataTransfer:

```tsx
// OLD WAY (still works)
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('mediaFile', JSON.stringify(file))
  }}
/>

// NEW WAY (recommended)
const { dragHandlers } = useDraggable({
  type: 'media',
  getData: () => file
})

<div {...dragHandlers} />
```

Both approaches work, but the new way provides:
- Type safety
- Centralized management
- Better debugging
- Event coordination
- Custom previews

## Future Enhancements / Будущие улучшения

- [ ] Touch device support (mobile/tablet drag)
- [ ] Drag constraints (limit drag area)
- [ ] Multi-item drag (select multiple items)
- [ ] Snap-to-grid for timeline drops
- [ ] Drag reordering within lists
- [ ] Keyboard shortcuts during drag (Ctrl for copy, Shift for move)
- [ ] Analytics/telemetry for drag operations

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/drag-drop/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Drag & Drop медиа файлов на timeline | ⏳ Planned | - | 🔴 High |
| Drag & Drop эффектов на клипы | ⏳ Planned | - | 🔴 High |
| Drag & Drop фильтров на клипы | ⏳ Planned | - | 🔴 High |
| Drag & Drop переходов между клипами | ⏳ Planned | - | 🔴 High |
| Drag & Drop шаблонов на timeline | ⏳ Planned | - | 🟡 Medium |
| Drag & Drop style templates | ⏳ Planned | - | 🟡 Medium |
| Drag & Drop subtitle styles | ⏳ Planned | - | 🟢 Low |
| Custom ghost image при перетаскивании | ⏳ Planned | - | 🟡 Medium |
| Type validation на drop targets | ⏳ Planned | - | 🔴 High |
| DragEnter/DragLeave события | ⏳ Planned | - | 🟡 Medium |
| DragOver курсор индикация | ⏳ Planned | - | 🟢 Low |
| Drop callback выполнение | ⏳ Planned | - | 🔴 High |
| Множественные drop zones | ⏳ Planned | - | 🟡 Medium |
| Backward compatibility с legacy dataTransfer | ⏳ Planned | - | 🟢 Low |
| EventEmitter для cross-module communication | ⏳ Planned | - | 🟡 Medium |
| Cleanup при unmount компонентов | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал (drag основных типов, type validation, drop callbacks)
- 🟡 Medium - важный функционал (templates, ghost image, события, multiple zones, events)
- 🟢 Low - дополнительный функционал (subtitle styles, курсор, backward compat, cleanup)

### Описание
Drag & Drop - frontend-only модуль без Tauri команд, использует HTML5 Drag & Drop API. Критически важно протестировать корректность перетаскивания основных типов контента (media, effects, filters, transitions) и валидацию типов на drop targets. Необходимо проверить работу singleton DragDropManager для координации операций между разными модулями. Важно убедиться что ghost images создаются правильно и cleanup происходит при unmount.
