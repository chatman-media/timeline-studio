/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для use-timeline hook
 *
 * Покрытие:
 * 1. UI Controls (timeScale, scroll, editMode, snapMode)
 * 2. Selection (clips, tracks, multiple selection)
 * 3. Clipboard (copy, cut, paste, delete)
 * 4. Drag & Drop operations
 * 5. Toggle functions (waveforms, thumbnails, markers)
 * 6. Project operations (create, load, save)
 * 7. Clip operations (add, move, delete, trim, split, update)
 * 8. Track operations
 * 9. Edge cases и helper properties
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getVideoEditingOrchestrator } from "../../services/video-editing-orchestrator"
import type { MediaFile } from "../../types"
import { MediaType } from "../../types"
import { useTimeline } from "../use-timeline"

// Mock orchestrator
vi.mock("../../services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    infoSync: vi.fn(),
    errorSync: vi.fn(),
    debugSync: vi.fn(),
    warnSync: vi.fn(),
  }),
}))

describe("useTimeline", () => {
  // Mock data
  const mockMediaFile: MediaFile = {
    id: "media-1",
    name: "test-video.mp4",
    path: "/test/video.mp4",
    type: MediaType.Video,
    duration: 120,
    size: 1024 * 1024,
  }

  const mockProject = {
    id: "project-1",
    name: "Test Project",
    settings: {},
  }

  // Mock actors
  let mockTimelineActor: any
  let mockOrchestrator: any
  let mockStateSubscription: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock timeline actor
    mockTimelineActor = {
      send: vi.fn(),
      getSnapshot: vi.fn(() => ({
        context: {
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
          editMode: "select" as const,
          snapMode: "none" as const,
          isDragging: false,
          draggedClipId: null,
          draggedTrackId: null,
          draggedResourceType: null,
          draggedResourceId: null,
          isRecording: false,
          showWaveforms: false,
          showThumbnails: true,
          showMarkers: false,
          uiError: null,
          error: null,
        },
      })),
    }

    // Create mock orchestrator
    mockStateSubscription = {
      unsubscribe: vi.fn(),
    }

    mockOrchestrator = {
      getTimelineState: vi.fn(() => mockTimelineActor.getSnapshot()),
      getActors: vi.fn(() => ({
        timeline: mockTimelineActor,
      })),
      subscribeToTimeline: vi.fn((callback) => {
        callback(mockTimelineActor.getSnapshot())
        return mockStateSubscription
      }),
      createProject: vi.fn(),
      loadProject: vi.fn(),
      saveProject: vi.fn(),
      addClip: vi.fn(),
      moveClip: vi.fn(),
      deleteClip: vi.fn(),
      trimClip: vi.fn(),
      splitClip: vi.fn(),
      updateClip: vi.fn(),
      batchUpdateClips: vi.fn(),
      selectClips: vi.fn(),
      addTrack: vi.fn(),
    }

    vi.mocked(getVideoEditingOrchestrator).mockReturnValue(mockOrchestrator)
  })

  describe("Initialization", () => {
    it("should initialize with orchestrator state", () => {
      const { result } = renderHook(() => useTimeline())

      expect(result.current.project).toBeNull()
      expect(result.current.currentTime).toBe(0)
      expect(result.current.timeScale).toBe(1)
      expect(result.current.editMode).toBe("select")
      expect(result.current.snapMode).toBe("none")
    })

    it("should subscribe to timeline state changes", () => {
      renderHook(() => useTimeline())

      expect(mockOrchestrator.subscribeToTimeline).toHaveBeenCalled()
    })

    it("should unsubscribe on unmount", () => {
      const { unmount } = renderHook(() => useTimeline())

      unmount()

      expect(mockStateSubscription.unsubscribe).toHaveBeenCalled()
    })

    it("should compute helper properties correctly", () => {
      const { result } = renderHook(() => useTimeline())

      expect(result.current.hasProject).toBe(false)
      expect(result.current.hasUnsavedChanges).toBe(false)
      expect(result.current.hasSelection).toBe(false)
      expect(result.current.hasClipboard).toBe(false)
      expect(result.current.isDragging).toBe(false)
      expect(result.current.isRecording).toBe(false)
    })
  })

  describe("UI Controls", () => {
    it("should set time scale", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setTimeScale(2)
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_TIME_SCALE",
        scale: 2,
      })
    })

    it("should set scroll position", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setScrollPosition(100, 50)
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_SCROLL_POSITION",
        x: 100,
        y: 50,
      })
    })

    it("should set edit mode to cut", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setEditMode("cut")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_EDIT_MODE",
        mode: "cut",
      })
    })

    it("should set edit mode to trim", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setEditMode("trim")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_EDIT_MODE",
        mode: "trim",
      })
    })

    it("should set snap mode to grid", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setSnapMode("grid")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_SNAP_MODE",
        mode: "grid",
      })
    })

    it("should set snap mode to clips", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setSnapMode("clips")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_SNAP_MODE",
        mode: "clips",
      })
    })
  })

  describe("Selection", () => {
    it("should select single clip", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.selectClip("clip-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1"],
        addToSelection: false,
      })
    })

    it("should select clip and add to selection", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.selectClip("clip-2", true)
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-2"],
        addToSelection: true,
      })
    })

    it("should select multiple clips", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.selectMultipleClips(["clip-1", "clip-2", "clip-3"])
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1", "clip-2", "clip-3"],
        addToSelection: false,
      })
    })

    it("should select track", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.selectTrack("track-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_TRACKS",
        trackIds: ["track-1"],
        addToSelection: false,
      })
    })

    it("should clear selection", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.clearSelection()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "CLEAR_SELECTION",
      })
    })

    it("should update hasSelection when clips are selected", async () => {
      const { result } = renderHook(() => useTimeline())

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          selectedClipIds: ["clip-1", "clip-2"],
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasSelection).toBe(true)
        expect(result.current.selectedClipIds).toEqual(["clip-1", "clip-2"])
      })
    })

    it("should update hasSelection when tracks are selected", async () => {
      const { result } = renderHook(() => useTimeline())

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          selectedTrackIds: ["track-1"],
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasSelection).toBe(true)
        expect(result.current.selectedTrackIds).toEqual(["track-1"])
      })
    })

    it("should select clips via orchestrator", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.selectClipsById(["clip-1", "clip-2"], true)
      })

      expect(mockOrchestrator.selectClips).toHaveBeenCalledWith(["clip-1", "clip-2"], true)
    })
  })

  describe("Clipboard Operations", () => {
    it("should copy selected clips", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.copyClips()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "COPY_CLIPS",
      })
    })

    it("should cut selected clips", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.cutClips()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "CUT_CLIPS",
      })
    })

    it("should paste clips at position", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.pasteClips("track-1", 30)
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "PASTE_CLIPS",
        trackId: "track-1",
        time: 30,
      })
    })

    it("should delete selected clips", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.deleteSelected()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "DELETE_SELECTED",
      })
    })

    it("should track clipboard state", async () => {
      const { result } = renderHook(() => useTimeline())

      const mockClipboard = {
        type: "clips",
        data: [{ id: "clip-1" }],
      }

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          clipboard: mockClipboard,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasClipboard).toBe(true)
        expect(result.current.clipboard).toEqual(mockClipboard)
      })
    })
  })

  describe("Drag & Drop Operations", () => {
    it("should start dragging clip", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.startDragClip("clip-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "START_DRAG_CLIP",
        clipId: "clip-1",
      })
    })

    it("should start dragging track", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.startDragTrack("track-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "START_DRAG_TRACK",
        trackId: "track-1",
      })
    })

    it("should start dragging transition resource", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.startDragResource("transition", "trans-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "START_DRAG_RESOURCE",
        resourceType: "transition",
        resourceId: "trans-1",
      })
    })

    it("should start dragging effect resource", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.startDragResource("effect", "effect-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "START_DRAG_RESOURCE",
        resourceType: "effect",
        resourceId: "effect-1",
      })
    })

    it("should end drag operation", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.endDrag()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "END_DRAG",
      })
    })

    it("should update isDragging state", async () => {
      const { result } = renderHook(() => useTimeline())

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          isDragging: true,
          draggedClipId: "clip-1",
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.isDragging).toBe(true)
        expect(result.current.draggedClipId).toBe("clip-1")
      })
    })
  })

  describe("Toggle Functions", () => {
    it("should toggle recording", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.toggleRecording()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "TOGGLE_RECORDING",
      })
    })

    it("should toggle waveforms", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.toggleWaveforms()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "TOGGLE_WAVEFORMS",
      })
    })

    it("should toggle thumbnails", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.toggleThumbnails()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "TOGGLE_THUMBNAILS",
      })
    })

    it("should toggle markers", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.toggleMarkers()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "TOGGLE_MARKERS",
      })
    })

    it("should update toggle states", async () => {
      const { result } = renderHook(() => useTimeline())

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          showWaveforms: true,
          showThumbnails: false,
          showMarkers: true,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.showWaveforms).toBe(true)
        expect(result.current.showThumbnails).toBe(false)
        expect(result.current.showMarkers).toBe(true)
      })
    })
  })

  describe("Project Operations", () => {
    it("should create new project", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.createProject("New Project", { fps: 30 })
      })

      expect(mockOrchestrator.createProject).toHaveBeenCalledWith("New Project", { fps: 30 })
    })

    it("should load project", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.loadProject("/path/to/project.json")
      })

      expect(mockOrchestrator.loadProject).toHaveBeenCalledWith("/path/to/project.json")
    })

    it("should save project", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.saveProject()
      })

      expect(mockOrchestrator.saveProject).toHaveBeenCalled()
    })

    it("should update hasProject when project is loaded", async () => {
      const { result } = renderHook(() => useTimeline())

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          project: mockProject,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasProject).toBe(true)
        expect(result.current.project).toEqual(mockProject)
      })
    })

    it("should track unsaved changes", async () => {
      const { result } = renderHook(() => useTimeline())

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          hasUnsavedChanges: true,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasUnsavedChanges).toBe(true)
      })
    })
  })

  describe("Clip Operations", () => {
    it("should add clip to track", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.addClip("track-1", mockMediaFile, 30)
      })

      expect(mockOrchestrator.addClip).toHaveBeenCalledWith("track-1", mockMediaFile, 30)
    })

    it("should move clip to new position", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.moveClip("clip-1", "track-2", 45)
      })

      expect(mockOrchestrator.moveClip).toHaveBeenCalledWith("clip-1", "track-2", 45)
    })

    it("should delete clip", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.deleteClip("clip-1")
      })

      expect(mockOrchestrator.deleteClip).toHaveBeenCalledWith("clip-1")
    })

    it("should trim clip start and end", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.trimClip("clip-1", 5, 15)
      })

      expect(mockOrchestrator.trimClip).toHaveBeenCalledWith("clip-1", 5, 15)
    })

    it("should split clip at time", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.splitClip("clip-1", 10)
      })

      expect(mockOrchestrator.splitClip).toHaveBeenCalledWith("clip-1", 10)
    })

    it("should update clip properties", () => {
      const { result } = renderHook(() => useTimeline())

      const updates = { volume: 0.8, opacity: 0.9 }

      act(() => {
        result.current.updateClip("clip-1", updates)
      })

      expect(mockOrchestrator.updateClip).toHaveBeenCalledWith("clip-1", updates)
    })

    it("should batch update multiple clips", () => {
      const { result } = renderHook(() => useTimeline())

      const updates = [
        { clip_id: "clip-1", updates: { volume: 0.5 } },
        { clip_id: "clip-2", updates: { volume: 0.7 } },
      ]

      act(() => {
        result.current.batchUpdateClips(updates)
      })

      expect(mockOrchestrator.batchUpdateClips).toHaveBeenCalledWith(updates)
    })
  })

  describe("Track Operations", () => {
    it("should add video track", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.addTrack("video", "Video Track 1")
      })

      expect(mockOrchestrator.addTrack).toHaveBeenCalledWith("video", "Video Track 1", undefined)
    })

    it("should add audio track to section", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.addTrack("audio", "Audio Track", "section-1")
      })

      expect(mockOrchestrator.addTrack).toHaveBeenCalledWith("audio", "Audio Track", "section-1")
    })
  })

  describe("Edge Cases", () => {
    it("should handle multiple rapid UI updates", () => {
      const { result } = renderHook(() => useTimeline())

      act(() => {
        result.current.setTimeScale(1)
        result.current.setTimeScale(2)
        result.current.setTimeScale(3)
      })

      expect(mockTimelineActor.send).toHaveBeenCalledTimes(3)
      expect(mockTimelineActor.send).toHaveBeenLastCalledWith({
        type: "SET_TIME_SCALE",
        scale: 3,
      })
    })

    it("should maintain orchestrator instance across re-renders", () => {
      const { rerender } = renderHook(() => useTimeline())

      const mockedOrchestrator = vi.mocked(getVideoEditingOrchestrator)
      const firstCallCount = mockedOrchestrator.mock.calls.length

      rerender()
      rerender()

      expect(getVideoEditingOrchestrator).toHaveBeenCalledTimes(firstCallCount)
    })

    it("should handle state updates during drag", async () => {
      const { result } = renderHook(() => useTimeline())

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]

      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          isDragging: true,
          draggedClipId: "clip-1",
          selectedClipIds: ["clip-1"],
        },
      })

      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.isDragging).toBe(true)
        expect(result.current.hasSelection).toBe(true)
      })
    })

    it("should compute helper properties dynamically", async () => {
      const { result } = renderHook(() => useTimeline())

      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]

      // State 1: No project, no selection
      expect(result.current.hasProject).toBe(false)
      expect(result.current.hasSelection).toBe(false)

      // State 2: Project loaded, clips selected
      mockTimelineActor.getSnapshot.mockReturnValue({
        context: {
          ...mockTimelineActor.getSnapshot().context,
          project: mockProject,
          selectedClipIds: ["clip-1"],
          hasUnsavedChanges: true,
        },
      })

      act(() => {
        subscribeCallback(mockTimelineActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasProject).toBe(true)
        expect(result.current.hasSelection).toBe(true)
        expect(result.current.hasUnsavedChanges).toBe(true)
      })
    })
  })
})
