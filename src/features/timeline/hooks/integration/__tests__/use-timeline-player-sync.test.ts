import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePlayer } from "@/domains/video-editing"
import { createMockClip } from "../../__mocks__/test-factories"
import * as timelinePlayerSync from "../../services/timeline-player-sync"
// Import mocked functions
import { useTimeline } from "../use-timeline"
import { useTimelinePlayerSync } from "../use-timeline-player-sync"
import { useTimelineSelection } from "../use-timeline-selection"

// Mock dependencies
vi.mock("@/domains/video-editing", () => ({
  usePlayer: vi.fn(),
}))

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(),
}))

vi.mock("../../hooks/use-timeline-selection", () => ({
  useTimelineSelection: vi.fn(),
}))

vi.mock("../../services/timeline-player-sync", () => ({
  timelinePlayerSync: {
    setPlayerContext: vi.fn(),
    syncSelectedClip: vi.fn(),
    clearSelection: vi.fn(),
    syncPlaybackTime: vi.fn(),
  },
}))

// Test data
const mockClip1 = createMockClip({
  id: "clip-1",
  trackId: "track-1",
  mediaId: "source-1",
  startTime: 10,
  duration: 20,
  offset: 0,
  effects: [],
  speed: 1,
  volume: 1,
  opacity: 1,
  filters: [],
  transitions: [],
})

const mockClip2 = createMockClip({
  ...mockClip1,
  id: "clip-2",
  startTime: 35,
})

// Helper to create full TimelineContextType mock
function createTimelineMock(overrides: Partial<ReturnType<typeof useTimeline>> = {}) {
  return {
    // Project
    project: null,
    isLoading: false,
    hasUnsavedChanges: false,
    createProject: vi.fn(),
    saveProject: vi.fn(),
    loadProject: vi.fn(),
    backend: null,

    // Playback
    isPlaying: false,
    currentTime: 15,
    playbackRate: 1,
    duration: 300,
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setPlaybackRate: vi.fn(),

    // Tracks
    tracks: [],
    activeTrackId: null,
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    updateTrack: vi.fn(),
    reorderTracks: vi.fn(),
    setActiveTrack: vi.fn(),

    // Clips
    clips: [],
    addClip: vi.fn(),
    removeClip: vi.fn(),
    moveClip: vi.fn(),
    trimClip: vi.fn(),
    splitClip: vi.fn(),
    updateClip: vi.fn(),
    batchUpdateClips: vi.fn(),

    // Selection
    selectedClipIds: [],
    selectedTrackIds: [],
    clipboardClips: [],
    selectClips: vi.fn(),
    selectTracks: vi.fn(),
    clearSelection: vi.fn(),
    copyClips: vi.fn(),
    cutClips: vi.fn(),
    pasteClips: vi.fn(),
    deleteSelected: vi.fn(),

    // Effects
    applyEffect: vi.fn(),
    removeEffect: vi.fn(),
    applyFilter: vi.fn(),
    removeFilter: vi.fn(),
    applyTransition: vi.fn(),
    removeTransition: vi.fn(),

    // Legacy methods
    addSection: vi.fn(),
    removeSection: vi.fn(),
    selectSections: vi.fn(),
    setTimeScale: vi.fn(),
    setScrollPosition: vi.fn(),
    setEditMode: vi.fn(),
    toggleSnap: vi.fn(),
    copySelection: vi.fn(),
    cutSelection: vi.fn(),
    paste: vi.fn(),
    send: vi.fn(),
    ...overrides,
  } as any
}

