# Video Player

**English** | [Русский](./README.ru.md)

## Overview
Comprehensive video playback module with support for various formats, effects preview, transitions, HDR content, and full integration with Timeline Studio ecosystem using XState architecture.

## Status
- ✅ **Components**: Fully implemented (100% test coverage)
- ✅ **Hooks**: Fully implemented (100% test coverage)
- ✅ **Services**: State machine and provider ready (100% test coverage)
- ✅ **Tests**: 257 tests passing
- ✅ **Tauri Integration**: Full desktop support via convertVideoSrc
- ✅ **Backend Sync**: Real-time state synchronization

## Structure
```
video-player/
├── components/
│   ├── video-player.tsx
│   ├── player-controls.tsx
│   ├── volume-slider.tsx
│   ├── enhanced-video-player.tsx
│   ├── hdr-video-player.tsx
│   ├── effects-preview-player.tsx
│   └── video-player-with-transitions.tsx
├── hooks/
│   ├── use-fullscreen.ts
│   ├── use-player-ai-analysis.ts
│   ├── use-player-speed-ramping.ts
│   ├── use-transition-preview.ts
│   ├── use-video-element.ts
│   └── use-video-selection.ts
├── services/
│   ├── player-machine.ts
│   ├── player-provider.tsx
│   ├── frame-capture-service.ts
│   ├── codec-support.ts
│   └── hdr-support.ts
└── __tests__/
```

## Features
### ✅ Implemented
- [x] Video playback with format support via Tauri
- [x] Play/pause, seek, frame navigation
- [x] Volume control with slider
- [x] Fullscreen mode
- [x] Playback speed control (0.25x - 2x)
- [x] GPU acceleration status monitoring
- [x] AI content analysis overlay
- [x] Real-time effects preview
- [x] Transitions preview
- [x] HDR content support
- [x] Multi-format codec support
- [x] Keyboard shortcuts
- [x] Recording from camera
- [x] Grid overlay for composition

### ❌ Not Implemented
- [ ] A-B loop repeat
- [ ] Bookmarks/markers
- [ ] Subtitles support
- [ ] Histogram display
- [ ] Vectorscope
- [ ] Codec information display
- [ ] Bitrate statistics

## Usage
```typescript
import { VideoPlayer, useVideoElement } from '@/features/video-player'

function PlayerComponent() {
  const {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek
  } = useVideoElement()

  return (
    <VideoPlayer
      ref={videoRef}
      src="/path/to/video.mp4"
      onPlay={play}
      onPause={pause}
      onTimeUpdate={(time) => seek(time)}
    />
  )
}
```

## Integration
- **Depends on**: @/features/project-settings, @/features/app-state, @/lib/tauri-utils
- **Used by**: @/features/media-studio, @/features/timeline, @/features/browser, @/features/effects

## Testing
- **Total tests**: 257 tests (all passing)
- **Coverage**: 100% for all video-player files
- **Component tests**: 82 tests
- **Hook tests**: 71 tests
- **Service tests**: 104 tests

```bash
bun run test src/features/video-player
```

## TODO / Roadmap
- [ ] A-B loop feature for fragment repetition
- [ ] Enhanced navigation with bookmarks
- [ ] Subtitle support (multiple formats)
- [ ] Video analysis tools (histogram, vectorscope)
- [ ] Codec information display
- [ ] WebGL video processing enhancements
- [ ] UI customization options
- [ ] E2E tests (planned in `e2e/tauri/features/video-player/`)
