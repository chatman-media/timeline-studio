# Export API

## Обзор

Export API предоставляет комплексное решение для экспорта видео с поддержкой GPU ускорения, пресетов для социальных сетей и расширенных настроек.

## Основные компоненты

### useExport Hook

Основной хук для управления экспортом.

```typescript
const {
  startExport,        // Запуск экспорта
  cancelExport,       // Отмена экспорта
  pauseExport,        // Пауза экспорта
  resumeExport,       // Возобновление экспорта
  progress,           // Прогресс (0-100)
  timeRemaining,      // Оставшееся время
  currentStage,       // Текущий этап
  isExporting,        // Флаг экспорта
  error,              // Ошибка
} = useExport()
```

### ExportProvider

Провайдер контекста для экспорта.

```typescript
<ExportProvider>
  <ExportDialog />
  <ExportProgress />
</ExportProvider>
```

## Настройки экспорта

### ExportSettings

```typescript
interface ExportSettings {
  // Основные настройки
  outputPath: string
  format: ExportFormat
  quality: QualityPreset | CustomQuality
  
  // Видео настройки
  resolution: Resolution
  frameRate: number
  bitrate: number | 'auto'
  codec: VideoCodec
  
  // Аудио настройки
  audioCodec: AudioCodec
  audioBitrate: number
  audioChannels: AudioChannels
  
  // GPU ускорение
  gpuAcceleration: GPUAcceleration
  
  // Дополнительные опции
  exportRange: ExportRange
  watermark?: WatermarkSettings
  metadata?: VideoMetadata
}
```

### Пресеты платформ

```typescript
type PlatformPreset = 
  | 'youtube'         // YouTube оптимизация
  | 'tiktok'         // TikTok вертикальное видео
  | 'instagram'      // Instagram Reels/Posts
  | 'vimeo'          // Vimeo высокое качество
  | 'telegram'       // Telegram сжатие
  | 'twitter'        // Twitter ограничения
  | 'facebook'       // Facebook видео
  | 'custom'         // Пользовательские настройки

// Получение пресета
const preset = getExportPreset('youtube')
```

## GPU ускорение

### Поддерживаемые технологии

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
  | 'auto'       // Автовыбор

// Проверка доступности GPU
const gpuInfo = await checkGPUAvailability()
```

### Настройки производительности

```typescript
interface PerformanceSettings {
  threads: number | 'auto'        // Количество потоков
  priority: ProcessPriority       // Приоритет процесса
  memoryLimit?: number           // Лимит памяти (MB)
  chunkSize?: number            // Размер чанка
}
```

## Процесс экспорта

### Запуск экспорта

```typescript
// Базовый экспорт
const exportId = await startExport({
  outputPath: '/path/to/output.mp4',
  format: 'mp4',
  quality: 'high',
  gpuAcceleration: { enabled: true, type: 'auto' }
})

// Экспорт с пресетом
const exportId = await startExportWithPreset('youtube', {
  outputPath: '/path/to/video.mp4',
  metadata: {
    title: 'My Video',
    description: 'Description',
    tags: ['tag1', 'tag2']
  }
})
```

### Мониторинг прогресса

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('Export')

// Подписка на прогресс
const unsubscribe = onExportProgress((progress) => {
  logger.debugSync('Export progress', {
    percentage: progress.percentage,
    stage: progress.stage,
    timeRemaining: progress.timeRemaining,
    speed: progress.speed
  })
})

// Детальный прогресс
interface ExportProgress {
  percentage: number           // 0-100
  stage: ExportStage          // Текущий этап
  currentFrame: number        // Текущий кадр
  totalFrames: number         // Всего кадров
  fps: number                // Скорость обработки
  timeElapsed: number        // Прошло времени
  timeRemaining: number      // Осталось времени
  speed: number             // Скорость относительно realtime
}
```

### Этапы экспорта

```typescript
type ExportStage = 
  | 'preparing'        // Подготовка
  | 'analyzing'        // Анализ проекта
  | 'rendering'        // Рендеринг
  | 'encoding'         // Кодирование
  | 'audio-processing' // Обработка аудио
  | 'finalizing'       // Финализация
  | 'uploading'        // Загрузка (если включена)
  | 'completed'        // Завершено
```

## Расширенные функции

### Batch экспорт

