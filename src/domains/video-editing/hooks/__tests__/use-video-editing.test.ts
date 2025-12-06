/**
 * Tests for useVideoEditing Hook
 *
 * Comprehensive tests for the combined video editing hook with
 * orchestrator integration
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useVideoEditing } from "../use-video-editing"

// Hoisted mocks
const { mockOrchestrator, mockTimelineActor, mockPlayerActor } = vi.hoisted(() => {
  const mockTimelineState = {
    context: {
      project: null,
      tracks: [],
      clips: [],
      sections: [],
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
      hasUnsavedChanges: false,
      isRecording: false,
      timeScale: 1,
      scrollPosition: 0,
      editMode: "select" as const,
      snapMode: "none" as const,
      showWaveforms: true,
      showThumbnails: true,
      isDragging: false,
      draggedClipId: null,
      draggedTrackId: null,
      draggedResourceId: null,
      clipboard: null,
    },
  }

  const mockPlayerState = {
    context: {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isPaused: false,
      isStopped: true,
      isLoading: false,
      isRecording: false,
      volume: 1.0,
      playbackRate: 1.0,
      video: null,
      error: null,
      speedRampingEnabled: false,
      basePlaybackRate: 1.0,
    },
  }

  const mockTimelineActor = {
    send: vi.fn(),
    getSnapshot: vi.fn(() => mockTimelineState),
    subscribe: vi.fn((callback: any) => {
      // Immediately call with initial state
      callback(mockTimelineState)
      return { unsubscribe: vi.fn() }
    }),
  }

  const mockPlayerActor = {
    send: vi.fn(),
    getSnapshot: vi.fn(() => mockPlayerState),
    subscribe: vi.fn((callback: any) => {
      callback(mockPlayerState)
      return { unsubscribe: vi.fn() }
    }),
  }

  const mockOrchestrator = {
    getTimelineState: vi.fn(() => mockTimelineState),
    getPlayerState: vi.fn(() => mockPlayerState),
    getActors: vi.fn(() => ({
      timeline: mockTimelineActor,
      player: mockPlayerActor,
    })),
    subscribeToTimeline: vi.fn((callback: any) => {
      callback(mockTimelineState)
      return { unsubscribe: vi.fn() }
    }),
    subscribeToPlayer: vi.fn((callback: any) => {
      callback(mockPlayerState)
      return { unsubscribe: vi.fn() }
    }),
    createProject: vi.fn(),
    loadProject: vi.fn(),
    saveProject: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stopPlayback: vi.fn(),
    seek: vi.fn(),
    addTrack: vi.fn(),
    addClip: vi.fn(),
  }

  return { mockOrchestrator, mockTimelineActor, mockPlayerActor }
})

// Mock orchestrator
vi.mock("../../services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: () => mockOrchestrator,
}))

describe("useVideoEditing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Hook Initialization", () => {
    it("should initialize with orchestrator", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current).toBeDefined()
      expect(mockOrchestrator.getTimelineState).toHaveBeenCalled()
      expect(mockOrchestrator.getPlayerState).toHaveBeenCalled()
    })

    it("should subscribe to timeline state changes", () => {
      renderHook(() => useVideoEditing())

      expect(mockOrchestrator.subscribeToTimeline).toHaveBeenCalled()
    })

    it("should subscribe to player state changes", () => {
      renderHook(() => useVideoEditing())

      expect(mockOrchestrator.subscribeToPlayer).toHaveBeenCalled()
    })

    it("should provide initial timeline state", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.timeline).toBeDefined()
      expect(result.current.timeline.project).toBeNull()
      expect(result.current.timeline.tracks).toEqual([])
      expect(result.current.timeline.clips).toEqual([])
    })

    it("should provide initial player state", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.player).toBeDefined()
      expect(result.current.player.isPlaying).toBe(false)
      expect(result.current.player.currentTime).toBe(0)
      expect(result.current.player.duration).toBe(0)
    })

    it("should cleanup subscriptions on unmount", () => {
      const unsubscribeTimeline = vi.fn()
      const unsubscribePlayer = vi.fn()

      mockOrchestrator.subscribeToTimeline.mockReturnValue({ unsubscribe: unsubscribeTimeline })
      mockOrchestrator.subscribeToPlayer.mockReturnValue({ unsubscribe: unsubscribePlayer })

      const { unmount } = renderHook(() => useVideoEditing())

      unmount()

      expect(unsubscribeTimeline).toHaveBeenCalled()
      expect(unsubscribePlayer).toHaveBeenCalled()
    })
  })

  describe("Project Operations", () => {
    it("should create project", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.createProject("Test Project")
      })

      expect(mockOrchestrator.createProject).toHaveBeenCalledWith("Test Project", undefined)
    })

    it("should create project with settings", () => {
      const { result } = renderHook(() => useVideoEditing())
      const settings = { width: 1920, height: 1080 }

      act(() => {
        result.current.createProject("Test Project", settings)
      })

      expect(mockOrchestrator.createProject).toHaveBeenCalledWith("Test Project", settings)
    })

    it("should load project", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.loadProject("/path/to/project.json")
      })

      expect(mockOrchestrator.loadProject).toHaveBeenCalledWith("/path/to/project.json")
    })

    it("should save project", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.saveProject()
      })

      expect(mockOrchestrator.saveProject).toHaveBeenCalled()
    })
  })

  describe("Playback Control", () => {
    it("should play video", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.play()
      })

      expect(mockOrchestrator.play).toHaveBeenCalled()
    })

    it("should pause video", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.pause()
      })

      expect(mockOrchestrator.pause).toHaveBeenCalled()
    })

    it("should stop video", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.stop()
      })

      expect(mockOrchestrator.stopPlayback).toHaveBeenCalled()
    })

    it("should seek to time", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.seek(5.5)
      })

      expect(mockOrchestrator.seek).toHaveBeenCalledWith(5.5)
    })

    it("should load video", () => {
      const { result } = renderHook(() => useVideoEditing())
      const mockVideo = { id: "video-1", path: "/path/to/video.mp4" } as any

      act(() => {
        result.current.loadVideo(mockVideo)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "LOAD_VIDEO",
        video: mockVideo,
      })
    })
  })

  describe("Timeline Operations", () => {
    it("should add track", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.addTrack("video", "Video Track 1")
      })

      expect(mockOrchestrator.addTrack).toHaveBeenCalledWith("video", "Video Track 1", undefined)
    })

    it("should add track with section", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.addTrack("video", "Video Track 1", "section-1")
      })

      expect(mockOrchestrator.addTrack).toHaveBeenCalledWith("video", "Video Track 1", "section-1")
    })

    it("should add clip", () => {
      const { result } = renderHook(() => useVideoEditing())
      const mockMedia = { id: "media-1", name: "video.mp4" }

      act(() => {
        result.current.addClip("track-1", mockMedia, 5.0)
      })

      expect(mockOrchestrator.addClip).toHaveBeenCalledWith("track-1", mockMedia, 5.0)
    })
  })

  describe("UI Control", () => {
    it("should set time scale", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.setTimeScale(2.0)
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_TIME_SCALE",
        scale: 2.0,
      })
    })

    it("should set edit mode", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.setEditMode("trim")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_EDIT_MODE",
        mode: "trim",
      })
    })

    it("should set snap mode", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.setSnapMode("clips")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SET_SNAP_MODE",
        mode: "clips",
      })
    })
  })

  describe("Selection Operations", () => {
    it("should select clip", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.selectClip("clip-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1"],
        addToSelection: false,
      })
    })

    it("should select track", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.selectTrack("track-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_TRACKS",
        trackIds: ["track-1"],
        addToSelection: false,
      })
    })

    it("should select section", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.selectSection("section-1")
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "SELECT_SECTIONS",
        sectionIds: ["section-1"],
        addToSelection: false,
      })
    })

    it("should clear selection", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.clearSelection()
      })

      expect(mockTimelineActor.send).toHaveBeenCalledWith({
        type: "CLEAR_SELECTION",
      })
    })
  })

  describe("Recording Operations", () => {
    it("should start recording", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.startRecording()
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "START_RECORDING",
      })
    })

    it("should stop recording", () => {
      const { result } = renderHook(() => useVideoEditing())

      act(() => {
        result.current.stopRecording()
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "STOP_RECORDING",
      })
    })
  })

  describe("State Shortcuts", () => {
    it("should provide isPlaying shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.isPlaying).toBe(false)
    })

    it("should provide hasProject shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.hasProject).toBe(false)
    })

    it("should provide hasUnsavedChanges shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.hasUnsavedChanges).toBe(false)
    })

    it("should provide hasSelection shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.hasSelection).toBe(false)
    })

    it("should provide currentTime shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.currentTime).toBe(0)
    })

    it("should provide duration shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.duration).toBe(0)
    })

    it("should provide isRecording shortcut", () => {
      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.isRecording).toBe(false)
    })

    it("should update hasSelection when clips are selected", () => {
      const updatedTimelineState = {
        context: {
          ...mockOrchestrator.getTimelineState().context,
          selectedClipIds: ["clip-1", "clip-2"],
        },
      }

      mockOrchestrator.subscribeToTimeline.mockImplementation((callback: any) => {
        callback(updatedTimelineState)
        return { unsubscribe: vi.fn() }
      })

      const { result } = renderHook(() => useVideoEditing())

      expect(result.current.hasSelection).toBe(true)
    })
  })

  describe("State Updates", () => {
    it("should update timeline state on changes", async () => {
      const { result, rerender } = renderHook(() => useVideoEditing())

      // Initial state
      expect(result.current.timeline.tracks).toEqual([])

      // Simulate state update
      const updatedState = {
        context: {
          ...result.current.timeline,
          tracks: [{ id: "track-1", name: "Track 1" }],
        },
      }

      // Get the callback that was passed to subscribeToTimeline
      const subscribeCallback = mockOrchestrator.subscribeToTimeline.mock.calls[0][0]

      act(() => {
        subscribeCallback(updatedState)
      })

      rerender()

      await waitFor(() => {
        expect(result.current.timeline.tracks).toHaveLength(1)
      })
    })

    it("should update player state on changes", async () => {
      const { result, rerender } = renderHook(() => useVideoEditing())

      // Initial state
      expect(result.current.player.isPlaying).toBe(false)

      // Simulate state update
      const updatedState = {
        context: {
          ...result.current.player,
          isPlaying: true,
          currentTime: 5.5,
        },
      }

      // Get the callback
      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]

      act(() => {
        subscribeCallback(updatedState)
      })

      rerender()

      await waitFor(() => {
        expect(result.current.player.isPlaying).toBe(true)
        expect(result.current.currentTime).toBe(5.5)
        expect(result.current.isPlaying).toBe(true)
      })
    })
  })
})
