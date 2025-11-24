# Preview Module - WebGL2 Preview System

High-performance WebGL2-based preview system for Timeline Studio, providing real-time video rendering with effects.

**🌐 Languages:** [English](./README.md) | [Русский](./README.ru.md)

## 🚀 Features

- **WebGL2 Rendering**: GPU-accelerated rendering using modern WebGL2
- **Real-time Effects**: Apply effects in real-time during playback
- **Smart Caching**: Intelligent frame caching for smooth playback
- **Quality Scaling**: Automatic quality adaptation based on GPU capabilities
- **Frame Extraction**: Extract frames from video sources
- **Timeline Integration**: Tight integration with timeline system

## 📁 Structure

```
src/features/preview/
├── hooks/
│   ├── use-webgl2-preview.ts     # Main hook for WebGL2 preview
│   └── use-preview-cache.ts      # Hook for cache management
├── services/
│   ├── webgl2-preview-renderer.ts # WebGL2 preview renderer
│   ├── preview-cache.ts          # Frame caching system
│   └── frame-extractor.ts        # Video frame extraction
├── components/
│   ├── preview-canvas.tsx        # Canvas component for preview
│   ├── preview-controls.tsx      # Preview control elements
│   └── quality-settings.tsx      # Quality settings panel
├── types/
│   └── preview.ts               # TypeScript types
└── utils/
    └── preview-utils.ts         # Preview utilities
```

## 🏗️ Architecture

### WebGL2PreviewRenderer

Main renderer built on top of the unified WebGL2 library:

```typescript
import { WebGL2PreviewRenderer } from '@/features/preview/services'

const renderer = new WebGL2PreviewRenderer({
  name: 'timeline-preview',
  canvas: canvasElement,
  antialias: true
})

// Initialize
await renderer.initialize()

// Set video source
renderer.setVideoSource(videoElement)

// Set timeline segments
renderer.setSegments(timelineSegments)

// Render frame
renderer.setCurrentTime(5.5)
renderer.render(deltaTime)

// Capture frame
const frame = await renderer.captureFrame()
```

### useWebGL2Preview Hook

React hook for integrating WebGL2 preview into components:

```typescript
import { useWebGL2Preview } from '@/features/preview/hooks'

function PreviewComponent() {
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
    cacheSize: 100, // MB
    prefetchRange: 2, // seconds
    updateInterval: 33 // ~30fps
  })

  return (
    <div>
      <canvas ref={canvasRef} />
      <video ref={videoRef} style={{ display: 'none' }} />
      
      {isInitialized && (
        <div>
          GPU Tier: {gpuTier}
          Cache: {cacheStats?.entries} entries ({cacheStats?.sizeMB}MB)
        </div>
      )}
    </div>
  )
}
```

### PreviewCache

Intelligent frame caching system:

```typescript
import { PreviewCache } from '@/features/preview/services'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('PreviewCache')
const cache = new PreviewCache(100) // 100MB limit

// Get or compute frame
const frame = await cache.getOrCompute(
  currentTime,
  activeEffects,
  async () => {
    // Frame rendering function
    return await renderFrame(currentTime, activeEffects)
  }
)

// Prefetch frames
await cache.prefetch(
  currentTime,
  prefetchRange,
  fps,
  effects,
  renderFunction
)

// Cache statistics
const stats = cache.getStats()
logger.debugSync('Cache statistics', { entries: stats.entries, sizeMB: stats.sizeMB })
```

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import { useWebGL2Preview } from '@/features/preview/hooks'
import { useTimeline } from '@/features/timeline/hooks'
import { usePlayer } from '@/features/video-player'

function VideoPreview() {
  const timeline = useTimeline()
  const player = usePlayer()
  
  const {
    canvasRef,
    videoRef,
    previewFrame,
    isInitialized,
    quality,
    setQuality
  } = useWebGL2Preview()

  // Automatic sync with player
  useEffect(() => {
    if (player.currentVideo && videoRef.current) {
      videoRef.current.src = player.currentVideo.path
    }
  }, [player.currentVideo, videoRef])

  return (
    <div className="preview-container">
      <canvas 
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{ width: '100%', height: 'auto' }}
      />
      
      <video 
        ref={videoRef}
        muted
        style={{ display: 'none' }}
      />
      
      {!isInitialized && <div>Initializing WebGL2...</div>}
    </div>
  )
}
```

### 2. Quality Settings

```typescript
// Automatic GPU adaptation
const { gpuTier, quality, setQuality } = useWebGL2Preview()

useEffect(() => {
  // Custom quality settings
  if (gpuTier === 'high') {
    setQuality({
      resolution: 1.0,
      effects: 'all',
      fps: 30,
      antialiasing: true
    })
  } else if (gpuTier === 'low') {
    setQuality({
      resolution: 0.5,
      effects: 'basic',
      fps: 15,
      antialiasing: false
    })
  }
}, [gpuTier, setQuality])
```

### 3. Effects Integration

```typescript
import { useUnifiedEffects } from '@/features/effects/hooks'

