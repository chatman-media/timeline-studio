# Person Identification - Face Recognition and Person Identification Module

[🇷🇺 Русская версия](./README.ru.md)

> ✅ **Module is fully implemented and integrated into Timeline Studio**

## 📋 Overview

Person Identification is an advanced module for face detection, person identification, and tracking their appearances throughout the video. The module is integrated with Timeline and provides a complete set of tools for working with persons in video projects.

## API (Backend Commands)

This module uses extensive Tauri backend integration for face detection, tracking, and database operations:

### Person Database Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_person_database` | - | Initialize Tauri person database |
| `create_person` | `{ name, tags, notes }` | Create new person profile |
| `delete_person` | `{ personId }` | Delete person from database |
| `add_face_embedding` | `{ personId, embedding, quality }` | Add face embedding to person |
| `add_person_appearance` | `{ personId, clipId, startTime, endTime, confidence }` | Record person appearance |
| `add_person_thumbnail` | `{ personId, imageData }` | Add thumbnail image |
| `set_similarity_threshold` | `{ threshold }` | Set similarity threshold for matching |

### Advanced Tracking Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_advanced_tracking` | `{ config }` | Initialize advanced tracking system |
| `start_person_tracking` | `{ videoPath, personIds }` | Start tracking persons in video |
| `stop_person_tracking` | - | Stop tracking process |
| `assign_person_to_track` | `{ trackId, personId }` | Assign person to tracking track |
| `merge_tracks` | `{ sourceTrackId, targetTrackId }` | Merge two tracking tracks |
| `update_tracking_config` | `{ config }` | Update tracking configuration |
| `cleanup_tracking` | - | Cleanup tracking resources |

### Face Detection Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_yolo_processor` | `{ modelPath }` | Initialize YOLO face detector |
| `init_facenet_processor` | `{ modelPath }` | Initialize FaceNet embedder |
| `start_realtime_face_detection` | `{ config }` | Start real-time face detection |
| `stop_realtime_face_detection` | - | Stop real-time detection |
| `update_face_detection_config` | `{ config }` | Update detection settings |
| `cleanup_face_detection` | - | Cleanup detection resources |

### Clustering Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_clustering_engine` | `{ params: { eps, min_samples } }` | Initialize clustering engine |
| `cluster_faces` | `{ embeddings, params }` | Cluster face embeddings |
| `find_nearest_cluster` | `{ embedding, clusters }` | Find nearest cluster for embedding |
| `auto_cluster_video_faces` | `{ fileId, embeddings, metadata }` | Auto-cluster faces in video |
| `get_aligned_face` | `{ imageData, landmarks, outputSize }` | Get aligned face with quality score |
| `blur_faces_in_image` | `{ imagePath, outputPath, autoDetect }` | Blur faces for privacy |

