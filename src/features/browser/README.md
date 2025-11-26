# Browser Module - Media and Resources Browser

**Languages:** [English](./README.md) | [Русский](./README.ru.md)

## Overview

The Browser module provides a tabbed interface for browsing and managing different types of media files and resources in Timeline Studio. It serves as the main entry point for importing and organizing project assets.

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `get_media_files` | `{ directory: string }` | Get list of media files in a directory (used for directory import) |

**Note:** The Browser module also relies on shared media commands from `/src/features/media/`:
- `import_media` - Import media files into the project
- `add_imported_media` - Add imported media to media pool
- `get_media_metadata` - Get metadata for media files (duration, resolution, etc.)
- `clear_imported_media` - Clear imported media from backend state

These commands are used through the `use-music-import.ts` hook for Music tab functionality.

## Features

### Tab System
- **Media** - Video and image files
- **Music** - Audio files and music
- **Transitions** - Transitions between clips
- **Effects** - Video effects
- **Subtitles** - Subtitles and text
- **Filters** - Image filters
- **Templates** - Project templates
- **Style Templates** - Intro/outro and title templates

### Media Browser
- Import media files via button or drag & drop
- Preview thumbnails with playback capability
- File metadata (resolution, duration, format)
- Date-based grouping
- Search and filtering
- Favorite files (star)
- Status bar with information
- Add to resources panel button (plus)
- Load to player for preview button (arrow)

### Integration
- Drag & drop to Timeline - fully functional
- "Apply" button for loading into VideoPlayer
- Add to resources panel for Timeline and AI integration
- Seamless integration with project settings via providers

## Architecture

### Components
- `browser.tsx` - Root component with tab management
- `browser-tabs.tsx` - Tab navigation
- `browser-content.tsx` - Content display for each tab
- `layout/` - Layout components (buttons, status bar)
- `preview/` - Preview components (audio, video, image)

### State Management
- `browser-state-machine.ts` - XState machine for browser state
- `browser-state-provider.tsx` - React context provider
- `use-browser-state.ts` - Hook for accessing browser state

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

## Testing

- **Total tests**: 535 tests (534 passing, 1 skipped)
- **Component coverage**: 71.73% statements
- **Service coverage**: 100% statements
- **Layout coverage**: 86.1% statements
- **Preview coverage**: 74.54% statements

### Test Behavior (from test suites)

#### resource-loaders.test.ts (Lazy Loading)
**loadEffectsLazy:**
- ✓ Should successfully load effects
- ✓ Should handle string functions in effects
- ✓ Should handle loading errors

**loadFiltersLazy:**
- ✓ Should successfully load filters

**loadTransitionsLazy:**
- ✓ Should successfully load transitions
- ✓ Should handle string functions in transitions

**loadAllResourcesLazy:**
- ✓ Should load all resource types
- ✓ Should handle cancellation
- ✓ Should handle errors from individual loaders

**loadResourcesByCategory:**
- ✓ Should load resources for specific category
- ✓ Should return empty array for non-existent category
- ✓ Should handle cancellation
- ✓ Should handle unknown resource type

**loadResourcesInChunks:**
- ✓ Should load resources in chunks
- ✓ Should handle loading errors
- ✓ Should handle cancellation during chunking

#### use-music-import.test.tsx
**importFile:**
- ✓ Should successfully import audio files
- ✓ Should handle no files selected
- ✓ Should handle import errors
- ✓ Should create basic music files without metadata
- ✓ Should handle metadata loading errors gracefully

**importDirectory:**
- ✓ Should successfully import audio files from directory
- ✓ Should handle no directory selected
- ✓ Should filter only audio files from directory
- ✓ Should handle directory with no audio files
- ✓ Should handle directory import errors

**Progress Tracking:**
- ✓ Should update progress during import

**Cleanup:**
- ✓ Should clean up timeouts on unmount

**Edge Cases:**
- ✓ Should handle files with special characters
- ✓ Should handle files without extensions
- ✓ Should handle very long file paths

