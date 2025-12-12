/**
 * Timeline Hooks
 *
 * Экспорт всех хуков для работы с Timeline
 */

// Animation
export type { UseKeyframeAnimationReturn } from "./animation/use-keyframe-animation"
export { useKeyframeAnimation } from "./animation/use-keyframe-animation"
// Batch Operations
export type { UseBatchOperationsReturn } from "./batch/use-batch-operations"
export { useBatchOperations } from "./batch/use-batch-operations"

// Clips
export type { UseClipsReturn } from "./clips/use-clips"
export { useClips } from "./clips/use-clips"
export type { UseLinkedClipsReturn } from "./clips/use-linked-clips"
export { useLinkedClips } from "./clips/use-linked-clips"

// Editing
export type { UseSlipSlideReturn } from "./editing/use-slip-slide"
export { useSlipSlide } from "./editing/use-slip-slide"

// Effects
export type { UseClipEffectsOptions, UseClipEffectsReturn } from "./effects/use-clip-effects"
export { useClipEffects } from "./effects/use-clip-effects"
export { useTimelineEffects } from "./effects/use-timeline-effects"
export { useTimelineTransitions } from "./effects/use-timeline-transitions"

// Integration
export type { UseIntegratedVersionControlReturn } from "./integration/use-integrated-version-control"
export { useIntegratedVersionControl } from "./integration/use-integrated-version-control"
export { useTimelinePlayerSync } from "./integration/use-timeline-player-sync"

// State
export { useTimeline } from "./state/use-timeline"
export type { UseTimelineActionsReturn } from "./state/use-timeline-actions"
export { useTimelineActions } from "./state/use-timeline-actions"
export type { TimelinePersonsHook } from "./state/use-timeline-persons"
export { useTimelinePersons } from "./state/use-timeline-persons"
export type { UseTimelineSelectionReturn } from "./state/use-timeline-selection"
export { useTimelineSelection } from "./state/use-timeline-selection"
export { useTimelineTracks } from "./state/use-timeline-tracks"
export type { UseTracksReturn } from "./state/use-tracks"
export { useTracks } from "./state/use-tracks"
export type { UseUndoRedoReturn } from "./state/use-undo-redo"
export { UndoRedoHelpers, useUndoRedo } from "./state/use-undo-redo"
