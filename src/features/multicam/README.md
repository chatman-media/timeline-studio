# Multicam

**English** | [Русский](./README.ru.md)

## Overview

Multi-camera editing system for Timeline Studio providing synchronization, switching, and editing of video from multiple cameras simultaneously with support for timecode and audio-based sync.

## Status

- ✅ **Components**: AngleViewer, SyncControls, AudioSyncDialog
- ✅ **Hooks**: useMulticam, useMulticamShortcuts, useVideoLazyLoading
- ✅ **Services**: MulticamManager, timecode sync, audio sync
- ✅ **Tests**: 16 test files with comprehensive coverage

## Structure

```
multicam/
├── components/
│   ├── angle-viewer.tsx          # Camera grid preview
│   ├── sync-controls.tsx         # Synchronization controls
│   ├── sync-info.tsx             # Sync information display
│   └── audio-sync-dialog.tsx     # Audio sync dialog
├── hooks/
│   ├── use-multicam.ts           # Main multicam hook
│   └── use-multicam-shortcuts.ts # Keyboard shortcuts (1-9)
├── services/
│   ├── multicam-manager.ts       # Global state manager
│   ├── timecode-sync.ts          # Timecode synchronization
│   └── audio-sync.ts             # Audio synchronization
├── types/
│   └── multicam.ts               # TypeScript definitions
└── __tests__/                    # Comprehensive test suite
```

## Features

### ✅ Implemented

- [x] Camera angle switching (keyboard shortcuts 1-9)
- [x] Grid preview of all camera angles
- [x] Timecode-based synchronization (SMPTE)
- [x] Audio-based synchronization with correlation algorithm
- [x] Manual offset adjustment
- [x] Automatic player switching on angle change
- [x] Linked clips system integration
- [x] Global multicam manager with event bus
- [x] Visual sync indicators on timeline
- [x] Next/previous angle navigation

### ❌ Not Implemented

- [ ] Clapperboard detection system
- [ ] Real Web Audio API integration (currently mocked)
- [ ] Project-level sync settings persistence
- [ ] Support for more than 9 cameras
- [ ] Color correction between cameras
- [ ] AI assistant for automatic best angle selection

## Usage

### Basic Setup

```typescript
import { useMulticam, AngleViewer } from '@/features/multicam'

function MulticamEditor() {
  const baseClipId = "clip-123"
  const multicam = useMulticam(baseClipId)

  return (
    <div>
      <AngleViewer
        baseClipId={baseClipId}
        onAngleClick={(angle, index) => {
          console.log(`Selected camera ${index + 1}`)
        }}
      />

      <div>
        Active camera: {multicam.activeAngle?.name}
      </div>
    </div>
  )
}
```

### Programmatic Switching

```typescript
const multicam = useMulticam(baseClipId)

// Switch to camera 2
multicam.switchToAngle(1) // 0-indexed

// Next camera
multicam.switchToNextAngle()

// Previous camera
multicam.switchToPreviousAngle()
```

### Synchronization

```typescript
// Auto-sync by timecode
multicam.autoSyncByTimecode()

// Auto-sync by audio
await multicam.autoSyncByAudio()

// Manual offset adjustment
multicam.setSyncOffset(angleIndex, offsetSeconds)

// Apply synchronization
multicam.syncAngles()
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 1-9 | Switch to camera 1-9 |

Shortcuts are automatically activated when using `useMulticam`.

## Integration

- **Depends on**: `@/features/timeline` (linked clips), `@/features/video-player`, keyboard shortcuts system
- **Used by**: Multi-camera editing workflows
- **Frontend-only**: No Tauri backend commands

## Testing

- **Total tests**: 16 test files
- **Coverage**: Components (5 files), hooks (3 files), services (4 files), utils (1 file), integration (1 file)

Test categories:
- ✓ Components: angle-viewer, camera-selector, multicam-indicator, sync-controls, audio-sync-dialog
- ✓ Hooks: use-multicam, use-multicam-shortcuts, use-video-lazy-loading
- ✓ Services: multicam-manager, audio-sync, timecode-sync
- ✓ Utils: simple-event-bus
- ✓ Integration: multicam-editing

Run tests:
```bash
bun run test src/features/multicam
```

## Synchronization Methods

### Timecode Sync
- Extracts timecode from video metadata (SMPTE)
- Supports standard (HH:MM:SS:FF) and drop frame (HH:MM:SS;FF)
- Automatic alignment of clips

### Audio Sync
- Analyzes audio tracks for matching segments
- Correlation algorithm for signal matching
- Visual process feedback
- Sync quality assessment

### Manual Sync
- Precise offset adjustment via sliders
- Per-camera offset control

## TODO / Roadmap

- [ ] Implement clapperboard detection system
- [ ] Integrate real Web Audio API (replace mock)
- [ ] Add project-level sync settings persistence
- [ ] Support for more than 9 cameras
- [ ] Implement color correction matching between cameras
- [ ] Create AI assistant for automatic best angle selection
- [ ] Add waveform visualization for audio sync
- [ ] Implement multi-track audio mixing
