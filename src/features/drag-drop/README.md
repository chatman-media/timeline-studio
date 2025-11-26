# Drag & Drop

**English** | [Русский](./README.ru.md)

## Overview

Global drag-and-drop management system for Timeline Studio. Provides unified drag-and-drop functionality across all modules (media files, effects, filters, transitions, templates). Uses singleton pattern to coordinate drag operations between different parts of the application.

## Status

- ✅ **Components**: N/A (hook-based system)
- ✅ **Hooks**: useDraggable, useDropZone, useDragDropState
- ✅ **Services**: DragDropManager singleton with EventEmitter
- ✅ **Tests**: Comprehensive coverage (hooks and manager), 4 SSR tests skipped

## Structure

```
drag-drop/
├── hooks/
│   └── use-drag-drop.ts           # React hooks for drag & drop
│       ├── useDraggable()         # Make element draggable
│       ├── useDropZone()          # Register drop target
│       └── useDragDropState()     # Access current drag state
├── services/
│   └── drag-drop-manager.ts       # Global singleton manager
│       ├── DragDropManager        # Main manager class
│       └── EventEmitter           # Event coordination
├── __tests__/                     # Test files
└── index.ts                       # Public exports
```

## Features

### ✅ Implemented

- [x] **Global coordination**: Single manager for all drag operations
- [x] **Type-safe drops**: Drop targets can specify accepted types
- [x] **Ghost image**: Custom preview images during drag
- [x] **Event system**: EventEmitter for cross-module communication
- [x] **Multiple drop targets**: Register multiple drop zones
- [x] **Backward compatibility**: Supports both new unified system and legacy dataTransfer types
- [x] **Draggable types**: media, music, effect, filter, transition, template, style-template, subtitle-style

### ❌ Not Implemented

- [ ] Touch device support (mobile/tablet drag)
- [ ] Drag constraints (limit drag area)
- [ ] Multi-item drag (select multiple items)
- [ ] Snap-to-grid for timeline drops
- [ ] Drag reordering within lists
- [ ] Keyboard shortcuts during drag (Ctrl for copy, Shift for move)
- [ ] Analytics/telemetry for drag operations

## Usage

### Making an element draggable

```typescript
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

```typescript
import { useDropZone } from '@/features/drag-drop'

function TimelineDropZone() {
  const dropZoneRef = useRef<HTMLDivElement>(null)

  useDropZone({
    id: 'timeline-drop',
    accepts: ['media', 'effect', 'filter', 'transition'],
    elementRef: dropZoneRef,
    onDrop: (item, event) => {
      if (item.type === 'media') {
        addMediaToTimeline(item.data, event.clientX)
      }
    },
    onDragEnter: (item) => {
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

```typescript
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

```typescript
import { getDragDropManager } from '@/features/drag-drop'

const manager = getDragDropManager()

// Listen to drag events
manager.on('dragStart', (state) => {
  console.log('Drag started:', state)
})

manager.on('dragEnd', () => {
  console.log('Drag ended')
})
```

## Integration

- **Depends on**:
  - `events` (Node.js EventEmitter) - Event coordination
  - `react` - Hook implementations
  - HTML5 Drag & Drop API - Native browser support

- **Used by**:
  - `@/features/browser` - Drag media files to timeline
  - `@/features/effects` - Drag effects to clips
  - `@/features/filters` - Drag filters to clips
  - `@/features/transitions` - Drag transitions between clips
  - `@/features/templates` - Drag templates to timeline
  - `@/features/style-templates` - Drag style templates
  - `@/features/timeline` - Drop target for all items

## Testing

Run tests:
```bash
# All drag-drop tests
bun run test src/features/drag-drop

# Specific test file
bun run test src/features/drag-drop/hooks/__tests__/use-drag-drop.test.ts
```

### Test Coverage

**use-drag-drop.test.ts**:
- ✓ useDraggable hook creates drag handlers
- ✓ useDraggable calls startDrag when drag starts
- ✓ useDraggable passes correct item data and preview
- ✓ useDropZone hook registers drop target
- ✓ useDropZone accepts specified draggable types
- ✓ useDropZone calls callbacks on drag events
- ✓ useDropZone validates draggable types
- ✓ useDragDropState provides current drag state
- ✓ useDragDropState updates on drag events

**drag-drop-manager.test.ts**:
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

**Note:** 4 SSR-related tests are skipped as Timeline Studio is a Tauri desktop application, not SSR.

## Architecture

### Singleton Pattern
The `DragDropManager` uses singleton pattern to ensure only one instance manages all drag operations.

### Event Lifecycle

1. **dragStart** - User initiates drag
2. **dragOver** - Mouse moves over drop target
3. **dragEnter** - Mouse enters drop target
4. **dragLeave** - Mouse leaves drop target
5. **drop** - User releases mouse
6. **dragEnd** - Drag operation ends

### Ghost Image System
Custom drag preview created from preview data with position styling.

## Backward Compatibility

The manager supports both new unified system and legacy dataTransfer types:

```typescript
// New unified way (recommended)
event.dataTransfer.setData('application/json', JSON.stringify(item))

// Legacy compatibility (for old code)
switch (item.type) {
  case 'media':
    event.dataTransfer.setData('mediaFile', JSON.stringify(item.data))
    break
  // ... other types
}
```

## Performance

- **Singleton pattern** - Single manager instance, minimal memory overhead
- **Event delegation** - Global listeners instead of per-element listeners
- **Lazy ghost creation** - Ghost image only created when preview provided
- **Efficient target lookup** - Map-based drop target registry
- **Cleanup on unmount** - Hooks automatically unregister targets

## E2E Tests

**Location**: `e2e/tauri/features/drag-drop/`

**Status**: ⏳ Planned (0 tests implemented)

### Planned
- ⏳ Drag & drop media files to timeline
- ⏳ Drag & drop effects to clips
- ⏳ Drag & drop filters to clips
- ⏳ Drag & drop transitions between clips
- ⏳ Drag & drop templates to timeline
- ⏳ Custom ghost image during drag
- ⏳ Type validation on drop targets
- ⏳ DragEnter/DragLeave events
- ⏳ Drop callback execution
- ⏳ Multiple drop zones
- ⏳ EventEmitter for cross-module communication

## TODO / Roadmap

- [ ] Add touch device support for mobile/tablet
- [ ] Implement drag constraints to limit drag area
- [ ] Add multi-item drag (select multiple items)
- [ ] Implement snap-to-grid for timeline drops
- [ ] Add drag reordering within lists
- [ ] Support keyboard shortcuts during drag (Ctrl, Shift)
- [ ] Add analytics/telemetry for drag operations
- [ ] Complete E2E tests for all drag types
- [ ] Add visual feedback improvements
- [ ] Implement drag preview animations
- [ ] Add accessibility features (keyboard navigation)

## Best Practices

1. **Use hooks for components** - `useDraggable` and `useDropZone` for React components
2. **Specify accepted types** - Always define which types a drop zone accepts
3. **Provide preview** - Include preview image for better UX
4. **Clean up listeners** - Hooks handle this automatically
5. **Type validation** - Manager validates types before drop
6. **Error handling** - Handle edge cases in onDrop callbacks

## License

Part of Timeline Studio - see root project license.
