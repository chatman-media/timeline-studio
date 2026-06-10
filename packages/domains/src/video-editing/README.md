# Video Editing Domain

Центральный домен видеоредактирования: таймлайн, воспроизведение, эффекты, импорт/экспорт в Timeline Studio.

## Quick Start

```typescript
import {
  useTimeline,
  usePlayer,
  TimelineProvider,
  getVideoEditingOrchestrator
} from "@/domains/video-editing"

// Провайдер в корне приложения
function App() {
  return (
    <TimelineProvider>
      <VideoEditor />
    </TimelineProvider>
  )
}

// Использование в компоненте
function VideoEditor() {
  const { addClip, trimClip, splitClip, selectedClipIds } = useTimeline()
  const { play, pause, seek, isPlaying } = usePlayer()

  const handleAddMedia = (trackId: string, media: MediaFile) => {
    addClip(trackId, media, currentTime)
  }
}
```

## Public API

### Hooks
| Hook | Purpose |
|------|---------|
| `useTimeline()` | Timeline state and clip operations |
| `usePlayer()` | Video playback control |
| `useUndoRedo()` | Undo/redo operations |
| `useVideoEditing()` | Combined editing context |

### Providers
| Provider | Purpose |
|----------|---------|
| `TimelineProvider` | Main timeline context |
| `TimelineClipsProvider` | Clip management |
| `TimelineTracksProvider` | Track management |
| `TimelinePlaybackProvider` | Playback control |
| `TimelineSelectionProvider` | Selection state |
| `UndoRedoProvider` | Undo/redo context |

### State Machines
| Export | Purpose |
|--------|---------|
| `timelineMachine` | Timeline UI state |
| `timelineExtendedMachine` | Extended timeline logic |
| `playerMachine` | Player state machine |

### Orchestrator
| Export | Purpose |
|--------|---------|
| `getVideoEditingOrchestrator()` | Get singleton instance |
| `getTimelineActor()` | Get timeline actor |
| `getPlayerActor()` | Get player actor |

### Services
| Service | Purpose |
|---------|---------|
| `AAFExporter` / `AAFImporter` | Avid AAF format |
| `FCPXMLExporter` / `FCPXMLImporter` | Final Cut Pro XML |
| `EDLExporter` / `EDLImporter` | Edit Decision List |
| `UndoRedoService` | Undo/redo stack |

### Domain Services
| Service | Purpose |
|---------|---------|
| `videoCompilerCacheService` | Cache statistics and management |
| `videoCompilerRenderService` | Render job orchestration |
| `videoCompilerSystemService` | GPU and system capabilities |

## Key Features

- **Timeline Management** - Tracks, clips, sections, markers
- **Video Playback** - Play, pause, seek, speed control
- **Clip Operations** - Add, move, trim, split, copy/paste
- **Effects & Filters** - Apply and manage video effects
- **Undo/Redo** - Full action history
- **Professional Import/Export** - AAF, FCPXML, EDL formats
- **Backend Sync** - Real-time Tauri backend synchronization

## Import/Export Formats

| Format | Import | Export | NLE |
|--------|--------|--------|-----|
| AAF | ✅ | ✅ | Avid Media Composer |
| FCPXML | ✅ | ✅ | Final Cut Pro |
| EDL | ✅ | ✅ | Universal |

## Dependencies

**Internal:**
- `@/domains/shared` - Events, types, utilities
- `@/domains/project-management` - Project settings
- `@/domains/project-management` - BackendSync service

**External:**
- `xstate` v5 - State machines
- `@tauri-apps/api` - Tauri IPC

**Used by:**
- `@/features/timeline` - Timeline UI
- `@/features/video-player` - Player components
- `@/features/effects` - Effects panel
- `@/features/media-studio` - Main workspace

## Testing

```bash
bun run test src/domains/video-editing/__tests__/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Full API description |
| [Architecture](./docs/ARCHITECTURE.md) | Architecture and diagrams |
| [Changelog](./docs/CHANGELOG.md) | History of changes |
