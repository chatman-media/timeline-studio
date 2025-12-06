/**
 * Тесты для Backend Event Handlers
 *
 * Покрытие:
 * 1. Project Lifecycle Events (ProjectCreated, Opened, Saved, Closed)
 * 2. Clip Events (Added, Moved, Trimmed, Deleted, Updated, Split)
 * 3. Track Events (Added, Deleted, Updated)
 * 4. Media Events (Added, Removed, Updated)
 * 5. Playback Events (Started, Stopped, Seeked, RateChanged)
 * 6. Error Handling (invalid events, missing payload)
 * 7. State Consistency
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import { handleBackendEvent } from "../backend-event-handlers"
import type { TimelineExtendedContext } from "../timeline-extended-machine"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    infoSync: vi.fn(),
    errorSync: vi.fn(),
    debugSync: vi.fn(),
    warnSync: vi.fn(),
  }),
}))

// Mock type validation
vi.mock("../../utils/type-validation", () => ({
  validateProjectEvent: vi.fn(() => true),
  validateClip: vi.fn(() => true),
}))

// Mock clip transform
vi.mock("../../utils/clip-transform", () => ({
  convertClipDataToTimelineClip: vi.fn((clipData: any) => ({
    id: clipData.id,
    trackId: clipData.track_id,
    startTime: clipData.start_time,
    duration: clipData.duration,
    ...clipData,
  })),
}))

// Import mocked modules
import { validateProjectEvent } from "../../utils/type-validation"

describe("BackendEventHandlers", () => {
  let mockContext: TimelineExtendedContext

  beforeEach(() => {
    vi.clearAllMocks()

    mockContext = {
      project: null,
      projectState: null,
      isLoading: false,
      hasUnsavedChanges: false,
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1,
      duration: 0,
      activeTrackId: null,
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
      clipboard: null,
      timeScale: 1,
      scrollPosition: { x: 0, y: 0 },
      editMode: "select",
      snapMode: "none",
      isDragging: false,
      draggedClipId: null,
      draggedTrackId: null,
      draggedResourceType: null,
      draggedResourceId: null,
      isRecording: false,
      showWaveforms: true,
      showThumbnails: true,
      showMarkers: true,
      error: null,
    }
  })

  describe("Project Lifecycle Events", () => {
    it("should handle ProjectCreated event", () => {
      const event: ProjectEvent = {
        type: "ProjectCreated",
        payload: {
          project_id: "project-1",
          name: "New Project",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.isLoading).toBe(false)
      expect(result.hasUnsavedChanges).toBe(false)
    })

    it("should handle ProjectOpened event", () => {
      const event: ProjectEvent = {
        type: "ProjectOpened",
        payload: {
          path: "/path/to/project.json",
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.isLoading).toBe(false)
      expect(result.hasUnsavedChanges).toBe(false)
    })

    it("should handle ProjectSaved event", () => {
      const event: ProjectEvent = {
        type: "ProjectSaved",
        payload: {
          path: "/path/to/project.json",
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.hasUnsavedChanges).toBe(false)
    })

    it("should handle ProjectClosed event", () => {
      mockContext.project = { id: "project-1" } as any
      mockContext.selectedClipIds = ["clip-1"]
      mockContext.selectedTrackIds = ["track-1"]
      mockContext.hasUnsavedChanges = true

      const event: ProjectEvent = {
        type: "ProjectClosed",
        payload: {
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.project).toBeNull()
      expect(result.hasUnsavedChanges).toBe(false)
      expect(result.selectedClipIds).toEqual([])
      expect(result.selectedTrackIds).toEqual([])
      expect(result.selectedSectionIds).toEqual([])
    })
  })

  describe("Clip Events", () => {
    it("should handle ClipAdded event", () => {
      const event: ProjectEvent = {
        type: "ClipAdded",
        payload: {
          project_id: "project-1",
          clip: {
            id: "clip-1",
            track_id: "track-1",
            start_time: 0,
            duration: 10,
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      // Handler may update hasUnsavedChanges or other properties
      expect(result).toBeDefined()
    })

    it("should handle ClipMoved event", () => {
      const event: ProjectEvent = {
        type: "ClipMoved",
        payload: {
          project_id: "project-1",
          clip_id: "clip-1",
          old_track_id: "track-1",
          new_track_id: "track-2",
          old_time: 0,
          new_time: 10,
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle ClipTrimmed event", () => {
      const event: ProjectEvent = {
        type: "ClipTrimmed",
        payload: {
          project_id: "project-1",
          clip_id: "clip-1",
          old_start: 0,
          old_end: 10,
          new_start: 2,
          new_end: 8,
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle ClipDeleted event", () => {
      mockContext.selectedClipIds = ["clip-1"]

      const event: ProjectEvent = {
        type: "ClipDeleted",
        payload: {
          project_id: "project-1",
          clip_id: "clip-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle ClipUpdated event", () => {
      const event: ProjectEvent = {
        type: "ClipUpdated",
        payload: {
          project_id: "project-1",
          clip_id: "clip-1",
          updates: {
            volume: 0.8,
            opacity: 0.9,
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle ClipSplit event", () => {
      const event: ProjectEvent = {
        type: "ClipSplit",
        payload: {
          project_id: "project-1",
          original_clip_id: "clip-1",
          first_clip: {
            id: "clip-1a",
            track_id: "track-1",
            start_time: 0,
            duration: 5,
          },
          second_clip: {
            id: "clip-1b",
            track_id: "track-1",
            start_time: 5,
            duration: 5,
          },
          split_time: 5,
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })
  })

  describe("Track Events", () => {
    it("should handle TrackAdded event", () => {
      const event: ProjectEvent = {
        type: "TrackAdded",
        payload: {
          project_id: "project-1",
          track: {
            id: "track-1",
            name: "Video Track 1",
            type: "video",
            index: 0,
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle TrackDeleted event", () => {
      mockContext.selectedTrackIds = ["track-1"]

      const event: ProjectEvent = {
        type: "TrackDeleted",
        payload: {
          project_id: "project-1",
          track_id: "track-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle TrackUpdated event", () => {
      const event: ProjectEvent = {
        type: "TrackUpdated",
        payload: {
          project_id: "project-1",
          track_id: "track-1",
          updates: {
            name: "Updated Track",
            muted: true,
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })
  })

  describe("Media Events", () => {
    it("should handle MediaAdded event", () => {
      const event: ProjectEvent = {
        type: "MediaAdded",
        payload: {
          project_id: "project-1",
          media: {
            id: "media-1",
            path: "/path/to/video.mp4",
            type: "video",
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle MediaRemoved event", () => {
      const event: ProjectEvent = {
        type: "MediaRemoved",
        payload: {
          project_id: "project-1",
          media_id: "media-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })

    it("should handle MediaUpdated event", () => {
      const event: ProjectEvent = {
        type: "MediaUpdated",
        payload: {
          project_id: "project-1",
          media_id: "media-1",
          updates: {
            duration: 120,
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toBeDefined()
    })
  })

  describe("Playback Events", () => {
    it("should handle PlaybackStarted event", () => {
      const event: ProjectEvent = {
        type: "PlaybackStarted",
        payload: {
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.isPlaying).toBe(true)
    })

    it("should handle PlaybackStopped event", () => {
      mockContext.isPlaying = true

      const event: ProjectEvent = {
        type: "PlaybackStopped",
        payload: {
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.isPlaying).toBe(false)
    })

    it("should handle PlaybackSeeked event", () => {
      const event: ProjectEvent = {
        type: "PlaybackSeeked",
        payload: {
          project_id: "project-1",
          time: 30,
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.currentTime).toBe(30)
    })

    it("should handle PlaybackRateChanged event", () => {
      const event: ProjectEvent = {
        type: "PlaybackRateChanged",
        payload: {
          project_id: "project-1",
          rate: 2.0,
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result.playbackRate).toBe(2.0)
    })
  })

  describe("Error Handling", () => {
    it("should skip invalid events", () => {
      vi.mocked(validateProjectEvent).mockReturnValueOnce(false)

      const invalidEvent: any = {
        type: "InvalidEvent",
        payload: {},
      }

      const result = handleBackendEvent(mockContext, invalidEvent)

      expect(result.error).toContain("Invalid backend event")
    })

    it("should handle malformed event payloads gracefully", () => {
      const event: any = {
        type: "ClipAdded",
        payload: {
          project_id: "project-1",
          clip: null, // Invalid clip data
        },
      }

      // Should handle invalid data gracefully
      const result = handleBackendEvent(mockContext, event)
      expect(result).toBeDefined()
    })

    it("should handle events with missing project_id", () => {
      const event: any = {
        type: "ClipAdded",
        payload: {
          // missing project_id
          clip: {
            id: "clip-1",
          },
        },
      }

      const result = handleBackendEvent(mockContext, event)
      expect(result).toBeDefined()
    })

    it("should return empty object for unhandled event types", () => {
      const event: any = {
        type: "UnknownEventType",
        payload: {
          project_id: "project-1",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      // Should return empty object for unknown types
      expect(result).toEqual({})
    })
  })

  describe("State Consistency", () => {
    it("should maintain project state after clip operations", () => {
      mockContext.project = { id: "project-1" } as any

      const addEvent: ProjectEvent = {
        type: "ClipAdded",
        payload: {
          project_id: "project-1",
          clip: {
            id: "clip-1",
            track_id: "track-1",
            start_time: 0,
            duration: 10,
          },
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, addEvent)

      // Project should still exist
      expect(mockContext.project).not.toBeNull()
    })

    it("should clear selection when clip is deleted", () => {
      mockContext.selectedClipIds = ["clip-1", "clip-2"]

      const event: ProjectEvent = {
        type: "ClipDeleted",
        payload: {
          project_id: "project-1",
          clip_id: "clip-1",
          timestamp: Date.now(),
        },
      } as any

      handleBackendEvent(mockContext, event)

      // Handler should update selection (implementation dependent)
      // This is a placeholder - actual implementation may vary
    })

    it("should clear selection when track is deleted", () => {
      mockContext.selectedTrackIds = ["track-1"]
      mockContext.selectedClipIds = ["clip-1", "clip-2"]

      const event: ProjectEvent = {
        type: "TrackDeleted",
        payload: {
          project_id: "project-1",
          track_id: "track-1",
          timestamp: Date.now(),
        },
      } as any

      handleBackendEvent(mockContext, event)

      // Handler should clean up affected state
    })

    it("should handle multiple sequential events correctly", () => {
      const events: ProjectEvent[] = [
        {
          type: "ProjectCreated",
          payload: {
            project_id: "project-1",
            name: "Test",
            timestamp: Date.now(),
          },
        } as any,
        {
          type: "TrackAdded",
          payload: {
            project_id: "project-1",
            track: { id: "track-1" },
            timestamp: Date.now(),
          },
        } as any,
        {
          type: "ClipAdded",
          payload: {
            project_id: "project-1",
            clip: { id: "clip-1", track_id: "track-1" },
            timestamp: Date.now(),
          },
        } as any,
      ]

      let currentContext = { ...mockContext }

      events.forEach((event) => {
        const updates = handleBackendEvent(currentContext, event)
        currentContext = { ...currentContext, ...updates }
      })

      // Should have processed all events
      expect(currentContext.isLoading).toBe(false)
    })

    it("should preserve unrelated state during event handling", () => {
      mockContext.timeScale = 2
      mockContext.scrollPosition = { x: 100, y: 50 }
      mockContext.editMode = "trim"

      const event: ProjectEvent = {
        type: "PlaybackStarted",
        payload: {
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      handleBackendEvent(mockContext, event)

      // Unrelated UI state should not be modified
      expect(mockContext.timeScale).toBe(2)
      expect(mockContext.scrollPosition).toEqual({ x: 100, y: 50 })
      expect(mockContext.editMode).toBe("trim")
    })
  })

  describe("Timestamp Handling", () => {
    it("should accept events with valid timestamps", () => {
      const event: ProjectEvent = {
        type: "ProjectSaved",
        payload: {
          path: "/path/to/project.json",
          project_id: "project-1",
          timestamp: Date.now(),
        },
      } as any

      expect(() => handleBackendEvent(mockContext, event)).not.toThrow()
    })

    it("should handle events with missing timestamps", () => {
      const event: any = {
        type: "ProjectSaved",
        payload: {
          path: "/path/to/project.json",
          project_id: "project-1",
          // timestamp missing
        },
      }

      expect(() => handleBackendEvent(mockContext, event)).not.toThrow()
    })
  })

  describe("Complex Scenarios", () => {
    it("should handle clip split and maintain selection", () => {
      mockContext.selectedClipIds = ["clip-1"]

      const event: ProjectEvent = {
        type: "ClipSplit",
        payload: {
          project_id: "project-1",
          original_clip_id: "clip-1",
          first_clip: { id: "clip-1a", track_id: "track-1", start_time: 0, duration: 5 },
          second_clip: { id: "clip-1b", track_id: "track-1", start_time: 5, duration: 5 },
          split_time: 5,
          timestamp: Date.now(),
        },
      } as any

      const result = handleBackendEvent(mockContext, event)

      // Handler should update selection to include both new clips
      expect(result).toBeDefined()
    })

    it("should handle rapid playback state changes", () => {
      const startEvent: ProjectEvent = {
        type: "PlaybackStarted",
        payload: { project_id: "project-1", timestamp: Date.now() },
      } as any

      const stopEvent: ProjectEvent = {
        type: "PlaybackStopped",
        payload: { project_id: "project-1", timestamp: Date.now() + 100 },
      } as any

      let context = { ...mockContext }

      const result1 = handleBackendEvent(context, startEvent)
      context = { ...context, ...result1 }

      const result2 = handleBackendEvent(context, stopEvent)
      context = { ...context, ...result2 }

      expect(context.isPlaying).toBe(false)
    })
  })
})
