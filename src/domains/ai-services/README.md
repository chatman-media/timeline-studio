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
  progressCallback: (progress) => logger.debugSync(`${progress}% complete`)
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
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

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
  logger.warnSync('Low quality video detected')
  // Рекомендации по улучшению
}
```

## API (Backend Commands)

### Content Intelligence Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `ffmpeg_detect_scenes` | `{ videoPath: string }` | Детекция сцен в видео через FFmpeg |
| `ffmpeg_analyze_quality` | `{ videoPath: string }` | Анализ качества видео |
| `ffmpeg_detect_silence` | `{ videoPath: string }` | Обнаружение тишины в видео |
| `ffmpeg_analyze_motion` | `{ videoPath: string }` | Анализ движения в видео |
| `ffmpeg_extract_keyframes` | `{ videoPath: string, options?: {...} }` | Извлечение ключевых кадров |
| `ffmpeg_analyze_audio` | `{ videoPath: string }` | Анализ аудиодорожки |
| `ffmpeg_quick_analysis` | `{ filePath: string }` | Быстрый анализ видеофайла |

### Recognition Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_yolo_processor` | `{ modelPath: string, device: string }` | Инициализация YOLO процессора |
| `detect_objects_in_image` | `{ processorId: string, imagePath: string }` | Детекция объектов на изображении |
| `analyze_video_with_yolo` | `{ processorId: string, videoPath: string, options?: {...} }` | Анализ видео с YOLO |
| `init_retinaface_processor` | `{}` | Инициализация RetinaFace детектора |
| `detect_faces_with_landmarks` | `{ imagePath: string }` | Детекция лиц с ключевыми точками |
| `init_facenet_processor` | `{}` | Инициализация FaceNet для эмбеддингов |
| `generate_face_embedding` | `{ imagePath: string }` | Генерация эмбеддинга лица |
| `calculate_cosine_similarity` | `{ embedding1: number[], embedding2: number[] }` | Вычисление схожести эмбеддингов |

### Montage Planner Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `analyze_montage_videos` | `{ videos: MediaFile[] }` | Анализ видео для монтажа |
| `analyze_video_composition` | `{ videoPath: string }` | Анализ композиции видео |
| `detect_key_moments` | `{ videoPath: string }` | Детекция ключевых моментов |
| `generate_montage_plan` | `{ analysis: Analysis, preferences: Preferences }` | Генерация плана монтажа |
| `optimize_montage_plan` | `{ plan: MontagePlan, constraints: Constraints }` | Оптимизация плана монтажа |
| `validate_montage_plan` | `{ plan: MontagePlan }` | Валидация плана монтажа |
| `apply_montage_plan` | `{ plan: MontagePlan }` | Применение плана к таймлайну |
| `export_montage_plan` | `{ plan: MontagePlan, format: string }` | Экспорт плана монтажа |

### Audio & Whisper Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `analyze_audio_peaks` | `{ audioPath: string, options?: {...} }` | Анализ аудио пиков |
| `detect_speech_onsets` | `{ audioPath: string, options?: {...} }` | Детекция начала речи |
| `whisper_transcribe_openai` | `{ audioPath: string, options: WhisperOptions }` | Транскрипция через Whisper |

### Person Identification Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `create_person` | `{ name: string }` | Создание записи персоны |
| `get_person` | `{ personId: string }` | Получение данных персоны |
| `add_face_embedding` | `{ personId: string, embedding: number[], metadata: {...} }` | Добавление эмбеддинга лица |
| `search_similar_persons` | `{ embedding: number[], topK?: number }` | Поиск похожих персон |
| `delete_person` | `{ personId: string }` | Удаление персоны |
| `init_advanced_tracking` | `{ config: TrackingConfig }` | Инициализация трекинга |
| `start_person_tracking` | `{ videoPath: string, options?: {...} }` | Запуск трекинга персон |
| `assign_person_to_track` | `{ trackId: string, personId: string }` | Привязка персоны к треку |
| `merge_tracks` | `{ sourceTrackId: string, targetTrackId: string }` | Объединение треков |

