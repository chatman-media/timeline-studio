# Export API

## Overview

The Export API provides a comprehensive solution for video export with GPU acceleration support, social media presets, and advanced settings.

## Core Components

### useExport Hook

Main hook for managing export.

```typescript
const {
  startExport,        // Start export
  cancelExport,       // Cancel export
  pauseExport,        // Pause export
  resumeExport,       // Resume export
  progress,           // Progress (0-100)
  timeRemaining,      // Time remaining
  currentStage,       // Current stage
  isExporting,        // Export flag
  error,              // Error state
} = useExport()
```

### ExportProvider

Context provider for export.

```typescript
<ExportProvider>
  <ExportDialog />
  <ExportProgress />
</ExportProvider>
```

## Export Settings

### ExportSettings

```typescript
interface ExportSettings {
  // Basic settings
  outputPath: string
  format: ExportFormat
  quality: QualityPreset | CustomQuality
  
  // Video settings
  resolution: Resolution
  frameRate: number
  bitrate: number | 'auto'
  codec: VideoCodec
  
  // Audio settings
  audioCodec: AudioCodec
  audioBitrate: number
  audioChannels: AudioChannels
  
  // GPU acceleration
  gpuAcceleration: GPUAcceleration
  
  // Additional options
  exportRange: ExportRange
  watermark?: WatermarkSettings
  metadata?: VideoMetadata
}
```

### Platform Presets

```typescript
type PlatformPreset = 
  | 'youtube'         // YouTube optimization
  | 'tiktok'         // TikTok vertical video
  | 'instagram'      // Instagram Reels/Posts
  | 'vimeo'          // Vimeo high quality
  | 'telegram'       // Telegram compression
  | 'twitter'        // Twitter limitations
  | 'facebook'       // Facebook video
  | 'custom'         // Custom settings

// Get preset
const preset = getExportPreset('youtube')
```

## GPU Acceleration

### Supported Technologies

```typescript
interface GPUAcceleration {
  enabled: boolean
  type: GPUType
  device?: string
}

type GPUType = 
  | 'nvidia'     // NVENC
  | 'amd'        // AMF
  | 'intel'      // QuickSync
  | 'apple'      // VideoToolbox
  | 'auto'       // Auto-select

// Check GPU availability
const gpuInfo = await checkGPUAvailability()
```

### Performance Settings

```typescript
interface PerformanceSettings {
  threads: number | 'auto'        // Thread count
  priority: ProcessPriority       // Process priority
  memoryLimit?: number           // Memory limit (MB)
  chunkSize?: number            // Chunk size
}
```

## Export Process

### Starting Export

```typescript
// Basic export
const exportId = await startExport({
  outputPath: '/path/to/output.mp4',
  format: 'mp4',
  quality: 'high',
  gpuAcceleration: { enabled: true, type: 'auto' }
})

// Export with preset
const exportId = await startExportWithPreset('youtube', {
  outputPath: '/path/to/video.mp4',
  metadata: {
    title: 'My Video',
    description: 'Description',
    tags: ['tag1', 'tag2']
  }
})
```

### Progress Monitoring

```typescript
// Subscribe to progress
const unsubscribe = onExportProgress((progress) => {
  console.log(`Progress: ${progress.percentage}%`)
  console.log(`Stage: ${progress.stage}`)
  console.log(`ETA: ${progress.timeRemaining}`)
  console.log(`Speed: ${progress.speed}x`)
})

// Detailed progress
interface ExportProgress {
  percentage: number           // 0-100
  stage: ExportStage          // Current stage
  currentFrame: number        // Current frame
  totalFrames: number         // Total frames
  fps: number                // Processing speed
  timeElapsed: number        // Time elapsed
  timeRemaining: number      // Time remaining
  speed: number             // Speed relative to realtime
}
```

### Export Stages

```typescript
type ExportStage = 
  | 'preparing'        // Preparation
  | 'analyzing'        // Project analysis
  | 'rendering'        // Rendering
  | 'encoding'         // Encoding
  | 'audio-processing' // Audio processing
  | 'finalizing'       // Finalizing
  | 'uploading'        // Uploading (if enabled)
  | 'completed'        // Completed
```

## Advanced Features

### Batch Export

```typescript
// Export to multiple formats
const batchExport = await startBatchExport([
  {
    name: 'YouTube 4K',
    preset: 'youtube',
    settings: { resolution: '3840x2160' }
  },
  {
    name: 'TikTok',
    preset: 'tiktok',
    settings: { aspectRatio: '9:16' }
  },
  {
    name: 'Instagram Reel',
    preset: 'instagram',
    settings: { duration: 60 }
  }
])

// Monitor batch export
batchExport.on('itemComplete', (item, index) => {
  console.log(`Completed ${item.name} (${index + 1}/${batchExport.total})`)
})
```