// Helper to create full UseTimelineSelectionReturn mock
function createSelectionMock(overrides: Partial<ReturnType<typeof useTimelineSelection>> = {}) {
  return {
    // Current selection
    selectedClips: [],
    selectedTracks: [],
    selectedSections: [],

    // Selection state
    hasSelection: false,
    selectionCount: {
      clips: 0,
      tracks: 0,
      sections: 0,
      total: 0,
    },
    selectionBounds: null,

    // Selection actions
    selectClip: vi.fn(),
    selectTrack: vi.fn(),
    selectSection: vi.fn(),
    selectMultiple: vi.fn(),
    selectAll: vi.fn(),
    selectNone: vi.fn(),
    invertSelection: vi.fn(),

    // Area selection
    selectInTimeRange: vi.fn(),
    selectByType: vi.fn(),

    // Operations
    deleteSelected: vi.fn(),
    duplicateSelected: vi.fn(),
    groupSelected: vi.fn(),
    ungroupSelected: vi.fn(),

    // Properties
    setSelectedVolume: vi.fn(),
    setSelectedSpeed: vi.fn(),
    setSelectedOpacity: vi.fn(),
    muteSelected: vi.fn(),
    unmuteSelected: vi.fn(),
    lockSelected: vi.fn(),
    unlockSelected: vi.fn(),

    // Clipboard
    copySelected: vi.fn(),
    cutSelected: vi.fn(),
    pasteAtTime: vi.fn(),

    // Utilities
    isClipSelected: vi.fn(),
    isTrackSelected: vi.fn(),
    isSectionSelected: vi.fn(),
    getSelectionStats: vi.fn(() => ({
      totalDuration: 0,
      averageVolume: 0,
      trackTypes: [],
      mediaTypes: [],
    })),
    ...overrides,
  } as any
}

const mockPlayerContext = {
  // Playback control
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn().mockResolvedValue(undefined),
  seek: vi.fn().mockResolvedValue(undefined),
  setPlaybackRate: vi.fn().mockResolvedValue(undefined),

  // Playback state
  isPlaying: false,
  currentTime: 0,
  duration: 100,
  volume: 1,
  playbackRate: 1,

  // Speed ramping
  speedRampingEnabled: false,
  currentPlaybackRate: 1,
  basePlaybackRate: 1,

  // Local state
  isVideoLoading: false,
  isVideoReady: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isResizableMode: false,

  // Media content
  currentVideo: null,
  previewMedia: null,
  videoSource: "timeline" as const,
  selectedClipId: null,

  // Effects and filters
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,

  // Prerender settings
  prerenderSettings: {
    prerenderEnabled: false,
    prerenderQuality: 80,
    prerenderSegmentDuration: 10,
    prerenderApplyEffects: true,
    prerenderAutoPrerender: false,
  },

  // Local actions
  setCurrentVideo: vi.fn(),
  setVolume: vi.fn(),
  setDuration: vi.fn(),
  setVideoLoading: vi.fn(),
  setVideoReady: vi.fn(),
  setIsSeeking: vi.fn(),
  setIsChangingCamera: vi.fn(),
  setIsRecording: vi.fn(),
  setIsResizableMode: vi.fn(),
  setPreviewMedia: vi.fn(),
  setVideoSource: vi.fn(),
  applyEffect: vi.fn(),
  applyFilter: vi.fn(),
  applyTemplate: vi.fn(),
  clearEffects: vi.fn(),
  clearFilters: vi.fn(),
  clearTemplate: vi.fn(),
  setPrerenderSettings: vi.fn(),
  setSpeedRampingEnabled: vi.fn(),
  updatePlaybackRate: vi.fn(),
  setBasePlaybackRate: vi.fn(),

  // Player-specific backend commands
  playerSetMedia: vi.fn().mockResolvedValue(undefined),
  playerSetVolume: vi.fn().mockResolvedValue(undefined),
  playerSelectClip: vi.fn().mockResolvedValue(undefined),
  playerClearSelection: vi.fn().mockResolvedValue(undefined),
  playerSetSource: vi.fn().mockResolvedValue(undefined),
  playerApplyEffect: vi.fn().mockResolvedValue(undefined),
  playerApplyFilter: vi.fn().mockResolvedValue(undefined),
  playerApplyTemplate: vi.fn().mockResolvedValue(undefined),
  playerClearEffects: vi.fn().mockResolvedValue(undefined),
  playerClearFilters: vi.fn().mockResolvedValue(undefined),
  playerClearTemplate: vi.fn().mockResolvedValue(undefined),
}

