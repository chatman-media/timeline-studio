# Timeline

**English** | [Русский](./README.ru.md)

## Overview

The Timeline feature is the core editing component of Timeline Studio, providing comprehensive video timeline editing capabilities with multi-track support, clip management, and real-time synchronization with the video player.

## Status

- ✅ **Components**: Complete with modular provider architecture
- ✅ **Hooks**: 6+ hooks for tracks, clips, selection, and actions
- ✅ **Services**: XState machine with backend integration
- ✅ **Tests**: 1793 tests passing (100% success rate)

## Structure

```
timeline/
├── components/           # UI components (Timeline, Track, Clip)
│   └── README.md        # Components documentation
├── hooks/               # React hooks (useTracks, useClips, etc.)
│   └── README.md        # Hooks documentation
├── services/            # XState machines and business logic
│   ├── providers/       # Modular context providers
│   └── README.md        # Services documentation
├── types/               # TypeScript type definitions
│   └── README.md        # Types documentation
├── utils/               # Helper functions and utilities
│   └── README.md        # Utils documentation (8 utilities with keyframe support)
└── __tests__/          # Test files (1793 tests)
```

## Features

### ✅ Implemented

**Track Management:**
- [x] Create video/audio tracks (backend commands)
- [x] Delete, rename, lock/unlock tracks
- [x] Hide/show tracks (UI state)
- [x] Track components with full functionality

**Clip Operations:**
- [x] Place media files on tracks
- [x] Move clips horizontally (move commands)
- [x] Trim clip duration
- [x] Copy/paste clips (clipboard in UI machine)
- [x] Delete clips
- [x] Video, audio, and subtitle clip components

**Timeline Controls:**
- [x] Timeline scale system
- [x] Time navigation
- [x] Zoom controls
- [x] Playhead indicator
- [x] Player synchronization (timeline-player-sync service)

**Advanced Features:**
- [x] Version Control Integration - automatic snapshots
- [x] Video Fade Transitions
- [x] SLIP/SLIDE edit modes
- [x] Batch Operations
- [x] Keyframe Animation
- [x] Drag & Drop system with multi-select
- [x] Speed ramping hotkeys
- [x] Markers and JL cut hotkeys
- [x] Effects cache system (LRU cache with prefetch)

### 🚧 Partially Implemented

- [x] Timeline-player sync service for VideoPlayer synchronization
- [x] MediaFile types integrated for Browser work
- [ ] Full two-way synchronization with VideoPlayer
- [ ] Drag & Drop media from Browser to Timeline

## Usage

```typescript
import { TimelineProvider } from '@/features/timeline/services/providers/timeline-provider'
import { useTimelineProject, useTimelineSelection } from '@/features/timeline/services/providers'

function App() {
  return (
    <TimelineProvider>
      {/* Your components */}
    </TimelineProvider>
  )
}

function MyComponent() {
  const { project, updateProject } = useTimelineProject()
  const { selectedClipIds, selectClips } = useTimelineSelection()
  // ...
}
```

## Integration

- **Depends on**: `@/domains/app-state`, `@/domains/media-management`, `@/features/video-player`
- **Used by**: `@/features/media-studio`, `@/features/effects`, `@/features/transitions`
- **Integration**: Backend sync via app-state, timeline-player-sync service for playback

## Testing

- **Total tests**: 1793 tests
  - Hooks: 1200+ tests (100% coverage)
  - Components: 400+ tests (100% coverage)
  - Services: 150+ tests (100% coverage)
  - Types/Factories: 43 tests (100% coverage)

```bash
# Run all timeline tests
bun run test src/features/timeline

# Run in watch mode
bun run test:watch src/features/timeline

# Run with coverage
bun run test:coverage src/features/timeline
```

## TODO / Roadmap

### High Priority
- [ ] E2E tests for timeline operations (drag, trim, delete)
- [ ] Full two-way VideoPlayer synchronization
- [ ] Drag & Drop media from Browser to Timeline

### Medium Priority
- [ ] Advanced animation transitions
- [ ] Export and rendering system
- [ ] Timeline scrolling and fixed time scale UI

### Low Priority
- [ ] WebGL effects integration enhancements
- [ ] Performance optimization for large projects
- [ ] Context menu improvements

## Documentation

For detailed documentation, see:
- [DEV.md](DEV.md) - Technical documentation and architecture
- [components/README.md](components/README.md) - UI components documentation
- [hooks/README.md](hooks/README.md) - React hooks documentation
- [services/README.md](services/README.md) - Business logic documentation
- [utils/README.md](utils/README.md) - Utilities documentation
- [types/README.md](types/README.md) - TypeScript types documentation

---

**Version:** 1.0
**Last Updated:** 2025-11-26