### Segment Export

```typescript
// Export timeline portion
const segmentExport = await exportSegment({
  startTime: 10.5,      // Start in seconds
  endTime: 45.2,        // End in seconds
  settings: exportSettings
})

// Export marked segments
const markers = getTimelineMarkers()
const segments = await exportMarkedSegments(markers, {
  namingPattern: 'segment_{index}_{name}',
  settings: exportSettings
})
```

### Direct Upload

```typescript
// Export with platform upload
const uploadExport = await exportAndUpload({
  exportSettings: {
    preset: 'youtube',
    quality: 'high'
  },
  uploadSettings: {
    platform: 'youtube',
    privacy: 'unlisted',
    title: 'My Video',
    description: 'Video description',
    tags: ['tag1', 'tag2'],
    thumbnail: thumbnailFile
  }
})

// Track upload
uploadExport.on('uploadProgress', (progress) => {
  console.log(`Upload: ${progress.percentage}%`)
})
```

## Quality Optimization

### Adaptive Quality

```typescript
// Automatic quality optimization
const optimizedSettings = await optimizeQuality({
  targetFileSize: 100 * 1024 * 1024, // 100MB
  minQuality: 'medium',
  maxQuality: 'high',
  content: timeline
})

// Two-pass encoding
const twoPassExport = await exportWithTwoPass({
  ...exportSettings,
  encoding: {
    passes: 2,
    targetBitrate: 5000,
    maxBitrate: 8000,
    bufferSize: 10000
  }
})
```

### Content Analysis

```typescript
// Pre-export analysis
const analysis = await analyzeContent(timeline)

// Settings recommendations
const recommendations = getExportRecommendations(analysis)
// {
//   suggestedBitrate: 4500,
//   suggestedCodec: 'h265',
//   motionComplexity: 'high',
//   recommendedGPU: true
// }
```

## Watermark and Branding

### Watermark Settings

```typescript
interface WatermarkSettings {
  type: 'image' | 'text'
  content: string | File
  position: WatermarkPosition
  opacity: number         // 0-1
  scale: number          // 0.1-2
  animation?: WatermarkAnimation
}

// Add watermark
const watermarkedExport = await exportWithWatermark({
  ...exportSettings,
  watermark: {
    type: 'image',
    content: logoFile,
    position: 'bottom-right',
    opacity: 0.8,
    scale: 0.5,
    animation: {
      type: 'fade-in',
      duration: 2
    }
  }
})
```

## Error Handling

### Crash Recovery

```typescript
// Automatic recovery
const resilientExport = await startResilientExport({
  ...exportSettings,
  recovery: {
    autoRetry: true,
    maxRetries: 3,
    checkpointInterval: 30 // seconds
  }
})

// Manual recovery
try {
  await startExport(settings)
} catch (error) {
  if (error.code === 'EXPORT_CRASHED') {
    // Recover from last checkpoint
    const recovered = await recoverExport(error.checkpointId)
  }
}
```

### Settings Validation

```typescript
// Validate settings before export
const validation = validateExportSettings(settings)
if (!validation.valid) {
  console.error('Invalid settings:', validation.errors)
  // {
  //   errors: [
  //     { field: 'bitrate', message: 'Bitrate too high for resolution' },
  //     { field: 'codec', message: 'Codec not supported on this system' }
  //   ]
  // }
}
```

## AI Integration

### AI Optimization

```typescript
// Use AI for optimization
const aiOptimized = await optimizeWithAI({
  content: timeline,
  targetPlatform: 'youtube',
  preferences: {
    prioritize: 'quality', // 'quality' | 'size' | 'speed'
    style: 'cinematic'
  }
})

// AI quality analysis
const qualityScore = await analyzeExportQuality(outputFile)
```

## Export Events

```typescript
// Subscribe to events
export.on('start', (exportId) => {
  console.log('Export started:', exportId)
})

export.on('progress', (progress) => {
  updateUI(progress)
})

export.on('stageChange', (stage) => {
  console.log('New stage:', stage)
})

export.on('complete', (result) => {
  console.log('Export complete:', result.outputPath)
  console.log('Duration:', result.duration)
  console.log('File size:', result.fileSize)
})

export.on('error', (error) => {
  handleExportError(error)
})

export.on('cancelled', () => {
  console.log('Export cancelled')
})
```

## Statistics and Analytics

```typescript
// Get export statistics
const stats = await getExportStatistics()
// {
//   totalExports: 142,
//   successRate: 0.98,
//   averageSpeed: 3.2, // x realtime
//   mostUsedPreset: 'youtube',
//   averageFileSize: 245000000,
//   gpuUsageRate: 0.85
// }

// Export history
const history = await getExportHistory({
  limit: 10,
  sortBy: 'date',
  order: 'desc'
})
```

---

*Last updated: July 31, 2025*