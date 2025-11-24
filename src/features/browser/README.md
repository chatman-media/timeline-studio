# Browser Module - Media and Resources Browser

**Languages:** [English](./README.md) | [Русский](./README.ru.md)

## Overview

The Browser module provides a tabbed interface for browsing and managing different types of media files and resources in Timeline Studio. It serves as the main entry point for importing and organizing project assets.

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

## License

Part of Timeline Studio - see root project license.
