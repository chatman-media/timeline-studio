# Options

**English** | [Русский](./README.ru.md)

## Overview
Unified settings panel providing comprehensive control over color grading, speed control, audio settings, and media information display.

## Status
- ✅ **Components**: All core components fully implemented
- ✅ **Hooks**: Timeline integration hooks ready
- ✅ **Tests**: 10+ tests passing (components, integration)

## Structure
```
options/
├── components/
│   ├── options.tsx              # Main tabbed interface
│   ├── audio-settings.tsx       # Professional audio controls
│   ├── speed-settings.tsx       # Speed and timing controls
│   └── info-settings.tsx        # Media information display
└── __tests__/
    └── components/              # Component tests
```

## Features
### ✅ Implemented
- [x] Tabbed interface with smart auto-switching
- [x] Audio settings (sample rate, channels, codec, effects)
- [x] Speed control (presets, ramping, reverse playback)
- [x] Media information display
- [x] Timeline integration
- [x] Color grading integration

### ❌ Not Implemented
- [ ] Settings presets and templates
- [ ] Batch operations for multiple clips
- [ ] Real-time preview integration
- [ ] Undo/redo support for settings

## Usage
```typescript
import { Options } from '@/features/options'

// Basic usage
<Options selectedMediaFile={currentMediaFile} />

// Timeline integration (automatic)
const { selectedClipIds, clips } = useTimeline()
// Options component handles Timeline state automatically
```

## Integration
- **Depends on**: @/features/timeline, @/features/color-grading
- **Used by**: @/features/media-studio
- **Timeline**: Safe integration with automatic clip detection

## Testing
- **Total tests**: 10+ tests
- **Coverage**: Components, integration, Timeline interaction

```bash
# Run all tests
bun run test src/features/options

# Run specific test
bun run test src/features/options/__tests__/components/audio-settings.test.tsx
```

## TODO / Roadmap
- [ ] Settings presets system
- [ ] Audio spectrum analysis
- [ ] Advanced color tools (histogram, vectorscope)
- [ ] Export profiles for different platforms
- [ ] Real-time preview in VideoPlayer
- [ ] Template system for consistent styling
