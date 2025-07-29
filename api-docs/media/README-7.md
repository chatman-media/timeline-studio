# Recognition Module - Advanced ML Integration

[🇷🇺 Русская версия](#russian-version)

## Overview

The recognition module provides comprehensive integration with advanced ML models for object detection, face recognition, and video analysis. The system is built on ONNX Runtime with GPU acceleration support.

## Current Status (July 2025)

✅ **Module is active and ready to use**
- YOLO v8/v11 fully integrated (all sizes: nano→extra)
- FaceNet for embeddings generation (512D and 128D vectors)
- RetinaFace for high-precision detection with 5-point landmarks
- MediaPipe for 468-point 3D landmarks and expression analysis
- Face Clustering with DBSCAN algorithm
- Privacy Processor with 6 face blurring types
- ORT configured with version `2.0.0-rc.10` and `load-dynamic` feature
- All Tauri commands registered and available

## Architecture

### Core Processors

1. **YoloProcessor** - Object and face detection
   - Support for YOLOv8/v11 all sizes (n/s/m/l/x)
   - Specialized face models (face)
   - Object segmentation (seg)

2. **FaceNetProcessor** - Face embeddings generation
   - 512D vectors for high accuracy
   - 128D vectors for fast processing
   - ArcFace as alternative

3. **RetinaFaceProcessor** - High-precision face detection
   - 5 key facial landmarks
   - Head pose estimation
   - Face quality assessment
   - Face alignment

4. **MediaPipeProcessor** - Advanced face analysis
   - 468 3D facial landmarks
   - Facial expressions analysis
   - 3D head pose with confidence
   - Face geometry analysis

5. **PrivacyProcessor** - Privacy and anonymization
   - Face blurring with various methods
   - Adaptive blur based on face size
   - Batch video processing support
   - 6 blur types (Gaussian, Box, Pixelate, EyeBar, SolidColor, Mosaic)

6. **FaceClusteringEngine** - Smart face clustering
   - DBSCAN algorithm for automatic grouping
   - Support for cosine and Euclidean metrics
   - Automatic main character detection
   - Integration with PersonDatabase for saving results

### Module Structure

```
recognition/
├── mod.rs                         # Main module
├── commands/                      # Tauri commands
│   ├── mod.rs                    # Command re-exports
│   ├── yolo_commands.rs          # YOLO commands
│   ├── yolo_commands_simple.rs   # Simplified YOLO commands
│   ├── facenet_commands.rs       # FaceNet commands
│   ├── retinaface_commands.rs    # RetinaFace commands
│   ├── mediapipe_commands.rs     # MediaPipe commands
│   ├── privacy_commands.rs       # Privacy commands
│   └── clustering_commands.rs    # Clustering commands
├── yolo_processor.rs             # YOLO processor
├── facenet_processor.rs          # FaceNet processor
├── retinaface_processor.rs       # RetinaFace processor
├── mediapipe_processor.rs        # MediaPipe processor
├── privacy_processor.rs          # Privacy processor
├── face_clustering.rs            # Face clustering engine
├── model_manager.rs              # Model management
├── frame_processor.rs            # Frame processing
├── result_aggregator.rs          # Result aggregation
├── recognition_service.rs        # Recognition service
└── types.rs                      # Common data types
```

## Supported Models

### YOLO Models
```rust
// Object detection
YoloModel::YoloV8Nano        // Fastest
YoloModel::YoloV8Small       // Balance of speed and accuracy
YoloModel::YoloV8Medium      // Good accuracy
YoloModel::YoloV8Large       // High accuracy
YoloModel::YoloV8Extra       // Maximum accuracy

// Face detection
YoloModel::YoloV8FaceNano    // Fast face detection
YoloModel::YoloV8FaceMedium  // Accurate face detection
YoloModel::YoloV11Face       // Latest face model
```

### FaceNet Models
```rust
FaceNetModel::FaceNet512D    // 512-dimensional embeddings
FaceNetModel::FaceNet128D    // 128-dimensional embeddings
FaceNetModel::ArcFace512D    // ArcFace embeddings
```

### RetinaFace Models
```rust
RetinaFaceModel::ResNet50         // High accuracy
RetinaFaceModel::MobileNet        // Fast processing
RetinaFaceModel::ResNet50Enhanced // Enhanced version
```

### MediaPipe Models
```rust
MediaPipeModel::BlazeFaceShort    // Detection up to 2m
MediaPipeModel::BlazeFaceFull     // Detection up to 5m
MediaPipeModel::FaceMesh           // 468 landmarks
MediaPipeModel::FaceMeshAttention // With attention mechanism
MediaPipeModel::SelfieSegmentation // Portrait segmentation
```

## Workflow

### 1. Processor Initialization

```rust
// YOLO
let yolo_state = State<YoloProcessorState>;
invoke('init_yolo_processor', { modelType: 'yolov8n-face' });

// FaceNet
let facenet_state = State<FaceNetProcessorState>;
invoke('init_facenet_processor', { modelType: 'facenet-512d' });

// RetinaFace
let retinaface_state = State<RetinaFaceProcessorState>;
invoke('init_retinaface_processor', { modelType: 'retinaface-r50' });

// MediaPipe
let mediapipe_state = State<MediaPipeProcessorState>;
invoke('init_mediapipe_processor', { modelType: 'face-mesh' });

// Face Clustering
let clustering_state = State<ClusteringEngineState>;
invoke('init_clustering_engine', { params: { eps: 0.5, min_samples: 3 } });
```

### 2. Image Processing

#### YOLO Detection
```typescript
const detections = await invoke('detect_objects_in_image', {
  imagePath: '/path/to/image.jpg'
});
```

#### FaceNet Embeddings
```typescript
const embedding = await invoke('generate_face_embedding', {
  imagePath: '/path/to/face.jpg'
});

// Face comparison
const similarity = await invoke('calculate_cosine_similarity', {
  embedding1: face1_embedding,
  embedding2: face2_embedding
});
```

#### RetinaFace Landmarks
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

#### MediaPipe Analysis
```typescript
// Extract 468 landmarks
const landmarks = await invoke('extract_face_mesh_landmarks', {
  imageData: base64_image_data
});

// Facial expressions analysis
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

#### Privacy Processing
```typescript
// Initialize with blur type
await invoke('init_privacy_processor', {
  blurType: 'gaussian' // 'gaussian', 'box', 'pixelate', 'eye_bar', 'solid_black', 'mosaic'
});

// Blur faces in image with auto-detection
await invoke('blur_faces_in_image', {
  imagePath: '/path/to/input.jpg',
  outputPath: '/path/to/output.jpg',
  autoDetect: true
});

// Batch process video frames
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

#### Face Clustering
```typescript
// Cluster faces
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

// Find nearest cluster for new face
const nearest = await invoke('find_nearest_cluster', {
  embedding: newFaceEmbedding,
  clusters: existingClusters
});

// Auto-cluster video faces
await invoke('auto_cluster_video_faces', {
  fileId: 'video-123',
  embeddings: videoEmbeddings,
  metadata: faceMetadata,
  saveResults: true
});
```

## Model Configuration

All model paths are centralized in `ModelsConfig`:

```rust
pub struct ModelsConfig {
    pub yolo_models: YoloModelsConfig,
    pub facenet_models: FaceNetModelsConfig,
    pub retinaface_models: RetinaFaceModelsConfig,
    pub mediapipe_models: MediaPipeModelsConfig,
}
```

Models should be placed in appropriate directories:
- `models/yolo/` - YOLO models
- `models/facenet/` - FaceNet models
- `models/retinaface/` - RetinaFace models
- `models/mediapipe/` - MediaPipe models

## Model Installation

### Automatic Download
```bash
# Run the model download script
./scripts/download-models.sh
```

### Manual Download
1. YOLO models: https://github.com/ultralytics/assets/releases
2. FaceNet models: https://github.com/serengil/deepface_models/releases
3. RetinaFace models: https://github.com/biubug6/Pytorch_Retinaface
4. MediaPipe models: https://google.github.io/mediapipe/

## Timeline Studio Integration

### Person Identification Pipeline
```typescript
// 1. Face detection with YOLO
const faces = await detectFacesWithYolo(frame);

// 2. Refinement with RetinaFace
const refined = await refineWithRetinaFace(faces);

// 3. Extract embeddings with FaceNet
const embeddings = await generateEmbeddings(refined);

// 4. Cluster faces
const clusters = await clusterFaces(embeddings);

// 5. Expression analysis with MediaPipe
const expressions = await analyzeExpressions(refined);

// 6. Save to person database
await saveToPersonDatabase({
  embeddings,
  clusters,
  expressions,
  landmarks: refined.landmarks
});
```

### Smart Montage Integration
```typescript
// Analyze key moments by faces
const keyMoments = await detectKeyMoments({
  useSmileDetection: true,
  useExpressionAnalysis: true,
  useHeadPoseTracking: true
});
```

## Performance

### Processing Speed (RTX 3080)
- YOLO nano: 100+ FPS
- YOLO medium: 50+ FPS
- FaceNet 512D: 30ms/face
- RetinaFace: 40ms/frame
- MediaPipe FaceMesh: 25ms/face
- Face Clustering: <100ms for 100 faces

### Optimization
1. **GPU acceleration**: Automatic for all models
2. **Batch processing**: Up to 10x speedup
3. **Model caching**: Models loaded once
4. **Parallel processing**: Different processors can work in parallel

## API Commands

### YOLO Commands
- `init_yolo_processor(modelType: string)`
- `detect_objects_in_image(imagePath: string)`
- `analyze_video_with_yolo(videoPath: string, options: YoloOptions)`
- `update_yolo_confidence_threshold(threshold: number)`

### FaceNet Commands
- `init_facenet_processor(modelType: string)`
- `generate_face_embedding(imagePath: string)`
- `generate_face_embedding_from_base64(imageData: string)`
- `calculate_cosine_similarity(embedding1: number[], embedding2: number[])`

### RetinaFace Commands
- `init_retinaface_processor(modelType: string)`
- `detect_faces_with_landmarks(imagePath: string)`
- `detect_faces_with_landmarks_from_base64(imageData: string)`
- `get_aligned_face(imageData: string, landmarks: FacialLandmarks)`
- `configure_retinaface_thresholds(confidence: number, nms: number)`

### MediaPipe Commands
- `init_mediapipe_processor(modelType: string)`
- `detect_faces_blazeface(imagePath: string)`
- `extract_face_mesh_landmarks(imageData: string)`
- `analyze_facial_expressions(imageData: string)`
- `configure_mediapipe_settings(confidence: number, maxFaces: number)`

### Privacy Commands
- `init_privacy_processor(blurType: string)`
- `blur_faces_in_image(imagePath: string, outputPath: string, autoDetect: boolean)`
- `update_privacy_settings(blurType?: string, expandRatio?: number, adaptiveBlur?: boolean)`
- `blur_faces_in_video_frames(framePaths: string[], outputDir: string, autoDetect: boolean)`
- `get_privacy_processor_info()`

### Clustering Commands
- `init_clustering_engine(params?: DBSCANParams)`
- `cluster_faces(embeddings: number[][], params?: DBSCANParams)`
- `find_nearest_cluster(embedding: number[], clusters: FaceCluster[])`
- `update_clustering_params(params: DBSCANParams)`
- `merge_clusters(cluster1: FaceCluster, cluster2: FaceCluster, embeddings: number[][])`
- `analyze_clustering_quality(result: ClusteringResult)`
- `auto_cluster_video_faces(fileId: string, embeddings: number[][], metadata: FaceMetadata[], saveResults: boolean)`
- `get_clustering_engine_info()`

## Data Structures

### Detection Result
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
  embedding: Float32Array;  // 512 or 128 values
  model_type: string;
  face_bbox: BoundingBox;
  quality_score: number;
}
```

### Facial Landmarks
```typescript
interface FacialLandmarks {
  points: Point3D[];        // 5, 68 or 468 points
  confidence: number;
  face_bbox: BoundingBox;
  head_pose?: HeadPose3D;
}
```

### Clustering Result
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

## Testing

```bash
# All tests
cargo test --package timeline-studio --lib recognition

