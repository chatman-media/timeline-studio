# Recognition API

## Overview

The Recognition API provides functionality for object, face, and scene detection in videos using YOLO v11 and other ML models.

## Core Components

### useRecognition Hook

Main hook for working with recognition.

```typescript
const {
  recognizeFrame,        // Frame recognition
  recognizeVideo,        // Video recognition
  trackObjects,          // Object tracking
  isProcessing,          // Processing flag
  progress,              // Processing progress
  results,               // Recognition results
  error,                 // Error state
} = useRecognition()
```

### RecognitionProvider

Context provider for the recognition system.

```typescript
<RecognitionProvider>
  <RecognitionPanel />
  <RecognitionOverlay />
</RecognitionProvider>
```

## Recognition Types

### ObjectDetection

```typescript
interface ObjectDetection {
  id: string
  type: 'object'
  class: string              // Object class (person, car, etc.)
  confidence: number         // Confidence (0-1)
  bbox: BoundingBox         // Coordinates
  frame: number             // Frame number
  timestamp: number         // Time in video
}

interface BoundingBox {
  x: number        // Top-left X
  y: number        // Top-left Y
  width: number    // Width
  height: number   // Height
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
  embedding?: Float32Array   // For identification
  personId?: string         // Person ID
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
  keyframe: string         // Keyframe URL
  description?: string     // AI scene description
  tags?: string[]         // Scene tags
}
```

## Object Detection

### Single Frame

```typescript
// Recognize in current frame
const detections = await recognizeFrame({
  videoPath: '/path/to/video.mp4',
  timestamp: 15.5,
  models: ['yolo', 'face'],
  options: {
    minConfidence: 0.5,
    maxDetections: 100
  }
})

// Recognize in image
const imageDetections = await recognizeImage({
  imagePath: '/path/to/image.jpg',
  models: ['yolo'],
  options: {
    classes: ['person', 'car', 'bicycle'] // Only these classes
  }
})
```

### Batch Processing

```typescript
// Recognize in multiple frames
const batchResults = await recognizeBatch({
  videoPath: '/path/to/video.mp4',
  timestamps: [5, 10, 15, 20, 25],
  models: ['yolo', 'face'],
  parallel: true
})

// Recognize with interval
const intervalResults = await recognizeInterval({
  videoPath: '/path/to/video.mp4',
  startTime: 0,
  endTime: 30,
  interval: 1, // Every second
  models: ['yolo']
})
```

## Video Recognition

### Full Video

```typescript
// Analyze entire video
const videoAnalysis = await recognizeVideo({
  videoPath: '/path/to/video.mp4',
  models: ['yolo', 'face', 'scene'],
  options: {
    frameSkip: 5,        // Analyze every 5th frame
    minSceneLength: 2,   // Minimum scene length in seconds
    trackObjects: true   // Track between frames
  },
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`)
  }
})
```

### Stream Processing

```typescript
// Stream recognition
const stream = await startRecognitionStream({
  videoPath: '/path/to/video.mp4',
  models: ['yolo'],
  chunkSize: 30, // Frames per chunk
})

stream.on('chunk', (results) => {
  processResults(results)
})

stream.on('complete', () => {
  console.log('Recognition complete')
})

// Stop stream
stream.stop()
```

## Object Tracking

### Object Tracking

```typescript
// Initialize tracker
const tracker = await initializeTracker({
  videoPath: '/path/to/video.mp4',
  initialDetections: detections,
  algorithm: 'SORT' // 'SORT' | 'DeepSORT' | 'ByteTrack'
})

// Track objects
const tracks = await tracker.track({
  startFrame: 100,
  endFrame: 500,
  onUpdate: (frame, tracks) => {
    updateVisualization(tracks)
  }
})

// Get trajectories
const trajectories = tracker.getTrajectories()
```

### Multi-object Tracking

```typescript
// Track multiple objects
const multiTracker = await trackMultipleObjects({
  videoPath: '/path/to/video.mp4',
  objects: [
    { id: 'obj1', bbox: { x: 100, y: 100, width: 50, height: 50 }, frame: 0 },
    { id: 'obj2', bbox: { x: 200, y: 200, width: 60, height: 60 }, frame: 0 }
  ],
  options: {
    maxDistance: 50,      // Maximum linking distance
    maxFramesSkipped: 5   // Maximum skipped frames
  }
})
```

## Person Identification

### Face Recognition

```typescript
// Create person database
const personDB = await createPersonDatabase()

// Add person
await personDB.addPerson({
  name: 'John Doe',
  faceImages: ['/path/to/face1.jpg', '/path/to/face2.jpg'],
  metadata: { role: 'actor' }
})

