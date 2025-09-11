# Video Compiler API

## Overview

The Video Compiler API provides low-level access to the video rendering and compilation system with GPU acceleration support and advanced processing capabilities.

## Core Components

### useVideoCompiler Hook

Main hook for working with Video Compiler.

```typescript
const {
  compile,              // Compile project
  render,               // Render frames
  extractFrames,        // Extract frames
  getProgress,          // Get progress
  cancel,               // Cancel operation
  getCapabilities,      // System capabilities
} = useVideoCompiler()
```

### VideoCompilerProvider

Context provider for Video Compiler.

```typescript
<VideoCompilerProvider config={compilerConfig}>
  <RenderPanel />
  <ProgressMonitor />
</VideoCompilerProvider>
```

## Project Structure

### ProjectSchema

```typescript
interface ProjectSchema {
  version: string
  resolution: Resolution
  frameRate: number
  duration: number
  tracks: TrackSchema[]
  globalEffects: EffectSchema[]
  colorSpace: ColorSpace
  metadata: ProjectMetadata
}

interface TrackSchema {
  id: string
  type: 'video' | 'audio' | 'overlay'
  clips: ClipSchema[]
  effects: EffectSchema[]
  opacity: number
  blendMode: BlendMode
}

interface ClipSchema {
  id: string
  sourceId: string
  startTime: number
  duration: number
  inPoint: number
  outPoint: number
  transform: Transform
  effects: EffectSchema[]
  transitions: TransitionSchema[]
}
```

## Rendering

### Start Rendering

```typescript
// Basic rendering
const renderJob = await compile({
  project: projectSchema,
  output: {
    path: '/path/to/output.mp4',
    format: 'mp4',
    codec: 'h264',
    bitrate: 10000000, // 10 Mbps
    preset: 'medium'
  },
  hardware: {
    gpu: true,
    encoder: 'nvenc' // 'nvenc' | 'amf' | 'qsv' | 'videotoolbox'
  }
})

// Advanced settings
const advancedJob = await compile({
  project: projectSchema,
  output: {
    path: '/path/to/output.mp4',
    format: 'mp4',
    codec: 'h265',
    bitrate: 'variable',
    crf: 23,
    preset: 'slow',
    profile: 'main10',
    pixelFormat: 'yuv420p10le'
  },
  encoding: {
    passes: 2,
    keyframeInterval: 60,
    bFrames: 3,
    refFrames: 5,
    threads: 0 // Auto
  },
  filters: {
    deinterlace: true,
    denoise: { strength: 5 },
    sharpen: { amount: 0.5 }
  }
})
```

### Progress Monitoring

```typescript
// Subscribe to progress
renderJob.on('progress', (progress) => {
  console.log(`Frame: ${progress.frame}/${progress.totalFrames}`)
  console.log(`Time: ${progress.timeElapsed}/${progress.timeRemaining}`)
  console.log(`Speed: ${progress.fps} fps (${progress.speed}x)`)
  console.log(`Bitrate: ${progress.bitrate} kbps`)
})

// Detailed statistics
renderJob.on('statistics', (stats) => {
  console.log(`Dropped frames: ${stats.droppedFrames}`)
  console.log(`Encoding speed: ${stats.encodingSpeed}`)
  console.log(`GPU usage: ${stats.gpuUsage}%`)
  console.log(`Memory usage: ${stats.memoryUsage} MB`)
})

// Completion
renderJob.on('complete', (result) => {
  console.log(`Output: ${result.outputPath}`)
  console.log(`Size: ${result.fileSize}`)
  console.log(`Duration: ${result.duration}`)
})
```

## Frame Extraction

### Frame Extraction

```typescript
// Extract single frame
const frame = await extractFrame({
  source: '/path/to/video.mp4',
  timestamp: 15.5,
  format: 'png',
  size: { width: 1920, height: 1080 }
})

// Extract multiple frames
const frames = await extractFrames({
  source: '/path/to/video.mp4',
  timestamps: [5, 10, 15, 20],
  format: 'jpeg',
  quality: 90,
  parallel: true
})

// Extract with interval
const intervalFrames = await extractFramesInterval({
  source: '/path/to/video.mp4',
  interval: 1, // Every second
  startTime: 0,
  endTime: 30,
  format: 'webp',
  outputPattern: 'frame_%04d.webp'
})
```