```typescript
// Экспорт в несколько форматов
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

// Мониторинг batch экспорта
batchExport.on('itemComplete', (item, index) => {
  logger.infoSync('Batch export item complete', {
    name: item.name,
    index: index + 1,
    total: batchExport.total
  })
})
```

### Экспорт сегментов

```typescript
// Экспорт части таймлайна
const segmentExport = await exportSegment({
  startTime: 10.5,      // Начало в секундах
  endTime: 45.2,        // Конец в секундах
  settings: exportSettings
})

// Экспорт маркированных сегментов
const markers = getTimelineMarkers()
const segments = await exportMarkedSegments(markers, {
  namingPattern: 'segment_{index}_{name}',
  settings: exportSettings
})
```

### Прямая загрузка

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ExportApi')

// Экспорт с загрузкой на платформу
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

// Отслеживание загрузки
uploadExport.on('uploadProgress', (progress) => {
  logger.debugSync(`Upload: ${progress.percentage}%`)
})
```

## Оптимизация качества

### Адаптивное качество

```typescript
// Автоматическая оптимизация качества
const optimizedSettings = await optimizeQuality({
  targetFileSize: 100 * 1024 * 1024, // 100MB
  minQuality: 'medium',
  maxQuality: 'high',
  content: timeline
})

// Two-pass кодирование
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

### Анализ контента

```typescript
// Анализ перед экспортом
const analysis = await analyzeContent(timeline)

// Рекомендации по настройкам
const recommendations = getExportRecommendations(analysis)
// {
//   suggestedBitrate: 4500,
//   suggestedCodec: 'h265',
//   motionComplexity: 'high',
//   recommendedGPU: true
// }
```

## Watermark и брендирование

### Настройки watermark

```typescript
interface WatermarkSettings {
  type: 'image' | 'text'
  content: string | File
  position: WatermarkPosition
  opacity: number         // 0-1
  scale: number          // 0.1-2
  animation?: WatermarkAnimation
}

// Добавление watermark
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

## Обработка ошибок

### Восстановление после сбоев

```typescript
// Автоматическое восстановление
const resilientExport = await startResilientExport({
  ...exportSettings,
  recovery: {
    autoRetry: true,
    maxRetries: 3,
    checkpointInterval: 30 // секунд
  }
})

// Ручное восстановление
try {
  await startExport(settings)
} catch (error) {
  if (error.code === 'EXPORT_CRASHED') {
    // Восстановление с последней контрольной точки
    const recovered = await recoverExport(error.checkpointId)
  }
}
```

### Валидация настроек

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ExportApi')

// Проверка настроек перед экспортом
const validation = validateExportSettings(settings)
if (!validation.valid) {
  logger.errorSync('Invalid settings:', validation.errors)
  // {
  //   errors: [
  //     { field: 'bitrate', message: 'Bitrate too high for resolution' },
  //     { field: 'codec', message: 'Codec not supported on this system' }
  //   ]
  // }
}
```

## Интеграция с AI

### AI оптимизация

```typescript
// Использование AI для оптимизации
const aiOptimized = await optimizeWithAI({
  content: timeline,
  targetPlatform: 'youtube',
  preferences: {
    prioritize: 'quality', // 'quality' | 'size' | 'speed'
    style: 'cinematic'
  }
})

// AI анализ результата
const qualityScore = await analyzeExportQuality(outputFile)
```

## События экспорта

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ExportApi')

// Подписка на события
export.on('start', (exportId) => {
  logger.infoSync('Export started:', exportId)
})

export.on('progress', (progress) => {
  updateUI(progress)
})

export.on('stageChange', (stage) => {
  logger.infoSync('New stage:', stage)
})

export.on('complete', (result) => {
  logger.infoSync('Export complete:', result.outputPath)
  logger.infoSync('Duration:', result.duration)
  logger.infoSync('File size:', result.fileSize)
})

export.on('error', (error) => {
  handleExportError(error)
})

export.on('cancelled', () => {
  logger.infoSync('Export cancelled')
})
```

## Статистика и аналитика

```typescript
// Получение статистики экспорта
const stats = await getExportStatistics()
// {
//   totalExports: 142,
//   successRate: 0.98,
//   averageSpeed: 3.2, // x realtime
//   mostUsedPreset: 'youtube',
//   averageFileSize: 245000000,
//   gpuUsageRate: 0.85
// }

// История экспортов
const history = await getExportHistory({
  limit: 10,
  sortBy: 'date',
  order: 'desc'
})
```

---

*Последнее обновление: 31 июля 2025*