# Specific processor
cargo test --package timeline-studio --lib recognition::yolo_processor
cargo test --package timeline-studio --lib recognition::facenet_processor
cargo test --package timeline-studio --lib recognition::retinaface_processor
cargo test --package timeline-studio --lib recognition::mediapipe_processor
cargo test --package timeline-studio --lib recognition::face_clustering
```

## Known Limitations

1. Models must be downloaded separately (300MB-2GB)
2. First initialization may take 5-10 seconds
3. GPU memory: minimum 4GB VRAM for all models
4. MediaPipe requires special ONNX model format

## Development Plans

### Q3 2025
- [ ] TensorRT optimization for NVIDIA GPU
- [ ] CoreML integration for Apple Silicon
- [ ] WebGPU support for browser version

### Q4 2025
- [ ] Object tracking between frames (DeepSORT)
- [ ] Real-time video stream processing
- [ ] Gesture and pose recognition (MediaPipe Holistic)
- [ ] Cloud API integration (AWS Rekognition, Azure Face)

## Contacts

For questions and suggestions about the recognition module:
- GitHub Issues: https://github.com/timeline-studio/issues
- Email: recognition@timeline.studio

---

<a name="russian-version"></a>

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
│   ├── yolo_commands_simple.rs   # Упрощенные YOLO команды
│   ├── facenet_commands.rs       # FaceNet команды
│   ├── retinaface_commands.rs    # RetinaFace команды
│   ├── mediapipe_commands.rs     # MediaPipe команды
│   ├── privacy_commands.rs       # Privacy команды
│   └── clustering_commands.rs    # Clustering команды
├── yolo_processor.rs             # YOLO процессор
├── facenet_processor.rs          # FaceNet процессор
├── retinaface_processor.rs       # RetinaFace процессор
├── mediapipe_processor.rs        # MediaPipe процессор
├── privacy_processor.rs          # Privacy процессор
├── face_clustering.rs            # Face clustering engine
├── model_manager.rs              # Управление моделями
├── frame_processor.rs            # Обработка кадров
├── result_aggregator.rs          # Агрегация результатов
├── recognition_service.rs        # Сервис распознавания
└── types.rs                      # Общие типы данных
```

