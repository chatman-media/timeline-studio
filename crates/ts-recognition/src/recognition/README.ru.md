# Модуль распознавания - Продвинутая ML интеграция

## Обзор

Модуль распознавания предоставляет комплексную интеграцию с передовыми ML моделями для обнаружения объектов, распознавания лиц и анализа видео. Система построена на базе ONNX Runtime с поддержкой GPU ускорения.

## Текущий статус (Июль 2025)

✅ **Модуль активен и готов к использованию**
- YOLO v8/v11 полностью интегрированы (все размеры: nano→extra)
- FaceNet для генерации embeddings (512D и 128D векторы)
- RetinaFace для высокоточной детекции с 5-точечными landmarks
- MediaPipe для 468-точечных 3D landmarks и анализа выражений
- Кластеризация лиц с алгоритмом DBSCAN
- Privacy Processor с 6 типами размытия лиц
- ORT настроен с версией `2.0.0-rc.10` и `load-dynamic` feature
- Все команды Tauri зарегистрированы и доступны

## Архитектура

### Основные процессоры

1. **YoloProcessor** - Детекция объектов и лиц
   - Поддержка YOLOv8/v11 всех размеров (n/s/m/l/x)
   - Специализированные модели для лиц (face)
   - Сегментация объектов (seg)

2. **FaceNetProcessor** - Генерация face embeddings
   - 512D векторы для высокой точности
   - 128D векторы для быстрой работы
   - ArcFace как альтернатива

3. **RetinaFaceProcessor** - Высокоточная детекция лиц
   - 5 ключевых facial landmarks
   - Head pose estimation
   - Face quality assessment
   - Face alignment

4. **MediaPipeProcessor** - Продвинутый анализ лиц
   - 468 3D facial landmarks
   - Facial expressions анализ
   - 3D head pose с confidence
   - Face geometry анализ

5. **PrivacyProcessor** - Приватность и анонимизация
   - Размытие лиц различными методами
   - Адаптивное размытие на основе размера лица
   - Поддержка batch обработки видео
   - 6 типов размытия (Gaussian, Box, Pixelate, EyeBar, SolidColor, Mosaic)

6. **FaceClusteringEngine** - Умная кластеризация лиц
   - DBSCAN алгоритм для автоматической группировки
   - Поддержка косинусной и евклидовой метрик
   - Автоматическое определение главных персонажей
   - Интеграция с PersonDatabase для сохранения результатов

### Структура модуля

```
recognition/
├── mod.rs                         # Главный модуль
├── commands/                      # Tauri команды
│   ├── mod.rs                    # Реэкспорт команд
│   ├── yolo_commands.rs          # YOLO команды
│   ├── facenet_commands.rs       # FaceNet команды
│   ├── retinaface_commands.rs    # RetinaFace команды
│   ├── mediapipe_commands.rs     # MediaPipe команды
│   ├── privacy_commands.rs       # Privacy команды
│   ├── person_commands.rs        # Person management команды
│   └── recognition_advanced_commands.rs # Продвинутые команды
├── yolo_processor_refactored.rs  # Унифицированный YOLO процессор (async)
├── frame_processor.rs            # Низкоуровневая обработка YOLO
├── model_manager.rs              # Управление YOLO моделями
├── facenet_processor.rs          # FaceNet процессор
├── retinaface_processor.rs       # RetinaFace процессор
├── mediapipe_processor.rs        # MediaPipe процессор
├── privacy_processor.rs          # Privacy процессор
├── face_clustering.rs            # Face clustering engine
├── person_manager.rs             # Управление персонами
├── person_database.rs            # SQLite база персон
├── result_aggregator.rs          # Агрегация результатов
├── recognition_service.rs        # Главный сервис распознавания
├── vision_service.rs             # Высокоуровневый API для анализа
├── types.rs                      # Базовые типы данных
└── types_professional.rs         # Профессиональные типы
```

## Поддерживаемые модели

### YOLO модели
```rust
// YOLOv11 модели (новейшие)
YoloModel::YoloV11Detection     // Детекция объектов v11
YoloModel::YoloV11Segmentation  // Сегментация v11
YoloModel::YoloV11Face          // Детекция лиц v11

// YOLOv8 базовые модели
YoloModel::YoloV8Detection      // Детекция объектов v8
YoloModel::YoloV8Segmentation   // Сегментация v8
YoloModel::YoloV8Face           // Детекция лиц v8

// YOLOv8 размерные варианты (для объектов)
YoloModel::YoloV8Nano          // Самая быстрая (n)
YoloModel::YoloV8Small         // Баланс скорости/точности (s)
YoloModel::YoloV8Medium        // Хорошая точность (m)
YoloModel::YoloV8Large         // Высокая точность (l)
YoloModel::YoloV8Extra         // Максимальная точность (x)

// Кастомные модели
YoloModel::Custom(PathBuf)     // Своя ONNX модель
```

