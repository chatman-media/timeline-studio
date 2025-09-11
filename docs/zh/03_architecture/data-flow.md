# Data Flow in Timeline Studio

## 📋 Contents

- [Data Flow Overview](#data-flow-overview)
- [Project Lifecycle](#project-lifecycle)
- [Media File Processing](#media-file-processing)
- [Timeline State](#timeline-state)
- [Rendering and Export](#rendering-and-export)
- [State Synchronization](#state-synchronization)

## 🌊 Data Flow Overview

Timeline Studio uses unidirectional data flow with clear separation of responsibilities between layers:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI Layer  │ ──> │ State Layer  │ ──> │ Data Layer  │
│   (React)   │ <── │   (XState)   │ <── │   (Rust)    │
└─────────────┘     └──────────────┘     └─────────────┘
      ▲                                           │
      └───────────── Events/Updates ──────────────┘
```

## 📂 Project Lifecycle

### 1. Project Creation

```typescript
// Frontend: Initiate creation
const createProject = async (settings: ProjectSettings) => {
  // 1. Frontend validation
  const validated = validateProjectSettings(settings)
  
  // 2. Send command to backend
  const project = await invoke('create_project', { settings: validated })
  
  // 3. Update state
  projectMachine.send({ 
    type: 'PROJECT_CREATED', 
    project 
  })
  
  // 4. Initialize subsystems
  await initializeTimeline(project.id)
  await initializeResources(project.id)
}
```

```rust
// Backend: Handle creation
#[tauri::command]
async fn create_project(settings: ProjectSettings) -> Result<Project> {
    // 1. Create project structure
    let project_id = Uuid::new_v4();
    let project_dir = get_projects_dir().join(&project_id.to_string());
    fs::create_dir_all(&project_dir)?;
    
    // 2. Initialize project database
    let db_path = project_dir.join("project.db");
    let pool = create_project_database(&db_path).await?;
    
    // 3. Save settings
    let project = Project {
        id: project_id,
        name: settings.name,
        created_at: Utc::now(),
        settings,
        media_files: Vec::new(),
        timeline: Timeline::default(),
    };
    
    save_project_metadata(&pool, &project).await?;
    
    Ok(project)
}
```

### 2. Project Loading

```mermaid
sequenceDiagram
    participant UI
    participant State
    participant Backend
    participant FS
    
    UI->>State: LOAD_PROJECT
    State->>Backend: invoke('load_project')
    Backend->>FS: Read project files
    FS-->>Backend: Project data
    Backend->>Backend: Verify media paths
    Backend-->>State: Project + Media
    State->>State: Update machines
    State-->>UI: Render UI
```

## 🎬 Media File Processing

### Media Import

```typescript
// Frontend: Import component
export function MediaImporter() {
  const { importFiles } = useMediaImport()
  
  const handleDrop = async (files: File[]) => {
    // 1. Get file paths
    const paths = files.map(f => f.path)
    
    // 2. Start import with progress
    const imported = await importFiles(paths)
    
    // 3. Update media browser
    mediaBrowser.send({ 
      type: 'FILES_ADDED', 
      files: imported 
    })
  }
}

// Import hook
function useMediaImport() {
  const importFiles = async (paths: string[]) => {
    const results = []
    
    for (const path of paths) {
      // Parallel processing
      results.push(
        invoke('import_media_file', { path })
      )
    }
    
    return Promise.all(results)
  }
  
  return { importFiles }
}
```

```rust
// Backend: Media processing
#[tauri::command]
async fn import_media_file(
    path: String,
    state: State<'_, AppState>
) -> Result<MediaFile> {
    // 1. Verify file
    let metadata = extract_media_metadata(&path).await?;
    
    // 2. Generate preview
    let thumbnail = generate_thumbnail(&path, &metadata).await?;
    
    // 3. Copy to project media folder
    let media_path = copy_to_project_media(&path, &state.current_project).await?;
    
    // 4. Create record
    let media_file = MediaFile {
        id: Uuid::new_v4(),
        original_path: path,
        project_path: media_path,
        metadata,
        thumbnail,
        imported_at: Utc::now(),
    };
    
    // 5. Save to database
    save_media_file(&state.db, &media_file).await?;
    
    // 6. Update cache
    state.media_cache.insert(media_file.id, media_file.clone()).await;
    
    Ok(media_file)
}
```

### Preview Generation

```rust
// Parallel preview generation
pub async fn generate_previews(files: Vec<MediaFile>) -> Vec<Preview> {
    use rayon::prelude::*;
    
    files
        .par_iter()
        .map(|file| {
            match file.media_type {
                MediaType::Video => generate_video_preview(file),
                MediaType::Audio => generate_waveform(file),
                MediaType::Image => generate_image_thumbnail(file),
            }
        })
        .collect()
}

async fn generate_video_preview(file: &MediaFile) -> Preview {
    // Extract keyframes
    let keyframes = extract_keyframes(&file.path, 10).await?;
    
    // Create preview sprite
    let sprite = create_preview_sprite(keyframes).await?;
    
    Preview {
        file_id: file.id,
        sprite_path: sprite,
        frame_count: keyframes.len(),
    }
}
```

## 📐 Timeline State

### Timeline Data Structure

```typescript
// types/timeline.ts
interface Timeline {
  id: string
  tracks: Track[]
  duration: number
  playhead: number
  zoom: number
  selection: Selection | null
}

interface Track {
  id: string
  type: 'video' | 'audio' | 'text'
  clips: Clip[]
  height: number
  muted: boolean
  locked: boolean
}

interface Clip {
  id: string
  mediaId: string
  trackId: string
  startTime: number
  duration: number
  inPoint: number
  outPoint: number
  effects: Effect[]
  transitions: Transition[]
}
```

### Timeline XState Machine

```typescript
// services/timeline-machine.ts
export const timelineMachine = setup({
  types: {} as {
    context: TimelineContext
    events: TimelineEvent
  },
  guards: {
    canAddClip: ({ context, event }) => {
      // Check for overlaps
      return !hasOverlap(context.clips, event.clip)
    },
    canSplitClip: ({ context }) => {
      return context.selectedClip !== null
    }
  },
  actions: {
    addClipToTimeline: assign({
      clips: ({ context, event }) => {
        const newClip = createClip(event.media, event.position)
        return [...context.clips, newClip]
      }
    }),
    updatePlayhead: assign({
      playhead: ({ event }) => event.position
    }),
    applyEffect: assign({
      clips: ({ context, event }) => {
        return context.clips.map(clip =>
          clip.id === event.clipId
            ? { ...clip, effects: [...clip.effects, event.effect] }
            : clip
        )
      }
    })
  }
}).createMachine({
  id: 'timeline',
  initial: 'idle',
  context: {
    clips: [],
    tracks: [],
    playhead: 0,
    zoom: 1,
    selection: null
  },
  states: {
    idle: {
      on: {
        DRAG_START: 'dragging',
        PLAY: 'playing',
        SELECT_CLIP: {
          actions: assign({
            selection: ({ event }) => ({
              type: 'clip',
              id: event.clipId
            })
          })
        }
      }
    },
    dragging: {
      on: {
        DRAG_MOVE: {
          actions: 'updateDragPosition'
        },
        DRAG_END: {
          target: 'idle',
          actions: 'finalizeDrag'
        }
      }
    },
    playing: {
      invoke: {
        src: 'playbackService',
        onSnapshot: {
          actions: 'updatePlayhead'
        }
      },
      on: {
        PAUSE: 'idle',
        STOP: {
          target: 'idle',
          actions: assign({ playhead: 0 })
        }
      }
    }
  }
})
```

### Video Player Synchronization

```typescript
// hooks/useTimelineSync.ts
export function useTimelineSync() {
  const video = useVideoPlayer()
  const timeline = useTimeline()
  
  // Sync playback position
  useEffect(() => {
    const interval = setInterval(() => {
      if (video.isPlaying) {
        timeline.send({
          type: 'UPDATE_PLAYHEAD',
          position: video.currentTime
        })
      }
    }, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [video.isPlaying])
  
  // Sync seek operations
  const handleTimelineSeek = (position: number) => {
    video.seek(position)
    timeline.send({
      type: 'UPDATE_PLAYHEAD',
      position
    })
  }
  
  return { handleTimelineSeek }
}
```

## 🎨 Rendering and Export

### Export Process

```typescript
// Frontend: Initiate export
async function exportVideo(settings: ExportSettings) {
  // 1. Prepare timeline data
  const timelineData = serializeTimeline(timeline)
  
  // 2. Start export
  const exportId = await invoke('start_export', {
    timeline: timelineData,
    settings
  })
  
  // 3. Track progress
  const unlisten = await listen(`export-progress-${exportId}`, (event) => {
    updateProgress(event.payload)
  })
  
  // 4. Wait for completion
  const result = await invoke('wait_export', { exportId })
  unlisten()
  
  return result
}
```

```rust
// Backend: Rendering process
pub async fn render_timeline(
    timeline: Timeline,
    settings: ExportSettings,
    progress_tx: Sender<RenderProgress>,
) -> Result<String> {
    // 1. Create render graph
    let graph = build_render_graph(&timeline)?;
    
    // 2. Initialize FFmpeg
    let mut encoder = VideoEncoder::new(&settings);
    
    // 3. Frame-by-frame rendering
    let total_frames = calculate_total_frames(&timeline, &settings);
    
    for frame_num in 0..total_frames {
        // Frame composition
        let frame = compose_frame(&graph, frame_num).await?;
        
        // Apply effects
        let processed = apply_frame_effects(frame, &timeline.global_effects);
        
        // Encode
        encoder.encode_frame(processed)?;
        
        // Send progress
        progress_tx.send(RenderProgress {
            current: frame_num,
            total: total_frames,
            fps: encoder.current_fps(),
        }).await?;
    }
    
    // 4. Finalize
    let output_path = encoder.finalize()?;
    Ok(output_path)
}
```

### Frame Composition

```rust
async fn compose_frame(
    graph: &RenderGraph,
    frame_num: u32
) -> Result<Frame> {
    let mut compositor = FrameCompositor::new();
    
    // Traverse graph bottom-up (by tracks)
    for track in graph.tracks.iter().rev() {
        for node in track.nodes_at_frame(frame_num) {
            match node {
                RenderNode::Clip(clip) => {
                    let frame = extract_clip_frame(clip, frame_num)?;
                    compositor.add_layer(frame, clip.blend_mode);
                }
                RenderNode::Transition(transition) => {
                    let frames = extract_transition_frames(transition, frame_num)?;
                    compositor.add_transition(frames, transition.type);
                }
                RenderNode::Text(text) => {
                    let rendered = render_text(text, frame_num)?;
                    compositor.add_overlay(rendered);
                }
            }
        }
    }
    
    Ok(compositor.finalize())
}
```

## 🔄 State Synchronization

### Optimistic Updates

```typescript
// Optimistic update with rollback
async function updateClipEffect(clipId: string, effect: Effect) {
  // 1. Save current state
  const previousState = timeline.getSnapshot()
  
  // 2. Apply change locally
  timeline.send({
    type: 'APPLY_EFFECT',
    clipId,
    effect
  })
  
  try {
    // 3. Send to backend
    await invoke('update_clip_effect', { clipId, effect })
  } catch (error) {
    // 4. Rollback on error
    timeline.send({
      type: 'RESTORE_STATE',
      state: previousState
    })
    throw error
  }
}
```

### Debouncing and Batching

```typescript
// Batch position updates
const positionUpdates = useDebouncedBatch<PositionUpdate>(
  async (updates) => {
    await invoke('batch_update_positions', { updates })
  },
  100 // 100ms debounce
)

// Usage
function handleClipMove(clipId: string, newPosition: number) {
  // Local update
  updateClipPosition(clipId, newPosition)
  
  // Batched backend update
  positionUpdates.add({ clipId, position: newPosition })
}
```

## 📊 Performance Monitoring

```typescript
// Operation profiling
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  
  async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - start
      
      this.recordMetric(name, duration, 'success')
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(name, duration, 'error')
      throw error
    }
  }
  
  private recordMetric(name: string, duration: number, status: string) {
    const metric = this.metrics.get(name) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      maxDuration: 0
    }
    
    metric.count++
    metric.totalDuration += duration
    metric.averageDuration = metric.totalDuration / metric.count
    metric.maxDuration = Math.max(metric.maxDuration, duration)
    
    this.metrics.set(name, metric)
    
    // Send metrics to analytics
    if (metric.count % 100 === 0) {
      this.sendAnalytics(name, metric)
    }
  }
}
```

---

*For more details, see the [Component Communication](COMMUNICATION.md) and [State Management](FRONTEND/STATE_MANAGEMENT.md) documentation.*