// Identify in video
const identifications = await identifyPersonsInVideo({
  videoPath: '/path/to/video.mp4',
  personDB,
  options: {
    similarityThreshold: 0.6,
    minFaceSize: 50
  }
})
```

### Face Clustering

```typescript
// Automatic face grouping
const clusters = await clusterFaces({
  videoPath: '/path/to/video.mp4',
  options: {
    algorithm: 'DBSCAN',
    minSamples: 5,
    epsilon: 0.5
  }
})

// Assign names to clusters
clusters.forEach((cluster, index) => {
  cluster.assignName(`Person ${index + 1}`)
})
```

## Scene Analysis

### Scene Detection

```typescript
// Detect scenes
const scenes = await detectScenes({
  videoPath: '/path/to/video.mp4',
  options: {
    method: 'content', // 'content' | 'threshold' | 'adaptive'
    threshold: 30,     // For threshold method
    minSceneLength: 1  // Minimum scene length in seconds
  }
})

// Analyze scene content
const analyzedScenes = await analyzeScenes(scenes, {
  generateDescriptions: true,
  extractKeyframes: true,
  detectActivities: true
})
```

### Activity Recognition

```typescript
// Recognize activities
const activities = await recognizeActivities({
  videoPath: '/path/to/video.mp4',
  options: {
    model: 'i3d', // 'i3d' | 'slowfast' | 'x3d'
    classes: ['walking', 'running', 'sitting', 'talking'],
    windowSize: 2 // Seconds
  }
})
```

## Export Results

### Export Formats

```typescript
// Export to JSON
await exportResults(results, {
  format: 'json',
  outputPath: '/path/to/results.json',
  includeFrames: true,
  includeEmbeddings: false
})

// Export to CSV
await exportResults(results, {
  format: 'csv',
  outputPath: '/path/to/results.csv',
  columns: ['timestamp', 'class', 'confidence', 'bbox']
})

// Export annotations
await exportAnnotations(results, {
  format: 'yolo', // 'yolo' | 'coco' | 'pascal-voc'
  outputDir: '/path/to/annotations/',
  saveImages: true
})
```

### Visualization

```typescript
// Create annotated video
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

// Generate heatmap
const heatmap = await generateHeatmap(results, {
  type: 'density', // 'density' | 'trajectory'
  resolution: { width: 1920, height: 1080 },
  colormap: 'hot'
})
```

## Filtering and Search

### Filter Results

```typescript
// Filter by class
const persons = results.filter(d => d.class === 'person')

// Filter by confidence
const highConfidence = results.filter(d => d.confidence > 0.8)

// Filter by time
const timeRange = results.filter(d => 
  d.timestamp >= 10 && d.timestamp <= 20
)

// Complex filter
const filtered = filterDetections(results, {
  classes: ['person', 'car'],
  minConfidence: 0.6,
  timeRange: { start: 5, end: 15 },
  bbox: { minWidth: 50, minHeight: 50 }
})
```

### Search

```typescript
// Find similar faces
const similarFaces = await findSimilarFaces({
  targetFace: faceDetection,
  database: allFaces,
  threshold: 0.7,
  maxResults: 10
})

// Search by description
const matches = await searchByDescription({
  query: 'person wearing red shirt',
  detections: results,
  model: 'clip' // Vision-language model
})
```

## Performance

### Optimization

```typescript
// GPU acceleration
const gpuRecognition = await createRecognizer({
  backend: 'cuda', // 'cuda' | 'tensorrt' | 'openvino' | 'cpu'
  device: 0,       // GPU index
  optimization: {
    batchSize: 8,
    fp16: true,    // Half precision
    tensorrt: true // TensorRT optimization
  }
})

// Result caching
const cachedRecognition = withCache(recognition, {
  cacheDir: '/path/to/cache',
  maxSize: '10GB',
  ttl: 86400 // 24 hours
})
```

### Monitoring

```typescript
// Performance metrics
const metrics = recognition.getMetrics()
console.log(`FPS: ${metrics.fps}`)
console.log(`Latency: ${metrics.latency}ms`)
console.log(`GPU Usage: ${metrics.gpuUsage}%`)

// Profiling
const profile = await recognition.profile({
  frames: 100,
  warmup: 10
})
```

## Events

```typescript
// Subscribe to events
recognition.on('detection', (detection) => {
  console.log('New detection:', detection)
})

recognition.on('sceneChange', (scene) => {
  console.log('Scene changed:', scene)
})

recognition.on('personIdentified', (person) => {
  console.log('Person identified:', person.name)
})

recognition.on('progress', (progress) => {
  updateProgressBar(progress)
})

recognition.on('error', (error) => {
  handleError(error)
})
```

---

*Last updated: July 31, 2025*