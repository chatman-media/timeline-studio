# Media Management Domain - Architecture

## Overview

Домен `media-management` отвечает за импорт, организацию и обработку медиафайлов. Использует event-driven архитектуру для синхронизации с Rust backend.

## Directory Structure

```
src/domains/media-management/
├── index.ts                          # Public API exports
├── README.md                         # Overview documentation
├── docs/
│   ├── API.md                        # Full API reference
│   ├── ARCHITECTURE.md               # This file
│   └── CHANGELOG.md                  # History
├── components/
│   └── audio-waveform.tsx            # Peaks.js waveform component
├── hooks/
│   ├── index.ts                      # Hooks exports
│   ├── use-file-operations.ts        # File operations hook
│   ├── use-media-import.ts           # Media import hook
│   ├── use-media-management.ts       # Main management hook
│   ├── use-media-metadata.ts         # Metadata hook
│   └── use-peaks-waveform.ts         # Peaks.js integration
├── machines/
│   ├── file-operations-machine.ts    # File ops state machine
│   ├── media-import-machine.ts       # Import state machine
│   └── backend-event-handlers.ts     # Backend event processing
├── providers/
│   └── media-management-provider.tsx # React context provider
├── services/
│   ├── camera-import.ts              # Camera/device import
│   ├── error-tracker.ts              # Error tracking & recovery
│   ├── indexeddb-cache-service.ts    # Browser cache
│   ├── media-api.ts                  # Tauri media commands
│   ├── media-metadata-service.ts     # Metadata extraction
│   ├── media-restoration-service.ts  # Missing files restoration
│   ├── proxy-generator.ts            # Proxy file generation
│   ├── smart-organization.ts         # Smart file organization
│   └── waveform-generator.ts         # Audio waveform generation
├── tauri/
│   ├── commands.ts                   # Tauri command wrappers
│   └── events.ts                     # Tauri event types
├── types/
│   ├── index.ts                      # Domain types
│   └── peaks-waveform.ts             # Peaks.js types
├── __tests__/
└── __mocks__/
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
│         (MediaBrowser, ImportDialog, MediaGrid, etc.)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       useMediaManagement()                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 MediaManagementContext                   │   │
│  │  • mediaPool: Map<string, MediaInfo>                     │   │
│  │  • fileOperationsState                                   │   │
│  │  • mediaImportState                                      │   │
│  │  • importFiles(), selectMediaFiles(), etc.               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MediaManagementProvider                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Event Subscriptions                   │   │
│  │  • backendSync.onStateChange() - Initial sync            │   │
│  │  • backendSync.onEvent() - Incremental updates           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │   │                                 │
│              ┌─────────────┘   └─────────────┐                  │
│              ▼                               ▼                   │
│    ┌────────────────────┐        ┌────────────────────┐        │
│    │  Backend Events    │        │   User Actions     │        │
│    │  MediaAdded        │        │  importFiles()     │        │
│    │  MediaUpdated      │        │  selectMediaFiles()│        │
│    │  MediaRemoved      │        │  extractMetadata() │        │
│    └────────────────────┘        └────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │CameraImport  │ │ProxyGenerator│ │SmartOrganize │            │
│  │Service       │ │Service       │ │Service       │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │Waveform      │ │ErrorTracker  │ │IndexedDBCache│            │
│  │Generator     │ │Service       │ │Service       │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tauri Commands (IPC Bridge)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  import_media_files(), extract_media_metadata()          │   │
│  │  copy_media_to_project(), create_proxy_files()           │   │
│  │  detect_video_scenes(), generate_audio_waveform()        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend (Tauri)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      MediaPool                           │   │
│  │  • items: HashMap<String, MediaItem>                     │   │
│  │  + FFmpeg integration for metadata                       │   │
│  │  + File system operations                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## State Machine: fileOperationsMachine

```
              ┌───────────┐
              │   idle    │◄─────────────────────────────┐
              └─────┬─────┘                              │
                    │                                    │
                    │ START_OPERATION                    │
                    ▼                                    │
       ┌────────────────────────┐                       │
       │   Global Event Handler │                       │
       │  • UPDATE_PROGRESS     │                       │
       │  • COMPLETE_OPERATION  │──────────────────────►│
       │  • FAIL_OPERATION      │                       │
       │  • CANCEL_OPERATION    │                       │
       │  • CLEAR_COMPLETED     │                       │
       │  • RETRY_FAILED        │                       │
       └────────────────────────┘                       │
                                                        │
           Emits external events:                       │
           • file.operation.started                     │
           • file.operation.completed                   │
           • file.operation.failed ─────────────────────┘
```

## Event-Driven Flow

### 1. Media Import Flow

```
User selects files
    │
    ▼
useMediaManagement().importFiles(files, options)
    │
    ├──► Set loading state
    │    setIsLoading(true)
    │
    ├──► For each file:
    │    │
    │    ├──► Determine media type (Video/Audio/Image)
    │    │
    │    └──► backendSync.executeCommand(AppCommands.addMedia())
    │
    ▼