### Chat & API Keys Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `save_simple_api_key` | `{ serviceName: string, apiKey: string }` | Сохранение API ключа |
| `get_decrypted_api_key` | `{ serviceName: string }` | Получение расшифрованного ключа |
| `validate_api_key` | `{ serviceName: string, apiKey: string }` | Валидация API ключа |
| `list_api_keys` | `{}` | Список сохранённых ключей |
| `delete_api_key` | `{ serviceName: string }` | Удаление API ключа |

## Behavior (from tests) / Поведение (из тестов)

### unified-orchestrator.test.ts
- ✓ Orchestrator предоставляет методы для всех AI операций
- ✓ Интеграция с FFmpeg, YOLO, Whisper сервисами
- ✓ Обработка ошибок и retry логика
- ✓ Кэширование результатов анализа

### chat-machine.test.ts
- ✓ XState машина для управления AI чатом
- ✓ Отправка сообщений и получение ответов
- ✓ Поддержка streaming ответов
- ✓ Управление историей сообщений

### ai-intelligence-machine.test.ts
- ✓ Машина состояний для AI интеллекта
- ✓ Анализ контента и генерация адаптаций
- ✓ Интеграция с платформами (YouTube, TikTok, Instagram)

### use-unified-analysis.test.tsx
- ✓ React хук для унифицированного анализа
- ✓ Асинхронная загрузка результатов
- ✓ Обработка состояний loading/error/success

## Dependencies / Зависимости

### Depends on:
- `@tauri-apps/api` - Tauri IPC для коммуникации с backend
- `xstate` - State machines для управления сложным состоянием
- `@/lib/tauri-logger` - Логирование операций

### Used by:
- `@/features/ai-chat` - AI ассистент в редакторе
- `@/features/ai-director` - AI режиссер для автомонтажа
- `@/features/recognition` - Распознавание объектов и лиц
- `@/domains/ai-tools` - AI инструменты для интеграции

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Работа с файлами | ✅ Ready | `file-system.spec.ts` | 🔴 High |
| FFmpeg анализ видео | ⏳ Planned | - | 🔴 High |
| FFmpeg детекция сцен | ⏳ Planned | - | 🔴 High |
| FFmpeg извлечение ключевых кадров | ⏳ Planned | - | 🟡 Medium |
| FFmpeg анализ аудио | ⏳ Planned | - | 🟡 Medium |
| YOLO детекция объектов | ⏳ Planned | - | 🔴 High |
| YOLO анализ видео | ⏳ Planned | - | 🔴 High |
| RetinaFace детекция лиц | ⏳ Planned | - | 🟡 Medium |
| FaceNet эмбеддинги | ⏳ Planned | - | 🟡 Medium |
| Whisper транскрипция | ⏳ Planned | - | 🔴 High |
| Person identification | ⏳ Planned | - | 🟡 Medium |
| Монтаж планнер анализ | ⏳ Planned | - | 🔴 High |
| Монтаж планнер генерация плана | ⏳ Planned | - | 🔴 High |
| AI Chat API ключи | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал (FFmpeg, YOLO, Whisper, монтаж планнер)
- 🟡 Medium - важный функционал (face detection, embeddings, API keys)
- 🟢 Low - дополнительный функционал

### Команды для тестирования

```typescript
// Content Intelligence
invoke('ffmpeg_detect_scenes', { videoPath })
invoke('ffmpeg_analyze_quality', { videoPath })
invoke('ffmpeg_extract_keyframes', { videoPath, options })
invoke('ffmpeg_analyze_audio', { videoPath })

// Recognition
invoke('init_yolo_processor', { modelPath, device })
invoke('detect_objects_in_image', { processorId, imagePath })
invoke('analyze_video_with_yolo', { processorId, videoPath, options })

// Whisper
invoke('whisper_transcribe_openai', { audioPath, options })

// Montage Planner
invoke('analyze_montage_videos', { videos })
invoke('generate_montage_plan', { analysis, preferences })
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.