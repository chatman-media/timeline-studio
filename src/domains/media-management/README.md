# Media Management Domain

Управление медиафайлами, импорт, метаданные и операции с файлами в Timeline Studio.

## Quick Start

```typescript
import {
  MediaManagementProvider,
  useMediaManagement
} from "@/domains/media-management"

// Провайдер в корне приложения
function App() {
  return (
    <MediaManagementProvider>
      <YourApp />
    </MediaManagementProvider>
  )
}

// Использование в компоненте
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

### Services
| Service | Purpose |
|---------|---------|
| `CameraImportService` | Import from cameras/devices |
| `ProxyGeneratorService` | Generate proxy files |
| `SmartOrganizationService` | Smart file organization |
| `WaveformGeneratorService` | Audio waveform generation |
| `ErrorTrackerService` | Error tracking & recovery |
| `IndexedDBCacheService` | Browser cache for previews |

## Key Features

- **Event-Driven** - Sync via backend events
- **MediaPool** - Map<string, MediaInfo> for all media
- **File Operations** - Copy, move, delete, rename
- **Proxy Generation** - Create optimized editing proxies
- **Smart Organization** - Organize by date, camera, events
- **Waveform Generation** - Audio visualization with Peaks.js
- **Error Recovery** - Exponential backoff retry

## Supported Formats

| Type | Formats |
|------|---------|
| Video | `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.mxf` |
| Audio | `.mp3`, `.wav`, `.aiff`, `.flac`, `.ogg`, `.m4a` |
| Image | `.jpg`, `.png`, `.gif`, `.webp`, `.tiff`, `.heic` |

## Dependencies

**Internal:**
- `@/domains/project-management` - AppCommands
- `@/features/app-state/services/backend-sync` - BackendSync
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