### FaceNet модели
```rust
FaceNetModel::FaceNet512D    // 512-мерные embeddings
FaceNetModel::FaceNet128D    // 128-мерные embeddings
FaceNetModel::ArcFace512D    // ArcFace embeddings
```

### RetinaFace модели
```rust
RetinaFaceModel::ResNet50         // Высокая точность
RetinaFaceModel::MobileNet        // Быстрая обработка
RetinaFaceModel::ResNet50Enhanced // Улучшенная версия
```

### MediaPipe модели
```rust
MediaPipeModel::BlazeFaceShort    // Детекция до 2м
MediaPipeModel::BlazeFaceFull     // Детекция до 5м
MediaPipeModel::FaceMesh           // 468 landmarks
MediaPipeModel::FaceMeshAttention // С attention механизмом
MediaPipeModel::SelfieSegmentation // Портретная сегментация
```

## Процесс работы

### 1. Инициализация процессоров

**⚡ ВАЖНО**: Все процессоры теперь используют async API и создаются автоматически при первом использовании.

```typescript
// YOLO - через ProcessorConfig
const config = {
  model: 'YoloV8Medium',  // или 'YoloV11Detection', 'YoloV8Face' и т.д.
  processing_config: {
    confidence_threshold: 0.5,
    iou_threshold: 0.45,
    max_detections: 100,
    target_classes: ['person', 'car', 'dog'] // опционально
  }
};

// Процессор создается автоматически при вызове команд
const detections = await invoke('yolo_detect_objects', {
  imagePath: '/path/to/image.jpg',
  config: config
});

// FaceNet - автоматическая инициализация
const embedding = await invoke('generate_face_embedding', {
  imagePath: '/path/to/face.jpg'
});

// RetinaFace - автоматическая инициализация
const faces = await invoke('detect_faces_retinaface', {
  imagePath: '/path/to/image.jpg',
  confidence: 0.7
});

// MediaPipe - автоматическая инициализация
const landmarks = await invoke('extract_face_mesh_landmarks', {
  imageData: base64_image_data
});
```

### 2. Обработка изображений

#### YOLO детекция
```typescript
// Одиночное изображение
const detections = await invoke('yolo_detect_objects', {
  imagePath: '/path/to/image.jpg',
  config: {
    model: 'YoloV8Medium',
    processing_config: {
      confidence_threshold: 0.5,
      target_classes: ['person', 'car'] // опционально
    }
  }
});

// Пакетная обработка
const batchResults = await invoke('yolo_detect_objects_batch', {
  imagePaths: ['/path/1.jpg', '/path/2.jpg'],
  config: config
});

// Список доступных моделей
const models = await invoke('yolo_list_available_models');
// ['YoloV8Nano', 'YoloV8Medium', 'YoloV11Detection', ...]
```

#### FaceNet embeddings
```typescript
const embedding = await invoke('generate_face_embedding', {
  imagePath: '/path/to/face.jpg'
});

// Сравнение лиц
const similarity = await invoke('calculate_cosine_similarity', {
  embedding1: face1_embedding,
  embedding2: face2_embedding
});
```

#### RetinaFace landmarks
```typescript
const faces = await invoke('detect_faces_with_landmarks', {
  imagePath: '/path/to/image.jpg'
});

// face = {
//   bbox: { x1, y1, x2, y2 },
//   landmarks: {
//     left_eye: { x, y },
//     right_eye: { x, y },
//     nose_tip: { x, y },
//     mouth_left: { x, y },
//     mouth_right: { x, y }
//   },
//   head_pose: { pitch, yaw, roll },
//   quality_score: 0.95
// }
```

#### MediaPipe анализ
```typescript
// Извлечение 468 landmarks
const landmarks = await invoke('extract_face_mesh_landmarks', {
  imageData: base64_image_data
});

// Анализ выражений лица
const expressions = await invoke('analyze_facial_expressions', {
  imageData: base64_image_data
});

// expressions = {
//   smile_score: 0.8,
//   left_eye_openness: 0.9,
//   right_eye_openness: 0.85,
//   mouth_openness: 0.3,
//   eyebrow_raise: 0.1,
//   gaze_direction: { x: 0.5, y: 0.5 },
//   attention_score: 0.7
// }
```