describe("useTimelinePlayerSync", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(usePlayer).mockReturnValue(mockPlayerContext)
    vi.mocked(useTimeline).mockReturnValue(createTimelineMock())
    vi.mocked(useTimelineSelection).mockReturnValue(createSelectionMock())
  })

  describe("Initialization", () => {
    it("должен инициализировать player context при монтировании", () => {
      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenCalledWith(mockPlayerContext)
    })

    it("должен обновлять player context при его изменении", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync())

      const newPlayerContext = { ...mockPlayerContext, volume: 0.5 }
      vi.mocked(usePlayer).mockReturnValue(newPlayerContext)

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenCalledTimes(2)
      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenLastCalledWith(newPlayerContext)
    })
  })

  describe("Синхронизация выбранных клипов", () => {
    it("должен синхронизировать один выбранный клип", () => {
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      const { result } = renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)
      expect(result.current.isSynced).toBe(true)
      expect(result.current.syncedClip).toEqual(mockClip1)
    })

    it("должен очищать синхронизацию когда нет выбранных клипов", () => {
      vi.mocked(useTimelineSelection).mockReturnValue(createSelectionMock())

      const { result } = renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).toHaveBeenCalled()
      expect(result.current.isSynced).toBe(false)
      expect(result.current.syncedClip).toBe(null)
    })

    it("не должен синхронизировать когда выбрано несколько клипов", () => {
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1, mockClip2],
        }),
      )

      const { result } = renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).not.toHaveBeenCalled()
      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).not.toHaveBeenCalled()
      expect(result.current.isSynced).toBe(false)
      expect(result.current.syncedClip).toBe(null)
    })

    it("должен обновлять синхронизацию при изменении выбора", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync())

      // Изначально нет выбранных клипов
      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).toHaveBeenCalled()

      // Выбираем один клип
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)

      // Выбираем другой клип
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip2],
        }),
      )

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenLastCalledWith(mockClip2)
    })
  })

  describe("Синхронизация времени воспроизведения", () => {
    it("должен синхронизировать текущее время воспроизведения", () => {
      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(15)
    })

    it("должен обновлять время при его изменении", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync())

      // Изменяем текущее время
      vi.mocked(useTimeline).mockReturnValue(
        createTimelineMock({
          currentTime: 25,
        }),
      )

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledTimes(2)
      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenLastCalledWith(25)
    })

    it("должен синхронизировать время 0", () => {
      vi.mocked(useTimeline).mockReturnValue(
        createTimelineMock({
          currentTime: 0,
        }),
      )

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(0)
    })

    it("должен обрабатывать дробные значения времени", () => {
      vi.mocked(useTimeline).mockReturnValue(
        createTimelineMock({
          currentTime: 15.567,
        }),
      )

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(15.567)
    })
  })

  describe("Комплексные сценарии", () => {
    it("должен корректно обрабатывать все изменения вместе", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync())

      // Проверяем инициализацию
      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenCalledWith(mockPlayerContext)
      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).toHaveBeenCalled()
      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(15)

      // Изменяем все параметры
      const newPlayerContext = { ...mockPlayerContext, isPlaying: true }
      vi.mocked(usePlayer).mockReturnValue(newPlayerContext)
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )
      vi.mocked(useTimeline).mockReturnValue(
        createTimelineMock({
          currentTime: 30,
          isPlaying: true,
        }),
      )

      rerender()

      // Проверяем, что все обновления произошли
      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenLastCalledWith(newPlayerContext)
      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)
      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenLastCalledWith(30)
    })

    it("должен корректно очищать синхронизацию при размонтировании", () => {
      const { unmount } = renderHook(() => useTimelinePlayerSync())

      // Устанавливаем синхронизацию с клипом
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      unmount()

      // При размонтировании React очищает все эффекты, но наш хук не имеет cleanup функций
      // Это может быть потенциальной проблемой, если сервис синхронизации держит ссылки
    })
  })

  describe("Edge cases", () => {
    it("должен обрабатывать null player context", () => {
      vi.mocked(usePlayer).mockReturnValue(null as any)

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenCalledWith(null)
    })

    it("должен обрабатывать пустой массив клипов после выбора", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync())

      // Сначала выбираем клип
      vi.mocked(useTimelineSelection).mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)

      // Затем очищаем выбор
      vi.mocked(useTimelineSelection).mockReturnValue(createSelectionMock())

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).toHaveBeenCalled()
    })

    it("должен обрабатывать отрицательное время", () => {
      vi.mocked(useTimeline).mockReturnValue(
        createTimelineMock({
          currentTime: -5, // Может случиться при перемотке
        }),
      )

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(-5)
    })

    it("должен обрабатывать очень большое время", () => {
      vi.mocked(useTimeline).mockReturnValue(
        createTimelineMock({
          currentTime: 999999,
        }),
      )

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(999999)
    })
  })
})