## Поддерживаемые модели

### YOLO модели
```rust
// Детекция объектов
YoloModel::YoloV8Nano        // Самая быстрая
YoloModel::YoloV8Small       // Баланс скорости и точности
YoloModel::YoloV8Medium      // Хорошая точность
YoloModel::YoloV8Large       // Высокая точность
YoloModel::YoloV8Extra       // Максимальная точность

// Детекция лиц
YoloModel::YoloV8FaceNano    // Быстрая детекция лиц
YoloModel::YoloV8FaceMedium  // Точная детекция лиц
YoloModel::YoloV11Face       // Новейшая модель для лиц
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

```rust
// YOLO
let yolo_state = State<YoloProcessorState>;
invoke('init_yolo_processor', { modelType: 'yolov8n-face' });

// FaceNet
let facenet_state = State<FaceNetProcessorState>;
invoke('init_facenet_processor', { modelType: 'facenet-512d' });

// RetinaFace
let retinaface_state = State<RetinaFaceProcessorState>;
invoke('init_retinaface_processor', { modelType: 'retinaface-r50' });

// MediaPipe
let mediapipe_state = State<MediaPipeProcessorState>;
invoke('init_mediapipe_processor', { modelType: 'face-mesh' });

// Face Clustering
let clustering_state = State<ClusteringEngineState>;
invoke('init_clustering_engine', { params: { eps: 0.5, min_samples: 3 } });
```

### 2. Обработка изображений

#### YOLO детекция
```typescript
const detections = await invoke('detect_objects_in_image', {
  imagePath: '/path/to/image.jpg'
});
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