#### Privacy обработка
```typescript
// Инициализация с типом размытия
await invoke('init_privacy_processor', {
  blurType: 'gaussian' // 'gaussian', 'box', 'pixelate', 'eye_bar', 'solid_black', 'mosaic'
});

// Размытие лиц на изображении с автодетекцией
await invoke('blur_faces_in_image', {
  imagePath: '/path/to/input.jpg',
  outputPath: '/path/to/output.jpg',
  autoDetect: true
});

// Пакетная обработка кадров видео
const result = await invoke('blur_faces_in_video_frames', {
  framePaths: ['/frame1.jpg', '/frame2.jpg'],
  outputDir: '/output/frames/',
  autoDetect: true
});

// result = {
//   total_frames: 2,
//   processed_frames: 2,
//   failed_frames: 0,
//   total_faces_blurred: 5,
//   frame_results: [...]
// }
```

#### Кластеризация лиц
```typescript
// Кластеризация лиц
const result = await invoke('cluster_faces', {
  embeddings: faceEmbeddings,
  params: { eps: 0.5, min_samples: 3, metric: 'cosine' }
});

// result = {
//   clusters: [
//     {
//       id: 'cluster_0',
//       face_indices: [0, 1, 4, 7, 9],
//       centroid: [...],
//       confidence: 0.92,
//       person_name: 'Main Person 1'
//     },
//     ...
//   ],
//   noise_points: [15, 16],
//   stats: {
//     total_faces: 20,
//     num_clusters: 3,
//     num_noise: 2,
//     avg_cluster_size: 6,
//     max_cluster_size: 8,
//     min_cluster_size: 4
//   }
// }

// Поиск ближайшего кластера для нового лица
const nearest = await invoke('find_nearest_cluster', {
  embedding: newFaceEmbedding,
  clusters: existingClusters
});

// Автоматическая кластеризация лиц в видео
await invoke('auto_cluster_video_faces', {
  fileId: 'video-123',
  embeddings: videoEmbeddings,
  metadata: faceMetadata,
  saveResults: true
});
```

## Конфигурация моделей

Все пути к моделям централизованы в `ModelsConfig`:

```rust
pub struct ModelsConfig {
    pub yolo_models: YoloModelsConfig,
    pub facenet_models: FaceNetModelsConfig,
    pub retinaface_models: RetinaFaceModelsConfig,
    pub mediapipe_models: MediaPipeModelsConfig,
}
```

Модели должны быть размещены в соответствующих директориях:
- `models/yolo/` - YOLO модели
- `models/facenet/` - FaceNet модели
- `models/retinaface/` - RetinaFace модели
- `models/mediapipe/` - MediaPipe модели

## Установка моделей

### Автоматическая загрузка
```bash
# Запустите скрипт загрузки моделей
./scripts/download-models.sh
```

### Ручная загрузка
1. YOLO модели: https://github.com/ultralytics/assets/releases
2. FaceNet модели: https://github.com/serengil/deepface_models/releases
3. RetinaFace модели: https://github.com/biubug6/Pytorch_Retinaface
4. MediaPipe модели: https://google.github.io/mediapipe/

## Интеграция с Timeline Studio

### Person Identification Pipeline
```typescript
// 1. Детекция лиц с YOLO
const faces = await detectFacesWithYolo(frame);

// 2. Уточнение с RetinaFace
const refined = await refineWithRetinaFace(faces);

// 3. Извлечение embeddings с FaceNet
const embeddings = await generateEmbeddings(refined);

// 4. Кластеризация лиц
const clusters = await clusterFaces(embeddings);

// 5. Анализ выражений с MediaPipe
const expressions = await analyzeExpressions(refined);

// 6. Сохранение в базу персон
await saveToPersonDatabase({
  embeddings,
  clusters,
  expressions,
  landmarks: refined.landmarks
});
```

### Smart Montage Integration
```typescript
// Анализ ключевых моментов по лицам
const keyMoments = await detectKeyMoments({
  useSmileDetection: true,
  useExpressionAnalysis: true,
  useHeadPoseTracking: true
});
```

## Производительность

### Скорость обработки (RTX 3080)
- YOLO nano: 100+ FPS
- YOLO medium: 50+ FPS
- FaceNet 512D: 30ms/лицо
- RetinaFace: 40ms/кадр
- MediaPipe FaceMesh: 25ms/лицо
- Face Clustering: <100ms для 100 лиц

### Оптимизация
1. **GPU ускорение**: Автоматически для всех моделей
2. **Batch processing**: До 10x ускорение
3. **Model caching**: Модели загружаются один раз
4. **Parallel processing**: Разные процессоры могут работать параллельно

## API команд

### YOLO команды (обновлено для async API)
- `yolo_detect_objects(imagePath: string, config: ProcessorConfigDto)` - Детекция объектов
- `yolo_detect_objects_batch(imagePaths: string[], config: ProcessorConfigDto)` - Пакетная детекция
- `yolo_list_available_models()` - Список доступных моделей