#### use-resources.test.tsx (Resource Hooks)
**useEffects:**
- ✓ Should load and return effects

**useFilters:**
- ✓ Should load and return filters

**useTransitions:**
- ✓ Should load and return transitions

**useResourceById:**
- ✓ Should find resource by ID
- ✓ Should return null for non-existent ID

**useResourcesSearch:**
- ✓ Should perform search by query
- ✓ Should filter by category
- ✓ Should filter by tags
- ✓ Should filter by complexity

**useResourcesByCategory:**
- ✓ Should return resources by category

**useResourcesByTags:**
- ✓ Should return resources by tags

**useResourcesByComplexity:**
- ✓ Should return resources by complexity

**useLoadingState:**
- ✓ Should return loading state

**useResourcesStats:**
- ✓ Should return resource statistics

**useResources:**
- ✓ Should load resources by type

**useResourceSources:**
- ✓ Should manage data sources

**useResourcesCache:**
- ✓ Should manage cache

**useResourcesAdapter:**
- ✓ Should provide unified adapter interface
- ✓ Should filter through adapter

**Typed Search Hooks:**
- ✓ Should perform typed search for effects
- ✓ Should perform typed search for filters
- ✓ Should perform typed search for transitions

Run tests:
```bash
bun run test src/features/browser/__tests__/
```

## Technical Details

For detailed technical documentation, see [DEV.md](./DEV.md).

## Performance

- Lazy loading of tab content
- Virtualization for large lists
- Optimized re-renders
- Efficient state management

## API

```typescript
// Browser state
interface BrowserContext {
  activeTab: BrowserTab
  selectedFiles: Map<BrowserTab, string[]>
  searchQuery: string
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  groupBy: 'none' | 'date' | 'type' | 'folder'
}

// Browser hook
const { activeTab, switchTab, selectedFiles } = useBrowserState()
```

## 🎭 E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/browser/`

### Чеклист тестов

| Тест | Приоритет | Статус | Файл |
|------|-----------|--------|------|
| Проверка доступности Tauri команд импорта | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Tauri backend (core, dialog, fs) | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Команда `import_media` | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Команда `add_imported_media` | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Команда `get_media_metadata` | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Навигация на вкладку Media | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Отображение browser panel | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Чтение директории test-data | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Обработка кириллических имен файлов | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Кнопка импорта в UI | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Drag-and-drop зона | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Отображение media items | 🔴 High | ✅ Ready | `media-import.spec.ts` |
| Video playback preview | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Команда `get_project_state` (media pool) | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Подписка на backend events | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Команда `clear_imported_media` | 🟡 Medium | ✅ Ready | `media-import.spec.ts` |
| Переключение между вкладками (Effects, Filters, etc.) | 🟡 Medium | ⏳ Planned | - |
| Поиск и фильтрация медиа | 🟡 Medium | ⏳ Planned | - |
| Сортировка по дате/имени/размеру | 🟡 Medium | ⏳ Planned | - |
| Группировка по дате/типу | 🟡 Medium | ⏳ Planned | - |
| Добавление в избранное (star) | 🟢 Low | ⏳ Planned | - |
| Добавление в resources panel | 🔴 High | ⏳ Planned | - |
| Drag & drop на Timeline | 🔴 High | ⏳ Planned | - |
| Загрузка в VideoPlayer (Apply) | 🟡 Medium | ⏳ Planned | - |
| Grid/List view переключение | 🟢 Low | ⏳ Planned | - |
| Отображение метаданных файлов | 🟡 Medium | ⏳ Planned | - |

### Примечания
- ✅ **13 тестов уже реализованы** в `media-import.spec.ts`
- Покрыт весь backend workflow для импорта медиа
- Тесты проверяют Tauri API, команды, UI интеграцию
- Требуется добавить тесты для остальных вкладок (Effects, Filters, Transitions)
- Важно протестировать drag & drop на Timeline

## License

Part of Timeline Studio - see root project license.
