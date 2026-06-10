# Shared Domain - API Reference

## Table of Contents

- [Events](#events)
- [Hooks](#hooks)
- [Types](#types)
- [Utils](#utils)

---

## Events

### DomainEventBus

Централизованная шина событий для межсервисной коммуникации.

```typescript
import { eventBus, DomainEventBus } from "@/domains/shared"

// Singleton instance
const bus = DomainEventBus.getInstance()
// or
const bus = eventBus
```

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `subscribe` | `(handler, options?) => Unsubscribe` | Subscribe to events |
| `publish` | `(type, source, payload, metadata?) => Promise<PublishResult>` | Publish event |
| `getHistory` | `(filter?) => DomainEvent[]` | Get event history |
| `clearHistory` | `() => void` | Clear event history |
| `reset` | `() => void` | Reset all subscriptions |
| `getStats` | `() => Stats` | Get bus statistics |

### DomainEvent

```typescript
interface DomainEvent<T = unknown> {
  id: string
  type: string
  source: DomainName
  timestamp: number
  payload: T
  metadata?: Record<string, unknown>
}
```

### DomainName

```typescript
type DomainName =
  | "ai-services"
  | "ai-tools"
  | "browser"
  | "media-management"
  | "project-management"
  | "shared"
  | "system-integration"
  | "video-editing"
```

### SubscriptionOptions

```typescript
interface SubscriptionOptions {
  filter?: EventFilter
  priority?: number
  once?: boolean
  timeout?: number
}
```

### EventFilter

```typescript
interface EventFilter {
  type?: string | string[]
  source?: DomainName | DomainName[]
  custom?: (event: DomainEvent) => boolean
}
```

### PublishResult

```typescript
interface PublishResult {
  eventId: string
  handlerCount: number
  errors?: Error[]
}
```

### Pre-defined Event Constants

```typescript
import { DOMAIN_EVENTS } from "@/domains/shared"

// AI Services events
DOMAIN_EVENTS.AI_SERVICES.ANALYSIS_STARTED
DOMAIN_EVENTS.AI_SERVICES.ANALYSIS_COMPLETED
DOMAIN_EVENTS.AI_SERVICES.ANALYSIS_FAILED

// Media Management events
DOMAIN_EVENTS.MEDIA.FILE_IMPORTED
DOMAIN_EVENTS.MEDIA.FILE_DELETED
DOMAIN_EVENTS.MEDIA.METADATA_UPDATED

// Video Editing events
DOMAIN_EVENTS.VIDEO.CLIP_ADDED
DOMAIN_EVENTS.VIDEO.CLIP_REMOVED
DOMAIN_EVENTS.VIDEO.TIMELINE_UPDATED

// Project Management events
DOMAIN_EVENTS.PROJECT.PROJECT_CREATED
DOMAIN_EVENTS.PROJECT.PROJECT_SAVED
DOMAIN_EVENTS.PROJECT.PROJECT_LOADED

// System Integration events
DOMAIN_EVENTS.SYSTEM.UPDATE_AVAILABLE
DOMAIN_EVENTS.SYSTEM.MODAL_OPENED
DOMAIN_EVENTS.SYSTEM.NOTIFICATION_SHOWN
```

---

## Hooks

### useDomainEvents()

React hook for working with domain events.

```typescript
import { useDomainEvents } from "@/domains/shared"

function MyComponent() {
  const { publish, subscribe, on, once } = useDomainEvents({
    domain: "video-editing",
    debug: true
  })

  // Publish event
  await publish("clip.added", { clipId: "123" })

  // Subscribe to events
  on("clip.added", (event) => {
    console.log("Clip added:", event.payload)
  })

  // Subscribe once
  once("project.loaded", (event) => {
    console.log("Project loaded:", event.payload)
  })

  // Subscribe with filter
  subscribe(handler, {
    filter: { source: "media-management" },
    priority: 10
  })
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `domain` | `DomainName` | Source domain for published events |
| `debug` | `boolean` | Enable debug logging |

**Returns:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `publish` | `(type, payload, metadata?) => Promise<PublishResult>` | Publish event |
| `subscribe` | `(handler, options?) => void` | Subscribe with options |
| `on` | `(eventType, handler, options?) => void` | Subscribe to specific type |
| `once` | `(eventType, handler) => void` | Subscribe once |

---

## Types

### Service Contracts

#### IMediaAnalysisContract

```typescript
interface IMediaAnalysisContract {
  analyzeFile(filePath: string, options?: VideoAnalysisOptions): Promise<MediaAnalysisResult>
  batchAnalyze(filePaths: string[], options?: VideoAnalysisOptions): Promise<MediaAnalysisResult[]>
  cancelAnalysis(analysisId: string): Promise<void>
  getProgress(analysisId: string): number
  getCachedResult(filePath: string): Promise<MediaAnalysisResult | null>
  extractKeyFrames(filePath: string, options?: KeyFrameExtractionOptions): Promise<KeyFrameExtractionResult>
}
```

#### IExportContract

```typescript
interface IExportContract {
  export(timeline: any, settings: ExportSettings): Promise<ExportResult>
  getProgress(): ExportProgress
  cancel(): Promise<void>
  isCodecAvailable(codec: string): Promise<boolean>
  getAvailableCodecs(): Promise<string[]>
  estimateFileSize(timeline: any, settings: ExportSettings): Promise<number>
}
```

#### IAIServiceContract

```typescript
interface IAIServiceContract {
  sendRequest(prompt: string, context?: any, options?: AIRequestOptions): Promise<AIResponse>
  analyzeContent(content: any): Promise<AnalysisResult>
  isAvailable(): Promise<boolean>
  getModelInfo(): Promise<{ name: string; version: string; capabilities: string[] }>
  cancelRequest(requestId: string): Promise<void>
  generateText(prompt: string, options?: AIRequestOptions): Promise<string>
  generateDescription(mediaPath: string): Promise<string>
}
```

#### INotificationContract

```typescript
interface INotificationContract {
  info(message: string, duration?: number): void
  success(message: string, duration?: number): void
  warning(message: string, duration?: number): void
  error(message: string, duration?: number): void
  dismiss(id?: string): void
}
```

#### ILoggerContract

```typescript
interface ILoggerContract {
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error | any): void
}
```

### Export Settings

```typescript
interface ExportSettings {
  format: "mp4" | "mov" | "avi" | "webm" | "mkv"
  codec: string
  resolution?: { width: number; height: number }
  fps?: number
  bitrate?: number
  quality?: "low" | "medium" | "high" | "ultra"
  audioCodec?: string
  audioBitrate?: number
  audioChannels?: number
  audioSampleRate?: number
  outputPath: string
  includeMetadata?: boolean
  optimizeForWeb?: boolean
  hardwareAcceleration?: boolean
}
```

### Media Analysis Types

```typescript
interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
}

interface SceneDetectionResult {
  scenes: Array<{ start: number; end: number; confidence: number }>
  threshold: number
}

interface QualityAnalysisResult {
  sharpness: number
  noise: number
  exposure: number
  stability: number
  overallScore: number
}

interface AudioAnalysisResult {
  loudness: number
  peakLevel: number
  silentRegions: Array<{ start: number; end: number }>
  speechRegions: Array<{ start: number; end: number }>
}
```

---

## Utils

### Config Utils

```typescript
import { getConfig, setConfig, mergeConfigs } from "@/domains/shared"

// Get configuration value
const value = getConfig("key", defaultValue)

// Set configuration value
setConfig("key", value)

// Merge configurations
const merged = mergeConfigs(baseConfig, overrides)
```

### File Utils

```typescript
import {
  getFileExtension,
  getFileName,
  getMediaType,
  isVideoFile,
  isAudioFile,
  isImageFile
} from "@/domains/shared"

getFileExtension("/path/to/video.mp4")  // "mp4"
getFileName("/path/to/video.mp4")        // "video"
getMediaType("/path/to/video.mp4")       // "Video"
isVideoFile("/path/to/video.mp4")        // true
isAudioFile("/path/to/audio.mp3")        // true
isImageFile("/path/to/image.png")        // true
```

### ID Utils

```typescript
import { generateId, generateShortId, isValidId } from "@/domains/shared"

generateId()        // "clm1234567890abcdef"
generateShortId()   // "abc123"
isValidId("clm...") // true
```

### Time Utils

```typescript
import {
  formatDuration,
  formatTimestamp,
  parseTimestamp,
  msToFrames,
  framesToMs
} from "@/domains/shared"

formatDuration(3665)        // "1:01:05"
formatTimestamp(3665.5)     // "01:01:05:15"
parseTimestamp("01:01:05")  // 3665
msToFrames(1000, 30)        // 30
framesToMs(30, 30)          // 1000
```

### Validation Utils

```typescript
import {
  validateFilePath,
  validateMediaType,
  validateSettings,
  isValidUrl
} from "@/domains/shared"

validateFilePath("/path/to/file.mp4")  // { valid: true }
validateMediaType("Video")             // true
isValidUrl("https://example.com")      // true
```
