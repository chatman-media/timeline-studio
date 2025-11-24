# Video Compiler API

## Обзор

Video Compiler API предоставляет низкоуровневый доступ к системе рендеринга и компиляции видео с поддержкой GPU ускорения и расширенных возможностей обработки.

## Основные компоненты

### useVideoCompiler Hook

Главный хук для работы с Video Compiler.

```typescript
const {
  compile,              // Компиляция проекта
  render,               // Рендеринг кадров
  extractFrames,        // Извлечение кадров
  getProgress,          // Получение прогресса
  cancel,               // Отмена операции
  getCapabilities,      // Возможности системы
} = useVideoCompiler()
```

### VideoCompilerProvider

Провайдер контекста для Video Compiler.

```typescript
<VideoCompilerProvider config={compilerConfig}>
  <RenderPanel />
  <ProgressMonitor />
</VideoCompilerProvider>
```

## Структура проекта

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

## Рендеринг

### Запуск рендеринга

```typescript
// Базовый рендеринг
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

// Расширенные настройки
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

### Мониторинг прогресса

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('VideoCompiler')

// Подписка на прогресс
renderJob.on('progress', (progress) => {
  logger.debugSync('Render progress', {
    frame: progress.frame,
    totalFrames: progress.totalFrames,
    timeElapsed: progress.timeElapsed,
    timeRemaining: progress.timeRemaining,
    fps: progress.fps,
    speed: progress.speed,
    bitrate: progress.bitrate
  })
})

// Детальная статистика
renderJob.on('statistics', (stats) => {
  logger.debugSync('Render statistics', {
    droppedFrames: stats.droppedFrames,
    encodingSpeed: stats.encodingSpeed,
    gpuUsage: stats.gpuUsage,
    memoryUsage: stats.memoryUsage
  })
})

// Завершение
renderJob.on('complete', (result) => {
  logger.infoSync('Render complete', {
    outputPath: result.outputPath,
    fileSize: result.fileSize,
    duration: result.duration
  })
})
```

## Извлечение кадров

### Frame Extraction

```typescript
// Извлечение одного кадра
const frame = await extractFrame({
  source: '/path/to/video.mp4',
  timestamp: 15.5,
  format: 'png',
  size: { width: 1920, height: 1080 }
})

// Извлечение нескольких кадров
const frames = await extractFrames({
  source: '/path/to/video.mp4',
  timestamps: [5, 10, 15, 20],
  format: 'jpeg',
  quality: 90,
  parallel: true
})

// Извлечение с интервалом
const intervalFrames = await extractFramesInterval({
  source: '/path/to/video.mp4',
  interval: 1, // Каждую секунду
  startTime: 0,
  endTime: 30,
  format: 'webp',
  outputPattern: 'frame_%04d.webp'
})
```

### Thumbnail Generation

```typescript
// Генерация миниатюр
const thumbnails = await generateThumbnails({
  source: '/path/to/video.mp4',
  count: 10,
  size: { width: 320, height: 180 },
  format: 'jpeg',
  quality: 85,
  strategy: 'keyframes' // 'keyframes' | 'interval' | 'scenes'
})

// Спрайт миниатюр
const sprite = await generateThumbnailSprite({
  source: '/path/to/video.mp4',
  interval: 10, // Каждые 10 секунд
  gridSize: { cols: 10, rows: 10 },
  thumbSize: { width: 160, height: 90 },
  outputPath: '/path/to/sprite.jpg'
})
```

## GPU ускорение

### Hardware Capabilities

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('HardwareCapabilities')

// Получение возможностей системы
const capabilities = await getCapabilities()

logger.infoSync('GPU Encoders detected', { encoders: capabilities.encoders })
// {
//   nvenc: { available: true, codecs: ['h264', 'h265', 'av1'] },
//   amf: { available: false },
//   qsv: { available: true, codecs: ['h264', 'h265'] },
//   videotoolbox: { available: false }
// }

logger.infoSync('GPU Filters available', { filters: capabilities.filters })
// {
//   scale: true,
//   colorspace: true,
//   deinterlace: true,
//   // ...
// }

// Выбор оптимального энкодера
const bestEncoder = selectBestEncoder({
  codec: 'h264',
  resolution: { width: 1920, height: 1080 },
  frameRate: 60
})
```

### GPU Memory Management

```typescript
// Настройка использования памяти
const gpuConfig = {
  maxMemory: 4096, // MB
  preallocate: true,
  pooling: true,
  deviceIndex: 0
}