### Thumbnail Generation

```typescript
// Generate thumbnails
const thumbnails = await generateThumbnails({
  source: '/path/to/video.mp4',
  count: 10,
  size: { width: 320, height: 180 },
  format: 'jpeg',
  quality: 85,
  strategy: 'keyframes' // 'keyframes' | 'interval' | 'scenes'
})

// Thumbnail sprite
const sprite = await generateThumbnailSprite({
  source: '/path/to/video.mp4',
  interval: 10, // Every 10 seconds
  gridSize: { cols: 10, rows: 10 },
  thumbSize: { width: 160, height: 90 },
  outputPath: '/path/to/sprite.jpg'
})
```

## GPU Acceleration

### Hardware Capabilities

```typescript
// Get system capabilities
const capabilities = await getCapabilities()

console.log('GPU Encoders:', capabilities.encoders)
// {
//   nvenc: { available: true, codecs: ['h264', 'h265', 'av1'] },
//   amf: { available: false },
//   qsv: { available: true, codecs: ['h264', 'h265'] },
//   videotoolbox: { available: false }
// }

console.log('GPU Filters:', capabilities.filters)
// {
//   scale: true,
//   colorspace: true,
//   deinterlace: true,
//   // ...
// }

// Select optimal encoder
const bestEncoder = selectBestEncoder({
  codec: 'h264',
  resolution: { width: 1920, height: 1080 },
  frameRate: 60
})
```

### GPU Memory Management

```typescript
// Configure memory usage
const gpuConfig = {
  maxMemory: 4096, // MB
  preallocate: true,
  pooling: true,
  deviceIndex: 0
}

// Monitor memory
const memoryMonitor = createGPUMemoryMonitor()
memoryMonitor.on('warning', (usage) => {
  console.warn(`GPU memory usage high: ${usage.used}/${usage.total} MB`)
})
```

## Composition

### Layer Composition

```typescript
// Create composition
const composition = createComposition({
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  duration: 60
})

// Add layers
composition.addLayer({
  type: 'video',
  source: '/path/to/background.mp4',
  startTime: 0,
  duration: 60,
  opacity: 1,
  blendMode: 'normal'
})

composition.addLayer({
  type: 'video',
  source: '/path/to/overlay.mp4',
  startTime: 10,
  duration: 20,
  opacity: 0.7,
  blendMode: 'overlay',
  transform: {
    position: { x: 100, y: 100 },
    scale: { x: 0.5, y: 0.5 },
    rotation: 45
  }
})

// Render composition
const output = await renderComposition(composition, {
  outputPath: '/path/to/composite.mp4',
  codec: 'h264',
  quality: 'high'
})
```

### Effects Processing

```typescript
// Effect chain
const effectChain = createEffectChain()

effectChain
  .add('colorCorrection', {
    brightness: 0.1,
    contrast: 1.2,
    saturation: 1.1
  })
  .add('blur', {
    radius: 5,
    type: 'gaussian'
  })
  .add('vignette', {
    intensity: 0.3,
    radius: 0.8
  })

// Apply to clip
const processedClip = await applyEffects(clip, effectChain)
```

## Audio Processing

### Audio Processing

```typescript
// Audio mixing
const audioMix = createAudioMix({
  sampleRate: 48000,
  channels: 2,
  bitDepth: 24
})

// Add tracks
audioMix.addTrack({
  source: '/path/to/music.mp3',
  volume: 0.8,
  pan: 0,
  effects: ['reverb', 'compression']
})

audioMix.addTrack({
  source: '/path/to/voice.wav',
  volume: 1.0,
  pan: 0,
  effects: ['eq', 'denoiser']
})

// Render audio
const mixedAudio = await renderAudioMix(audioMix, {
  outputPath: '/path/to/mixed.wav',
  format: 'wav',
  normalize: true,
  loudnessTarget: -16 // LUFS
})
```

### Audio Effects

