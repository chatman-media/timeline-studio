# AI Services Domain

Специализированные AI сервисы для анализа медиа контента в Timeline Studio.

## Обзор

AI Services домен предоставляет сервисы для глубокого анализа видео и аудио контента, включая детекцию сцен, распознавание объектов, анализ качества и многое другое.

## Структура

```
ai-services/
├── factories/         # Фабрики для создания сервисов
├── services/          # Реализации сервисов анализа
│   ├── content/      # Классификация контента
│   ├── ffmpeg/       # FFmpeg интеграция
│   └── vision/       # Computer Vision сервисы
├── types/            # TypeScript типы
└── index.ts          # Главный экспорт
```

## Основные сервисы

### Media Analysis Factory

Централизованная фабрика для создания сервисов анализа:

```typescript
import { createMediaAnalysisFactory } from '@/domains/ai-services'

const factory = createMediaAnalysisFactory()

// Создание сервисов
const ffmpegService = factory.createFFmpegService()
const visionService = factory.createVisionService()
const contentService = factory.createContentAnalysisService()

// Проверка доступности
const isFFmpegAvailable = await factory.isFFmpegAvailable()
const availableServices = await factory.getAvailableServices()
```

### FFmpeg Analysis Service

Анализ видео и аудио с помощью FFmpeg:

```typescript
const ffmpegService = factory.createFFmpegService()

// Анализ видео
const videoAnalysis = await ffmpegService.analyzeVideo('path/to/video.mp4')
// Результат: duration, fps, resolution, codec, scenes, quality

// Анализ аудио
const audioAnalysis = await ffmpegService.analyzeAudio('path/to/audio.mp3')
// Результат: duration, channels, sampleRate, volume, silentSegments

// Извлечение кадров
const frames = await ffmpegService.extractFrames('video.mp4', {
  count: 10,
  format: 'png'
})

// Детекция сцен
const scenes = await ffmpegService.detectScenes('video.mp4', {
  threshold: 0.3
})
```

### Vision Service

Computer Vision анализ с помощью ML моделей:

```typescript
const visionService = factory.createVisionService()

// Анализ кадра
const frameAnalysis = await visionService.analyzeFrame('frame.jpg')
// Результат: objects, faces, text, scene, nsfw

// Детекция объектов
const objects = await visionService.detectObjects(['frame1.jpg', 'frame2.jpg'])

// Анализ композиции
const composition = await visionService.analyzeComposition('frame.jpg')
// Результат: ruleOfThirds, leadingLines, balance, symmetry

// Анализ цветов
const colors = await visionService.analyzeColors('frame.jpg')
// Результат: dominantColors, palette, temperature, saturation
```

### Content Analysis Service

Комплексный анализ контента:

```typescript
const contentService = factory.createContentAnalysisService()

// Полный анализ медиафайла
const analysis = await contentService.analyzeMediaFile({
  path: 'video.mp4',
  name: 'My Video',
  duration: 120
}, {
  enableSceneDetection: true,
  enableObjectDetection: true,
  enableQualityAnalysis: true,
  enableAudioAnalysis: true
})

// Пакетный анализ
const results = await contentService.batchAnalyze(mediaFiles, {
  concurrency: 3,
  progressCallback: (progress) => console.log(`${progress}% complete`)
})
```

### Content Classifier

Классификация контента для различных платформ:

```typescript
import { ContentClassifier } from '@/domains/ai-services'

const classifier = ContentClassifier.getInstance()

// Анализ сцены
const sceneAnalysis = await classifier.analyzeScene({
  mediaFile: { path: 'video.mp4', name: 'video', duration: 60 }
})

// Классификация контента
const classification = await classifier.classifyContent('video.mp4')
// Результат: genre, mood, themes, targetAudience, contentRating

// Адаптация для платформы
const adapted = await classifier.adaptForPlatform(content, 'youtube_shorts', {
  includeSeo: true,
  algorithmOptimized: true
})
```

## Типы данных

### MediaFile

```typescript
interface MediaFile {
  path: string
  name: string
  duration: number
  type?: string
  size?: number
  metadata?: Record<string, any>
}
```

### VideoAnalysisResult

```typescript
interface VideoAnalysisResult {
  duration: number
  fps: number
  resolution: { width: number; height: number }
  codec: string
  bitrate: number
  scenes: SceneInfo[]
  quality: QualityMetrics
}
```

### FrameAnalysisResult

```typescript
interface FrameAnalysisResult {
  objects: ObjectDetection[]
  faces: FaceDetection[]
  text: ExtractedText[]
  scene: SceneClassification
  nsfw: NSFWResult
}
```

## Интеграция с AI Core

AI Services интегрируется с AI Core доменом для использования AI моделей:

```typescript
import { getAIContainer } from '@/domains/ai-core'
import { createMediaAnalysisFactory } from '@/domains/ai-services'

// Регистрация в DI контейнере
const container = getAIContainer()
container.registerSingleton('MediaAnalysisFactory', async () => {
  return createMediaAnalysisFactory()
})

// Использование
const factory = await container.resolve('MediaAnalysisFactory')
```

## Конфигурация

```typescript
interface AnalysisConfig {
  ffmpeg?: {
    path?: string // путь к ffmpeg
    timeout?: number // таймаут операций
  }
  vision?: {
    modelPath?: string // путь к ONNX моделям
    maxConcurrency?: number
  }
  cache?: {
    enabled?: boolean
    directory?: string
    maxSize?: number // в байтах
  }
}
```

## Производительность

- Используется пул воркеров для параллельной обработки
- Кэширование результатов анализа
- Ленивая загрузка ML моделей
- Оптимизация памяти при работе с большими файлами

## Примеры использования

### Анализ видео для монтажа

```typescript
const factory = createMediaAnalysisFactory()
const ffmpeg = factory.createFFmpegService()
const vision = factory.createVisionService()

// Детекция ключевых моментов
const scenes = await ffmpeg.detectScenes('video.mp4')
const keyframes = await ffmpeg.extractKeyframes('video.mp4')

// Анализ каждого ключевого кадра
const frameAnalyses = await Promise.all(
  keyframes.map(frame => vision.analyzeFrame(frame))
)

// Найти кадры с людьми
const peopleFrames = frameAnalyses.filter(
  analysis => analysis.faces.length > 0
)
```

### Контроль качества

```typescript
const quality = await ffmpeg.analyzeQuality('video.mp4')

if (quality.overall < 70) {
  console.warn('Low quality video detected')
  // Рекомендации по улучшению
}
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.