### FaceNet команды
- `generate_face_embedding(imagePath: string)` - Генерация embedding из файла
- `generate_face_embedding_from_base64(imageData: string)` - Генерация из base64
- `calculate_cosine_similarity(embedding1: number[], embedding2: number[])` - Сравнение лиц

### RetinaFace команды
- `detect_faces_retinaface(imagePath: string, confidence: number)` - Детекция лиц с landmarks
- `detect_faces_with_landmarks_from_base64(imageData: string)` - Детекция из base64
- `get_aligned_face(imageData: string, landmarks: FacialLandmarks)` - Выравнивание лица

### MediaPipe команды
- `detect_faces_blazeface(imagePath: string)` - Быстрая детекция лиц
- `extract_face_mesh_landmarks(imageData: string)` - 468 landmarks
- `analyze_facial_expressions(imageData: string)` - Анализ выражений

### Privacy команды
- `blur_faces_in_image(imagePath: string, outputPath: string, autoDetect: boolean)` - Размытие лиц
- `blur_faces_in_video_frames(framePaths: string[], outputDir: string, autoDetect: boolean)` - Пакетное размытие
- `update_privacy_settings(blurType?: string, expandRatio?: number, adaptiveBlur?: boolean)` - Настройки

### Person Management команды (новые)
- `create_person(name: Option<string>, faceImages: string[])` - Создать профиль персоны
- `identify_person(faceImage: string, threshold: number)` - Идентифицировать по лицу
- `list_all_persons()` - Список всех персон
- `update_person_name(personId: string, name: string)` - Обновить имя
- `delete_person(personId: string)` - Удалить персону

### Advanced Recognition команды
- `analyze_image_full(imagePath: string, options: AnalysisOptions)` - Полный анализ изображения
- `analyze_video_full(videoPath: string, options: AnalysisOptions)` - Полный анализ видео
- `search_person_in_video(personId: string, videoPath: string)` - Поиск персоны в видео
- `auto_cluster_faces_in_video(videoPath: string)` - Автокластеризация лиц

## Структуры данных

### Detection результат
```typescript
interface Detection {
  class: string;
  class_id: number;
  confidence: number;
  bbox: BoundingBox;
  attributes?: Map<string, any>;
}
```

### Face Embedding
```typescript
interface FaceEmbedding {
  embedding: Float32Array;  // 512 или 128 значений
  model_type: string;
  face_bbox: BoundingBox;
  quality_score: number;
}
```

### Facial Landmarks
```typescript
interface FacialLandmarks {
  points: Point3D[];        // 5, 68 или 468 точек
  confidence: number;
  face_bbox: BoundingBox;
  head_pose?: HeadPose3D;
}
```

### Результат кластеризации
```typescript
interface ClusteringResult {
  clusters: FaceCluster[];
  noise_points: number[];
  stats: ClusteringStats;
}

interface FaceCluster {
  id: string;
  face_indices: number[];
  centroid: number[];
  confidence: number;
  person_name?: string;
}

interface ClusteringStats {
  total_faces: number;
  num_clusters: number;
  num_noise: number;
  avg_cluster_size: number;
  max_cluster_size: number;
  min_cluster_size: number;
}
```

## Тестирование

```bash
# Все тесты
cargo test --package timeline-studio --lib recognition

# Конкретный процессор
cargo test --package timeline-studio --lib recognition::yolo_processor
cargo test --package timeline-studio --lib recognition::facenet_processor
cargo test --package timeline-studio --lib recognition::retinaface_processor
cargo test --package timeline-studio --lib recognition::mediapipe_processor
cargo test --package timeline-studio --lib recognition::face_clustering
```

## Известные ограничения

1. Модели должны быть загружены отдельно (300MB-2GB)
2. Первая инициализация может занять 5-10 секунд
3. GPU память: минимум 4GB VRAM для всех моделей
4. MediaPipe требует специальный формат ONNX моделей

## Планы развития

### Q3 2025
- [ ] TensorRT оптимизация для NVIDIA GPU
- [ ] CoreML интеграция для Apple Silicon
- [ ] WebGPU поддержка для браузерной версии

### Q4 2025
- [ ] Трекинг объектов между кадрами (DeepSORT)
- [ ] Real-time обработка видеопотока
- [ ] Распознавание жестов и поз (MediaPipe Holistic)
- [ ] Интеграция с облачными API (AWS Rekognition, Azure Face)

## Контакты

Для вопросов и предложений по модулю распознавания:
- GitHub Issues: https://github.com/timeline-studio/issues
- Email: recognition@timeline.studio