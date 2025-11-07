# Recognition API

## Обзор

Recognition API предоставляет функциональность распознавания объектов, лиц и сцен в видео с использованием YOLO v11 и других ML моделей.

## Основные компоненты

### useRecognition Hook

Главный хук для работы с распознаванием.

```typescript
const {
  recognizeFrame,        // Распознавание в кадре
  recognizeVideo,        // Распознавание в видео
  trackObjects,          // Отслеживание объектов
  isProcessing,          // Флаг обработки
  progress,              // Прогресс обработки
  results,               // Результаты распознавания
  error,                 // Ошибка
} = useRecognition()
```

### RecognitionProvider

Провайдер контекста для системы распознавания.

```typescript
<RecognitionProvider>
  <RecognitionPanel />
  <RecognitionOverlay />
</RecognitionProvider>
```

## Типы распознавания

### ObjectDetection

```typescript
interface ObjectDetection {
  id: string
  type: 'object'
  class: string              // Класс объекта (person, car, etc.)
  confidence: number         // Уверенность (0-1)
  bbox: BoundingBox         // Координаты
  frame: number             // Номер кадра
  timestamp: number         // Время в видео
}

interface BoundingBox {
  x: number        // Левый верхний угол X
  y: number        // Левый верхний угол Y
  width: number    // Ширина
  height: number   // Высота
}
```

### FaceDetection

```typescript
interface FaceDetection {
  id: string
  type: 'face'
  confidence: number
  bbox: BoundingBox
  landmarks?: FaceLandmarks
  embedding?: Float32Array   // Для идентификации
  personId?: string         // ID персоны
  frame: number
  timestamp: number
}

interface FaceLandmarks {
  leftEye: Point
  rightEye: Point
  nose: Point
  leftMouth: Point
  rightMouth: Point
}
```

### SceneDetection

```typescript
interface SceneDetection {
  id: string
  type: 'scene'
  startTime: number
  endTime: number
  duration: number
  keyframe: string         // URL ключевого кадра
  description?: string     // AI описание сцены
  tags?: string[]         // Теги сцены
}
```

## Распознавание объектов

### Одиночный кадр

```typescript
// Распознавание в текущем кадре
const detections = await recognizeFrame({
  videoPath: '/path/to/video.mp4',
  timestamp: 15.5,
  models: ['yolo', 'face'],
  options: {
    minConfidence: 0.5,
    maxDetections: 100
  }
})

// Распознавание в изображении
const imageDetections = await recognizeImage({
  imagePath: '/path/to/image.jpg',
  models: ['yolo'],
  options: {
    classes: ['person', 'car', 'bicycle'] // Только эти классы
  }
})
```

### Batch обработка

```typescript
// Распознавание в нескольких кадрах
const batchResults = await recognizeBatch({
  videoPath: '/path/to/video.mp4',
  timestamps: [5, 10, 15, 20, 25],
  models: ['yolo', 'face'],
  parallel: true
})

// Распознавание с интервалом
const intervalResults = await recognizeInterval({
  videoPath: '/path/to/video.mp4',
  startTime: 0,
  endTime: 30,
  interval: 1, // Каждую секунду
  models: ['yolo']
})
```

## Распознавание видео

### Полное видео

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('Recognition')

// Анализ всего видео
const videoAnalysis = await recognizeVideo({
  videoPath: '/path/to/video.mp4',
  models: ['yolo', 'face', 'scene'],
  options: {
    frameSkip: 5,        // Анализировать каждый 5-й кадр
    minSceneLength: 2,   // Минимальная длина сцены в секундах
    trackObjects: true   // Отслеживание между кадрами
  },
  onProgress: (progress) => {
    logger.debugSync('Recognition progress', { percentage: progress.percentage })
  }
})
```

### Потоковая обработка

```typescript
// Потоковое распознавание
const stream = await startRecognitionStream({
  videoPath: '/path/to/video.mp4',
  models: ['yolo'],
  chunkSize: 30, // Кадров в чанке
})

stream.on('chunk', (results) => {
  processResults(results)
})

stream.on('complete', () => {
  logger.infoSync('Recognition complete', { streamId: stream.id })
})

// Остановка потока
stream.stop()
```

## Отслеживание объектов

### Object Tracking

```typescript
// Инициализация трекера
const tracker = await initializeTracker({
  videoPath: '/path/to/video.mp4',
  initialDetections: detections,
  algorithm: 'SORT' // 'SORT' | 'DeepSORT' | 'ByteTrack'
})

// Отслеживание объектов
const tracks = await tracker.track({
  startFrame: 100,
  endFrame: 500,
  onUpdate: (frame, tracks) => {
    updateVisualization(tracks)
  }
})

// Получение траекторий
const trajectories = tracker.getTrajectories()
```

### Multi-object Tracking

```typescript
// Отслеживание нескольких объектов
const multiTracker = await trackMultipleObjects({
  videoPath: '/path/to/video.mp4',
  objects: [
    { id: 'obj1', bbox: { x: 100, y: 100, width: 50, height: 50 }, frame: 0 },
    { id: 'obj2', bbox: { x: 200, y: 200, width: 60, height: 60 }, frame: 0 }
  ],
  options: {
    maxDistance: 50,      // Максимальное расстояние для связывания
    maxFramesSkipped: 5   // Максимум пропущенных кадров
  }
})
```

## Идентификация персон

### Face Recognition

```typescript
// Создание базы персон
const personDB = await createPersonDatabase()

