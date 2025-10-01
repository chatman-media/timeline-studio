# Scene Analysis Engine

Движок для интеллектуального анализа видео сцен с использованием computer vision и AI.

## 🎯 Возможности

- **Детекция сцен** - автоматическое обнаружение смены сцен
- **Распознавание объектов** - YOLO модели через ONNX Runtime
- **Классификация контента** - определение типа и жанра видео
- **Анализ качества** - оценка технического качества видео
- **Ключевые моменты** - поиск важных моментов в видео
- **Композиционный анализ** - правило третей, баланс, линии

## 📁 Структура

```
scene-analysis/
├── services/
│   ├── scene-analysis-engine.ts    # Главный движок
│   ├── content-classifier.ts       # Классификация контента
│   ├── vision-service.ts          # Computer vision функции
│   └── onnx-runtime-service.ts    # ONNX модели
├── types.ts                        # TypeScript типы
└── README.md
```

## 🚀 Использование

### Базовый анализ

```typescript
import { SceneAnalysisEngine } from './services/scene-analysis-engine'

const engine = new SceneAnalysisEngine()
await engine.initialize()

const result = await engine.process({
  mediaFile: {
    path: '/path/to/video.mp4',
    name: 'my-video.mp4',
    duration: 120
  }
})

console.log(result.scenes) // Массив обнаруженных сцен
console.log(result.keyMoments) // Важные моменты
console.log(result.classification) // Тип контента
```

### Анализ отдельного кадра

```typescript
const frameAnalysis = await engine.analyzeFrame(imageData)

// Результат:
{
  objects: [...],      // Обнаруженные объекты
  faces: [...],        // Лица
  composition: {...},  // Композиция
  quality: {...}       // Качество
}
```

### Настройка конфигурации

```typescript
const config: SceneAnalysisConfig = {
  ffmpeg: {
    sceneThreshold: 0.3,      // Чувствительность (0-1)
    minSceneLength: 2,        // Мин. длина сцены
    keyframeInterval: 1,      // Интервал ключевых кадров
    qualitySampleRate: 2      // Частота анализа качества
  },
  vision: {
    enableObjectDetection: true,
    enableFaceDetection: true,
    enableTextRecognition: false,
    objectConfidenceThreshold: 0.7,
    maxObjectsPerFrame: 10
  },
  ai: {
    enableSmartCropping: true,
    enableContentModeration: true,
    enableEmotionDetection: true
  }
}

const result = await engine.process(data, config)
```

## 🧠 AI Модели

### ONNX Runtime Service

Сервис для работы с ONNX моделями в браузере.

```typescript
const onnxService = new ONNXRuntimeService()
await onnxService.initialize()

// Загрузка модели
await onnxService.loadModel('yolov8n', '/models/yolov8n.onnx')

// Детекция объектов
const detections = await onnxService.runYOLOInference(imageData)
```

**Поддерживаемые модели:**
- YOLO v8 (nano, small, medium)
- Face Detection
- Scene Classification
- Emotion Recognition

### Vision Service

Высокоуровневый сервис для computer vision задач.

```typescript
const visionService = new VisionService()

// Детекция объектов
const objects = await visionService.detectObjects(imageData)

// Распознавание лиц
const faces = await visionService.detectFaces(imageData)

// Анализ композиции
const composition = await visionService.analyzeComposition(imageData)
```

### Content Classifier

Классификация видео контента по типу и жанру.

```typescript
const classifier = new ContentClassifier()

const classification = await classifier.classifyContent(scenes)
// Результат:
{
  contentType: 'movie',
  genres: ['action', 'drama'],
  confidence: 0.85
}
```

## 📊 Типы данных

### SceneAnalysisResult

```typescript
interface SceneAnalysisResult {
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]
  classification: {
    contentType: ContentType
    genres: Genre[]
    confidence: number
  }
  timeline: TimelineData
  audioAnalysis: AudioCharacteristics
  visualAnalysis: VisualCharacteristics
  summary: {
    totalScenes: number
    averageSceneDuration: number
    dominantColors: ColorInfo[]
    overallQuality: QualityScore
  }
}
```

### SceneAnalysis

```typescript
interface SceneAnalysis {
  id: string
  startTime: number
  endTime: number
  duration: number
  type: SceneType
  keyFrames: KeyFrame[]
  quality: QualityMetrics
  content: ContentElements
  transitions: SceneTransition[]
}
```

### KeyMoment

```typescript
interface KeyMoment {
  id: string
  timestamp: number
  duration: number
  type: 'climax' | 'emotional_peak' | 'action_peak' | 'visual_highlight'
  score: number
  description: string
  context: any
}
```

## ⚡ Производительность

- **Анализ сцен**: ~2-5 сек на минуту видео
- **Детекция объектов**: ~100ms на кадр
- **Классификация**: <1 сек на видео
- **Полный анализ**: ~10-30 сек для 5-минутного видео

### Оптимизация

1. **Параллельная обработка** - анализ нескольких кадров одновременно
2. **Кэширование** - результаты сохраняются в IndexedDB
3. **Lazy loading** - модели загружаются по требованию
4. **WebGL ускорение** - использование GPU для ONNX

## 🔧 Требования

- Браузер с поддержкой WebGL 2.0
- Минимум 4GB RAM
- ONNX Runtime библиотека
- FFmpeg (для Tauri версии)

## 🐛 Отладка

```typescript
// Включить debug логи
engine.enableDebug = true

// Проверить загруженные модели
const models = onnxService.getLoadedModels()

// Получить статистику производительности
const stats = engine.getPerformanceStats()
```

## 📝 Примеры

### Анализ YouTube видео

```typescript
const result = await engine.process(videoFile, {
  ffmpeg: { sceneThreshold: 0.4 },
  vision: { enableObjectDetection: true },
  ai: { enableSmartCropping: false }
})

// Создание глав для YouTube
const chapters = result.scenes.map(scene => ({
  time: scene.startTime,
  title: getSceneTitle(scene.type)
}))
```

### Поиск лучших моментов для превью

```typescript
const keyMoments = result.keyMoments
  .filter(m => m.score > 0.8)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)

// Использовать для создания превью
```