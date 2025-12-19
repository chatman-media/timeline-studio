import React from "react"

import { vi } from "vitest"

// Mock Timeline component
export const MockTimeline = vi.fn(({ onReady, onTimeUpdate, onSelectionChange, ...props }: any) => {
  // Simulate component lifecycle
  React.useEffect(() => {
    if (onReady) {
      onReady({ timeline: "mock-timeline-instance" })
    }
  }, [onReady])

  return (
    <div data-testid="mock-timeline" {...props} data-oid="dyeddoh">
      <div data-testid="timeline-header" data-oid="km15d2h">
        Timeline Header
      </div>
      <div data-testid="timeline-tracks" data-oid="bzmw__9">
        Timeline Tracks
      </div>
      <div data-testid="timeline-playhead" data-oid="5-1u4ed">
        Playhead
      </div>
    </div>
  )
})

// Mock Track component
export const MockTrack = vi.fn(({ track, onClipClick, onTrackClick, ...props }: any) => (
  <div
    data-testid={`mock-track-${track.id}`}
    data-track-type={track.type}
    onClick={() => onTrackClick?.(track)}
    {...props}
    data-oid="e03a:7f"
  >
    <div data-testid="track-header" data-oid="_i2wi.i">
      {track.name}
    </div>
    <div data-testid="track-clips" data-oid="kgm30bb">
      {track.clips?.map((clip: any) => (
        <div
          key={clip.id}
          data-testid={`clip-${clip.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onClipClick?.(clip)
          }}
          data-oid="zskez9g"
        >
          Clip {clip.id}
        </div>
      ))}
    </div>
  </div>
))

// Mock Clip component
export const MockClip = vi.fn(({ clip, selected, onSelect, onDrag, onResize, ...props }: any) => (
  <div
    data-testid={`mock-clip-${clip.id}`}
    data-selected={selected}
    onClick={() => onSelect?.(clip)}
    {...props}
    data-oid="a:jc.dc"
  >
    <div data-testid="clip-thumbnail" data-oid="sha9jlt">
      Thumbnail
    </div>
    <div data-testid="clip-duration" data-oid="iz.0wza">
      {clip.endTime - clip.startTime}s
    </div>
    {clip.effects?.length > 0 && (
      <div data-testid="clip-effects" data-oid="yu:ystv">
        {clip.effects.length} effects
      </div>
    )}
  </div>
))

// Mock TimelineScale component
export const MockTimelineScale = vi.fn(({ duration, scale, onScaleChange, ...props }: any) => (
  <div data-testid="mock-timeline-scale" {...props} data-oid="._yuc3n">
    <div data-testid="scale-ruler" data-oid="cy0f8o8">
      Scale: {scale}x | Duration: {duration}s
    </div>
    <button data-testid="zoom-in" onClick={() => onScaleChange?.(scale * 2)} data-oid="jg8d5cj">
      Zoom In
    </button>
    <button data-testid="zoom-out" onClick={() => onScaleChange?.(scale / 2)} data-oid="f3hqbl7">
      Zoom Out
    </button>
  </div>
))

// Mock TimelineContent component
export const MockTimelineContent = vi.fn(({ children, onScroll, ...props }: any) => (
  <div data-testid="mock-timeline-content" onScroll={(e) => onScroll?.(e)} {...props} data-oid="u:angar">
    {children}
  </div>
))

// Export all component mocks
export const timelineComponentMocks = {
  Timeline: MockTimeline,
  Track: MockTrack,
  Clip: MockClip,
  TimelineScale: MockTimelineScale,
  TimelineContent: MockTimelineContent,
}

// Set up vi.mock calls
vi.mock("../components/timeline", () => ({
  Timeline: MockTimeline,
}))

vi.mock("../components/track/track", () => ({
  Track: MockTrack,
}))

vi.mock("../components/clip/clip", () => ({
  Clip: MockClip,
}))

vi.mock("../components/timeline-scale/timeline-scale", () => ({
  TimelineScale: MockTimelineScale,
}))

vi.mock("../components/timeline-content", () => ({
  TimelineContent: MockTimelineContent,
}))

vi.mock("../components/timeline-top-panel", () => ({}))
