# Video Player Transition Preview API

## Overview

The Video Player transition preview system provides real-time rendering of transitions between clips using WebGL2.

## Core Components

### VideoPlayerWithTransitions

Extended VideoPlayer with transition preview support.

```typescript
interface VideoPlayerWithTransitionsProps {
  className?: string
  showTransitionOverlay?: boolean      // Show detailed information
  showMiniIndicator?: boolean          // Show mini indicator
  enableTransitionPreview?: boolean    // Enable preview
}

<VideoPlayerWithTransitions
  enableTransitionPreview={true}
  showTransitionOverlay={true}
  showMiniIndicator={true}
/>
```

### useTransitionPreview Hook

Hook for managing transition preview.

```typescript
const {
  state,              // Current transition state
  renderTransition,   // Rendering function
  isTransitionActive, // Check if active
  startPreview,       // Start preview
  stopPreview,        // Stop preview
  seekToTime,         // Seek to time
} = useTransitionPreview({
  enablePreview: true,
  autoPlay: false,
  loop: false,
})
```

### TransitionPreviewState

```typescript
interface TransitionPreviewState {
  activeTransition: TimelineTransition | null  // Active transition
  progress: number                             // Progress (0-1)
  isPlaying: boolean                          // Is playing
  startTime: number                           // Start time
  endTime: number                             // End time
}
```

## UI Components

### TransitionPlayerOverlay

Detailed transition information overlay on video.

```typescript
<TransitionPlayerOverlay
  transition={activeTransition}
  progress={0.5}
  onClose={() => setShowOverlay(false)}
  compact={false}  // false = full info, true = compact
/>
```

### TransitionMiniIndicator

Compact active transition indicator.

```typescript
<TransitionMiniIndicator
  transition={activeTransition}
  progress={0.3}
/>
```

### TransitionPreviewSettings

Preview settings panel.

```typescript
<TransitionPreviewSettings
  isEnabled={true}
  onEnabledChange={setEnabled}
  showOverlay={true}
  onShowOverlayChange={setShowOverlay}
  showMiniIndicator={true}
  onShowMiniIndicatorChange={setShowMiniIndicator}
  quality={100}
  onQualityChange={setQuality}
/>
```

## TransitionsPreviewService Integration

### WebGL2 Rendering

The system uses the existing `TransitionsPreviewService` for rendering:

```typescript
// Automatically used inside components
const transitionService = getTransitionsPreviewService()

// Render transition
const success = transitionService.applyTransition(
  videoElementA,      // Source video
  videoElementB,      // Target video  
  'fade',            // Transition type
  {
    duration: 2.0,
    progress: 0.5,
    easingFunction: 'easeInOut',
    direction: 'forward',
    customParams: { intensity: 1.0 }
  },
  outputCanvas       // Output canvas
)
```

### Supported Transitions

- **Fade**: Smooth fade
- **Dissolve**: Dissolve with noise
- **Wipe Left/Right/Up/Down**: Directional wipes
- **Slide**: Sliding
- **Zoom In/Out**: Scaling
- **Rotate**: Rotation
- **Circle Wipe**: Circular wipe
- **Pixelate**: Pixelation

## Algorithm

### 1. Detecting Active Transitions

```typescript
// useTransitionPreview automatically tracks timeline
const activeTransition = getTransitionAtTime(currentTime)

if (activeTransition) {
  const progress = (currentTime - transition.position) / transition.duration
  // Apply transition
}
```

### 2. Real-time Rendering

```typescript
useEffect(() => {
  if (activeTransition && videoA && videoB && canvas) {
    // Sync videos with current time
    videoA.currentTime = getClipTimeAtPosition(currentTime)
    videoB.currentTime = getNextClipTimeAtPosition(currentTime)
    
    // Render transition
    renderTransition(videoA, videoB, canvas)
  }
}, [currentTime, activeTransition])
```

### 3. Visibility Switching

- **Without transition**: Shows main video
- **With transition**: Shows canvas with transition render
- **Smooth switching** between modes

## Performance

### Optimizations

1. **Lazy initialization** of WebGL context
2. **Caching** of compiled shaders
3. **Reuse** of textures and buffers
4. **Quality adjustment** for rendering (25%, 50%, 75%, 100%)

### System Requirements

- **WebGL2** support
- **Modern GPU** for smooth rendering
- **Sufficient memory** for video textures

## Usage Examples

### Basic Preview

```typescript
function VideoPlayerExample() {
  return (
    <VideoPlayerWithTransitions
      enableTransitionPreview={true}
      showMiniIndicator={true}
    />
  )
}
```

### With Settings

```typescript
function AdvancedVideoPlayer() {
  const [showSettings, setShowSettings] = useState(false)
  const [previewEnabled, setPreviewEnabled] = useState(true)
  
  return (
    <div className="relative">
      <VideoPlayerWithTransitions
        enableTransitionPreview={previewEnabled}
        showTransitionOverlay={showSettings}
      />
      
      <div className="absolute top-4 right-4">
        <TransitionPreviewSettings
          isEnabled={previewEnabled}
          onEnabledChange={setPreviewEnabled}
          // ... other settings
        />
      </div>
    </div>
  )
}
```

### Timeline Integration

```typescript
function TimelineIntegratedPlayer() {
  const { currentTime } = useTimeline()
  const activeTransition = useActiveTransition()
  
  return (
    <div>
      <VideoPlayerWithTransitions
        enableTransitionPreview={!!activeTransition}
        showMiniIndicator={true}
      />
      
      {activeTransition && (
        <TransitionPreviewStatus
          isEnabled={true}
          hasActiveTransition={true}
          transitionName={activeTransition.transition.transitionId}
        />
      )}
    </div>
  )
}
```

## Events and Callbacks

### State Management

```typescript
const transitionPreview = useTransitionPreview({
  enablePreview: true,
  onTransitionStart: (transition) => {
    console.log('Transition started:', transition.id)
  },
  onTransitionEnd: (transition) => {
    console.log('Transition completed:', transition.id)
  }
})

// Programmatic control
transitionPreview.startPreview()    // Start animation
transitionPreview.stopPreview()     // Stop
transitionPreview.seekToTime(5.0)   // Seek
```

## Debugging and Monitoring

### Performance Information

```typescript
// In development mode
const debugInfo = {
  webglSupported: !!gl,
  activeShaders: transitionService.getLoadedShaders(),
  renderTime: performance.now() - startTime,
  memoryUsage: gl.getParameter(gl.RENDERER)
}
```

### Console Commands

```javascript
// In DevTools console
window.transitionDebug = {
  service: getTransitionsPreviewService(),
  enableLogging: true,
  showFPS: true
}
```

## Limitations

1. **WebGL2** required for operation
2. **One active transition** at a time
3. **Synchronization** with video elements may have delays
4. **Quality** depends on GPU performance

## Future Improvements

1. **Caching** of transition renders
2. **Preloading** of adjacent frames
3. **Multiple transitions** simultaneously
4. **Custom user shaders**
5. **Export preview** to video file