# Video Editing Domain - Architecture

## Overview

Домен `video-editing` — центральный домен Timeline Studio, управляющий редактированием видео: таймлайном, воспроизведением, эффектами, импортом/экспортом проектов.

## Directory Structure

```
src/domains/video-editing/
├── index.ts                              # Public API exports
├── README.md                             # Overview documentation
├── docs/
│   ├── API.md                            # Full API reference
│   ├── ARCHITECTURE.md                   # This file
│   └── CHANGELOG.md                      # History
├── hooks/
│   ├── use-player.ts                     # Player control hook
│   ├── use-timeline.ts                   # Timeline management hook
│   ├── use-undo-redo.ts                  # Undo/redo hook
│   └── use-video-editing.ts              # Combined hook
├── machines/
│   ├── player-machine.ts                 # Player state machine
│   ├── timeline-machine.ts               # Timeline UI state machine
│   ├── timeline-extended-machine.ts      # Extended timeline logic
│   └── backend-event-handlers.ts         # Backend event processing
├── providers/
│   ├── timeline-providers.tsx            # All timeline providers
│   ├── undo-redo-provider.tsx            # Undo/redo context
│   └── video-editing-provider.tsx        # Main domain provider
├── services/
│   ├── effects/
│   │   ├── index.ts
│   │   ├── user-presets-service.ts       # Effect presets
│   │   └── user-effects-service.ts       # User effects
│   ├── import-export/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── exporters/
│   │   │   ├── aaf-exporter.ts           # Avid AAF export
│   │   │   ├── edl-exporter.ts           # EDL export
│   │   │   └── fcpxml-exporter.ts        # FCPXML export
│   │   ├── importers/
│   │   │   ├── aaf-importer.ts           # Avid AAF import
│   │   │   ├── edl-importer.ts           # EDL import
│   │   │   └── fcpxml-importer.ts        # FCPXML import
│   │   └── import-export-manager.ts      # Manager singleton
│   ├── subtitles/
│   │   └── index.ts                      # Subtitle services
│   ├── compiler/
│   │   └── video-compiler-service.ts     # Video compilation
│   ├── undo-redo-service.ts              # Undo/redo service
│   └── video-editing-orchestrator.ts     # Main orchestrator
├── types/
│   ├── index.ts                          # Type exports
│   ├── context.ts                        # Context types
│   ├── effects.ts                        # Effect types
│   ├── media.ts                          # Media types
│   ├── player.ts                         # Player types
│   ├── timeline.ts                       # Timeline types
│   └── video-compiler.ts                 # Compiler types
├── utils/
│   ├── clip-transform.ts                 # Clip transformations
│   ├── command-queue.ts                  # Command queue
│   ├── media-file-adapter.ts             # Media file adapter
│   ├── project-transform.ts              # Project transformations
│   └── type-validation.ts                # Type validation
├── __tests__/
└── __mocks__/
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Components                             │
│     (TimelineEditor, VideoPlayer, EffectsPanel, TrackList)          │
└─────────────────────────────────────────────────────────────────────┘
          │              │               │              │
          ▼              ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ useTimeline()│ │  usePlayer() │ │useUndoRedo() │ │Provider Hooks│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
          │              │               │              │
          └──────────────┴───────────────┴──────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   VideoEditingOrchestrator                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Singleton Instance                        │   │
│  │  • timelineExtendedActor: Extended timeline logic           │   │
│  │  • playerActor: Playback control                            │   │
│  │  • timelineUIActor: UI state (selection, drag, zoom)        │   │
│  │  • backendSync: BackendSync service                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        Methods                               │   │
│  │  Project: createProject(), loadProject(), saveProject()      │   │
│  │  Playback: play(), pause(), stop(), seek()                   │   │
│  │  Clips: addClip(), moveClip(), trimClip(), splitClip()       │   │
│  │  Tracks: addTrack()                                          │   │
│  │  Selection: selectClips(), clearSelection()                  │   │
│  │  Commands: executeCommand()                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  timelineExtended │ │   playerMachine   │ │  timelineMachine  │
│      Machine      │ │                   │ │     (UI State)    │
│  ┌─────────────┐  │ │  ┌─────────────┐  │ │  ┌─────────────┐  │
│  │ States:     │  │ │  │ States:     │  │ │  │ States:     │  │
│  │  idle       │  │ │  │  idle       │  │ │  │  idle       │  │
│  │  active     │  │ │  │  loading    │  │ │  │  dragging   │  │
│  │  saving     │  │ │  │  ready      │  │ │  └─────────────┘  │
│  │  loading    │  │ │  │   playing   │  │ └───────────────────┘
│  │  error      │  │ │  │   paused    │  │
│  └─────────────┘  │ │  │  error      │  │
└───────────────────┘ │  └─────────────┘  │
                      └───────────────────┘
          │                     │
          └──────────┬──────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BackendSync Service                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • executeCommand(command: ProjectCommand)                   │   │
│  │  • onStateChange(callback)                                   │   │
│  │  • getState()                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Tauri Backend (Rust)                            │
│                                                                      │
│  Project State │ Playback State │ Media Pool │ Clip Operations      │
└─────────────────────────────────────────────────────────────────────┘
```

