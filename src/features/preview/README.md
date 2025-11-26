# Preview

**English** | [Русский](./README.ru.md)

## Overview
High-performance WebGL2-based preview system providing real-time video rendering with GPU-accelerated effects and smart caching.

## Status
- ✅ **Components**: PreviewCanvas, PreviewControls, QualitySettings
- ✅ **Hooks**: useWebGL2Preview, usePreviewCache
- ✅ **Services**: WebGL2PreviewRenderer, PreviewCache, FrameExtractor
- ✅ **Tests**: 10+ tests passing (renderer, hooks, integration)

## Structure
```
preview/
├── components/
│   ├── preview-canvas.tsx       # Canvas component for preview
│   ├── preview-controls.tsx     # Control elements
│   └── quality-settings.tsx     # Quality settings panel
├── hooks/
│   ├── use-webgl2-preview.ts    # Main WebGL2 preview hook
│   └── use-preview-cache.ts     # Cache management hook
├── services/
│   ├── webgl2-preview-renderer.ts  # WebGL2 renderer
│   ├── preview-cache.ts         # Frame caching system
│   └── frame-extractor.ts       # Video frame extraction
├── types/
│   └── preview.ts               # TypeScript types
├── utils/
│   └── preview-utils.ts         # Preview utilities
└── __tests__/
    ├── hooks/                   # Hook tests
    └── services/                # Service tests
```

## Features
### ✅ Implemented
- [x] WebGL2 GPU-accelerated rendering
- [x] Real-time effects application
- [x] Smart frame caching system
- [x] Quality scaling (GPU tier-based)
- [x] Frame extraction from video
- [x] Timeline integration
- [x] Performance monitoring
- [x] Automatic GPU adaptation

### ❌ Not Implemented
- [ ] Multi-layer composition
- [ ] Advanced blend modes
- [ ] 3D transforms
- [ ] Particle effects
- [ ] Video stabilization preview
- [ ] LUT preview

## Usage
```typescript
import { useWebGL2Preview } from '@/features/preview/hooks'

function VideoPreview() {
  const {
    canvasRef,
    videoRef,
    previewFrame,
    isInitialized,
    gpuTier,
    quality,
    setQuality,
    cacheStats
  } = useWebGL2Preview({
    cacheSize: 100,      // MB
    prefetchRange: 2,    // seconds
    updateInterval: 33   // ~30fps
  })

  return (
    <div>
      <canvas ref={canvasRef} width={1920} height={1080} />
      <video ref={videoRef} muted style={{ display: 'none' }} />

      {isInitialized && (
        <div>
          GPU Tier: {gpuTier}
          Cache: {cacheStats?.entries} entries
        </div>
      )}
    </div>
  )
}
```

## Integration
- **Depends on**: @/features/timeline, @/features/video-player, @/lib/webgl2
- **Used by**: @/features/media-studio
- **Effects**: Automatic integration with unified effects system
- **Backend**: Frontend-only (no Tauri commands)

## Testing
- **Total tests**: 10+ tests
- **Coverage**: WebGL2PreviewRenderer, useWebGL2Preview, GPU adaptation

```bash
# Run all tests
bun run test src/features/preview

# Run specific test
bun run test src/features/preview/__tests__/services/webgl2-preview-renderer.test.ts
```

## TODO / Roadmap
- [ ] Multi-layer composition support
- [ ] Advanced blend modes (screen, multiply, overlay)
- [ ] 3D transform effects
- [ ] Particle system integration
- [ ] Real-time video stabilization preview
- [ ] LUT (Look-Up Table) support
- [ ] HDR preview support
- [ ] Color space conversion preview
- [ ] Export preview optimization
- [ ] Hardware encoding preview
