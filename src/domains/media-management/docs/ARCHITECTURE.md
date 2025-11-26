# Media Management Domain - Architecture

## Overview

Домен `media-management` отвечает за импорт, организацию и обработку медиафайлов. Построен на архитектурном паттерне **Orchestrator** с event-driven синхронизацией через Rust backend.

### Orchestrator Pattern

`MediaManagementOrchestrator` (613 строк) - центральный координатор, который:
- Управляет 2 state machines (fileOperationsMachine, mediaImportMachine)
- Интегрирует 12 domain services
- Обеспечивает BackendSync интеграцию для синхронизации с Rust backend
- Предоставляет единый API для всех операций с медиа
- Поддерживает внутреннее состояние mediaPool (Map<string, MediaInfo>)

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
│   ├── media-management-orchestrator.ts # Main orchestrator (613 lines)
│   ├── camera-import.ts              # Camera/device import
│   ├── error-tracker.ts              # Error tracking & recovery
│   ├── file-system-service.ts        # File system operations
│   ├── indexeddb-cache-service.ts    # Browser cache
│   ├── media-api.ts                  # Tauri media commands
│   ├── media-metadata-service.ts     # Metadata extraction
│   ├── media-preview-service.ts      # Preview & thumbnail generation
│   ├── media-processor-service.ts    # Media file processing
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
│            MediaManagementOrchestrator (Singleton)               │
│                         613 lines                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Coordination Layer                      │   │
│  │  • Manages 2 State Machines                              │   │
│  │  • Integrates 12 Services                                │   │
│  │  • BackendSync Integration                               │   │
│  │  • Internal MediaPool State                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                     │
│              ┌─────────────┴─────────────┐                      │
│              ▼                           ▼                       │
│    ┌────────────────────┐      ┌────────────────────┐          │
│    │  State Machines    │      │  Domain Services   │          │
│    │                    │      │                    │          │
│    │ fileOperations     │      │ MediaMetadata      │          │
│    │ Machine            │      │ CameraImport       │          │
│    │                    │      │ ProxyGenerator     │          │
│    │ mediaImport        │      │ Waveform           │          │
│    │ Machine            │      │ SmartOrganization  │          │
│    │                    │      │ ErrorTracker       │          │
│    └────────────────────┘      │ IndexedDBCache     │          │
│                                │ FileSystem         │          │
│                                │ MediaPreview       │          │
│                                │ MediaProcessor     │          │
│                                └────────────────────┘          │
│                            │                                     │
│                            ▼                                     │
│    ┌───────────────────────────────────────────────────────┐   │
│    │          BackendSync Event Subscription               │   │
│    │  • onStateChange() - Initial load                     │   │
│    │  • onEvent() - Incremental updates                    │   │
│    │  • executeCommand() - Backend calls                   │   │
│    └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tauri Commands (IPC Bridge)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AddMedia, UpdateMedia, RemoveMedia                      │   │
│  │  file_exists, get_file_stats, search_files_by_name       │   │
│  │  generate_media_thumbnail, get_media_preview_data        │   │
│  │  scan_media_folder, process_media_files                  │   │
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
│  │  + Event emission (MediaAdded, etc.)                     │   │
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

## Orchestrator Architecture

### MediaManagementOrchestrator Flow