## State Machine: playerMachine

```
     ┌─────────────┐
     │    idle     │
     └──────┬──────┘
            │
            │ LOAD_VIDEO
            ▼
     ┌─────────────┐
     │   loading   │
     └──────┬──────┘
            │
            ├─── VIDEO_LOADED ────┐
            │                     │
            │ VIDEO_ERROR         │
            ▼                     ▼
     ┌─────────────┐       ┌─────────────────────┐
     │    error    │       │       ready          │
     └─────────────┘       │  ┌───────────────┐  │
            │              │  │    paused     │◄─┼──── PAUSE
            │              │  └───────┬───────┘  │
            │              │          │          │
            │              │          │ PLAY     │
            │              │          ▼          │
            │              │  ┌───────────────┐  │
            │              │  │   playing     │──┼──── VIDEO_ENDED
            │              │  └───────────────┘  │
            │              └─────────────────────┘
            │                        │
            │ LOAD_VIDEO             │ STOP
            └────────────────────────┴──────────────► idle
```

## State Machine: timelineMachine (UI)

```
     ┌─────────────┐
     │    idle     │◄────────────────────────────────────┐
     └──────┬──────┘                                     │
            │                                            │
            │ START_DRAG_CLIP                            │
            │ START_DRAG_TRACK                           │
            │ START_DRAG_RESOURCE                        │
            ▼                                            │
     ┌─────────────┐                                     │
     │  dragging   │─────────── END_DRAG ────────────────┘
     └─────────────┘

Events handled in idle state:
  • SYNC_PLAYBACK_STATE, SYNC_CURRENT_TIME
  • SET_TIME_SCALE, SET_SCROLL_POSITION
  • SET_EDIT_MODE, SET_SNAP_MODE
  • SELECT_CLIP, SELECT_TRACK, SELECT_SECTION, CLEAR_SELECTION
  • COPY_TO_CLIPBOARD, CLEAR_CLIPBOARD
  • TOGGLE_RECORDING, TOGGLE_WAVEFORMS, TOGGLE_THUMBNAILS, TOGGLE_MARKERS
  • SET_UI_ERROR, CLEAR_UI_ERROR
```

## Orchestrator Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hooks (UI Layer)                              │
│      useTimeline()        usePlayer()        useUndoRedo()      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ All hooks access orchestrator via
                              │ getVideoEditingOrchestrator()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              VideoEditingOrchestrator (Singleton)                │
│                                                                  │
│  let instance: VideoEditingOrchestrator | null = null           │
│                                                                  │
│  getInstance(): VideoEditingOrchestrator                         │
│    if (!instance) {                                             │
│      instance = new VideoEditingOrchestrator()                  │
│    }                                                            │
│    return instance                                              │
│                                                                  │
│  Constructor:                                                    │
│    1. Create actors (timeline, player, timelineUI)              │
│    2. Start all actors                                          │
│    3. Setup backend sync                                        │
│    4. Setup event handlers                                      │
│    5. Setup actor synchronization                               │
│    6. Setup event publishing                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Orchestrator manages three actors
                              ▼
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Timeline     │   │    Player     │   │  Timeline UI  │
│  Extended     │   │    Actor      │   │    Actor      │
│    Actor      │   │               │   │               │
│               │   │  Playback     │   │  Selection    │
│  Project      │   │  Effects      │   │  Drag/Drop   │
│  Clips        │   │  Recording    │   │  Zoom/Scroll │
│  Tracks       │   │               │   │  Clipboard   │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Actor Synchronization Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                    Actor Synchronization                          │
└───────────────────────────────────────────────────────────────────┘

1. Player → Timeline UI (Time sync)
   ┌──────────────┐     currentTime, isPlaying     ┌──────────────┐
   │ playerActor  │ ──────────────────────────────► │timelineUIActor│
   └──────────────┘     SYNC_CURRENT_TIME          └──────────────┘
                        SYNC_PLAYBACK_STATE

2. Timeline UI → Timeline Extended (Selection sync)
   ┌──────────────┐    selectedClipIds, trackIds    ┌──────────────┐
   │timelineUIActor│ ──────────────────────────────► │timelineExtended│
   └──────────────┘    SELECT_CLIPS, SELECT_TRACKS  └──────────────┘

3. Backend → Orchestrator → Actors (State sync)
   ┌──────────────┐                                  ┌──────────────┐
   │   Backend    │ ── onStateChange ──────────────► │ Orchestrator │
   └──────────────┘                                  └──────┬───────┘
                                                            │
                                    ┌───────────────────────┼───────────────────────┐
                                    ▼                       ▼                       ▼
                            ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
                            │timelineExtended│       │ playerActor  │       │timelineUIActor│
                            │ PROJECT_UPDATED│       │  SYNC_STATE  │       │               │
                            └──────────────┘       └──────────────┘       └──────────────┘
