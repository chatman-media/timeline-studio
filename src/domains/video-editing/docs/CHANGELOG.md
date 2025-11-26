# Video Editing Domain - Changelog

## History of changes and audits

---

## [2024-11-27] Domain Services for Video Compiler

**Status:** Completed

### Changes
- Created `video-compiler-cache-service.ts` (87 lines) - Cache statistics and management
- Created `video-compiler-render-service.ts` - Render job orchestration and video compilation
- Created `video-compiler-system-service.ts` - GPU capabilities and hardware acceleration detection
- All services use singleton pattern with exported instances
- Each service encapsulates Tauri backend calls with built-in logging
- Updated documentation to reflect new domain services layer
- Added domain services architecture diagram to ARCHITECTURE.md

### New API Surface
**videoCompilerCacheService:**
- `getCacheStats()` - Retrieve cache statistics
- `clearPreviewCache()` - Clear preview frame cache
- `clearAllCache()` - Clear all cached data

**videoCompilerRenderService:**
- `compileVideo(project, outputPath)` - Start video compilation
- `getActiveJobs()` - Get list of active render jobs
- `getRenderJob(jobId)` - Get specific render job by ID
- `cancelRender(jobId)` - Cancel a render job
- `generatePreview(project, timestamp)` - Generate preview frame

**videoCompilerSystemService:**
- `getGpuCapabilitiesFull()` - Get GPU capabilities
- `getSystemInfo()` - Get system information
- `checkFfmpegCapabilities()` - Check FFmpeg version and capabilities
- `getCompilerSettings()` - Get advanced compiler settings
- `setHardwareAcceleration(enabled)` - Enable/disable hardware acceleration
- `checkHardwareAccelerationSupport()` - Check hardware acceleration support

### Benefits
- Clean separation between domain logic and backend IPC
- Centralized Tauri command invocation
- Consistent error handling and logging
- Easy testing with service mocking
- Type-safe API for all video compiler operations

---

## [2024-11-26] Documentation Restructure

**Status:** Completed

### Changes
- Created docs/ directory structure
- Added API.md with full API reference
- Added ARCHITECTURE.md with architecture diagrams
- CHANGELOG.md created in docs/
- README.md refactored to concise overview (~100 lines)

---

## [2024-11-25] Orchestrator Integration

**Status:** Completed

### Changes
- Implemented VideoEditingOrchestrator singleton
- Added getVideoEditingOrchestrator() factory function
- Integrated with BackendSync service
- Added actor synchronization between timeline, player, and UI
- Implemented event publishing to domain event bus

---

## [2024-11-24] State Machines Migration

**Status:** Completed

### Changes
- Migrated timelineMachine from features/timeline to domain
- Migrated playerMachine from features/video-player to domain
- Created timelineExtendedMachine for project/clip operations
- Added backend-event-handlers.ts for event processing
- Implemented XState v5 setup pattern

---

## [2024-11-23] Import/Export Services

**Status:** Completed

### Changes
- Implemented AAFExporter and AAFImporter
- Implemented FCPXMLExporter and FCPXMLImporter
- Implemented EDLExporter and EDLImporter
- Created importExportManager singleton
- Added professional metadata support (timecode, camera info, LUTs)

---

## [2024-11-22] Hooks and Providers

**Status:** Completed

### Changes
- Created useTimeline hook with full API
- Created usePlayer hook
- Created useUndoRedo hook with UndoRedoHelpers
- Implemented TimelineProvider suite (8 specialized providers)
- Implemented UndoRedoProvider

---

## Timeline Events

| Event | Description |
|-------|-------------|
| `SYNC_PLAYBACK_STATE` | Sync playback from backend |
| `SYNC_CURRENT_TIME` | Update current time |
| `SET_PLAYBACK_RATE` | Change playback rate |
| `SET_TIME_SCALE` | Zoom level change |
| `SET_SCROLL_POSITION` | Scroll position update |
| `SET_EDIT_MODE` | Switch edit mode (select/cut/trim/move) |
| `SET_SNAP_MODE` | Change snap mode |
| `SELECT_CLIP` | Select single clip |
| `SELECT_TRACK` | Select single track |
| `SELECT_SECTION` | Select section |
| `CLEAR_SELECTION` | Clear all selection |
| `START_DRAG_CLIP` | Begin clip drag |
| `START_DRAG_TRACK` | Begin track drag |
| `START_DRAG_RESOURCE` | Begin resource drag |
| `END_DRAG` | End drag operation |
| `COPY_TO_CLIPBOARD` | Copy to clipboard |
| `CLEAR_CLIPBOARD` | Clear clipboard |
| `TOGGLE_RECORDING` | Toggle recording mode |
| `TOGGLE_WAVEFORMS` | Show/hide waveforms |
| `TOGGLE_THUMBNAILS` | Show/hide thumbnails |
| `TOGGLE_MARKERS` | Show/hide markers |

---

## Player Events