For detailed usage examples, see the [Tauri Backend Commands](#tauri-backend-commands) section below.

## ✅ Implemented Features

### 🎯 Core Functionality:
- ✅ **Automatic Face Detection** - face detection in videos using Scene Analysis Engine
- ✅ **Person Identification** - matching detected faces with known persons
- ✅ **Face Clustering** - automatic grouping of faces using DBSCAN algorithm
- ✅ **Person Profile Management** - create, edit, and delete persons
- ✅ **Timeline Integration** - display persons on Timeline clips
- ✅ **Search and Filtering** - quick person search by name and tags
- ✅ **Appearance Statistics** - person appearance counting in the project

### 🏗️ Architecture

```
src/features/person-identification/
├── components/                  # React components
│   ├── person-list.tsx         # ✅ Person list with filtering
│   ├── person-detail.tsx       # ✅ Detailed person information
│   ├── person-form.tsx         # ✅ Create/edit form
│   ├── person-manager.tsx      # ✅ Main management component
│   └── index.ts               # ✅ Barrel exports
├── hooks/                      # React hooks
│   ├── use-person-identification.ts # ✅ Main hook for working with persons
│   └── index.ts               # ✅ Barrel exports
├── services/                   # Business logic
│   └── person-database-service.ts # ✅ Service for IndexedDB
├── types/                      # TypeScript types
│   └── person.ts              # ✅ Complete types for persons
├── index.ts                   # ✅ Main module export
└── README.md                  # ✅ Documentation
```

### 🔗 Timeline Integration

```
src/features/timeline/
├── components/
│   ├── person-indicators/      # ✅ Person indicators on clips
│   │   ├── person-indicator.tsx
│   │   └── index.ts
│   ├── persons-panel/          # ✅ Persons panel in Timeline
│   │   ├── persons-panel.tsx
│   │   └── index.ts
│   └── track-controls-panel.tsx # ✅ Updated with persons panel
├── hooks/
│   ├── use-timeline-persons.ts # ✅ Hook for Timeline integration
│   └── index.ts               # ✅ Updated with new exports
```

## 🎨 User Interface

### PersonManager - Main Component
- ✅ List of all persons with photos and statistics
- ✅ Search persons by name and description
- ✅ Filter by tags
- ✅ Create new persons
- ✅ Edit existing ones
- ✅ Delete persons

### PersonIndicator - Timeline Indicators
- ✅ Small person avatars on video clips
- ✅ Confidence indicators (green/yellow/red)
- ✅ Compact mode for narrow clips
- ✅ Tooltip with detailed information
- ✅ Click to open person details

### PersonsPanel - Timeline Panel
- ✅ Integrated into left Timeline panel
- ✅ List of detected persons
- ✅ Analysis settings (confidence threshold, auto-detection)
- ✅ Appearance statistics
- ✅ Filtering and search

## 💾 Data Structures

### PersonProfile - Person Profile
```typescript
interface PersonProfile {
  id: string                    // ✅ Unique identifier
  name?: string                 // ✅ Person name (optional)
  isVerified: boolean          // ✅ Identity verification status
  
  // Biometric data
  faceEmbeddings: FaceEmbedding[]     // ✅ Face embeddings for recognition
  averageEmbedding?: Float32Array     // ✅ Average vector
  
  // Appearance statistics
  appearances: PersonAppearance[]      // ✅ All video appearances
  totalScreenTime: number             // ✅ Total screen time
  firstSeen: Timecode                 // ✅ First appearance
  lastSeen: Timecode                  // ✅ Last appearance
  
  // Metadata
  tags: string[]                      // ✅ Tags for categorization
  notes?: string                      // ✅ Notes about the person
  thumbnails: PersonThumbnail[]       // ✅ Face thumbnails
  
  // Privacy settings
  privacy: PersonPrivacySettings      // ✅ Privacy settings
  
  // System fields
  createdAt: string                   // ✅ Creation date
  updatedAt: string                   // ✅ Update date
}
```

### TimelinePersonAppearance - Timeline Appearance
```typescript
interface TimelinePersonAppearance {
  id: string            // ✅ Unique appearance ID
  personId: string      // ✅ Person ID
  clipId: string        // ✅ Timeline clip ID
  startTime: number     // ✅ Start time (seconds)
  endTime: number       // ✅ End time (seconds)
  confidence: number    // ✅ Identification confidence
  boundingBox?: BoundingBox  // ✅ Face area
  thumbnailPath?: string     // ✅ Thumbnail path
  detectedAt: Date      // ✅ Detection time
}
```

## 🔧 API and Hooks

### usePersonIdentification - Main Hook
```typescript
const {
  // State
  persons,           // ✅ All persons
  isLoading,         // ✅ Loading status
  error,            // ✅ Errors
  
  // Management methods
  addPerson,         // ✅ Add person
  updatePerson,      // ✅ Update person
  deletePerson,      // ✅ Delete person
  searchPersons,     // ✅ Search persons
  
  // Face methods
  detectFaces,       // ✅ Face detection
  identifyPerson,    // ✅ Identify by face
  createPersonFromFace, // ✅ Create person from face
  
  // Statistics
  getStatistics,     // ✅ Get statistics
} = usePersonIdentification()
```

### useTimelinePersons - Timeline Integration
```typescript
const {
  // State
  state,                    // ✅ Analysis state
  persons,                  // ✅ All persons
  
  // Clip methods
  getPersonsForClip,        // ✅ Persons in specific clip
  getAppearancesForClip,    // ✅ Appearances in clip
  
  // Analysis
  analyzeClipForPersons,    // ✅ Analyze clip
  analyzeTimelineForPersons, // ✅ Analyze entire Timeline
  
  // Settings
  enablePersonDetection,    // ✅ Enable auto-detection
  confidenceThreshold,      // ✅ Confidence threshold
} = useTimelinePersons()
```

## 🎯 AI Content Intelligence Integration

Person Identification is fully integrated with AI Content Intelligence Suite:

- ✅ **Scene Analysis Engine** - basic face detection
- ✅ **Computer Vision Service** - advanced processing
- ✅ **AI Intelligence Orchestrator** - analysis coordination
- ✅ **Unified AI Service** - unified API

## 🚀 Usage

### Basic Usage
```typescript
import { PersonManager } from '@/features/person-identification'

// In component
<PersonManager />
```

### In Timeline
```typescript
import { PersonIndicator } from '@/features/timeline/components/person-indicators'
import { useTimelinePersons } from '@/features/timeline/hooks'

const { getPersonsForClip, getAppearancesForClip } = useTimelinePersons()

<PersonIndicator
  persons={getPersonsForClip(clip.id)}
  appearances={getAppearancesForClip(clip.id)}
  clipId={clip.id}
  onClick={(personId) => showPersonDetail(personId)}
/>
```

## ⚙️ Settings

### Detection Settings
- ✅ **Confidence Threshold** - minimum confidence for identification (default 70%)
- ✅ **Auto-detection** - automatic analysis of new clips
- ✅ **Analysis Interval** - how often to analyze frames

### Privacy Settings
- ✅ **Face Blurring** - automatic face blurring for privacy
- ✅ **Hide from Search** - exclude from search results
- ✅ **Anonymization** - complete removal of personal data

## 📊 Statistics and Metrics

- ✅ **Total persons count** in project
- ✅ **Number of detected faces** 
- ✅ **Total appearances count**
- ✅ **Average faces per person**
- ✅ **Average identification confidence**

## 🔄 Automation

- ✅ **Automatic detection** of new persons in added clips
- ✅ **Background analysis** without blocking UI
- ✅ **Result caching** for performance improvement
- ✅ **Analysis progress** with visual indicators

## 🎭 Personalization Features

- ✅ **Person tags** - categorization and grouping
- ✅ **Notes** - additional person information
- ✅ **Thumbnails** - multiple person photos
- ✅ **Verification** - identity confirmation

## 🚀 Advanced Features (In Development)

### Face Clustering Integration
- ✅ **DBSCAN Algorithm** - density-based clustering for automatic face grouping
- ✅ **Clustering Integration** - seamless integration with PersonDatabase
- ✅ **Cluster Quality Metrics** - confidence scores and coverage statistics
- ✅ **Main Character Detection** - automatic detection based on appearance frequency

### ML Backend Integration
- ✅ **FaceNet Embeddings** - 512D and 128D face embeddings for high accuracy
- ✅ **RetinaFace Detection** - advanced face detection with 5-point landmarks and **real face quality assessment**
- ✅ **MediaPipe Analysis** - 468 3D facial landmarks and expression analysis
- ✅ **YOLO Integration** - real-time object and face detection with **automatic processor selection**
- ✅ **Privacy Processor** - 6 types of face blurring for anonymization with **real-time face detection**
- ✅ **Face Quality Assessment** - comprehensive 4-factor quality scoring (size, sharpness, landmarks, lighting)

### Tauri Backend Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `init_person_database` | - | Initialize Tauri person database |
| `create_person` | `{ name, tags, notes }` | Create new person profile |
| `delete_person` | `{ personId }` | Delete person from database |
| `add_face_embedding` | `{ personId, embedding, quality }` | Add face embedding to person |
| `add_person_appearance` | `{ personId, clipId, startTime, endTime, confidence }` | Record person appearance |
| `add_person_thumbnail` | `{ personId, imageData }` | Add thumbnail image |
| `set_similarity_threshold` | `{ threshold }` | Set similarity threshold for matching |
| `init_advanced_tracking` | `{ config }` | Initialize advanced tracking system |
| `start_person_tracking` | `{ videoPath, personIds }` | Start tracking persons in video |
| `stop_person_tracking` | - | Stop tracking process |
| `assign_person_to_track` | `{ trackId, personId }` | Assign person to tracking track |
| `merge_tracks` | `{ sourceTrackId, targetTrackId }` | Merge two tracking tracks |
| `update_tracking_config` | `{ config }` | Update tracking configuration |
| `cleanup_tracking` | - | Cleanup tracking resources |
| `init_yolo_processor` | `{ modelPath }` | Initialize YOLO face detector |
| `init_facenet_processor` | `{ modelPath }` | Initialize FaceNet embedder |
| `start_realtime_face_detection` | `{ config }` | Start real-time face detection |
| `stop_realtime_face_detection` | - | Stop real-time detection |
| `update_face_detection_config` | `{ config }` | Update detection settings |
| `cleanup_face_detection` | - | Cleanup detection resources |

### Clustering Commands

```typescript
// Initialize clustering engine
await invoke('init_clustering_engine', { params: { eps: 0.5, min_samples: 3 } })

// Cluster faces
const result = await invoke('cluster_faces', {
  embeddings: faceEmbeddings,
  params: { eps: 0.5, min_samples: 3, metric: 'cosine' }
})

// Find nearest cluster
const nearest = await invoke('find_nearest_cluster', {
  embedding: newFaceEmbedding,
  clusters: existingClusters
})

// Auto-cluster video faces
await invoke('auto_cluster_video_faces', {
  fileId: 'video-123',
  embeddings: videoEmbeddings,
  metadata: faceMetadata,
  saveResults: true
})

// RetinaFace with quality assessment
const result = await invoke('get_aligned_face', {
  imageData: base64Image,
  landmarks: facialLandmarks,
  outputSize: 112
})
// Returns: { aligned_image: string, size: number, quality_score: number }

// Privacy face blurring with auto-detection
await invoke('blur_faces_in_image', {
  imagePath: '/path/to/image.jpg',
  outputPath: '/path/to/blurred.jpg',
  autoDetect: true, // Uses first available YOLO processor
  faceBoxes: null
})
```

## 🧪 Testing

### Test Coverage

The module has comprehensive test coverage across all layers:

**Component Tests** (`__tests__/components/`):
- ✓ `person-detail.test.tsx` - Person detail view
- ✓ `person-form.test.tsx` - Create/edit person form
- ✓ `person-form-modal.test.tsx` - Modal dialog for person form
- ✓ `person-list.test.tsx` - Person list with filtering
- ✓ `person-manager.test.tsx` - Main person management component

**Hook Tests** (`__tests__/hooks/`):
- ✓ `use-person-identification.test.tsx` - Main person identification hook

**Service Tests** (`__tests__/services/`):
- ✓ `person-database-service.test.ts` - Basic database operations
- ✓ `person-database-service.integration.test.ts` - Integration tests
  - Database initialization
  - CRUD operations
  - Search functionality
  - Statistics calculation
- ✓ `person-database-service.tauri.test.ts` - Tauri backend integration
  - Database operations via Tauri
  - Embedding operations
  - Appearance tracking
  - Thumbnail management
  - Statistics and clustering
  - Error handling
- ✓ `person-database-service.extended.test.ts` - Extended functionality
  - Full person data management
  - Embedding search
  - Appearance tracking
  - Statistics and merging
  - Event listeners

### Running Tests

```bash
# Run all person identification tests
bun run test src/features/person-identification

# Run specific test suite
bun run test src/features/person-identification/__tests__/services/person-database-service.tauri.test.ts

# Run with coverage
bun run test:coverage src/features/person-identification
```

## 🛡️ Security and Privacy

- ✅ **Local storage** - all data stays on user's device
- ✅ **Encryption** - secure biometric data storage
- ✅ **GDPR ready** - compliant with data protection requirements
- ✅ **Right to deletion** - complete person data removal

---

**Status**: ✅ **Fully implemented and ready to use**

The Person Identification module is fully integrated into Timeline Studio and provides a comprehensive solution for working with persons in video projects. All main features are implemented and tested.

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/person-identification/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация базы данных персон (`init_person_database`) | ⏳ Planned | - | 🔴 High |
| Создание нового профиля персоны | ⏳ Planned | - | 🔴 High |
| Удаление персоны (`delete_person`) | ⏳ Planned | - | 🔴 High |
| Добавление эмбеддинга лица (`add_face_embedding`) | ⏳ Planned | - | 🔴 High |
| Добавление появления персоны (`add_person_appearance`) | ⏳ Planned | - | 🔴 High |
| Добавление миниатюры (`add_person_thumbnail`) | ⏳ Planned | - | 🟡 Medium |
| Настройка порога схожести (`set_similarity_threshold`) | ⏳ Planned | - | 🟡 Medium |
| Инициализация расширенного трекинга (`init_advanced_tracking`) | ⏳ Planned | - | 🟡 Medium |
| Запуск трекинга персон в видео (`start_person_tracking`) | ⏳ Planned | - | 🔴 High |
| Остановка трекинга (`stop_person_tracking`) | ⏳ Planned | - | 🔴 High |
| Назначение персоны на трек (`assign_person_to_track`) | ⏳ Planned | - | 🟡 Medium |
| Объединение треков (`merge_tracks`) | ⏳ Planned | - | 🟡 Medium |
| Обновление конфигурации трекинга (`update_tracking_config`) | ⏳ Planned | - | 🟢 Low |
| Очистка ресурсов трекинга (`cleanup_tracking`) | ⏳ Planned | - | 🟢 Low |
| Инициализация YOLO процессора (`init_yolo_processor`) | ⏳ Planned | - | 🔴 High |
| Инициализация FaceNet процессора (`init_facenet_processor`) | ⏳ Planned | - | 🔴 High |
| Запуск обнаружения лиц в реальном времени (`start_realtime_face_detection`) | ⏳ Planned | - | 🔴 High |
| Остановка обнаружения лиц (`stop_realtime_face_detection`) | ⏳ Planned | - | 🔴 High |
| Обновление конфигурации обнаружения (`update_face_detection_config`) | ⏳ Planned | - | 🟡 Medium |
| Очистка ресурсов обнаружения (`cleanup_face_detection`) | ⏳ Planned | - | 🟢 Low |
| Кластеризация лиц (`cluster_faces`) | ⏳ Planned | - | 🟡 Medium |
| Автоматическая кластеризация видео (`auto_cluster_video_faces`) | ⏳ Planned | - | 🟡 Medium |
| Выравнивание лица с оценкой качества (`get_aligned_face`) | ⏳ Planned | - | 🟡 Medium |
| Размытие лиц для приватности (`blur_faces_in_image`) | ⏳ Planned | - | 🟡 Medium |
| UI - список персон с фильтрацией | ⏳ Planned | - | 🔴 High |
| UI - форма создания/редактирования персоны | ⏳ Planned | - | 🔴 High |
| UI - детальная информация о персоне | ⏳ Planned | - | 🟡 Medium |
| UI - индикаторы персон на Timeline | ⏳ Planned | - | 🟡 Medium |
| UI - панель персон в Timeline | ⏳ Planned | - | 🟡 Medium |
| UI - монитор обнаружения в реальном времени | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал (управление БД, обнаружение лиц, трекинг, основной UI)
- 🟡 Medium - важный функционал (расширенная обработка, кластеризация, дополнительный UI)
- 🟢 Low - дополнительный функционал (конфигурация, очистка ресурсов, вспомогательные элементы)