```

## Import/Export Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   importExportManager                            │
│              (Singleton Manager)                                 │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  AAF Exporter   │  │ FCPXML Exporter │  │  EDL Exporter   │
│  AAF Importer   │  │ FCPXML Importer │  │  EDL Importer   │
│                 │  │                 │  │                 │
│  Avid Media     │  │  Final Cut Pro  │  │  Edit Decision  │
│  Composer       │  │                 │  │  List           │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Export Flow:
  Timeline State ──► Exporter ──► Format-specific file (AAF/FCPXML/EDL)

Import Flow:
  Format-specific file ──► Importer ──► Timeline State
```

## Undo/Redo Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     UndoRedoService                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  undoStack: UndoRedoAction[]                            │   │
│  │  redoStack: UndoRedoAction[]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  execute(action) ──► Push to undoStack ──► Clear redoStack     │
│  undo() ──► Pop from undoStack ──► Push to redoStack           │
│  redo() ──► Pop from redoStack ──► Push to undoStack           │
└─────────────────────────────────────────────────────────────────┘

UndoRedoAction Structure:
┌─────────────────────────────────────────────────────────────────┐
│  {                                                               │
│    type: "add_clip" | "remove_clip" | "move_clip" | ...         │
│    clipId?: string                                               │
│    trackId?: string                                              │
│    keyframeId?: string                                           │
│    before: State | null                                          │
│    after: State | null                                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interaction                             │
│          (Click, Drag, Keyboard Shortcut)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Component                             │
│                  (TimelineEditor, Player)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Hook                                     │
│              (useTimeline, usePlayer)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator                                  │
│            (VideoEditingOrchestrator)                            │
│                                                                  │
│  1. Send event to XState actor                                  │
│  2. Execute backend command (if needed)                          │
│  3. Publish domain event (if needed)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ XState     │  │  Backend   │  │ EventBus   │
     │ Actor      │  │  Sync      │  │ Publish    │
     └────────────┘  └────────────┘  └────────────┘
            │               │
            │               ▼
            │        ┌────────────┐
            │        │  Tauri     │
            │        │  Backend   │
            │        └────────────┘
            │               │
            │               ▼
            │        ┌────────────┐
            │        │ State      │
            │        │ Update     │
            │        └────────────┘
            │               │
            └───────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Component Re-render                              │
│              (State subscription update)                         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Singleton Orchestrator

**Decision:** VideoEditingOrchestrator is a singleton managing all actors.

**Rationale:**
- Single coordination point for timeline, player, and UI state
- Consistent state synchronization between actors
- Centralized backend communication
- Easy cleanup with stop() method

### 2. Three-Actor Architecture

**Decision:** Separate actors for timeline extended logic, player, and UI state.

**Rationale:**
- Separation of concerns (data vs playback vs UI)
- Independent scaling and testing
- Reduced coupling between different state types
- Clear ownership of state transitions

### 3. Backend Synchronization

**Decision:** All clip/track operations go through backend via executeCommand().

**Rationale:**
- Single source of truth in Rust backend
- Persistent state across sessions
- Optimized video processing in Rust
- Consistent undo/redo across frontend and backend

### 4. Professional Format Support

**Decision:** Native support for AAF, FCPXML, and EDL formats.

**Rationale:**
- Industry-standard interchange formats
- Seamless workflow with Avid, Final Cut Pro, DaVinci Resolve
- Professional metadata preservation (timecode, camera info, LUTs)

## Dependencies

### Internal Dependencies

```
video-editing
    │
    ├── @/domains/shared
    │   └── events, types, utilities
    │
    ├── @/domains/project-management
    │   └── project settings
    │
    ├── @/features/app-state
    │   └── BackendSync service
    │
    └── @/types/generated/state-types
        └── ProjectCommand types
```

### External Dependencies

- `xstate` (v5) - State machines
- `@tauri-apps/api` - Tauri IPC bridge

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/video-editing/__tests__/
```

**Test Files:**
- `machines/timeline-machine.test.ts` - UI state machine
- `machines/player-machine.test.ts` - Player state machine
- `services/undo-redo-service.test.ts` - Undo/redo logic
- `utils/media-file-adapter.test.ts` - Media file conversion
- `utils/project-transform.test.ts` - Project serialization
- `utils/clip-transform.test.ts` - Clip transformations
- `utils/type-validation.test.ts` - Type validation

**Coverage:** 204 tests, 3,254 lines of test code

## Performance Considerations

### Optimizations

1. **Actor-based State** - Only subscribers receive updates
2. **Debounced Backend Sync** - Prevents excessive IPC calls
3. **Batch Operations** - batchUpdateClips() for multiple changes
4. **Lazy Actor Creation** - Actors created on first orchestrator access
5. **Subscription Management** - Automatic cleanup on unmount
