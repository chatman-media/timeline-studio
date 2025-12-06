# Media Management Domain

Управление медиафайлами, импорт, метаданные и операции с файлами в Timeline Studio.

## Architecture Overview

Домен построен на архитектурном паттерне **Orchestrator** для координации сложных операций с медиа:

```
React Components
      ↓
useMediaManagement()
      ↓
MediaManagementOrchestrator (613 lines)
      ↓
├─→ State Machines (2)
│   ├─ fileOperationsMachine
│   └─ mediaImportMachine
│
├─→ Domain Services (12)
│   ├─ MediaMetadataService
│   ├─ CameraImportService
│   ├─ ProxyGeneratorService
│   ├─ WaveformGeneratorService
│   ├─ SmartOrganizationService
│   ├─ ErrorTrackerService
│   ├─ IndexedDBCacheService
│   ├─ FileSystemService
│   ├─ MediaPreviewService
│   └─ MediaProcessorService
│
└─→ BackendSync Integration
    └─ Event-driven synchronization with Rust backend
```

## Quick Start

```typescript
import {
  MediaManagementProvider,
  useMediaManagement,
  getMediaManagementOrchestrator
} from "@/domains/media-management"

// Провайдер в корне приложения
function App() {
  return (
    <MediaManagementProvider>
      <YourApp />
    </MediaManagementProvider>
  )
}

// Использование через хук (рекомендуется)
function MediaBrowser() {
  const {
    mediaPool,
    isLoading,
    importFiles,
    selectMediaFiles
  } = useMediaManagement()

  const handleImport = async () => {
    const files = await selectMediaFiles()
    if (files) {
      await importFiles(files, { copyToProject: true })
    }
  }

  return (
    <div>
      <button onClick={handleImport} disabled={isLoading}>
        Import Files
      </button>
      <p>Files in library: {mediaPool.size}</p>
    </div>
  )
}

// Прямое использование оркестратора (для специфичных случаев)
function DirectOrchestratorUsage() {
  const orchestrator = getMediaManagementOrchestrator()

  const handleAdvancedImport = async () => {
    // Импорт с прокси и waveform
    const files = await orchestrator.selectMediaFiles()
    if (files) {
      await orchestrator.importFiles(files, {
        createProxies: true,
        analyzeContent: true
      })

      // Генерация waveform для аудио
      const audioFile = files.find(f => f.endsWith('.mp3'))
      if (audioFile) {
        await orchestrator.generateWaveform(audioFile)
      }
    }
  }
}
```

## Public API

### Hooks
| Hook | Purpose |
|------|---------|
| `useMediaManagement()` | Main hook for media operations |
| `useMediaImport()` | Media import workflow |
| `useFileOperations()` | File copy/move/delete |
| `useMediaMetadata()` | Metadata extraction |

### Provider
| Provider | Purpose |
|----------|---------|
| `MediaManagementProvider` | Event-driven provider with BackendSync |

### State Machines
| Export | Purpose |
|--------|---------|
| `fileOperationsMachine` | File operations state machine |
| `mediaImportMachine` | Media import state machine |

### Orchestrator
| Export | Purpose |
|--------|---------|
| `getMediaManagementOrchestrator()` | Get singleton orchestrator instance |
| `resetMediaManagementOrchestrator()` | Reset orchestrator (for tests) |

### Services
| Service | Purpose |
|---------|---------|
| `MediaMetadataService` | Extract and manage metadata |
| `CameraImportService` | Import from cameras/devices |
| `ProxyGeneratorService` | Generate proxy files |
| `SmartOrganizationService` | Smart file organization |
| `WaveformGeneratorService` | Audio waveform generation |
| `ErrorTrackerService` | Error tracking & recovery |
| `IndexedDBCacheService` | Browser cache for previews |
| `FileSystemService` | File system operations |
| `MediaPreviewService` | Preview and thumbnail generation |
| `MediaProcessorService` | Media file processing |

## Key Features

- **Orchestrator Pattern** - Coordinated management of state machines and services
- **Event-Driven** - Sync via backend events through BackendSync
- **MediaPool** - Map<string, MediaInfo> for all media
- **File Operations** - Copy, move, delete, rename with progress tracking
- **Proxy Generation** - Create optimized editing proxies
- **Smart Organization** - Organize by date, camera, events
- **Waveform Generation** - Audio visualization with Peaks.js
- **Error Recovery** - Exponential backoff retry with recovery strategies
- **Cache Management** - IndexedDB cache with statistics

## Supported Formats

| Type | Formats |
|------|---------|
| Video | `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.mxf` |
| Audio | `.mp3`, `.wav`, `.aiff`, `.flac`, `.ogg`, `.m4a` |
| Image | `.jpg`, `.png`, `.gif`, `.webp`, `.tiff`, `.heic` |

## Dependencies

**Internal:**
- `@/domains/project-management` - AppCommands
- `@/domains/project-management/services/backend-sync` - BackendSync
- `@/lib/tauri-logger` - Logging

**External:**
- `xstate` v5 - State machines
- `peaks.js` - Audio waveform

## Testing

```bash
bun run test src/domains/media-management/__tests__/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Full API description |
| [Architecture](./docs/ARCHITECTURE.md) | Architecture and diagrams |
| [Changelog](./docs/CHANGELOG.md) | History of changes |
| [MediaPool Guide](./MEDIAPOOL-QUICK-GUIDE.md) | 5-minute guide |
| [MediaPool Architecture](./MEDIAPOOL-ARCHITECTURE.md) | Detailed event-driven system |
