# Timeline API

## Overview

The Timeline API provides a complete set of functions for managing the video timeline, including tracks, clips, effects, and transitions.

## Core Components

### useTimeline Hook

Main hook for working with the timeline.

```typescript
const {
  project,              // Current project
  selectedClipIds,      // Selected clips
  playhead,            // Playback position
  zoom,                // Zoom level
  isPlaying,           // Playback state
  selection,           // Current selection
  undoStack,           // Change history
  redoStack,           // Undo history
} = useTimeline()
```

### TimelineProvider

Context provider for the timeline.

```typescript
<TimelineProvider initialProject={project}>
  <Timeline />
  <TimelineControls />
  <TimelineRuler />
</TimelineProvider>
```

## Data Structure

### TimelineProject

```typescript
interface TimelineProject {
  id: string
  name: string
  settings: ProjectSettings
  tracks: Track[]
  duration: number
  transitions: TimelineTransition[]
  markers: TimelineMarker[]
  metadata: ProjectMetadata
}

interface ProjectSettings {
  resolution: Resolution
  frameRate: number
  aspectRatio: AspectRatio
  audioSampleRate: number
  audioChannels: number
}
```

### Track

```typescript
interface Track {
  id: string
  type: TrackType
  name: string
  clips: Clip[]
  height: number
  muted: boolean
  locked: boolean
  visible: boolean
  solo: boolean
  color?: string
}

type TrackType = 'video' | 'audio' | 'text' | 'overlay'
```

### Clip

```typescript
interface Clip {
  id: string
  trackId: string
  mediaId: string
  startTime: number      // Position on timeline
  duration: number       // Duration on timeline
  inPoint: number        // Start in source media
  outPoint: number       // End in source media
  effects: VideoEffect[]
  keyframes: Keyframe[]
  metadata: ClipMetadata
}

interface ClipMetadata {
  name: string
  thumbnailUrl?: string
  originalDuration: number
  locked: boolean
  disabled: boolean
}
```

## Clip Operations

### useClips Hook

```typescript
const clips = useClips()

// Add clip
const newClip = await clips.addClip({
  trackId: 'track-1',
  mediaId: 'media-123',
  position: 10.5,
  duration: 5.0
})

// Move clip
await clips.moveClip(clipId, newTrackId, newPosition)

// Trim clip
await clips.trimClip(clipId, {
  startTime: 2.0,
  duration: 3.5
})

// Split clip
const [leftClip, rightClip] = await clips.splitClip(clipId, splitTime)

// Remove clip
await clips.removeClip(clipId)

// Duplicate clip
const duplicated = await clips.duplicateClip(clipId)
```

### Batch Operations

```typescript
// Batch operations
await clips.batchUpdate([
  { type: 'move', clipId: 'clip1', trackId: 'track2', position: 5 },
  { type: 'trim', clipId: 'clip2', startTime: 1, duration: 4 },
  { type: 'remove', clipId: 'clip3' }
])

// Align clips
await clips.alignClips(clipIds, {
  alignment: 'left', // 'left' | 'right' | 'center'
  reference: 'first' // 'first' | 'last' | 'playhead'
})

// Distribute clips
await clips.distributeClips(clipIds, {
  spacing: 0.5, // Gap in seconds
  overlap: false
})
```

## Track Management

### useTracks Hook

```typescript
const tracks = useTracks()

// Add track
const newTrack = await tracks.addTrack({
  type: 'video',
  name: 'Video Track 2',
  height: 80
})

// Reorder tracks
await tracks.reorderTrack(trackId, newIndex)

// Resize track
await tracks.resizeTrack(trackId, newHeight)

// Toggle states
await tracks.toggleMute(trackId)
await tracks.toggleLock(trackId)
await tracks.toggleSolo(trackId)

// Remove track
await tracks.removeTrack(trackId)
```

## Effects and Filters

### Applying Effects

```typescript
const effects = useEffects()

// Add effect to clip
await effects.addEffect(clipId, {
  type: 'brightness',
  params: { intensity: 0.5 }
})

// Update effect parameters
await effects.updateEffect(clipId, effectId, {
  params: { intensity: 0.7 }
})

// Reorder effects
await effects.reorderEffects(clipId, [effectId2, effectId1, effectId3])

// Copy effects between clips
await effects.copyEffects(sourceClipId, targetClipId)

// Remove effect
await effects.removeEffect(clipId, effectId)
```

### Effect Presets

```typescript
// Save preset
const preset = await effects.savePreset({
  name: 'Cinematic Look',
  effects: clip.effects
})

// Apply preset
await effects.applyPreset(clipId, presetId)

// Manage presets
const presets = await effects.getPresets()
await effects.deletePreset(presetId)
```

## Transitions

### useTransitions Hook