// Мониторинг памяти
const memoryMonitor = createGPUMemoryMonitor()
memoryMonitor.on('warning', (usage) => {
  logger.warnSync('GPU memory usage high', {
    used: usage.used,
    total: usage.total,
    unit: 'MB'
  })
})
```

## Композиция

### Layer Composition

```typescript
// Создание композиции
const composition = createComposition({
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  duration: 60
})

// Добавление слоев
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

// Рендеринг композиции
const output = await renderComposition(composition, {
  outputPath: '/path/to/composite.mp4',
  codec: 'h264',
  quality: 'high'
})
```

### Effects Processing

```typescript
// Цепочка эффектов
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

// Применение к клипу
const processedClip = await applyEffects(clip, effectChain)
```

## Аудио обработка

### Audio Processing

```typescript
// Аудио микширование
const audioMix = createAudioMix({
  sampleRate: 48000,
  channels: 2,
  bitDepth: 24
})

// Добавление треков
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

// Рендеринг аудио
const mixedAudio = await renderAudioMix(audioMix, {
  outputPath: '/path/to/mixed.wav',
  format: 'wav',
  normalize: true,
  loudnessTarget: -16 // LUFS
})
```

### Audio Effects

```typescript
// Применение аудио эффектов
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

## Транскодирование

### Format Conversion

```typescript
// Простое транскодирование
await transcode({
  input: '/path/to/input.mov',
  output: '/path/to/output.mp4',
  codec: 'h264',
  preset: 'fast'
})

// Batch транскодирование
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

// Адаптивное транскодирование
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

## Анализ видео

### Video Analysis

```typescript
// Анализ видео
const analysis = await analyzeVideo({
  source: '/path/to/video.mp4',
  metrics: ['bitrate', 'framerate', 'resolution', 'codec', 'duration']
})

// Детальный анализ качества
const quality = await analyzeQuality({
  source: '/path/to/video.mp4',
  reference: '/path/to/reference.mp4',
  metrics: ['psnr', 'ssim', 'vmaf']
})

// Обнаружение проблем
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
// Создание стрима
const stream = await createLiveStream({
  input: 'camera:0', // или путь к файлу
  output: 'rtmp://server/live/stream',
  settings: {
    codec: 'h264',
    bitrate: 3000000,
    frameRate: 30,
    keyframeInterval: 60
  }
})

// Управление стримом
stream.start()
stream.pause()
stream.resume()
stream.stop()

// Мониторинг
stream.on('statistics', (stats) => {
  logger.debugSync('Stream statistics', {
    bitrate: stats.bitrate,
    droppedFrames: stats.droppedFrames,
    bufferLevel: stats.bufferLevel
  })
})
```

## Оптимизация

### Performance Optimization

```typescript
// Профилирование
const profile = await profileRender({
  project: projectSchema,
  duration: 60, // Секунд для профилирования
  metrics: ['cpu', 'gpu', 'memory', 'io']
})

// Оптимизация настроек
const optimized = await optimizeSettings({
  project: projectSchema,
  target: {
    quality: 0.9,     // 0-1
    speed: 0.7,       // 0-1
    fileSize: 'auto'  // или конкретный размер
  }
})

// Кэширование
const cache = createRenderCache({
  directory: '/path/to/cache',
  maxSize: '100GB',
  strategy: 'lru'
})

compiler.setCache(cache)
```

## События и callbacks

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('Compiler')

// Глобальные события
compiler.on('start', (job) => {
  logger.infoSync('Starting render', { jobId: job.id })
})

compiler.on('frame', (frame) => {
  updatePreview(frame.data)
})

compiler.on('error', (error) => {
  logger.errorSync('Compiler error', { error })
  handleError(error)
})

compiler.on('complete', (result) => {
  logger.infoSync('Render completed', { result })
  notifyUser(result)
})

// Job-specific callbacks
const job = await compile(config, {
  onProgress: (progress) => updateUI(progress),
  onFrame: (frame) => saveFrame(frame),
  onError: (error) => {
    logger.errorSync('Job error', { error })
    logError(error)
  },
  onComplete: (result) => {
    logger.infoSync('Job completed', { result })
    celebrate(result)
  }
})
```

---

*Последнее обновление: 31 июля 2025*