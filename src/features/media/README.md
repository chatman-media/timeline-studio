# Media

**English** | [Русский](./README.ru.md)

## Overview

Comprehensive media management module for Timeline Studio. Handles media file import, preview generation, metadata extraction, caching, and video streaming.

## Status

- ✅ **Components**: MediaContent, file selection, drag-and-drop
- ✅ **Hooks**: useMediaImport, useMediaProcessor, useMediaPreview, useFramePreview, useVideoStreaming, useCacheStatistics, useMediaRestoration
- ✅ **Services**: IndexedDBCacheService, MediaRestorationService, VideoStreamingService
- ✅ **Tests**: 87% coverage (~150+ tests)

## Structure

```
media/
├── components/    # UI components
├── hooks/         # React hooks
├── services/      # Business logic
├── types/         # TypeScript types
├── utils/         # Helper functions
└── __tests__/     # Test files
```

## Features

### ✅ Implemented

- [x] File import (drag-and-drop, file/folder selection, batch processing)
- [x] Metadata extraction via FFmpeg (duration, resolution, codecs)
- [x] Preview generation (thumbnails, timeline frames, multiple sizes)
- [x] Video streaming via local server
- [x] File restoration (automatic recovery of missing files)
- [x] IndexedDB caching (preview, timeline frames, recognition, subtitles)
- [x] Cache statistics and management
- [x] Audio track extraction from video
- [x] TypeScript strict mode with comprehensive types

### ❌ Not Implemented

- [ ] Cloud storage integration
- [ ] Advanced video analysis (scene detection, quality metrics)
- [ ] Batch metadata editing
- [ ] Smart preview caching strategies
- [ ] Media library organization (tags, collections)

## Usage

### Basic Media Import

```typescript
import { MediaContent } from '@/features/media/components/media-content'
import { useMediaImport } from '@/features/media/hooks'

function MyMediaBrowser() {
  const { importFiles, isImporting } = useMediaImport()

  return (
    <MediaContent
      onImport={importFiles}
      isLoading={isImporting}
    />
  )
}
```

### Available Hooks

```typescript
import {
  useMediaImport,      // Import files/folders
  useMediaProcessor,   // Extract metadata
  useMediaPreview,     // Generate thumbnails
  useFramePreview,     // Timeline frames
  useVideoStreaming,   // Video server integration
  useCacheStatistics,  // Cache management
  useMediaRestoration  // Restore missing files
} from '@/features/media/hooks'
```

### Cache Management

```typescript
import { IndexedDBCacheService } from '@/features/media/services'

const cache = IndexedDBCacheService.getInstance()

// Cache preview
await cache.cachePreview(fileId, previewData, 24 * 60 * 60 * 1000) // 24h

// Get cached data
const preview = await cache.getPreview(fileId)

// Clear cache
await cache.clearAllCache()

// Get statistics
const stats = await cache.getCacheStatistics()
console.log(`Total size: ${stats.totalSize} bytes`)
```

## Integration

- **Depends on**:
  - `@tauri-apps/api` - File system and media commands
  - `@/domains/browser` - Browser state management
  - `idb` - IndexedDB wrapper for caching
  - FFmpeg (backend) - Metadata extraction

- **Used by**:
  - `@/features/browser` - Media file browsing and selection
  - `@/features/timeline` - Timeline clips and media references
  - `@/features/video-player` - Video streaming integration
  - `@/domains/project` - Project media restoration
  - `@/features/recognition` - Media analysis and caching

## Testing

- **Total tests**: 150+ tests
- **Coverage**: ~87% statements, 90% branches (services), 84% branches (hooks)
- **Test categories**:
  - Hooks (use-media-import, use-media-processor, use-file-selection)
  - Services (indexeddb-cache-service, media-restoration-service)
  - Utils (tracks-utils, audio-tracks, preview-sizes)

```bash
# Run all tests
bun test src/features/media/__tests__/

# Run with coverage
bun test:coverage -- src/features/media/

# Run specific test file
bun test src/features/media/__tests__/hooks/use-media-import.test.tsx
```

## Tauri Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `get_media_metadata` | `{ filePath: string }` | Extract video/audio metadata via FFmpeg |
| `get_media_files` | `{ directoryPath: string }` | Get list of media files in directory |
| `cancel_media_processing` | - | Cancel ongoing media processing |
| `clear_media_preview_data` | `{ fileId: string }` | Clear cached preview data for file |
| `save_preview_data` | `{ path: string }` | Save preview cache to disk |
| `load_preview_data` | `{ path: string }` | Load preview cache from disk |
| `save_timeline_frames` | `{ fileId: string, frames: Frame[] }` | Save timeline preview frames |

Plus `@tauri-apps/plugin-dialog` (open) for file/folder selection dialogs.

## Key Services

### IndexedDBCacheService
- Singleton pattern for cache management
- Multiple cache types (preview, timeline, recognition, subtitles)
- Automatic expiration and cleanup
- Size-based cache limits
- Statistics and monitoring

### MediaRestorationService
- Restore missing files by original path
- Search by relative path
- Search in alternative locations
- Generate restoration report
- Manual file selection via Tauri dialog

### VideoStreamingService
- Local HTTP server for video playback
- Frame-accurate seeking
- Integration with video player

## TODO / Roadmap

- [ ] **Cloud Integration** - Support for cloud storage providers (S3, Google Drive, Dropbox)
- [ ] **Advanced Analysis** - Scene detection, quality metrics, duplicate detection
- [ ] **Batch Editing** - Edit metadata for multiple files at once
- [ ] **Smart Caching** - Predictive cache preloading based on usage patterns
- [ ] **Library Organization** - Tags, collections, smart folders
- [ ] **E2E Tests** - Complete E2E test coverage
  - File/folder selection dialogs
  - Metadata extraction for video/audio/image
  - Preview generation workflow
  - IndexedDB caching operations
  - File restoration flow
  - Drag-and-drop import
  - Video streaming integration
