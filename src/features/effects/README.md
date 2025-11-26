# Effects

**English** | [Русский](./README.ru.md)

## Overview

Comprehensive video effects system with 39 built-in effects across 8 categories. Features WebGL2 GPU-accelerated rendering, real-time preview, interactive parameter controls, and support for user presets. Includes artistic, cinematic, technical, and creative effects with FFmpeg export integration.

## Status

- ✅ **Components**: 7 components fully implemented (EffectList, EffectPreview, EffectCategories, EffectDetail, EffectIndicators, EffectPresets, EffectParameterControls)
- ✅ **Hooks**: 8 hooks (useEffects, useEffectCategories, useUnifiedEffects, useEffectsImport, useEffectsSearch, useEffectsByCategory, useEffectById)
- ✅ **Processors**: WebGL2 GPU-accelerated rendering, CSS preview fallback
- ✅ **Tests**: 66+ tests passing (91.75% component coverage, 100% utilities)
- ✅ **Internationalization**: 15 languages with RTL support

## Structure

```
effects/
├── components/
│   ├── effect-list.tsx
│   ├── effect-preview.tsx
│   ├── effect-categories.tsx
│   ├── effect-detail.tsx
│   ├── effect-indicators.tsx
│   ├── effect-presets.tsx
│   └── effect-parameter-controls.tsx
├── hooks/
│   ├── use-effects.ts
│   ├── use-effect-categories.ts
│   ├── use-unified-effects.ts
│   └── use-effects-import.ts
├── services/
│   ├── effect-processor.ts
│   ├── webgl2-effect-processor.ts
│   └── webgl2-unified-renderer.ts
├── utils/
│   └── css-effects.ts
├── data/
│   ├── effects.json
│   └── effect-categories.json
└── __tests__/
```

## Features

### ✅ Implemented

**Effect Categories (8 categories)**
- [x] Color Correction - brightness, contrast, saturation
- [x] Artistic - creative styles and artistic effects
- [x] Vintage - retro effects, film grain
- [x] Cinematic - vignette, professional film effects
- [x] Creative - neon, glow, modern effects
- [x] Technical - sharpness, noise reduction
- [x] Motion - speed control, reverse playback
- [x] Distortions - special visual distortions

**Core Features**
- [x] 39 effects with complete metadata and FFmpeg commands
- [x] Effect presets (subtle, moderate, dramatic)
- [x] Effect tags (popular, professional, beginner-friendly)
- [x] Complexity levels (basic, intermediate, advanced)
- [x] WebGL2 GPU-accelerated rendering
- [x] CSS preview fallback
- [x] Interactive parameter controls
- [x] Real-time preview
- [x] Effects import (JSON, .cube, .lut files)
- [x] Favorite effects system
- [x] Two view modes (grid and categories)

**Integration**
- [x] Browser tabs integration
- [x] TimelineResources usage
- [x] WebGL2 preview system

### ❌ Not Implemented

- [ ] Apply effects to timeline clips
- [ ] Save custom user presets (partially ready)
- [ ] Drag & drop to Timeline
- [ ] Animated effect previews

## Usage

### Basic Usage

```typescript
import { useEffects, EffectList } from '@/features/effects'

function MyComponent() {
  const effects = useEffects()

  return <EffectList effects={effects} />
}
```

### WebGL2 GPU-Accelerated Effects

```typescript
import { useUnifiedEffects } from '@/features/effects/hooks'
import { WebGL2EffectProcessor } from '@/features/effects/services'

// Initialize processor
const processor = new WebGL2EffectProcessor()
await processor.initialize()

// Apply effects with GPU acceleration
const result = await processor.processFrame(
  sourceFrame,
  [
    { type: 'colorCorrection', params: { brightness: 1.2 } },
    { type: 'gaussianBlur', params: { radius: 2.0 } }
  ]
)
```

### Import Custom Effects

```typescript
import { useEffectsImport } from '@/features/effects/hooks'

const { importEffect, importLUT } = useEffectsImport()

// Import JSON effect
await importEffect('/path/to/effect.json')

// Import LUT file
await importLUT('/path/to/lut.cube')
```

## Integration

- **Depends on**: `@/domains/video-compiler`, `@/lib/webgl2`
- **Used by**: `@/features/browser`, `@/features/timeline`

## Testing

- **Total tests**: 66+
- **Coverage**: 64.87% overall
  - Components: 91.75%
  - Utilities: 100%
  - WebGL2 processors: 95%
- **Run tests**: `bun test src/features/effects`
- **Coverage report**: `bun test:coverage src/features/effects`

## Performance

**WebGL2 GPU Acceleration**
- 10x faster rendering vs CPU processing
- Real-time parameter adjustment without lag
- Automatic quality scaling based on GPU capabilities
- Memory efficient shader pooling and caching

**Optimizations**
- Lazy loading of effects
- Memoization for list rendering
- Real-time search optimization
- CSS preview for quick fallback

## TODO / Roadmap

- [ ] Timeline integration - implement applying effects to clips via WebGL2
- [ ] Drag & Drop - add effect dragging to timeline
- [ ] Real-time parameters - effect adjustment with WebGL2 preview
- [ ] Custom presets - save user settings to file system
- [ ] WebGL2 shaders - expand GLSL effects library
- [ ] Animated previews - improve visual presentation with GPU acceleration
- [ ] E2E tests - create comprehensive test suite (see E2E Tests section in old README)

## Documentation

- **README.md** - This file (EN)
- **README.ru.md** - Russian version
- **DEV.md** - Technical documentation, architecture and testing
- **WEBGL2_MIGRATION.md** - WebGL2 migration guide
- **examples/hooks-usage.md** - Hook usage examples
