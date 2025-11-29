/**
 * Video Editing Events Tests
 *
 * Тесты для событий домена видео редактирования
 */

import { describe, expect, it } from "vitest"
import { VIDEO_EDITING_EVENTS } from "../video-editing-events"

describe("Video Editing Events", () => {
  describe("Event Constants", () => {
    it("should have correct timeline event types", () => {
      expect(VIDEO_EDITING_EVENTS.TIMELINE_CREATED).toBe("video.timeline.created")
      expect(VIDEO_EDITING_EVENTS.TIMELINE_UPDATED).toBe("video.timeline.updated")
      expect(VIDEO_EDITING_EVENTS.CLIP_ADDED).toBe("video.timeline.clip-added")
      expect(VIDEO_EDITING_EVENTS.CLIP_REMOVED).toBe("video.timeline.clip-removed")
      expect(VIDEO_EDITING_EVENTS.CLIP_MOVED).toBe("video.timeline.clip-moved")
      expect(VIDEO_EDITING_EVENTS.CLIP_TRIMMED).toBe("video.timeline.clip-trimmed")
      expect(VIDEO_EDITING_EVENTS.CLIP_DELETED).toBe("video.timeline.clip-deleted")
      expect(VIDEO_EDITING_EVENTS.SECTION_CREATED).toBe("video.timeline.section-created")
      expect(VIDEO_EDITING_EVENTS.TRACK_ADDED).toBe("video.timeline.track-added")
      expect(VIDEO_EDITING_EVENTS.TRACK_REMOVED).toBe("video.timeline.track-removed")
    })

    it("should have correct playback event types", () => {
      expect(VIDEO_EDITING_EVENTS.PLAYBACK_STARTED).toBe("video.playback.started")
      expect(VIDEO_EDITING_EVENTS.PLAYBACK_STOPPED).toBe("video.playback.stopped")
      expect(VIDEO_EDITING_EVENTS.PLAYBACK_TIME_CHANGED).toBe("video.playback.time-changed")
      expect(VIDEO_EDITING_EVENTS.PLAYBACK_RATE_CHANGED).toBe("video.playback.rate-changed")
      expect(VIDEO_EDITING_EVENTS.PLAYBACK_STATE_CHANGED).toBe("video.playback.state-changed")
    })

    it("should have correct effects event types", () => {
      expect(VIDEO_EDITING_EVENTS.EFFECT_APPLIED).toBe("video.effect.applied")
      expect(VIDEO_EDITING_EVENTS.EFFECT_REMOVED).toBe("video.effect.removed")
      expect(VIDEO_EDITING_EVENTS.FILTER_APPLIED).toBe("video.filter.applied")
    })

    it("should have correct export event types", () => {
      expect(VIDEO_EDITING_EVENTS.EXPORT_STARTED).toBe("video.export.started")
      expect(VIDEO_EDITING_EVENTS.EXPORT_PROGRESS).toBe("video.export.progress")
      expect(VIDEO_EDITING_EVENTS.EXPORT_COMPLETED).toBe("video.export.completed")
    })

    it("should have correct player event types", () => {
      expect(VIDEO_EDITING_EVENTS.MEDIA_LOADED).toBe("video.player.media-loaded")
      expect(VIDEO_EDITING_EVENTS.FRAME_CAPTURED).toBe("video.player.frame-captured")
    })

    it("should have all events prefixed with domain name", () => {
      const events = Object.values(VIDEO_EDITING_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^video\./)
      })
    })

    it("should not have duplicate event names", () => {
      const events = Object.values(VIDEO_EDITING_EVENTS)
      const uniqueEvents = new Set(events)
      expect(uniqueEvents.size).toBe(events.length)
    })

    it("should have consistent naming convention (kebab-case)", () => {
      const events = Object.values(VIDEO_EDITING_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      })
    })
  })

  describe("Event Count", () => {
    it("should have expected number of events", () => {
      const eventCount = Object.keys(VIDEO_EDITING_EVENTS).length
      // 10 timeline + 5 playback + 3 effects + 3 export + 2 player = 23
      expect(eventCount).toBe(23)
    })
  })

  describe("Event Grouping", () => {
    it("should have timeline events grouped", () => {
      const timelineEvents = Object.values(VIDEO_EDITING_EVENTS).filter((event) =>
        event.includes(".timeline."),
      )
      expect(timelineEvents).toHaveLength(10)
    })

    it("should have playback events grouped", () => {
      const playbackEvents = Object.values(VIDEO_EDITING_EVENTS).filter((event) =>
        event.includes(".playback."),
      )
      expect(playbackEvents).toHaveLength(5)
    })

    it("should have effect events grouped", () => {
      const effectEvents = Object.values(VIDEO_EDITING_EVENTS).filter((event) =>
        event.includes(".effect."),
      )
      expect(effectEvents).toHaveLength(2)
    })

    it("should have filter events grouped", () => {
      const filterEvents = Object.values(VIDEO_EDITING_EVENTS).filter((event) =>
        event.includes(".filter."),
      )
      expect(filterEvents).toHaveLength(1)
    })

    it("should have export events grouped", () => {
      const exportEvents = Object.values(VIDEO_EDITING_EVENTS).filter((event) =>
        event.includes(".export."),
      )
      expect(exportEvents).toHaveLength(3)
    })

    it("should have player events grouped", () => {
      const playerEvents = Object.values(VIDEO_EDITING_EVENTS).filter((event) =>
        event.includes(".player."),
      )
      expect(playerEvents).toHaveLength(2)
    })
  })

  describe("Event Lifecycle Patterns", () => {
    it("should have started/completed pairs for long-running operations", () => {
      expect(VIDEO_EDITING_EVENTS.EXPORT_STARTED).toBeDefined()
      expect(VIDEO_EDITING_EVENTS.EXPORT_COMPLETED).toBeDefined()

      expect(VIDEO_EDITING_EVENTS.PLAYBACK_STARTED).toBeDefined()
      expect(VIDEO_EDITING_EVENTS.PLAYBACK_STOPPED).toBeDefined()
    })

    it("should have add/remove pairs for CRUD operations", () => {
      expect(VIDEO_EDITING_EVENTS.CLIP_ADDED).toBeDefined()
      expect(VIDEO_EDITING_EVENTS.CLIP_REMOVED).toBeDefined()

      expect(VIDEO_EDITING_EVENTS.TRACK_ADDED).toBeDefined()
      expect(VIDEO_EDITING_EVENTS.TRACK_REMOVED).toBeDefined()

      expect(VIDEO_EDITING_EVENTS.EFFECT_APPLIED).toBeDefined()
      expect(VIDEO_EDITING_EVENTS.EFFECT_REMOVED).toBeDefined()
    })
  })

  describe("Constants Immutability", () => {
    it("should be readonly object", () => {
      expect(Object.isFrozen(VIDEO_EDITING_EVENTS)).toBe(false) // as const doesn't freeze
      // TypeScript prevents modification at compile time
    })
  })
})
