/**
 * Timeline Machine Tests
 *
 * Comprehensive tests for the unified timeline state machine with:
 * - Project management
 * - Playback control
 * - Track operations
 * - Clip operations
 * - Selection and clipboard
 * - Effects and transitions
 * - UI state management
 * - Backend synchronization
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import { MediaType } from "@timeline-studio/domains/media-management"
import { timelineMachine } from "../../machines/timeline-machine"
import type { MediaFile, Timeline, TimelineClip } from "../../types"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    debugSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
  }),
}))

describe("TimelineMachine", () => {
  let actor: ReturnType<typeof createActor<typeof timelineMachine>>

  // Helper to transition from idle to active state
  const activateActor = async () => {
    actor.send({ type: "CREATE_PROJECT", name: "Test Project" })
    // Wait for async transition
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  beforeEach(() => {
    actor = createActor(timelineMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in idle state", () => {
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("idle")
    })

    it("should have initial context values", () => {
      const { context } = actor.getSnapshot()

      // Project
      expect(context.project).toBeNull()
      expect(context.projectState).toBeNull()
      expect(context.isLoading).toBe(false)
      expect(context.hasUnsavedChanges).toBe(false)

      // Playback
      expect(context.isPlaying).toBe(false)
      expect(context.currentTime).toBe(0)
      expect(context.playbackRate).toBe(1)
      expect(context.duration).toBe(0)

      // Tracks
      expect(context.activeTrackId).toBeNull()

      // Selection
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
      expect(context.clipboard).toBeNull()

      // UI
      expect(context.timeScale).toBe(100)
      expect(context.scrollPosition).toEqual({ x: 0, y: 0 })
      expect(context.editMode).toBe("select")
      expect(context.snapMode).toBe("clips")

      // Drag
      expect(context.isDragging).toBe(false)
      expect(context.draggedClipId).toBeNull()
      expect(context.draggedTrackId).toBeNull()
      expect(context.draggedResourceType).toBeNull()
      expect(context.draggedResourceId).toBeNull()

      // Flags
      expect(context.isRecording).toBe(false)
      expect(context.showWaveforms).toBe(true)
      expect(context.showThumbnails).toBe(true)
      expect(context.showMarkers).toBe(true)

      // Error
      expect(context.error).toBeNull()
    })
  })

  describe("Project Management", () => {
    const mockProject: Timeline = {
      id: "project-1",
      name: "Test Project",
      duration: 120,
      fps: 30,
      sampleRate: 48000,
      sections: [],
      globalTracks: [],
      resources: {
        media: [],
        effects: [],
        transitions: [],
        filters: [],
        music: [],
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
        sampleRate: 48000,
        channels: 2,
        bitDepth: 24,
        timeFormat: "timecode" as const,
        snapToGrid: true,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 60,
      },
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it("should update project and transition to active on PROJECT_UPDATED event in idle", () => {
      actor.send({ type: "PROJECT_UPDATED", project: mockProject })

      const { context } = actor.getSnapshot()
      expect(context.project).toEqual(mockProject)
      expect(context.duration).toBe(120)
      // Should transition to active state when project is loaded
      expect(actor.getSnapshot().value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
    })

    it("should transition to creatingProject state", () => {
      actor.send({ type: "CREATE_PROJECT", name: "New Project" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("creatingProject")
      expect(snapshot.context.isLoading).toBe(true)
    })

    it("should transition to active after creating project", async () => {
      await activateActor()

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
      expect(snapshot.context.isLoading).toBe(false)
      expect(snapshot.context.hasUnsavedChanges).toBe(true)
    })

    it("should transition to savingProject state", async () => {
      await activateActor()
      actor.send({ type: "SAVE_PROJECT" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("savingProject")
      expect(snapshot.context.isLoading).toBe(true)
    })

    it("should return to active state after save", async () => {
      await activateActor()
      actor.send({ type: "SAVE_PROJECT" })

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 50))

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
      expect(snapshot.context.isLoading).toBe(false)
      expect(snapshot.context.hasUnsavedChanges).toBe(false)
    })
  })

  describe("Playback Control", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should transition to playing state", () => {
      actor.send({ type: "PLAY" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "playing",
          editing: "normal",
        },
      })
      expect(snapshot.context.isPlaying).toBe(true)
    })

    it("should transition to paused state", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "PAUSE" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "paused",
          editing: "normal",
        },
      })
      expect(snapshot.context.isPlaying).toBe(false)
    })

    it("should transition to stopped state", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "STOP" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
      expect(snapshot.context.isPlaying).toBe(false)
      expect(snapshot.context.currentTime).toBe(0)
    })

    it("should update current time on SEEK", () => {
      actor.send({ type: "SEEK", time: 5.5 })

      const { context } = actor.getSnapshot()
      expect(context.currentTime).toBe(5.5)
    })

    it("should update playback rate", () => {
      actor.send({ type: "SET_PLAYBACK_RATE", rate: 2.0 })

      const { context } = actor.getSnapshot()
      expect(context.playbackRate).toBe(2.0)
    })

    it("should sync playback state", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "SYNC_PLAYBACK_STATE", isPlaying: true, currentTime: 10.0 })

      const { context } = actor.getSnapshot()
      expect(context.currentTime).toBe(10.0)
    })

    it("should seek while playing", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "SEEK", time: 15.0 })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "playing",
          editing: "normal",
        },
      })
      expect(snapshot.context.currentTime).toBe(15.0)
    })

    it("should seek while paused", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "PAUSE" })
      actor.send({ type: "SEEK", time: 20.0 })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "paused",
          editing: "normal",
        },
      })
      expect(snapshot.context.currentTime).toBe(20.0)
    })

    it("should seek while stopped", () => {
      actor.send({ type: "SEEK", time: 25.0 })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
      expect(snapshot.context.currentTime).toBe(25.0)
    })
  })

  describe("Track Operations", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should mark unsaved on ADD_TRACK", () => {
      actor.send({ type: "ADD_TRACK", trackType: "video", name: "Video Track 1" })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on REMOVE_TRACK", () => {
      actor.send({ type: "REMOVE_TRACK", trackId: "track-1" })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on UPDATE_TRACK", () => {
      actor.send({ type: "UPDATE_TRACK", trackId: "track-1", updates: { name: "New Name" } })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on REORDER_TRACKS", () => {
      actor.send({ type: "REORDER_TRACKS", sectionId: "section-1", trackIds: ["track-2", "track-1"] })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should set active track", () => {
      actor.send({ type: "SET_ACTIVE_TRACK", trackId: "track-1" })

      const { context } = actor.getSnapshot()
      expect(context.activeTrackId).toBe("track-1")
    })

    it("should clear active track", () => {
      actor.send({ type: "SET_ACTIVE_TRACK", trackId: "track-1" })
      actor.send({ type: "SET_ACTIVE_TRACK", trackId: null })

      const { context } = actor.getSnapshot()
      expect(context.activeTrackId).toBeNull()
    })
  })

  describe("Clip Operations", () => {
    const mockMediaFile: MediaFile = {
      id: "media-1",
      name: "video.mp4",
      path: "/test/video.mp4",
      type: MediaType.Video,
      duration: 60,
      size: 1024 * 1024,
    }

    beforeEach(async () => {
      await activateActor()
    })

    it("should mark unsaved on ADD_CLIP", () => {
      actor.send({ type: "ADD_CLIP", trackId: "track-1", mediaFile: mockMediaFile, time: 0 })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on REMOVE_CLIP", () => {
      actor.send({ type: "REMOVE_CLIP", clipId: "clip-1" })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on MOVE_CLIP", () => {
      actor.send({ type: "MOVE_CLIP", clipId: "clip-1", trackId: "track-2", time: 5.0 })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on TRIM_CLIP", () => {
      actor.send({ type: "TRIM_CLIP", clipId: "clip-1", startTime: 1.0, endTime: 9.0 })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on SPLIT_CLIP", () => {
      actor.send({ type: "SPLIT_CLIP", clipId: "clip-1", time: 5.0 })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on UPDATE_CLIP", () => {
      actor.send({ type: "UPDATE_CLIP", clipId: "clip-1", updates: { volume: 0.5 } })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })

    it("should mark unsaved on BATCH_UPDATE_CLIPS", () => {
      const mockClips: TimelineClip[] = [
        {
          id: "clip-1",
          name: "clip-1",
          trackId: "track-1",
          mediaId: "media-1",
          startTime: 0,
          duration: 10,
          sourceIn: 0,
          sourceOut: 10,
          mediaStartTime: 0,
          mediaEndTime: 10,
          offset: 0,
          playbackRate: 1.0,
          speed: 1.0,
          isReversed: false,
          volume: 1.0,
          opacity: 1.0,
          isSelected: false,
          isLocked: false,
          isMuted: false,
          position: { x: 0, y: 0, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1 },
          effects: [],
          filters: [],
          transitions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      actor.send({ type: "BATCH_UPDATE_CLIPS", clips: mockClips })

      const { context } = actor.getSnapshot()
      expect(context.hasUnsavedChanges).toBe(true)
    })
  })

  describe("Selection", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should select clips", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1", "clip-2"] })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual(["clip-1", "clip-2"])
    })

    it("should add to clip selection", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1"] })
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-2", "clip-3"], addToSelection: true })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual(["clip-1", "clip-2", "clip-3"])
    })

    it("should not duplicate clips when adding to selection", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1", "clip-2"] })
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-2", "clip-3"], addToSelection: true })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual(["clip-1", "clip-2", "clip-3"])
    })

    it("should select tracks", () => {
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track-1", "track-2"] })

      const { context } = actor.getSnapshot()
      expect(context.selectedTrackIds).toEqual(["track-1", "track-2"])
    })

    it("should add to track selection", () => {
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track-1"] })
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track-2"], addToSelection: true })

      const { context } = actor.getSnapshot()
      expect(context.selectedTrackIds).toEqual(["track-1", "track-2"])
    })

    it("should clear all selections", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1"] })
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track-1"] })
      actor.send({ type: "CLEAR_SELECTION" })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
    })
  })

  describe("UI State Management", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should set time scale", () => {
      actor.send({ type: "SET_TIME_SCALE", scale: 200 })

      const { context } = actor.getSnapshot()
      expect(context.timeScale).toBe(200)
    })

    it("should set scroll position", () => {
      actor.send({ type: "SET_SCROLL_POSITION", x: 100, y: 50 })

      const { context } = actor.getSnapshot()
      expect(context.scrollPosition).toEqual({ x: 100, y: 50 })
    })

    it("should set edit mode", () => {
      actor.send({ type: "SET_EDIT_MODE", mode: "trim" })

      const { context } = actor.getSnapshot()
      expect(context.editMode).toBe("trim")
    })

    it("should set snap mode", () => {
      actor.send({ type: "SET_SNAP_MODE", mode: "grid" })

      const { context } = actor.getSnapshot()
      expect(context.snapMode).toBe("grid")
    })

    it("should toggle recording", () => {
      const initialRecording = actor.getSnapshot().context.isRecording

      actor.send({ type: "TOGGLE_RECORDING" })
      expect(actor.getSnapshot().context.isRecording).toBe(!initialRecording)

      actor.send({ type: "TOGGLE_RECORDING" })
      expect(actor.getSnapshot().context.isRecording).toBe(initialRecording)
    })

    it("should toggle waveforms", () => {
      const initialWaveforms = actor.getSnapshot().context.showWaveforms

      actor.send({ type: "TOGGLE_WAVEFORMS" })
      expect(actor.getSnapshot().context.showWaveforms).toBe(!initialWaveforms)

      actor.send({ type: "TOGGLE_WAVEFORMS" })
      expect(actor.getSnapshot().context.showWaveforms).toBe(initialWaveforms)
    })

    it("should toggle thumbnails", () => {
      const initialThumbnails = actor.getSnapshot().context.showThumbnails

      actor.send({ type: "TOGGLE_THUMBNAILS" })
      expect(actor.getSnapshot().context.showThumbnails).toBe(!initialThumbnails)

      actor.send({ type: "TOGGLE_THUMBNAILS" })
      expect(actor.getSnapshot().context.showThumbnails).toBe(initialThumbnails)
    })

    it("should toggle markers", () => {
      const initialMarkers = actor.getSnapshot().context.showMarkers

      actor.send({ type: "TOGGLE_MARKERS" })
      expect(actor.getSnapshot().context.showMarkers).toBe(!initialMarkers)

      actor.send({ type: "TOGGLE_MARKERS" })
      expect(actor.getSnapshot().context.showMarkers).toBe(initialMarkers)
    })
  })

  describe("Drag Operations", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should start dragging clip", () => {
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "dragging",
        },
      })
      expect(snapshot.context.isDragging).toBe(true)
      expect(snapshot.context.draggedClipId).toBe("clip-1")
    })

    it("should start dragging track", () => {
      actor.send({ type: "START_DRAG_TRACK", trackId: "track-1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "dragging",
        },
      })
      expect(snapshot.context.isDragging).toBe(true)
      expect(snapshot.context.draggedTrackId).toBe("track-1")
    })

    it("should start dragging resource", () => {
      actor.send({ type: "START_DRAG_RESOURCE", resourceType: "effect", resourceId: "effect-1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "dragging",
        },
      })
      expect(snapshot.context.isDragging).toBe(true)
      expect(snapshot.context.draggedResourceType).toBe("effect")
      expect(snapshot.context.draggedResourceId).toBe("effect-1")
    })

    it("should end drag operation", () => {
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })
      actor.send({ type: "END_DRAG" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
      expect(snapshot.context.isDragging).toBe(false)
      expect(snapshot.context.draggedClipId).toBeNull()
    })

    it("should drag while playing", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip-1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "playing",
          editing: "dragging",
        },
      })
      expect(snapshot.context.isPlaying).toBe(true)
      expect(snapshot.context.isDragging).toBe(true)
    })
  })

  describe("Error Handling", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should clear error", () => {
      actor.send({ type: "CLEAR_ERROR" })

      const { context } = actor.getSnapshot()
      expect(context.error).toBeNull()
    })
  })

  describe("Backend Synchronization", () => {
    beforeEach(async () => {
      await activateActor()
    })

    it("should handle BACKEND_EVENT", () => {
      const mockEvent = {
        type: "ClipAdded",
        payload: {
          clip_id: "clip-1",
          track_id: "track-1",
        },
      } as any

      actor.send({ type: "BACKEND_EVENT", event: mockEvent })

      // Should not throw and machine should still be in active state
      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toEqual({
        active: {
          playback: "stopped",
          editing: "normal",
        },
      })
    })
  })

  describe("Complex Workflows", () => {
    it("should handle complete editing workflow", async () => {
      // First activate the actor
      await activateActor()

      const mockProject: Timeline = {
        id: "project-1",
        name: "Test Project",
        duration: 120,
        fps: 30,
        sampleRate: 48000,
        sections: [],
        globalTracks: [],
        resources: {
          media: [],
          effects: [],
          transitions: [],
          filters: [],
          music: [],
        },
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          aspectRatio: "16:9",
          sampleRate: 48000,
          channels: 2,
          bitDepth: 24,
          timeFormat: "timecode" as const,
          snapToGrid: true,
          gridSize: 1,
          autoSave: true,
          autoSaveInterval: 60,
        },
        version: "1.0.0",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Update project
      actor.send({ type: "PROJECT_UPDATED", project: mockProject })
      expect(actor.getSnapshot().context.project).toEqual(mockProject)

      // Add track
      actor.send({ type: "ADD_TRACK", trackType: "video", name: "Video Track 1" })
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true)

      // Add clip
      const mockMediaFile: MediaFile = {
        id: "media-1",
        name: "video.mp4",
        path: "/test/video.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024 * 1024,
      }
      actor.send({ type: "ADD_CLIP", trackId: "track-1", mediaFile: mockMediaFile, time: 0 })

      // Select clip
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1"] })
      expect(actor.getSnapshot().context.selectedClipIds).toEqual(["clip-1"])

      // Play
      actor.send({ type: "PLAY" })
      expect(actor.getSnapshot().context.isPlaying).toBe(true)

      // Seek
      actor.send({ type: "SEEK", time: 5.0 })
      expect(actor.getSnapshot().context.currentTime).toBe(5.0)

      // Pause
      actor.send({ type: "PAUSE" })
      expect(actor.getSnapshot().context.isPlaying).toBe(false)

      // Should remain in active state throughout
      expect(actor.getSnapshot().value).toEqual({
        active: {
          playback: "paused",
          editing: "normal",
        },
      })
    })

    it("should maintain selection during playback state changes", async () => {
      await activateActor()

      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1", "clip-2"] })
      actor.send({ type: "PLAY" })
      actor.send({ type: "PAUSE" })
      actor.send({ type: "STOP" })

      const { context } = actor.getSnapshot()
      expect(context.selectedClipIds).toEqual(["clip-1", "clip-2"])
    })

    it("should preserve UI state during save", async () => {
      await activateActor()

      actor.send({ type: "SET_TIME_SCALE", scale: 150 })
      actor.send({ type: "SET_EDIT_MODE", mode: "trim" })
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1"] })

      actor.send({ type: "SAVE_PROJECT" })
      await new Promise((resolve) => setTimeout(resolve, 50))

      const { context } = actor.getSnapshot()
      expect(context.timeScale).toBe(150)
      expect(context.editMode).toBe("trim")
      expect(context.selectedClipIds).toEqual(["clip-1"])
    })
  })
})