```
Constructor
    │
    ├──► Create State Machine Actors
    │    ├─ fileOperationsActor = createActor(fileOperationsMachine)
    │    └─ mediaImportActor = createActor(mediaImportMachine)
    │
    ├──► Initialize Services
    │    ├─ metadataService = getMediaMetadataService()
    │    ├─ cameraImportService = getCameraImport()
    │    ├─ proxyGeneratorService = getProxyGenerator()
    │    ├─ smartOrganizationService = getSmartOrganization()
    │    ├─ waveformGeneratorService = getWaveformGenerator()
    │    ├─ errorTrackerService = new ErrorTrackerService()
    │    └─ cacheService = indexedDBCacheService
    │
    ├──► Setup Synchronization
    │    ├─ Subscribe to fileOperationsActor state changes
    │    └─ Subscribe to mediaImportActor state changes
    │
    ├──► Setup BackendSync
    │    ├─ backendSync.onEvent() → handleMediaBackendEvent()
    │    └─ backendSync.onStateChange() → loadInitialState()
    │
    └──► Initialize Preview Cache
         └─ restorePreviewCache()

Public API Methods
    │
    ├──► Media Import
    │    ├─ importFiles() → mediaImportActor + backendSync.executeCommand()
    │    ├─ selectMediaFiles() → media-api.selectMediaFile()
    │    ├─ selectAudioFiles() → media-api.selectAudioFile()
    │    ├─ selectMediaDirectory() → media-api.selectMediaDirectory()
    │    ├─ getMediaInfo() → mediaPool lookup
    │    └─ extractMetadata() → metadataService + backendSync
    │
    ├──► Camera Import
    │    ├─ detectCameras() → cameraImportService.detectCameras()
    │    └─ importFromCamera() → cameraImportService.importFromCamera()
    │
    ├──► Proxy Generation
    │    ├─ generateProxy() → proxyGeneratorService.generateProxy()
    │    └─ generateProxies() → proxyGeneratorService.generateBatch()
    │
    ├──► Smart Organization
    │    ├─ organizeByDate() → smartOrganizationService.organizeByDate()
    │    └─ organizeByCamera() → smartOrganizationService.organizeByCamera()
    │
    ├──► Waveform Generation
    │    ├─ generateWaveform() → waveformGeneratorService.generateWaveform()
    │    └─ getWaveformData() → waveformGeneratorService.generateWaveform()
    │
    ├──► File Operations
    │    ├─ startFileOperation() → fileOperationsActor.send()
    │    ├─ updateOperationProgress() → fileOperationsActor.send()
    │    ├─ completeOperation() → fileOperationsActor.send()
    │    ├─ failOperation() → fileOperationsActor.send()
    │    └─ cancelOperation() → fileOperationsActor.send()
    │
    ├──► Cache Management
    │    ├─ clearCache() → cacheService.clear()
    │    └─ getCacheStatistics() → cacheService.getStatistics()
    │
    ├──► State Access
    │    ├─ getMediaPool() → return mediaPool Map
    │    ├─ getFileOperationsState() → fileOperationsActor.getSnapshot()
    │    ├─ getMediaImportState() → mediaImportActor.getSnapshot()
    │    ├─ isMediaLoading() → return isLoading
    │    └─ getError() → return error
    │
    ├──► Subscriptions
    │    ├─ subscribeToFileOperations() → fileOperationsActor.subscribe()
    │    └─ subscribeToMediaImport() → mediaImportActor.subscribe()
    │
    └──► Error Tracking
         ├─ getErrorStatistics() → errorTrackerService.getStatistics()
         └─ clearErrors() → errorTrackerService.clearErrors()
```

## Event-Driven Flow

### 1. Media Import Flow (via Orchestrator)

```
User selects files
    │
    ▼
useMediaManagement().importFiles(files, options)
    │
    ▼
MediaManagementOrchestrator.importFiles()
    │
    ├──► Set loading state (this.isLoading = true)
    │
    ├──► Send to mediaImportMachine
    │    ├─ mediaImportActor.send({ type: "ADD_FILES", files })
    │    ├─ mediaImportActor.send({ type: "UPDATE_OPTIONS", options })
    │    └─ mediaImportActor.send({ type: "START_IMPORT" })
    │
    ├──► For each file:
    │    │
    │    ├──► Determine media type (getMediaTypeFromPath)
    │    │
    │    └──► backendSync.executeCommand({ type: "AddMedia", params })
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
MediaManagementOrchestrator event handler
    │
    ├──► handleMediaBackendEvent(context, event)
    │    ├─ Extract media info from event
    │    └─ Update mediaPool Map
    │
    ├──► Update orchestrator state
    │    ├─ this.mediaPool updated
    │    ├─ this.isLoading = false
    │    └─ this.error = null
    │
    └──► React components re-render (via provider)
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

### 3. Initial State Sync (via Orchestrator)

```
MediaManagementOrchestrator constructor
    │
    ├──► Setup BackendSync subscriptions
    │    │
    │    ├──► backendSync.onEvent() → handleMediaBackendEvent()
    │    │
    │    └──► backendSync.onStateChange() → loadInitialState()
    │
    └──► Initialize preview cache
         └─ restorePreviewCache() → restore thumbnails from disk

When backend state loads:
    │
    ▼
Orchestrator.loadInitialState(state)
    │
    ├──► Create initialMediaPool Map
    │
    ├──► Load from state.project.media_pool.items
    │    └─ Convert backend MediaItem to frontend MediaInfo
    │
    ├──► Load from state.imported_media (temporary)
    │    └─ Merge into initialMediaPool
    │
    └──► Set this.mediaPool = initialMediaPool