| Event | Description |
|-------|-------------|
| `LOAD_VIDEO` | Load video file |
| `PLAY` | Start playback |
| `PAUSE` | Pause playback |
| `STOP` | Stop and reset |
| `SEEK` | Seek to time |
| `SET_VOLUME` | Change volume |
| `SET_PLAYBACK_RATE` | Change speed |
| `UPDATE_TIME` | Time update during playback |
| `VIDEO_LOADED` | Video loaded successfully |
| `VIDEO_ENDED` | Playback reached end |
| `VIDEO_ERROR` | Loading/playback error |
| `TOGGLE_SPEED_RAMPING` | Toggle speed ramping |
| `SET_VIDEO_SOURCE` | Switch browser/timeline source |
| `SET_PREVIEW_MEDIA` | Set preview media |
| `APPLY_EFFECT` | Apply video effect |
| `REMOVE_EFFECT` | Remove effect |
| `APPLY_FILTER` | Apply filter |
| `REMOVE_FILTER` | Remove filter |
| `APPLY_TEMPLATE` | Apply multi-cam template |
| `REMOVE_TEMPLATE` | Remove template |
| `START_RECORDING` | Begin recording |
| `STOP_RECORDING` | Stop recording |

---

## Backend Commands

| Command | Description |
|---------|-------------|
| `AddTrack` | Add new track |
| `AddClip` | Add clip to track |
| `MoveClip` | Move clip |
| `DeleteClip` | Delete clip |
| `TrimClip` | Trim clip boundaries |
| `SplitClip` | Split clip at time |
| `UpdateClip` | Update clip properties |
| `CopyClips` | Copy clips to buffer |
| `CutClips` | Cut clips to buffer |
| `PasteClips` | Paste from buffer |
| `BatchUpdateClips` | Batch update multiple clips |
| `SelectClips` | Select clips |
| `SelectSections` | Select sections |
| `ClearSelection` | Clear selection |

---

## Behavior (from tests)

### machines/timeline-machine.test.ts
- Initial state is "idle" with empty selection
- SET_TIME_SCALE clamps between 10 and 1000
- SET_EDIT_MODE switches between select/cut/trim/move
- SET_SNAP_MODE switches between none/grid/clips/markers
- SELECT_CLIP single selection replaces previous
- SELECT_CLIP with multiple=true toggles selection
- CLEAR_SELECTION empties all selection arrays
- START_DRAG_CLIP transitions to "dragging" state
- END_DRAG returns to "idle" and clears drag state
- COPY_TO_CLIPBOARD stores clipboard data
- TOGGLE_WAVEFORMS flips showWaveforms boolean
- SYNC_PLAYBACK_STATE updates isPlaying and currentTime

### machines/player-machine.test.ts
- Initial state is "idle"
- LOAD_VIDEO transitions to "loading"
- VIDEO_LOADED transitions to "ready.paused"
- PLAY in ready state transitions to "ready.playing"
- PAUSE transitions to "ready.paused"
- STOP returns to "idle" and resets time
- SEEK updates currentTime and sets isSeeking
- UPDATE_TIME updates currentTime during playback
- SET_VOLUME clamps between 0 and 1
- SET_PLAYBACK_RATE updates speed
- APPLY_EFFECT adds to appliedEffects array
- REMOVE_EFFECT filters from appliedEffects
- VIDEO_ERROR transitions to "error" state

### services/undo-redo-service.test.ts
- execute() adds action to undoStack
- execute() clears redoStack
- undo() moves action to redoStack
- redo() moves action to undoStack
- canUndo() returns false when stack empty
- canRedo() returns false when stack empty
- clear() empties both stacks
- Clip actions store before/after state
- Track actions store before/after state
- Keyframe actions store before/after state

### utils/media-file-adapter.test.ts
- fromFeature() converts feature format to domain
- toFeature() converts domain format to feature
- Preserves all metadata (resolution, fps, codec)
- Handles optional fields correctly
- Type checking validates MediaType enum

### utils/project-transform.test.ts
- projectToTimeline() converts project to timeline state
- timelineToProject() converts timeline to project format
- Preserves track and clip relationships
- Handles empty projects correctly
- Validates required fields

### utils/clip-transform.test.ts
- convertClipToTimelineClip() transforms backend clips
- validateClip() returns true for valid clips
- validateClip() returns false for missing required fields
- Handles effect and transition arrays

### utils/type-validation.test.ts
- validateProjectEvent() validates event structure
- Rejects unknown event types
- Validates clip payload structure
- Validates track payload structure

---

## Import/Export Formats

| Format | Import | Export | NLE Compatibility |
|--------|--------|--------|-------------------|
| AAF | ✅ | ✅ | Avid Media Composer |
| FCPXML | ✅ | ✅ | Final Cut Pro X |
| EDL | ✅ | ✅ | Universal (CMX 3600) |
| .tlproj | ✅ | ✅ | Timeline Studio Native |

---

## Dependencies

### Internal
- `@/domains/shared` - Events, types, utilities
- `@/domains/project-management` - Project settings
- `@/features/app-state` - BackendSync service
- `@/types/generated/state-types` - Backend command types

### External
- `xstate` v5 - State machines
- `@tauri-apps/api` - Tauri IPC

### Used by
- `@/features/timeline` - Timeline UI components
- `@/features/video-player` - Player components
- `@/features/effects` - Effects and filters UI
- `@/features/media-studio` - Main editing workspace