### YOLO команды
- `init_yolo_processor(modelType: string)`
- `detect_objects_in_image(imagePath: string)`
- `analyze_video_with_yolo(videoPath: string, options: YoloOptions)`
- `update_yolo_confidence_threshold(threshold: number)`

### FaceNet команды
- `init_facenet_processor(modelType: string)`
- `generate_face_embedding(imagePath: string)`
- `generate_face_embedding_from_base64(imageData: string)`
- `calculate_cosine_similarity(embedding1: number[], embedding2: number[])`

### RetinaFace команды
- `init_retinaface_processor(modelType: string)`
- `detect_faces_with_landmarks(imagePath: string)`
- `detect_faces_with_landmarks_from_base64(imageData: string)`
- `get_aligned_face(imageData: string, landmarks: FacialLandmarks)`
- `configure_retinaface_thresholds(confidence: number, nms: number)`

### MediaPipe команды
- `init_mediapipe_processor(modelType: string)`
- `detect_faces_blazeface(imagePath: string)`
- `extract_face_mesh_landmarks(imageData: string)`
- `analyze_facial_expressions(imageData: string)`
- `configure_mediapipe_settings(confidence: number, maxFaces: number)`

### Privacy команды
- `init_privacy_processor(blurType: string)`
- `blur_faces_in_image(imagePath: string, outputPath: string, autoDetect: boolean)`
- `update_privacy_settings(blurType?: string, expandRatio?: number, adaptiveBlur?: boolean)`
- `blur_faces_in_video_frames(framePaths: string[], outputDir: string, autoDetect: boolean)`
- `get_privacy_processor_info()`

### Clustering команды
- `init_clustering_engine(params?: DBSCANParams)`
- `cluster_faces(embeddings: number[][], params?: DBSCANParams)`
- `find_nearest_cluster(embedding: number[], clusters: FaceCluster[])`
- `update_clustering_params(params: DBSCANParams)`
- `merge_clusters(cluster1: FaceCluster, cluster2: FaceCluster, embeddings: number[][])`
- `analyze_clustering_quality(result: ClusteringResult)`
- `auto_cluster_video_faces(fileId: string, embeddings: number[][], metadata: FaceMetadata[], saveResults: boolean)`
- `get_clustering_engine_info()`

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