```typescript
const transitions = useTransitions()

// Add transition between clips
const transition = await transitions.addTransition({
  type: 'fade',
  duration: 1.0,
  fromClipId: 'clip1',
  toClipId: 'clip2'
})

// Update transition
await transitions.updateTransition(transitionId, {
  duration: 1.5,
  params: { direction: 'left' }
})

// Remove transition
await transitions.removeTransition(transitionId)
```

## Markers and Regions

### useMarkers Hook

```typescript
const markers = useMarkers()

// Add marker
const marker = await markers.addMarker({
  time: 15.5,
  name: 'Important moment',
  color: '#FF5733',
  type: 'comment' // 'comment' | 'chapter' | 'todo'
})

// Create region
const region = await markers.createRegion({
  startTime: 10,
  endTime: 20,
  name: 'Intro',
  color: '#3498DB'
})

// Navigate markers
await markers.jumpToMarker(markerId)
await markers.jumpToNextMarker()
await markers.jumpToPreviousMarker()
```

## Playback

### usePlayback Hook

```typescript
const playback = usePlayback()

// Playback control
playback.play()
playback.pause()
playback.stop()
playback.togglePlayPause()

// Navigation
playback.seek(timeInSeconds)
playback.seekToFrame(frameNumber)
playback.stepForward() // 1 frame
playback.stepBackward()

// Playback speed
playback.setPlaybackRate(2.0) // 2x speed

// Loop modes
playback.setLoopMode('none') // 'none' | 'all' | 'selection'
playback.setLoopRegion(startTime, endTime)
```

## History

### useHistory Hook

```typescript
const history = useHistory()

// Undo/Redo
history.undo()
history.redo()
history.canUndo() // boolean
history.canRedo() // boolean

// History management
history.clearHistory()
history.checkpoint('Before big change')

// Get history
const undoStack = history.getUndoStack()
const action = history.getLastAction()
```

## Selection and Navigation

### useSelection Hook

```typescript
const selection = useSelection()

// Select clips
selection.select(clipId)
selection.selectMultiple([clipId1, clipId2])
selection.selectAll()
selection.deselectAll()

// Select region
selection.selectRegion(startTime, endTime)

// Navigate selection
selection.selectNext()
selection.selectPrevious()
selection.extendSelection(clipId)
```

## Zoom and Scroll

### useTimelineView Hook

```typescript
const view = useTimelineView()

// Zoom
view.zoomIn()
view.zoomOut()
view.zoomToFit()
view.zoomToSelection()
view.setZoom(pixelsPerSecond)

// Scroll
view.scrollToTime(timeInSeconds)
view.scrollToClip(clipId)
view.centerPlayhead()

// Visible range
const visibleRange = view.getVisibleTimeRange()
// { start: 10, end: 25 }
```

## Snap and Alignment

### useSnapping Hook

```typescript
const snapping = useSnapping()

// Snap settings
snapping.setEnabled(true)
snapping.setSnapToGrid(true)
snapping.setSnapToClips(true)
snapping.setSnapToMarkers(true)
snapping.setSnapThreshold(5) // pixels

// Get snap points
const snapPoints = snapping.getSnapPoints(position)
const snappedPosition = snapping.snap(position)
```

## Region Export

```typescript
// Export selected region
const exportRegion = useExportRegion()

const region = exportRegion.setRegion(startTime, endTime)
const preview = await exportRegion.generatePreview()

await exportRegion.export({
  format: 'mp4',
  quality: 'high',
  outputPath: '/path/to/output.mp4'
})
```

## Timeline Events

```typescript
// Subscribe to events
timeline.on('clipAdded', (clip) => {
  console.log('Clip added:', clip)
})

timeline.on('selectionChanged', (selection) => {
  updateUI(selection)
})

timeline.on('playheadChanged', (time) => {
  updateTimeDisplay(time)
})

timeline.on('zoomChanged', (zoom) => {
  updateZoomSlider(zoom)
})

// Unsubscribe
timeline.off('clipAdded', handler)
```

## Performance

### Optimization for Large Projects

```typescript
// Track virtualization
const virtualizer = useTrackVirtualizer({
  trackHeight: 80,
  overscan: 2
})

// Lazy loading clips
const visibleClips = useVisibleClips({
  loadAhead: 5, // seconds
  unloadDelay: 10 // seconds
})

// Debounced updates
const debouncedUpdate = useDebouncedTimelineUpdate(100)
```

## AI Integration

```typescript
// AI assistant for timeline
const ai = useTimelineAI()

// Automatic clip arrangement
const suggestions = await ai.suggestArrangement(clips)
await ai.applyArrangement(suggestions)

// Smart trimming
const trimPoints = await ai.detectTrimPoints(clip)
await clips.trimClip(clipId, trimPoints)

// Generate transitions
const transitions = await ai.generateTransitions(clips)
```

---

*Last updated: July 31, 2025*