# Video Editing Domain - API Reference

## Table of Contents

- [Types](#types)
- [Hooks](#hooks)
- [Providers](#providers)
- [Orchestrator](#orchestrator)
- [State Machines](#state-machines)
- [Services](#services)
- [Domain Services](#domain-services)
- [Utilities](#utilities)

---

## Types

### MediaFile

```typescript
interface MediaFile {
  id: string
  name: string
  path: string
  type: MediaType
  duration?: number
  resolution?: { width: number; height: number }
  fps?: number
  codec?: MediaCodec
  colorSpace?: MediaColorSpace
  audioChannels?: number
  audioSampleRate?: number
  timecode?: { start: string; drop_frame: boolean }
  cameraMetadata?: CameraMetadata
  lut?: string
}
```

### MediaType

```typescript
enum MediaType {
  Video = "video",
  VideoWithAudio = "video_with_audio",
  StillImage = "still_image",
  SequenceClip = "sequence_clip",
  TitleClip = "title_clip",
  GeneratorClip = "generator_clip"
}
```

### TimelineContext

```typescript
interface TimelineContext {
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  timeScale: number
  scrollPosition: { x: number; y: number }
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]
  isDragging: boolean
  draggedClipId: string | null
  draggedTrackId: string | null
  clipboard: ClipboardData | null
  isRecording: boolean
  showWaveforms: boolean
  showThumbnails: boolean
  showMarkers: boolean
  uiError: string | null
}
```

### PlayerContext

```typescript
interface PlayerContext {
  video: MediaFile | null
  currentTime: number
  duration: number
  volume: number
  isPlaying: boolean
  isSeeking: boolean
  isRecording: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
  isResizableMode: boolean
  speedRampingEnabled: boolean
  currentPlaybackRate: number
  basePlaybackRate: number
  prerenderEnabled: boolean
  prerenderQuality: number
  previewMedia: MediaFile | null
  videoSource: "browser" | "timeline"
  appliedEffects: Array<{ id: string; name: string; params: any }>
  appliedFilters: Array<{ id: string; name: string; params: any }>
  appliedTemplate: { id: string; name: string; files: MediaFile[] } | null
}
```

### VideoEffect

```typescript
interface VideoEffect {
  id: string
  type: string
  name: string
  enabled: boolean
  parameters: Record<string, any>
  keyframes?: Keyframe[]
  category: EffectCategory
}
```

### TransitionParameters

```typescript
interface TransitionParameters {
  id: string
  type: TransitionType
  duration: number
  easing?: EasingFunction
  direction?: TransitionDirection
  customParameters?: Record<string, any>
}

enum TransitionType {
  Cut = "cut",
  Dissolve = "dissolve",
  Wipe = "wipe",
  Slide = "slide",
  Push = "push",
  Zoom = "zoom",
  Glitch = "glitch"
}
```

---

## Hooks

### useTimeline()

Main hook for timeline management.

```typescript
import { useTimeline } from "@/domains/video-editing"

const {
  // State
  project,
  currentTime,
  isPlaying,
  timeScale,
  editMode,
  snapMode,
  selectedClipIds,
  selectedTrackIds,
  hasProject,
  hasUnsavedChanges,
  hasSelection,
  hasClipboard,
  isDragging,
  isRecording,

  // UI Controls
  setTimeScale,
  setScrollPosition,
  setEditMode,
  setSnapMode,

  // Selection
  selectClip,
  selectTrack,
  selectMultipleClips,
  selectClipsById,
  clearSelection,

  // Clipboard
  copyClips,
  cutClips,
  pasteClips,
  deleteSelected,

  // Drag Operations
  startDragClip,
  startDragTrack,
  startDragResource,
  endDrag,

  // Toggle Functions
  toggleRecording,
  toggleWaveforms,
  toggleThumbnails,
  toggleMarkers,

  // Project Operations
  createProject,
  loadProject,
  saveProject,

  // Clip Operations (with backend sync)
  addClip,
  moveClip,
  deleteClip,
  trimClip,
  splitClip,
  updateClip,
  batchUpdateClips,

  // Track Operations
  addTrack
} = useTimeline()
```

### usePlayer()

Hook for video playback control.

```typescript
import { usePlayer } from "@/domains/video-editing"

const {
  // State
  video,
  currentTime,
  duration,
  volume,
  isPlaying,
  isVideoReady,
  currentPlaybackRate,
  appliedEffects,
  appliedFilters,

  // Playback
  play,
  pause,
  stop,
  seek,
  setPlaybackRate,

  // Volume
  setVolume,

  // Effects
  applyEffect,
  removeEffect,
  applyFilter,
  removeFilter,
  applyTemplate,
  removeTemplate,

  // Recording
  startRecording,
  stopRecording
} = usePlayer()
```

### useUndoRedo()

Hook for undo/redo operations.

```typescript
import { useUndoRedo, UndoRedoHelpers } from "@/domains/video-editing"

const {
  canUndo,
  canRedo,
  undoStack,
  redoStack,
  undo,
  redo,
  execute,
  clear
} = useUndoRedo()

// Helpers for creating actions
UndoRedoHelpers.createClipAction(type, clipId, before, after)
UndoRedoHelpers.createTrackAction(type, trackId, before, after)
UndoRedoHelpers.createKeyframeAction(type, keyframeId, before, after)
```

### useVideoEditing()

Combined hook for video editing context.

```typescript
import { useVideoEditing } from "@/domains/video-editing"

const { timeline, player, undoRedo } = useVideoEditing()
```

---

## Providers

### TimelineProvider

Main timeline context provider.

```tsx
import { TimelineProvider, useTimelineClips } from "@/domains/video-editing"

function App() {
  return (
    <TimelineProvider>
      <TimelineEditor />
    </TimelineProvider>
  )
}
```

### Specialized Providers

| Provider | Hook | Purpose |
|----------|------|---------|
| `TimelineClipsProvider` | `useTimelineClips()` | Clip management |
| `TimelineTracksProvider` | `useTimelineTracks()` | Track management |
| `TimelinePlaybackProvider` | `useTimelinePlayback()` | Playback control |
| `TimelineSelectionProvider` | `useTimelineSelection()` | Selection state |
| `TimelineEffectsProvider` | `useTimelineEffects()` | Effects management |
| `TimelineKeyframesProvider` | `useTimelineKeyframes()` | Keyframe editing |
| `TimelineMarkersProvider` | `useTimelineMarkers()` | Marker management |
| `TimelineProjectProvider` | `useTimelineProject()` | Project state |

### UndoRedoProvider

```tsx
import { UndoRedoProvider, useUndoRedoContext } from "@/domains/video-editing"

function App() {
  return (
    <UndoRedoProvider>
      <Editor />
    </UndoRedoProvider>
  )
}

// Specialized hooks
useClipUndoRedo()
useTrackUndoRedo()
useKeyframeUndoRedo()
```

---

## Orchestrator

### VideoEditingOrchestrator

Singleton orchestrator coordinating all machines and services.

```typescript
import { getVideoEditingOrchestrator } from "@/domains/video-editing"

const orchestrator = getVideoEditingOrchestrator()

// Project Operations
await orchestrator.createProject("My Project", settings)
await orchestrator.loadProject("/path/to/project.tlproj")
await orchestrator.saveProject()

// Playback Control
orchestrator.play()
orchestrator.pause()
orchestrator.stopPlayback()
orchestrator.seek(10.5)

// Track Operations
await orchestrator.addTrack("video", "Video Track 1")

// Clip Operations
await orchestrator.addClip(trackId, mediaFile, startTime)
await orchestrator.moveClip(clipId, newTrackId, newTime)
await orchestrator.deleteClip(clipId)
await orchestrator.trimClip(clipId, start, end)
await orchestrator.splitClip(clipId, time)
await orchestrator.updateClip(clipId, updates)
await orchestrator.copyClips(clipIds)
await orchestrator.cutClips(clipIds)
await orchestrator.pasteClips(trackId, time)
await orchestrator.batchUpdateClips(updates)

// Selection
await orchestrator.selectClips(clipIds, addToSelection)
await orchestrator.selectSections(sectionIds, addToSelection)
await orchestrator.clearSelection()

// State Access
orchestrator.getTimelineState()
orchestrator.getPlayerState()
orchestrator.getTimelineUIState()

// Subscriptions
orchestrator.subscribeToTimeline(callback)
orchestrator.subscribeToPlayer(callback)
orchestrator.subscribeToTimelineUI(callback)

// Cleanup
orchestrator.stop()
```

### Helper Functions

```typescript
import {
  getVideoEditingOrchestrator,
  getTimelineActor,
  getPlayerActor,
  getTimelineUIActor
} from "@/domains/video-editing"
```

---

## State Machines

### timelineMachine

UI state machine for timeline.

```typescript
import { timelineMachine } from "@/domains/video-editing"
import { createActor } from "xstate"

const actor = createActor(timelineMachine)
actor.start()

// Events
actor.send({ type: "SYNC_PLAYBACK_STATE", isPlaying, currentTime })
actor.send({ type: "SET_TIME_SCALE", scale: 150 })
actor.send({ type: "SET_EDIT_MODE", mode: "trim" })
actor.send({ type: "SET_SNAP_MODE", mode: "clips" })
actor.send({ type: "SELECT_CLIP", clipId, multiple: false })
actor.send({ type: "CLEAR_SELECTION" })
actor.send({ type: "START_DRAG_CLIP", clipId })
actor.send({ type: "END_DRAG" })
actor.send({ type: "COPY_TO_CLIPBOARD", data })
actor.send({ type: "TOGGLE_WAVEFORMS" })
```

**States:** `idle` ↔ `dragging`

### timelineExtendedMachine

Extended timeline machine with project and clip operations.

```typescript
import { timelineExtendedMachine } from "@/domains/video-editing"

// Events
CREATE_PROJECT, LOAD_PROJECT, SAVE_PROJECT
ADD_CLIP, MOVE_CLIP, REMOVE_CLIP, TRIM_CLIP, SPLIT_CLIP, UPDATE_CLIP
COPY_CLIPS, CUT_CLIPS, PASTE_CLIPS
ADD_TRACK, SELECT_TRACKS, SELECT_CLIPS, SELECT_SECTIONS, CLEAR_SELECTION
PLAY, PAUSE, STOP, SEEK
PROJECT_UPDATED, SYNC_PLAYBACK_STATE
```

### playerMachine

Video playback state machine.

```typescript
import { playerMachine } from "@/domains/video-editing"
import { createActor } from "xstate"

const actor = createActor(playerMachine)
actor.start()

// Events
actor.send({ type: "LOAD_VIDEO", video: mediaFile })
actor.send({ type: "PLAY" })
actor.send({ type: "PAUSE" })
actor.send({ type: "STOP" })
actor.send({ type: "SEEK", time: 5.0 })
actor.send({ type: "SET_VOLUME", volume: 0.8 })
actor.send({ type: "SET_PLAYBACK_RATE", rate: 2.0 })
actor.send({ type: "APPLY_EFFECT", effect: { id, name, params } })
actor.send({ type: "APPLY_FILTER", filter: { id, name, params } })
actor.send({ type: "APPLY_TEMPLATE", template: { id, name, files } })
actor.send({ type: "START_RECORDING" })
actor.send({ type: "STOP_RECORDING" })
```

**States:** `idle` → `loading` → `ready.playing` | `ready.paused` | `error`

---

## Services

### Import/Export

```typescript
import {
  AAFExporter,
  AAFImporter,
  FCPXMLExporter,
  FCPXMLImporter,
  EDLExporter,
  EDLImporter,
  importExportManager
} from "@/domains/video-editing"

// AAF Export (Avid)
const aafExporter = new AAFExporter()
const aafData = await aafExporter.export(timeline, options)

// FCPXML Import (Final Cut Pro)
const fcpxmlImporter = new FCPXMLImporter()
const timeline = await fcpxmlImporter.import(fcpxmlContent, options)

// EDL Import/Export
const edlExporter = new EDLExporter()
const edlData = await edlExporter.export(timeline)
```

### UndoRedoService

```typescript
import { UndoRedoService } from "@/domains/video-editing"

const service = new UndoRedoService()

// Execute action with undo support
service.execute({
  type: "add_clip",
  clipId: "clip-1",
  before: null,
  after: clipData
})

// Undo/Redo
service.undo()
service.redo()

// State
service.canUndo()
service.canRedo()
service.getUndoStack()
service.getRedoStack()
service.clear()
```

---

## Domain Services

Domain services provide clean API separation between domain logic and Tauri backend. All services are singleton instances exported for direct use.

### videoCompilerCacheService

Manages video compiler cache statistics and operations.

```typescript
import { videoCompilerCacheService } from "@/domains/video-editing"

// Get cache statistics
const stats = await videoCompilerCacheService.getCacheStats()
// Returns: {
//   total_entries: number
//   cache_hits: number
//   cache_misses: number
//   hit_ratio: number
//   preview_hit_ratio: number
//   total_size: number
//   preview_size: number
// }

// Clear preview cache
await videoCompilerCacheService.clearPreviewCache()

// Clear all cache
await videoCompilerCacheService.clearAllCache()
```

**Methods:**
- `getCacheStats()` - Retrieve cache statistics
- `clearPreviewCache()` - Clear preview frame cache
- `clearAllCache()` - Clear all cached data

### videoCompilerRenderService

Orchestrates video render jobs and compilation.

```typescript
import { videoCompilerRenderService } from "@/domains/video-editing"

// Start video compilation
const jobId = await videoCompilerRenderService.compileVideo(
  projectSchema,
  "/path/to/output.mp4"
)

// Get active render jobs
const activeJobs = await videoCompilerRenderService.getActiveJobs()
// Returns: Array<{
//   id: string
//   status: string
//   progress: number
//   started_at: string
//   finished_at?: string
//   error?: string
// }>

// Get specific render job
const job = await videoCompilerRenderService.getRenderJob(jobId)

// Cancel render job
const cancelled = await videoCompilerRenderService.cancelRender(jobId)

// Generate preview frame at timestamp
const jpegData = await videoCompilerRenderService.generatePreview(
  projectSchema,
  5.0 // timestamp in seconds
)
```

**Methods:**
- `compileVideo(project, outputPath)` - Start video compilation, returns job ID
- `getActiveJobs()` - Get list of active render jobs
- `getRenderJob(jobId)` - Get specific render job by ID
- `cancelRender(jobId)` - Cancel a render job
- `generatePreview(project, timestamp)` - Generate preview frame as JPEG bytes

### videoCompilerSystemService

Detects GPU capabilities, system information, and hardware acceleration.

```typescript
import { videoCompilerSystemService } from "@/domains/video-editing"

// Get GPU capabilities
const gpuCaps = await videoCompilerSystemService.getGpuCapabilitiesFull()
// Returns: {
//   available_encoders: string[]
//   recommended_encoder: string | null
//   current_gpu: any
//   hardware_acceleration_supported: boolean
// }

// Get system information
const systemInfo = await videoCompilerSystemService.getSystemInfo()

// Check FFmpeg capabilities
const ffmpegCaps = await videoCompilerSystemService.checkFfmpegCapabilities()

// Get compiler settings
const settings = await videoCompilerSystemService.getCompilerSettings()

// Enable/disable hardware acceleration
await videoCompilerSystemService.setHardwareAcceleration(true)

// Check hardware acceleration support
const supported = await videoCompilerSystemService.checkHardwareAccelerationSupport()
```

**Methods:**
- `getGpuCapabilitiesFull()` - Get full GPU capabilities information
- `getSystemInfo()` - Get system information (platform, CPU, etc.)
- `checkFfmpegCapabilities()` - Check FFmpeg version and capabilities
- `getCompilerSettings()` - Get advanced compiler settings
- `setHardwareAcceleration(enabled)` - Enable/disable hardware acceleration
- `checkHardwareAccelerationSupport()` - Check if hardware acceleration is supported

**Usage Pattern:**
All domain services follow the same pattern:
1. Import the singleton instance
2. Call async methods directly
3. Handle errors with try/catch
4. All methods include built-in logging

---

## Utilities

### MediaFileAdapter

```typescript
import { MediaFileAdapter } from "@/domains/video-editing"

// Convert from feature MediaFile to domain MediaFile
const domainFile = MediaFileAdapter.fromFeature(featureFile)

// Convert back to feature format
const featureFile = MediaFileAdapter.toFeature(domainFile)
```

### Clip Transform

```typescript
import { convertClipToTimelineClip, validateClip } from "@/domains/video-editing"

const timelineClip = convertClipToTimelineClip(backendClip)
const isValid = validateClip(clip)
```

### Project Transform

```typescript
import { projectToTimeline, timelineToProject } from "@/domains/video-editing"

const timeline = projectToTimeline(projectData)
const project = timelineToProject(timelineState)
```

### Type Validation

```typescript
import { validateProjectEvent, validateClip, validateTrack } from "@/domains/video-editing"

if (validateProjectEvent(event)) {
  // Event is valid
}
```

---

## Backend Commands

The orchestrator executes backend commands via `executeCommand()`:

| Command | Params | Description |
|---------|--------|-------------|
| `AddTrack` | `{ name, track_type, index }` | Add new track |
| `AddClip` | `{ track_id, media_id, time }` | Add clip to track |
| `MoveClip` | `{ clip_id, track_id, time }` | Move clip |
| `DeleteClip` | `{ clip_id }` | Delete clip |
| `TrimClip` | `{ clip_id, start, end }` | Trim clip |
| `SplitClip` | `{ clip_id, time }` | Split clip at time |
| `UpdateClip` | `{ clip_id, updates }` | Update clip properties |
| `CopyClips` | `{ clip_ids }` | Copy clips |
| `CutClips` | `{ clip_ids }` | Cut clips |
| `PasteClips` | `{ track_id, time }` | Paste clips |
| `BatchUpdateClips` | `{ updates[] }` | Batch update |
| `SelectClips` | `{ clip_ids, add_to_selection }` | Select clips |
| `SelectSections` | `{ section_ids, add_to_selection }` | Select sections |
| `ClearSelection` | - | Clear selection |

---

## Backend Events

Events received from backend and processed by orchestrator:

| Event | Payload | Description |
|-------|---------|-------------|
| `ProjectCreated` | `{ project_id, name }` | Project created |
| `ProjectOpened` | `{ project_id, path }` | Project opened |
| `ProjectSaved` | `{ project_id }` | Project saved |
| `ProjectClosed` | `{}` | Project closed |
| `ClipAdded` | `{ clip, track_id }` | Clip added |
| `ClipMoved` | `{ clip_id, new_start, new_track }` | Clip moved |
| `ClipTrimmed` | `{ clip_id, new_in, new_out }` | Clip trimmed |
| `ClipDeleted` | `{ clip_id, track_id }` | Clip deleted |
| `ClipUpdated` | `{ clip }` | Clip updated |
| `ClipSplit` | `{ original_id, clips[] }` | Clip split |
| `TrackAdded` | `{ track }` | Track added |
| `TrackDeleted` | `{ track_id }` | Track deleted |
| `TrackUpdated` | `{ track }` | Track updated |
| `PlaybackStarted` | `{}` | Playback started |
| `PlaybackStopped` | `{}` | Playback stopped |
| `PlaybackSeeked` | `{ time }` | Seek to time |
| `PlaybackRateChanged` | `{ rate }` | Rate changed |
