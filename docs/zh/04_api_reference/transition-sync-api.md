# Transition Synchronization API

## Overview

The transition synchronization system ensures automatic updating of transitions when clips are modified on the timeline.

## Core Components

### clip-transition-sync.ts

Service for synchronizing transitions during clip operations.

```typescript
// Sync transitions when moving a clip
syncTransitionsOnClipMove(
  project: TimelineProject,
  clipId: string,
  oldTrackId: string,
  newTrackId: string,
  oldPosition: number,
  newPosition: number,
  oldDuration: number,
): TimelineProject

// Sync transitions when trimming a clip
syncTransitionsOnClipTrim(
  project: TimelineProject,
  clipId: string,
  trackId: string,
  oldStartTime: number,
  newStartTime: number,
  oldDuration: number,
  newDuration: number,
): TimelineProject

// Handle transitions when deleting a clip
syncTransitionsOnClipDelete(
  project: TimelineProject,
  clipId: string,
): TimelineProject

// Handle transitions when splitting a clip
syncTransitionsOnClipSplit(
  project: TimelineProject,
  originalClipId: string,
  leftClipId: string,
  rightClipId: string,
  splitTime: number,
): TimelineProject
```

### use-transition-sync.ts

Hook for managing transition synchronization.

```typescript
const {
  syncMoveClip,
  syncTrimClip,
  syncRemoveClip,
  syncSplitClip,
  findClip,
} = useTransitionSync({ project, updateProject })
```

### use-clips-with-transitions.ts

Wrapper around `useClips` with automatic transition synchronization.

```typescript
const clips = useClipsWithTransitions()

// All clip operations automatically synchronize transitions
await clips.moveClip(clipId, newTrackId, newPosition)
await clips.trimClip(clipId, newStartTime, newDuration)
await clips.removeClip(clipId)
```

## Synchronization Rules

### When Moving a Clip

1. **Between tracks**: All related transitions are removed
2. **Within a track**: Transitions adjust their positions

### When Trimming a Clip

- **Transition on in-point**: Position = new start position of clip
- **Transition on out-point**: Position = new end position - transition duration
- **Transition between clips**: Adjusted depending on which clip is trimmed

### When Deleting a Clip

All transitions related to the clip are removed:
- Transition on in-point (type: "in")
- Transition on out-point (type: "out")
- Transitions between clips (type: "between")

### When Splitting a Clip

- **Transition on in-point**: Stays with left clip
- **Transition on out-point**: Moves to right clip
- **"Before" transition**: Stays with left clip
- **"After" transition**: Moves to right clip

## Collision Detection

```typescript
// Check if a transition can be added
canAddTransition(
  project: TimelineProject,
  trackId: string,
  position: number,
  duration: number,
  excludeId?: string,
): boolean

// Resolve collisions after an operation
resolveTransitionCollisions(
  project: TimelineProject,
  trackId: string,
  changedTransitionId?: string,
): TimelineProject
```

## Component Integration

### TransitionControlPanel

The transition control panel automatically uses `useTimelineTransitions` to update and remove transitions.

```typescript
const { updateTransition, removeTransition } = useTimelineTransitions()

// Update transition
updateTransition(transitionId, updates)

// Remove transition
removeTransition(transitionId)
```

## Usage Examples

### Adding Synchronization to Existing Code

```typescript
// Before
const handleMoveClip = async (clipId: string, newTrackId: string, newPosition: number) => {
  await moveClip(clipId, newTrackId, newPosition)
}

// After
const handleMoveClip = async (clipId: string, newTrackId: string, newPosition: number) => {
  const clip = findClip(clipId)
  if (clip) {
    const oldTrackId = clip.trackId
    const oldPosition = clip.startTime
    const duration = clip.duration
    
    await moveClip(clipId, newTrackId, newPosition)
    
    syncMoveClip(clipId, oldTrackId, newTrackId, oldPosition, newPosition, duration)
  }
}
```

### Using the Ready Hook

```typescript
const clips = useClipsWithTransitions()

// All operations automatically synchronize transitions
const handleOperations = async () => {
  // Move
  await clips.moveClip("clip1", "track2", 10.0)
  
  // Trim
  await clips.trimClip("clip2", 5.0, 3.0)
  
  // Delete
  await clips.removeClip("clip3")
}
```

## Limitations

1. **Backend integration**: In the current implementation, synchronization only works on the client side
2. **Split operation**: Requires returning IDs of new clips for full synchronization
3. **Undo/Redo**: Transition synchronization is not integrated with the undo/redo system

## Future Improvements

1. Backend integration for persistent changes
2. Support for group clip operations
3. Automatic collision resolution on insertion
4. Visual indication of transition conflicts