```

## Services Architecture

### Orchestrator Integration

```
MediaManagementOrchestrator (singleton)
    │
    ├──► Internal State
    │    ├─ mediaPool: Map<string, MediaInfo>
    │    ├─ isLoading: boolean
    │    └─ error: string | null
    │
    ├──► State Machine Actors (created in constructor)
    │    ├─ fileOperationsActor
    │    └─ mediaImportActor
    │
    ├──► Service Singletons (obtained via getters)
    │    ├─ metadataService = getMediaMetadataService()
    │    ├─ cameraImportService = getCameraImport()
    │    ├─ proxyGeneratorService = getProxyGenerator()
    │    ├─ smartOrganizationService = getSmartOrganization()
    │    ├─ waveformGeneratorService = getWaveformGenerator()
    │    ├─ errorTrackerService = new ErrorTrackerService()
    │    ├─ cacheService = indexedDBCacheService
    │    ├─ fileSystemService (imported as singleton)
    │    ├─ mediaPreviewService (imported as singleton)
    │    └─ mediaProcessorService (imported as singleton)
    │
    └──► BackendSync Integration
         ├─ backendSync = getBackendSync()
         ├─ backendUnsubscribe: (() => void) | null
         └─ Event handlers for backend synchronization
```

### Service Singletons

```
┌─────────────────────────────────────────────────────────────────┐
│                     Service Singletons                           │
│                                                                  │
│  getMediaMetadataService() → MediaMetadataService (singleton)   │
│  getCameraImport()      → CameraImportService (singleton)       │
│  getProxyGenerator()    → ProxyGeneratorService (singleton)     │
│  getSmartOrganization() → SmartOrganizationService (singleton)  │
│  getWaveformGenerator() → WaveformGeneratorService (singleton)  │
│  getErrorTracker()      → ErrorTrackerService (singleton)       │
│  indexedDBCacheService  → IndexedDBCacheService (singleton)     │
│  fileSystemService      → FileSystemService (singleton)         │
│  mediaPreviewService    → MediaPreviewService (singleton)       │
│  mediaProcessorService  → MediaProcessorService (singleton)     │
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

### 1. Orchestrator Pattern

**Decision:** Use MediaManagementOrchestrator to coordinate all media operations.

**Rationale:**
- Single entry point for all media operations
- Coordinated management of state machines and services
- Clear separation between orchestration and implementation
- Simplified testing (mock orchestrator in tests)
- Centralized BackendSync integration
- Internal state management for mediaPool

**Benefits:**
- 613 lines of well-organized coordination logic
- Manages complexity of 2 machines + 12 services
- Provides clean API surface for hooks and components
- Singleton pattern ensures consistent state

### 2. Event-Driven Architecture

**Decision:** Use backend events for state synchronization through BackendSync.

**Rationale:**
- Incremental updates (not full state reload)
- Real-time sync across components
- Backend as single source of truth
- Reduced network overhead

**Implementation in Orchestrator:**
- `backendSync.onEvent()` → `handleMediaBackendEvent()`
- `backendSync.onStateChange()` → `loadInitialState()`
- `backendSync.executeCommand()` for backend operations

### 3. MediaPool as Map<string, MediaInfo>

**Decision:** Store media items in a Map keyed by media ID within orchestrator.

**Rationale:**
- O(1) lookup by ID
- Easy iteration with entries()
- Consistent with backend HashMap structure
- Simple add/update/remove operations

**Orchestrator Implementation:**
- Maintained as `this.mediaPool` in orchestrator
- Updated via `handleMediaBackendEvent()`
- Loaded via `loadInitialState()` on startup
- Exposed via `getMediaPool()` method

### 4. Service Singletons

**Decision:** Use singleton pattern for services coordinated by orchestrator.

**Rationale:**
- Single instance per service type
- Shared state (caches, connections)
- Lazy initialization
- Memory efficiency

**Orchestrator Coordination:**
- Services obtained in constructor
- Orchestrator delegates to appropriate service
- Services remain independent and testable
- Clear separation of concerns

### 5. IndexedDB for Caching

**Decision:** Cache previews and analysis results in IndexedDB via cacheService.

**Rationale:**
- Persistent across sessions
- Large storage capacity
- Async API doesn't block UI
- Browser-native solution

**Orchestrator Integration:**
- `clearCache()` → `cacheService.clear()`
- `getCacheStatistics()` → `cacheService.getStatistics()`

### 6. Error Tracking with Exponential Backoff

**Decision:** Implement retry logic with exponential backoff via ErrorTrackerService.

**Rationale:**
- Handles transient failures
- Prevents overwhelming backend
- Configurable retry limits
- Recovery strategies per error type

**Orchestrator Integration:**
- `getErrorStatistics()` → `errorTrackerService.getStatistics()`
- `clearErrors()` → `errorTrackerService.clearErrors()`
- Errors tracked during import operations

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
