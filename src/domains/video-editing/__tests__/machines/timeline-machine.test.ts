/**
 * Timeline Machine Tests
 *
 * Тесты для XState машины управления UI состоянием timeline
 */

import { beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { timelineMachine } from "../../machines/timeline-machine"

describe("TimelineMachine", () => {
  let actor: ReturnType<typeof createActor<typeof timelineMachine>>

  beforeEach(() => {
    actor = createActor(timelineMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should have initial context values", () => {
      const { context } = actor.getSnapshot()

      expect(context.isPlaying).toBe(false)
      expect(context.currentTime).toBe(0)
      expect(context.playbackRate).toBe(1)
      expect(context.timeScale).toBe(100)
      expect(context.scrollPosition).toEqual({ x: 0, y: 0 })
      expect(context.editMode).toBe("select")
      expect(context.snapMode).toBe("clips")
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
      expect(context.isDragging).toBe(false)
      expect(context.clipboard).toBeNull()
    })
  })

  describe("Playback State Synchronization", () => {
    it("should sync playback state from backend", () => {
      actor.send({
        type: "SYNC_PLAYBACK_STATE",
        isPlaying: true,
        currentTime: 45.5,
      })

      const { context } = actor.getSnapshot()
      expect(context.isPlaying).toBe(true)
      expect(context.currentTime).toBe(45.5)
    })

    it("should sync current time independently", () => {
      actor.send({ type: "SYNC_CURRENT_TIME", currentTime: 30 })

      expect(actor.getSnapshot().context.currentTime).toBe(30)
    })

    it("should set playback rate", () => {
      actor.send({ type: "SET_PLAYBACK_RATE", rate: 1.5 })

      expect(actor.getSnapshot().context.playbackRate).toBe(1.5)
    })
  })

  describe("UI Controls", () => {
    it("should set time scale", () => {
      actor.send({ type: "SET_TIME_SCALE", scale: 200 })

      expect(actor.getSnapshot().context.timeScale).toBe(200)
    })

    it("should clamp time scale to valid range", () => {
      actor.send({ type: "SET_TIME_SCALE", scale: 5 })
      expect(actor.getSnapshot().context.timeScale).toBe(10)

      actor.send({ type: "SET_TIME_SCALE", scale: 2000 })
      expect(actor.getSnapshot().context.timeScale).toBe(1000)
    })

    it("should set scroll position", () => {
      actor.send({ type: "SET_SCROLL_POSITION", x: 100, y: 50 })

      const { context } = actor.getSnapshot()
      expect(context.scrollPosition).toEqual({ x: 100, y: 50 })
    })

    it("should set edit mode", () => {
      actor.send({ type: "SET_EDIT_MODE", mode: "trim" })

      expect(actor.getSnapshot().context.editMode).toBe("trim")
    })

    it("should set snap mode", () => {
      actor.send({ type: "SET_SNAP_MODE", mode: "grid" })

      expect(actor.getSnapshot().context.snapMode).toBe("grid")
    })
  })

  describe("Clip Selection", () => {
    it("should select single clip", () => {
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual(["clip-1"])
    })

    it("should replace selection when selecting without multiple flag", () => {
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SELECT_CLIP", clipId: "clip-2" })

      expect(actor.getSnapshot().context.selectedClipIds).toEqual(["clip-2"])
    })

    it("should add to selection when multiple flag is true", () => {
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SELECT_CLIP", clipId: "clip-2", multiple: true })

      expect(actor.getSnapshot().context.selectedClipIds).toEqual(["clip-1", "clip-2"])
    })

    it("should toggle selection when clicking selected clip with multiple", () => {
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SELECT_CLIP", clipId: "clip-2", multiple: true })
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1", multiple: true })

      expect(actor.getSnapshot().context.selectedClipIds).toEqual(["clip-2"])
    })

    it("should clear all selections", () => {
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SELECT_TRACK", trackId: "track-1" })
      actor.send({ type: "CLEAR_SELECTION" })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
    })
  })

  describe("Track Selection", () => {
    it("should select single track", () => {
      actor.send({ type: "SELECT_TRACK", trackId: "track-1" })

      expect(actor.getSnapshot().context.selectedTrackIds).toEqual(["track-1"])
    })

    it("should select multiple tracks", () => {
      actor.send({ type: "SELECT_TRACK", trackId: "track-1" })
      actor.send({ type: "SELECT_TRACK", trackId: "track-2", multiple: true })

      expect(actor.getSnapshot().context.selectedTrackIds).toEqual(["track-1", "track-2"])
    })

    it("should toggle track selection", () => {
      actor.send({ type: "SELECT_TRACK", trackId: "track-1" })
      actor.send({ type: "SELECT_TRACK", trackId: "track-1", multiple: true })

      expect(actor.getSnapshot().context.selectedTrackIds).toEqual([])
    })
  })

  describe("Section Selection", () => {
    it("should select single section", () => {
      actor.send({ type: "SELECT_SECTION", sectionId: "section-1" })

      expect(actor.getSnapshot().context.selectedSectionIds).toEqual(["section-1"])
    })

    it("should select multiple sections", () => {
      actor.send({ type: "SELECT_SECTION", sectionId: "section-1" })
      actor.send({ type: "SELECT_SECTION", sectionId: "section-2", multiple: true })

      expect(actor.getSnapshot().context.selectedSectionIds).toEqual(["section-1", "section-2"])
    })

    it("should toggle section selection", () => {
      actor.send({ type: "SELECT_SECTION", sectionId: "section-1" })
      actor.send({ type: "SELECT_SECTION", sectionId: "section-1", multiple: true })

      expect(actor.getSnapshot().context.selectedSectionIds).toEqual([])
    })
  })

  describe("Drag and Drop", () => {
    it("should start clip drag", () => {
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })

      expect(actor.getSnapshot().value).toBe("dragging")
      const { context } = actor.getSnapshot()
      expect(context.isDragging).toBe(true)
      expect(context.draggedClipId).toBe("clip-1")
    })

    it("should start track drag", () => {
      actor.send({ type: "START_DRAG_TRACK", trackId: "track-1" })

      expect(actor.getSnapshot().value).toBe("dragging")
      const { context } = actor.getSnapshot()
      expect(context.isDragging).toBe(true)
      expect(context.draggedTrackId).toBe("track-1")
    })

    it("should start resource drag", () => {
      actor.send({
        type: "START_DRAG_RESOURCE",
        resourceType: "effect",
        resourceId: "effect-1",
      })

      expect(actor.getSnapshot().value).toBe("dragging")
      const { context } = actor.getSnapshot()
      expect(context.isDragging).toBe(true)
      expect(context.draggedResourceType).toBe("effect")
      expect(context.draggedResourceId).toBe("effect-1")
    })

    it("should end drag and return to idle", () => {
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })
      actor.send({ type: "END_DRAG" })

      expect(actor.getSnapshot().value).toBe("idle")
      const { context } = actor.getSnapshot()
      expect(context.isDragging).toBe(false)
      expect(context.draggedClipId).toBeNull()
    })

    it("should update time during drag", () => {
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })
      actor.send({ type: "SYNC_CURRENT_TIME", currentTime: 15 })

      expect(actor.getSnapshot().context.currentTime).toBe(15)
      expect(actor.getSnapshot().value).toBe("dragging")
    })
  })

  describe("Clipboard Operations", () => {
    it("should copy data to clipboard", () => {
      const clipboardData = {
        clips: [{ id: "clip-1", name: "Clip 1" }],
        tracks: [],
        metadata: {
          copiedAt: new Date(),
          originalTimeRange: { startTime: 0, endTime: 10 },
          trackIds: ["track-1"],
        },
      }

      actor.send({ type: "COPY_TO_CLIPBOARD", data: clipboardData })

      expect(actor.getSnapshot().context.clipboard).toEqual(clipboardData)
    })

    it("should clear clipboard", () => {
      const clipboardData = {
        clips: [{ id: "clip-1", name: "Clip 1" }],
        tracks: [],
        metadata: {
          copiedAt: new Date(),
          originalTimeRange: { startTime: 0, endTime: 10 },
          trackIds: ["track-1"],
        },
      }

      actor.send({ type: "COPY_TO_CLIPBOARD", data: clipboardData })
      actor.send({ type: "CLEAR_CLIPBOARD" })

      expect(actor.getSnapshot().context.clipboard).toBeNull()
    })
  })

  describe("UI Flags", () => {
    it("should toggle recording", () => {
      expect(actor.getSnapshot().context.isRecording).toBe(false)

      actor.send({ type: "TOGGLE_RECORDING" })
      expect(actor.getSnapshot().context.isRecording).toBe(true)

      actor.send({ type: "TOGGLE_RECORDING" })
      expect(actor.getSnapshot().context.isRecording).toBe(false)
    })

    it("should toggle waveforms", () => {
      expect(actor.getSnapshot().context.showWaveforms).toBe(true)

      actor.send({ type: "TOGGLE_WAVEFORMS" })
      expect(actor.getSnapshot().context.showWaveforms).toBe(false)

      actor.send({ type: "TOGGLE_WAVEFORMS" })
      expect(actor.getSnapshot().context.showWaveforms).toBe(true)
    })

    it("should toggle thumbnails", () => {
      expect(actor.getSnapshot().context.showThumbnails).toBe(true)

      actor.send({ type: "TOGGLE_THUMBNAILS" })
      expect(actor.getSnapshot().context.showThumbnails).toBe(false)
    })

    it("should toggle markers", () => {
      expect(actor.getSnapshot().context.showMarkers).toBe(true)

      actor.send({ type: "TOGGLE_MARKERS" })
      expect(actor.getSnapshot().context.showMarkers).toBe(false)
    })
  })

  describe("Error Handling", () => {
    it("should set UI error", () => {
      actor.send({ type: "SET_UI_ERROR", error: "Failed to load clip" })

      expect(actor.getSnapshot().context.uiError).toBe("Failed to load clip")
    })

    it("should clear UI error", () => {
      actor.send({ type: "SET_UI_ERROR", error: "Error" })
      actor.send({ type: "CLEAR_UI_ERROR" })

      expect(actor.getSnapshot().context.uiError).toBeNull()
    })
  })

  describe("Complex Workflows", () => {
    it("should handle complete editing workflow", () => {
      // Set up timeline
      actor.send({ type: "SET_TIME_SCALE", scale: 150 })
      actor.send({ type: "SET_EDIT_MODE", mode: "select" })
      actor.send({ type: "SET_SNAP_MODE", mode: "clips" })

      // Select clips
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SELECT_CLIP", clipId: "clip-2", multiple: true })

      // Copy to clipboard
      const clipboardData = {
        clips: [
          { id: "clip-1", name: "Clip 1" },
          { id: "clip-2", name: "Clip 2" },
        ],
        tracks: [],
        metadata: {
          copiedAt: new Date(),
          originalTimeRange: { startTime: 0, endTime: 20 },
          trackIds: ["track-1"],
        },
      }
      actor.send({ type: "COPY_TO_CLIPBOARD", data: clipboardData })

      // Verify state
      const { context } = actor.getSnapshot()
      expect(context.timeScale).toBe(150)
      expect(context.editMode).toBe("select")
      expect(context.snapMode).toBe("clips")
      expect(context.selectedClipIds).toEqual(["clip-1", "clip-2"])
      expect(context.clipboard).toBeDefined()
    })

    it("should handle drag and drop workflow", () => {
      // Select clip
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })

      // Start dragging
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })
      expect(actor.getSnapshot().value).toBe("dragging")

      // Update position during drag
      actor.send({ type: "SYNC_CURRENT_TIME", currentTime: 25 })

      // End drag
      actor.send({ type: "END_DRAG" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.currentTime).toBe(25)
    })

    it("should handle multi-track selection", () => {
      // Select multiple tracks
      actor.send({ type: "SELECT_TRACK", trackId: "track-1" })
      actor.send({ type: "SELECT_TRACK", trackId: "track-2", multiple: true })
      actor.send({ type: "SELECT_TRACK", trackId: "track-3", multiple: true })

      expect(actor.getSnapshot().context.selectedTrackIds).toHaveLength(3)

      // Deselect one track
      actor.send({ type: "SELECT_TRACK", trackId: "track-2", multiple: true })

      expect(actor.getSnapshot().context.selectedTrackIds).toHaveLength(2)
      expect(actor.getSnapshot().context.selectedTrackIds).toEqual(["track-1", "track-3"])
    })
  })

  describe("State Persistence", () => {
    it("should maintain state during playback sync", () => {
      // Set up initial state
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SET_TIME_SCALE", scale: 200 })

      // Sync playback
      actor.send({
        type: "SYNC_PLAYBACK_STATE",
        isPlaying: true,
        currentTime: 30,
      })

      // Verify other state is maintained
      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual(["clip-1"])
      expect(context.timeScale).toBe(200)
      expect(context.isPlaying).toBe(true)
    })

    it("should clear selection independently of other state", () => {
      // Set multiple state properties
      actor.send({ type: "SELECT_CLIP", clipId: "clip-1" })
      actor.send({ type: "SET_TIME_SCALE", scale: 150 })
      actor.send({ type: "SET_EDIT_MODE", mode: "trim" })

      // Clear only selection
      actor.send({ type: "CLEAR_SELECTION" })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual([])
      expect(context.timeScale).toBe(150)
      expect(context.editMode).toBe("trim")
    })
  })
})