```typescript
// Apply audio effects
const audioEffects = createAudioEffectChain()

audioEffects
  .add('eq', {
    lowShelf: { freq: 100, gain: -3 },
    highShelf: { freq: 10000, gain: 2 }
  })
  .add('compressor', {
    threshold: -20,
    ratio: 4,
    attack: 5,
    release: 50
  })
  .add('limiter', {
    threshold: -0.5,
    release: 10
  })

const processedAudio = await applyAudioEffects(audioTrack, audioEffects)
```

## Transcoding

### Format Conversion

```typescript
// Simple transcoding
await transcode({
  input: '/path/to/input.mov',
  output: '/path/to/output.mp4',
  codec: 'h264',
  preset: 'fast'
})

// Batch transcoding
const batch = await batchTranscode([
  {
    input: '/path/to/video1.mov',
    output: '/path/to/video1.mp4',
    settings: { codec: 'h264', bitrate: 5000000 }
  },
  {
    input: '/path/to/video2.avi',
    output: '/path/to/video2.mp4',
    settings: { codec: 'h265', crf: 23 }
  }
], {
  parallel: 2,
  hardware: true
})

// Adaptive transcoding
await adaptiveTranscode({
  input: '/path/to/input.mp4',
  outputs: [
    { height: 1080, bitrate: 8000000 },
    { height: 720, bitrate: 4000000 },
    { height: 480, bitrate: 2000000 }
  ],
  format: 'hls', // HTTP Live Streaming
  segmentDuration: 10
})
```

## Video Analysis

### Video Analysis

```typescript
// Analyze video
const analysis = await analyzeVideo({
  source: '/path/to/video.mp4',
  metrics: ['bitrate', 'framerate', 'resolution', 'codec', 'duration']
})

// Detailed quality analysis
const quality = await analyzeQuality({
  source: '/path/to/video.mp4',
  reference: '/path/to/reference.mp4',
  metrics: ['psnr', 'ssim', 'vmaf']
})

// Detect issues
const issues = await detectIssues({
  source: '/path/to/video.mp4',
  checks: [
    'corruption',
    'sync',
    'dropouts',
    'artifacts',
    'blackFrames'
  ]
})
```

## Streaming

### Live Streaming

```typescript
// Create stream
const stream = await createLiveStream({
  input: 'camera:0', // or file path
  output: 'rtmp://server/live/stream',
  settings: {
    codec: 'h264',
    bitrate: 3000000,
    frameRate: 30,
    keyframeInterval: 60
  }
})

// Control stream
stream.start()
stream.pause()
stream.resume()
stream.stop()

// Monitoring
stream.on('statistics', (stats) => {
  console.log(`Bitrate: ${stats.bitrate}`)
  console.log(`Dropped frames: ${stats.droppedFrames}`)
  console.log(`Network buffer: ${stats.bufferLevel}`)
})
```

## Optimization

### Performance Optimization

```typescript
// Profiling
const profile = await profileRender({
  project: projectSchema,
  duration: 60, // Seconds to profile
  metrics: ['cpu', 'gpu', 'memory', 'io']
})

// Optimize settings
const optimized = await optimizeSettings({
  project: projectSchema,
  target: {
    quality: 0.9,     // 0-1
    speed: 0.7,       // 0-1
    fileSize: 'auto'  // or specific size
  }
})

// Caching
const cache = createRenderCache({
  directory: '/path/to/cache',
  maxSize: '100GB',
  strategy: 'lru'
})

compiler.setCache(cache)
```

## Events and Callbacks

```typescript
// Global events
compiler.on('start', (job) => {
  console.log(`Starting render: ${job.id}`)
})

compiler.on('frame', (frame) => {
  updatePreview(frame.data)
})

compiler.on('error', (error) => {
  handleError(error)
})

compiler.on('complete', (result) => {
  notifyUser(result)
})

// Job-specific callbacks
const job = await compile(config, {
  onProgress: (progress) => updateUI(progress),
  onFrame: (frame) => saveFrame(frame),
  onError: (error) => logError(error),
  onComplete: (result) => celebrate(result)
})
```

---

*Last updated: July 31, 2025*