// Добавление персоны
await personDB.addPerson({
  name: 'John Doe',
  faceImages: ['/path/to/face1.jpg', '/path/to/face2.jpg'],
  metadata: { role: 'actor' }
})

// Идентификация в видео
const identifications = await identifyPersonsInVideo({
  videoPath: '/path/to/video.mp4',
  personDB,
  options: {
    similarityThreshold: 0.6,
    minFaceSize: 50
  }
})
```

### Clustering лиц

```typescript
// Автоматическая группировка лиц
const clusters = await clusterFaces({
  videoPath: '/path/to/video.mp4',
  options: {
    algorithm: 'DBSCAN',
    minSamples: 5,
    epsilon: 0.5
  }
})

// Присвоение имен кластерам
clusters.forEach((cluster, index) => {
  cluster.assignName(`Person ${index + 1}`)
})
```

## Анализ сцен

### Scene Detection

```typescript
// Обнаружение сцен
const scenes = await detectScenes({
  videoPath: '/path/to/video.mp4',
  options: {
    method: 'content', // 'content' | 'threshold' | 'adaptive'
    threshold: 30,     // Для метода threshold
    minSceneLength: 1  // Минимальная длина сцены в секундах
  }
})

// Анализ содержимого сцен
const analyzedScenes = await analyzeScenes(scenes, {
  generateDescriptions: true,
  extractKeyframes: true,
  detectActivities: true
})
```

### Activity Recognition

```typescript
// Распознавание действий
const activities = await recognizeActivities({
  videoPath: '/path/to/video.mp4',
  options: {
    model: 'i3d', // 'i3d' | 'slowfast' | 'x3d'
    classes: ['walking', 'running', 'sitting', 'talking'],
    windowSize: 2 // Секунд
  }
})
```

## Экспорт результатов

### Форматы экспорта

```typescript
// Экспорт в JSON
await exportResults(results, {
  format: 'json',
  outputPath: '/path/to/results.json',
  includeFrames: true,
  includeEmbeddings: false
})

// Экспорт в CSV
await exportResults(results, {
  format: 'csv',
  outputPath: '/path/to/results.csv',
  columns: ['timestamp', 'class', 'confidence', 'bbox']
})

// Экспорт аннотаций
await exportAnnotations(results, {
  format: 'yolo', // 'yolo' | 'coco' | 'pascal-voc'
  outputDir: '/path/to/annotations/',
  saveImages: true
})
```

### Визуализация

```typescript
// Создание видео с аннотациями
await createAnnotatedVideo({
  inputVideo: '/path/to/video.mp4',
  outputVideo: '/path/to/annotated.mp4',
  detections: results,
  options: {
    drawBoundingBoxes: true,
    drawLabels: true,
    drawTracks: true,
    fontSize: 12,
    lineWidth: 2
  }
})

// Генерация тепловой карты
const heatmap = await generateHeatmap(results, {
  type: 'density', // 'density' | 'trajectory'
  resolution: { width: 1920, height: 1080 },
  colormap: 'hot'
})
```

## Фильтрация и поиск

### Фильтрация результатов

```typescript
// Фильтр по классам
const persons = results.filter(d => d.class === 'person')

// Фильтр по уверенности
const highConfidence = results.filter(d => d.confidence > 0.8)

// Фильтр по времени
const timeRange = results.filter(d => 
  d.timestamp >= 10 && d.timestamp <= 20
)

// Комплексный фильтр
const filtered = filterDetections(results, {
  classes: ['person', 'car'],
  minConfidence: 0.6,
  timeRange: { start: 5, end: 15 },
  bbox: { minWidth: 50, minHeight: 50 }
})
```

### Поиск

```typescript
// Поиск похожих лиц
const similarFaces = await findSimilarFaces({
  targetFace: faceDetection,
  database: allFaces,
  threshold: 0.7,
  maxResults: 10
})

// Поиск по описанию
const matches = await searchByDescription({
  query: 'person wearing red shirt',
  detections: results,
  model: 'clip' // Vision-language model
})
```

## Производительность

### Оптимизация

```typescript
// GPU ускорение
const gpuRecognition = await createRecognizer({
  backend: 'cuda', // 'cuda' | 'tensorrt' | 'openvino' | 'cpu'
  device: 0,       // GPU index
  optimization: {
    batchSize: 8,
    fp16: true,    // Half precision
    tensorrt: true // TensorRT оптимизация
  }
})

// Кэширование результатов
const cachedRecognition = withCache(recognition, {
  cacheDir: '/path/to/cache',
  maxSize: '10GB',
  ttl: 86400 // 24 часа
})
```

### Мониторинг

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('RecognitionMetrics')

// Метрики производительности
const metrics = recognition.getMetrics()
logger.debugSync('Performance metrics', {
  fps: metrics.fps,
  latency: metrics.latency,
  gpuUsage: metrics.gpuUsage
})

// Профилирование
const profile = await recognition.profile({
  frames: 100,
  warmup: 10
})
```

## События

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('RecognitionEvents')

// Подписка на события
recognition.on('detection', (detection) => {
  logger.debugSync('New detection', { detection })
})

recognition.on('sceneChange', (scene) => {
  logger.infoSync('Scene changed', { scene })
})

recognition.on('personIdentified', (person) => {
  logger.infoSync('Person identified', { personName: person.name, personId: person.id })
})

recognition.on('progress', (progress) => {
  updateProgressBar(progress)
})

recognition.on('error', (error) => {
  logger.errorSync('Recognition error', { error })
  handleError(error)
})
```

---

*Последнее обновление: 31 июля 2025*