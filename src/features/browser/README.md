# Browser

**English** | [Русский](./README.ru.md)

## Overview

The Browser module provides a tabbed interface for browsing and managing different types of media files and resources in Timeline Studio. It serves as the main entry point for importing and organizing project assets.

## Status

**🎉 100% Complete** - All core functionality is fully implemented and tested.

- ✅ **Components**: Full tab system with Media, Music, Transitions, Effects, Subtitles, Filters, Templates, Style Templates (8 tabs active)
- ✅ **Hooks**: Music import, resources management, search, filtering, favorites
- ✅ **Services**: Browser state machine (XState), resource loaders with lazy loading
- ✅ **Tests**: 535 tests passing (534 + 1 skipped), 71.73% coverage

## Structure

```
browser/
├── components/
│   ├── browser.tsx                        # Root component with tab management
│   ├── browser-tabs.tsx                   # Tab navigation
│   ├── browser-content.tsx                # Content display for each tab
│   ├── layout/                            # Layout components
│   │   ├── status-bar.tsx                 # Status bar with bulk operations
│   │   ├── media-status-bar-wrapper.tsx   # StatusBar wrapper for media tab
│   │   ├── favorite-button.tsx            # Favorite toggle button
│   │   └── add-media-button.tsx           # Add to resources button
│   └── preview/                           # Preview components (audio, video, image)
├── hooks/
│   ├── use-browser-state.ts               # Hook for accessing browser state
│   ├── use-music-import.ts                # Music import functionality
│   ├── use-bulk-media-actions.ts          # Bulk operations for media files
│   └── use-resources.ts                   # Resource management hooks
├── services/
│   ├── browser-state-machine.ts           # XState machine for browser state
│   └── resource-loaders.ts                # Lazy loading for resources
└── __tests__/                             # Test files
```

## Features

### ✅ Implemented

- [x] **Tab System**: Media, Music, Transitions, Effects, Subtitles, Filters, Templates, Style Templates
- [x] **Media Import**: File and directory import via button or drag & drop
- [x] **Preview**: Thumbnails with playback capability for video/audio
- [x] **Metadata**: Resolution, duration, format information
- [x] **Organization**: Date-based grouping, search, filtering, favorites
- [x] **Integration**: Drag & drop to Timeline, load to VideoPlayer, add to resources panel
- [x] **Resource Loading**: Lazy loading with chunks, cancellation support
- [x] **State Management**: XState machine for complex state coordination
- [x] **Bulk Operations**: Add all video, add all audio, add by date, add all files to resources
- [x] **Status Bar**: Quick bulk operations for media tab with counts and date grouping

### 🚀 Future Improvements

Core functionality is complete. These are optional enhancements for future iterations:

- [ ] Bulk delete operations (select multiple, delete all)
- [ ] Custom tags and categories
- [ ] Advanced filtering by metadata
- [ ] Resource versioning
- [ ] Projects tab (template-based project creation)
- [ ] Scenarios tab (smart montage integration)

## Usage

```typescript
import { Browser } from '@/features/browser'

function MediaStudio() {
  return (
    <div>
      <Browser />
    </div>
  )
}
```

### Using Browser State Hook

```typescript
import { useBrowserState } from '@/features/browser'

function MyComponent() {
  const { activeTab, switchTab, selectedFiles } = useBrowserState()

  return (
    <div>
      <button onClick={() => switchTab('media')}>
        Switch to Media
      </button>
    </div>
  )
}
```

### Music Import Hook

```typescript
import { useMusicImport } from '@/features/browser'

function MusicTab() {
  const { importFile, importDirectory, isImporting, progress } = useMusicImport()

  return (
    <div>
      <button onClick={importFile}>Import File</button>
      <button onClick={importDirectory}>Import Directory</button>
      {isImporting && <progress value={progress} max={100} />}
    </div>
  )
}
```

### Bulk Media Operations Hook

```typescript
import { useBulkMediaActions } from '@/features/browser'

function MediaActions() {
  const {
    addAllVideoFiles,
    addAllAudioFiles,
    addDateFiles,
    addAllFiles
  } = useBulkMediaActions()

  return (
    <div>
      <button onClick={() => addAllVideoFiles(allMedia)}>
        Add All Video
      </button>
      <button onClick={() => addAllAudioFiles(allMedia)}>
        Add All Audio
      </button>
      <button onClick={() => addAllFiles(allMedia)}>
        Add All Files
      </button>
    </div>
  )
}
```

## Integration

- **Depends on**:
  - `@/domains/media-management` - Media import commands
  - `@/features/drag-drop` - Drag & drop system
  - `@/features/video-player` - Preview playback

- **Used by**:
  - `@/features/media-studio` - Main editing interface
  - `@/features/timeline` - Timeline editing

## Testing

- **Total tests**: 548 (547 passing, 1 skipped)
- **Component coverage**: 72.1%
- **Service coverage**: 100%
- **Layout coverage**: 87.5%
- **Preview coverage**: 74.54%

### Test Suites

**resource-loaders.test.ts** - Lazy loading system:
- ✓ Load effects/filters/transitions with string function handling
- ✓ Load all resources with cancellation support
- ✓ Load by category with error handling
- ✓ Chunked loading for performance

**use-music-import.test.tsx** - Music import:
- ✓ Import audio files with metadata
- ✓ Import from directory with filtering
- ✓ Progress tracking
- ✓ Error handling and edge cases

**use-resources.test.tsx** - Resource hooks:
- ✓ Load and return effects/filters/transitions
- ✓ Search with query/category/tags/complexity
- ✓ Resource statistics and caching
- ✓ Typed search for specific resource types

**status-bar.test.tsx** - Status bar with bulk operations:
- ✓ Display remaining video/audio counts
- ✓ Bulk add buttons for video and audio
- ✓ Date-based grouping and bulk add
- ✓ "Add all" button and "All files added" state
- ✓ Callback handlers for all operations

Run tests:
```bash
bun run test src/features/browser/__tests__/
```

## E2E Tests

**Location**: `e2e/tauri/features/browser/media-import.spec.ts`

**Status**: ✅ 13 tests implemented and passing

### Covered
- ✅ Tauri commands availability (`import_media`, `add_imported_media`, `get_media_metadata`)
- ✅ Media tab navigation and UI rendering
- ✅ Cyrillic filenames support
- ✅ Import button and drag-drop zone
- ✅ Media items display and video preview
- ✅ Backend events subscription
- ✅ Media pool state management

### Planned
- ⏳ Tab switching (Effects, Filters, Transitions)
- ⏳ Search and filtering
- ⏳ Sorting and grouping
- ⏳ Favorites and resources panel
- ⏳ Drag & drop to Timeline
- ⏳ Grid/List view switching

## TODO / Roadmap

- [x] ~~Implement bulk operations for media management~~ ✅ Completed
- [ ] Implement bulk delete operations (select multiple, delete all)
- [ ] Add custom tags and categories system
- [ ] Enhance metadata filtering capabilities
- [ ] Implement resource versioning
- [ ] Complete E2E tests for all browser tabs
- [ ] Add keyboard shortcuts for navigation
- [ ] Improve lazy loading performance
- [ ] Add resource preview caching

## License

Part of Timeline Studio - see root project license.