Backend processes AddMedia command
    │
    ├──► Validate file
    ├──► Extract metadata (FFmpeg)
    ├──► Generate thumbnail
    ├──► Add to MediaPool
    │
    └──► Emit MediaAdded event
         │
         ▼
BackendSync.onEvent() receives MediaAdded
    │
    ▼
handleMediaBackendEvent() processes event
    │
    ├──► Update mediaPool Map
    ├──► Update fileOperations
    │
    └──► React components re-render
```

### 2. Backend Event Processing

```
Rust Backend emits ProjectEvent (type: "Media")
    │
    ▼
BackendSync.onEvent() receives event
    │
    ▼
MediaManagementProvider callback
    │
    ├──► setMediaPool with functional update
    │    │
    │    └──► handleMediaBackendEvent(context, event)
    │         │
    │         ├──► MediaAdded: Add to pool
    │         ├──► MediaUpdated: Update in pool
    │         └──► MediaRemoved: Remove from pool
    │
    └──► Update fileOperations state
```

### 3. Initial State Sync

```
MediaManagementProvider mounts
    │
    ├──► restorePreviewCache()
    │    (Restore thumbnails from disk)
    │
    ├──► backendSync.onStateChange() subscription
    │    │
    │    ├──► Load from project.media_pool.items
    │    └──► Load from imported_media
    │
    └──► Initialize mediaPool Map
```

## Services Architecture

### Singleton Services

```
┌─────────────────────────────────────────────────────────────────┐
│                     Service Singletons                           │
│                                                                  │
│  getCameraImport()      → CameraImportService (singleton)       │
│  getProxyGenerator()    → ProxyGeneratorService (singleton)     │
│  getSmartOrganization() → SmartOrganizationService (singleton)  │
│  getWaveformGenerator() → WaveformGeneratorService (singleton)  │
│  getErrorTracker()      → ErrorTrackerService (singleton)       │
│  getMediaMetadataService() → MediaMetadataService (singleton)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### IndexedDB Cache Structure

```
IndexedDB: "timeline-studio-cache"
    │
    ├── Store: "previews"
    │   └── { mediaId, data: Blob, timestamp }
    │
    ├── Store: "frames"
    │   └── { mediaId, frames: Blob[], fps }
    │
    ├── Store: "recognition"
    │   └── { mediaId, results }
    │
    └── Store: "subtitles"
        └── { mediaId, subtitles }
```

## Key Design Decisions

### 1. Event-Driven Architecture

**Decision:** Use backend events for state synchronization.

**Rationale:**
- Incremental updates (not full state reload)
- Real-time sync across components
- Backend as single source of truth
- Reduced network overhead

### 2. MediaPool as Map<string, MediaInfo>

**Decision:** Store media items in a Map keyed by media ID.

**Rationale:**
- O(1) lookup by ID
- Easy iteration with entries()
- Consistent with backend HashMap structure
- Simple add/update/remove operations

### 3. Service Singletons

**Decision:** Use singleton pattern for services.

**Rationale:**
- Single instance per service type
- Shared state (caches, connections)
- Lazy initialization
- Memory efficiency

### 4. IndexedDB for Caching

**Decision:** Cache previews and analysis results in IndexedDB.

**Rationale:**
- Persistent across sessions
- Large storage capacity
- Async API doesn't block UI
- Browser-native solution

### 5. Error Tracking with Exponential Backoff

**Decision:** Implement retry logic with exponential backoff.

**Rationale:**
- Handles transient failures
- Prevents overwhelming backend
- Configurable retry limits
- Recovery strategies per error type

## Dependencies

### Internal Dependencies

```
media-management
    │
    ├── @/domains/project-management
    │   └── AppCommands for media operations
    │
    ├── @/features/app-state/services/backend-sync
    │   └── BackendSync for event subscription
    │
    ├── @/types/generated/state-types-extensions
    │   └── ProjectEvent types
    │
    └── @/lib/tauri-logger
        └── Logging
```

### External Dependencies

- `xstate` (v5) - State machines
- `peaks.js` - Audio waveform rendering
- `idb` - IndexedDB wrapper

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/media-management/__tests__/
```

**Coverage:**
- `use-file-operations.test.tsx` - File operations hook
- `use-media-import.test.tsx` - Media import hook
- `use-media-metadata.test.tsx` - Metadata hook
- `file-operations-machine.test.ts` - File ops state machine
- `media-import-machine.test.ts` - Import state machine
- `media-management-provider.test.tsx` - Provider tests
- `media-metadata-service.test.ts` - Metadata service

### Mock Data

Located in `__mocks__/`:
- `file-operations.ts` - Mock file operations
- `media-metadata.ts` - Mock metadata service
- `index.ts` - Combined mocks

## Performance Considerations

### Optimizations

1. **Functional State Updates** - `setMediaPool(current => ...)` for correct state
2. **Single Backend Subscription** - Only backendSync in useEffect deps
3. **IndexedDB Caching** - Persistent preview cache
4. **Lazy Service Init** - Services created on first use
5. **Incremental Updates** - Only changed data is processed

### Large Media Libraries

For projects with 1000+ files:
- Pagination in backend queries
- Virtual scrolling in UI
- Background thumbnail generation
- Progressive loading
