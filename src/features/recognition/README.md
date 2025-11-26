# Recognition

**English** | [Русский](./README.ru.md)

## Overview

YOLO object recognition module for Timeline Studio. Provides components for visualization, analysis, and interaction with object recognition results in video. Supports multiple YOLO models (YOLO11, YOLO8) for detection and face recognition.

## Status

- ✅ **Components**: Data overlay, visualization, graph overlay, track overlay
- ✅ **Hooks**: use-yolo-data (43 tests)
- ✅ **Services**: YoloDataService, SceneContextService
- ✅ **Tests**: 43 tests passing

## Structure

```
recognition/
├── components/              # React components
│   ├── yolo-data-overlay.tsx      # YOLO data overlay on video
│   ├── yolo-data-visualization.tsx # Data visualization charts
│   ├── yolo-graph-overlay.tsx     # Timeline graph with navigation
│   └── yolo-track-overlay.tsx     # Object track display
├── hooks/                   # React hooks
│   └── use-yolo-data.ts           # YOLO data management hook
├── services/                # Services
│   ├── yolo-data-service.ts       # Data loading and caching
│   └── scene-context-service.ts   # Scene context for AI
├── __tests__/              # Tests (43 tests)
│   ├── components/              # Component tests
│   ├── hooks/                   # Hook tests
│   └── services/                # Service tests
└── __mocks__/              # Shared test mocks
```

## Features

### ✅ Implemented

- [x] YOLO processor initialization (YOLO11, YOLO8 models)
- [x] Object detection visualization
- [x] Face detection support
- [x] Bounding boxes with labels on video overlay
- [x] Interactive charts and statistics
- [x] Timeline with click navigation
- [x] Object tracking visualization
- [x] Data caching for performance
- [x] Lazy loading
- [x] Preloading for video lists
- [x] Scene context creation for AI
- [x] JSON export
- [x] Class-based filtering
- [x] Internationalization support

### ❌ Not Implemented

- [ ] Timeline integration for data display
- [ ] Export annotated frames
- [ ] Confidence filtering
- [ ] Custom YOLO model support
- [ ] Motion and behavior analysis
- [ ] Real-time recognition processing
- [ ] Multi-object tracking improvements

## Usage

### Basic Usage

```typescript
import { YoloDataOverlay, useYoloData } from '@/features/recognition'

function VideoPlayer({ video, currentTime }) {
  return (
    <div className="relative">
      <video src={video.path} />
      <YoloDataOverlay
        video={video}
        currentTime={currentTime}
      />
    </div>
  )
}
```

### Using the Hook

```typescript
import { useYoloData } from '@/features/recognition'

function VideoAnalysis({ videoId }) {
  const {
    getYoloDataAtTimestamp,
    getVideoSummary,
    isLoading,
    getError
  } = useYoloData()

  const [detections, setDetections] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const data = await getYoloDataAtTimestamp(videoId, currentTime)
      setDetections(data)
    }
    loadData()
  }, [videoId, currentTime])

  if (isLoading(videoId)) return <div>Loading...</div>
  if (getError(videoId)) return <div>Error: {getError(videoId)}</div>

  return (
    <div>
      <h3>Objects detected: {detections.length}</h3>
      {detections.map((detection, index) => (
        <div key={index}>
          {detection.class} ({Math.round(detection.confidence * 100)}%)
        </div>
      ))}
    </div>
  )
}
```

### Scene Context for AI

```typescript
import { SceneContextService } from '@/features/recognition'

const sceneService = new SceneContextService()

function AIAnalysis({ video, detections, timestamp }) {
  const context = sceneService.createSceneContext(
    { id: video.id, name: video.name },
    detections,
    timestamp
  )

  const chatDescription = sceneService.createChatDescription(context)
  const detailedDescription = sceneService.createDetailedDescription(context)

  return (
    <div>
      <h3>Scene Context</h3>
      <p>{chatDescription}</p>
      <button onClick={() => {
        navigator.clipboard.writeText(sceneService.exportToJSON(context))
      }}>
        Copy JSON
      </button>
    </div>
  )
}
```

## Integration

- **Depends on**:
  - `@tauri-apps/api/core` - for invoke commands
  - `@/lib/tauri-logger` - for logging
  - ONNX Runtime - for model inference
- **Used by**:
  - Video Player - for overlay display
  - AI Chat - for scene context
  - Media Browser - for video analysis

## Testing

- **Total tests**: 43
- **Coverage**: Components, hooks, services
- **Test files**:
  - `services/montage-planner-machine.test.ts` - XState machine tests
  - `services/content-analyzer.test.ts` - Content analysis tests
  - `services/moment-detector.test.ts` - Moment detection tests
  - `hooks/use-montage-planner.test.tsx` - Hook functionality
  - `components/analysis/quality-meter.test.tsx` - Component tests

## TODO / Roadmap

- [ ] E2E tests for recognition workflow (18 tests planned)
- [ ] Integration with Timeline for data display
- [ ] Export annotated frames feature
- [ ] Confidence-based filtering UI
- [ ] Support for custom YOLO models
- [ ] Motion and behavior analysis
- [ ] Real-time recognition processing
- [ ] Multi-object tracking improvements
- [ ] Recognition batch processing
- [ ] Model performance optimization