function EffectsPreview() {
  const { activeEffects } = useUnifiedEffects()
  const { previewFrame, isInitialized } = useWebGL2Preview()

  // Effects are automatically applied through timeline integration
  return (
    <div>
      <canvas ref={canvasRef} />
      
      <div className="effects-info">
        Active Effects: {activeEffects.length}
        {activeEffects.map(effect => (
          <div key={effect.id}>{effect.name}</div>
        ))}
      </div>
    </div>
  )
}
```

## 🎛️ Quality Settings

The system automatically adapts quality based on GPU performance:

### GPU Tiers

- **High**: Modern gaming GPUs (GTX 1060+, RTX series, M1 Pro+)
  ```typescript
  {
    resolution: 1.0,     // Full resolution
    effects: "all",      // All effects enabled
    fps: 30,            // 30 FPS target
    antialiasing: true   // MSAA enabled
  }
  ```

- **Medium**: Mid-range GPUs (GTX 750+, integrated high-end)
  ```typescript
  {
    resolution: 0.75,    // 75% resolution
    effects: "all",      // All effects enabled
    fps: 24,            // 24 FPS target
    antialiasing: true   // MSAA enabled
  }
  ```

- **Low**: Older or low-end GPUs
  ```typescript
  {
    resolution: 0.5,     // 50% resolution
    effects: "basic",    // Only basic effects
    fps: 15,            // 15 FPS target
    antialiasing: false  // No antialiasing
  }
  ```

### Custom Settings

```typescript
const customQuality = {
  resolution: 0.8,        // 80% resolution
  effects: "essential",   // Only essential effects
  fps: 25,               // 25 FPS
  antialiasing: true,    // Enable antialiasing
  maxTextures: 8,        // Texture limit
  shaderComplexity: "medium" // Shader complexity
}

setQuality(customQuality)
```

## 📊 Performance Monitoring

### Cache Statistics

```typescript
const { cacheStats } = useWebGL2Preview()

logger.debugSync('Cache Stats:', {
  entries: cacheStats.entries,        // Number of cached frames
  sizeMB: cacheStats.sizeMB,         // Cache size in MB
  hitRate: cacheStats.hitRate,       // Cache hit rate
  averageRenderTime: cacheStats.avgRenderTime // Average render time
})
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@/features/preview/utils'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

const monitor = new PerformanceMonitor()

monitor.on('frameRendered', (stats) => {
  logger.debugSync(`Frame rendered in ${stats.renderTime}ms`)
  
  if (stats.renderTime > 33) { // More than 33ms = less than 30 FPS
    logger.warnSync('Frame drop detected, consider reducing quality')
  }
})
```

## 🔄 Timeline Integration

Preview module is tightly integrated with the timeline system:

```typescript
// Automatic timeline synchronization
const timeline = useTimeline()
const player = usePlayer()

const {
  canvasRef,
  previewFrame
} = useWebGL2Preview()

// Preview automatically updates when:
// - Current time changes
// - Effects are added/removed
// - Timeline segments change
// - Media files switch
```

## 🎨 Supported Effects

Preview system supports all effects from the unified effects system:

- **Color Correction**: Brightness, Contrast, Saturation, Hue
- **Color Grading**: Lift/Gamma/Gain, Color Wheels
- **Blur & Sharpen**: Gaussian Blur, Motion Blur, Unsharp Mask
- **Stylize**: Vintage, Film Emulation, Cartoon
- **Transform**: Scale, Rotate, Position, Crop
- **Temporal**: Stabilization, Speed Ramping

```typescript
// Effects are applied through timeline
const effectChain = [
  { type: 'colorCorrection', params: { brightness: 1.2 } },
  { type: 'gaussianBlur', params: { radius: 2.0 } },
  { type: 'vintage', params: { intensity: 0.8 } }
]

// Effects are automatically applied in preview
```

## 🧪 Testing

Run tests:
```bash
bun run test src/features/preview/__tests__/
```

Tests cover:
- ✅ WebGL2PreviewRenderer functionality
- ✅ useWebGL2Preview hook behavior
- ✅ PreviewCache operations
- ✅ Quality adaptation logic
- ✅ Timeline integration
- ✅ Effect application

## 🔧 Troubleshooting

### Common Issues

**WebGL2 not supported:**
```typescript
if (!isInitialized) {
  return <div>Your browser doesn't support WebGL2</div>
}
```

**Low performance:**
```typescript
// Force lower quality
setQuality({
  resolution: 0.5,
  effects: 'none',
  fps: 15,
  antialiasing: false
})
```

**Video issues:**
```typescript
// Check format support
const video = videoRef.current
if (video.readyState < 2) {
  logger.warnSync('Video not ready for processing')
}
```

## 📚 API Reference

### useWebGL2Preview Options
```typescript
interface UseWebGL2PreviewOptions {
  cacheSize?: number        // Cache size in MB (default: 100)
  prefetchRange?: number    // Prefetch range in seconds (default: 2)
  updateInterval?: number   // Update interval in ms (default: 33)
}
```

### PreviewQuality
```typescript
interface PreviewQuality {
  resolution: number        // 0.1 - 1.0
  effects: 'none' | 'basic' | 'all'
  fps: number              // Target FPS
  antialiasing: boolean    // Enable MSAA
}
```

### PreviewFrame
```typescript
interface PreviewFrame {
  bitmap: ImageBitmap      // Rendered frame
  width: number           // Frame width
  height: number          // Frame height
  timestamp: number       // Time in seconds
}
```

## 🔄 Migration

If you're upgrading from the old preview system, see the [WebGL Migration Guide](../../docs/05_development/webgl-migration-guide.md).

## 🤝 Contributing

When adding new features:
1. Follow WebGL2 library architecture
2. Ensure timeline compatibility
3. Add tests for new functionality
4. Update documentation

## 📄 License

Part of Timeline Studio - see root project license.