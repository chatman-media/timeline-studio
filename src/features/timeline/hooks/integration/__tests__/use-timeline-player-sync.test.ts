/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies - mocks MUST be before imports and can't reference variables
vi.mock("@/domains/video-editing", () => ({
  usePlayer: vi.fn(),
  // Include provider mocks needed by TimelineProviders
  PlayerProvider: ({ children }: { children: any }) => children,
  ResourcesProvider: ({ children }: { children: any }) => children,
  TimelineMarkersProvider: ({ children }: { children: any }) => children,
  TimelineProvider: ({ children }: { children: any }) => children,
}))

vi.mock("../../state/use-timeline", () => ({
  useTimeline: vi.fn(),
}))

vi.mock("../../state/use-timeline-selection", () => ({
  useTimelineSelection: vi.fn(),
}))

vi.mock("../../../services/timeline-player-sync", () => ({
  timelinePlayerSync: {
    setPlayerContext: vi.fn(),
    syncSelectedClip: vi.fn(),
    clearSelection: vi.fn(),
    syncPlaybackTime: vi.fn(),
  },
}))

import { usePlayer } from "@/domains/video-editing"
import { TimelineProviders } from "@/test/test-utils"
import { createMockClip } from "../../../__mocks__/test-factories"
import * as timelinePlayerSyncModule from "../../../services/timeline-player-sync"
import { useTimeline } from "../../state/use-timeline"
import { useTimelineSelection } from "../../state/use-timeline-selection"
import { useTimelinePlayerSync } from "../use-timeline-player-sync"

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
  id: "clip-2",
  trackId: "track-1",
  mediaId: "source-2",
  startTime: 30,
  duration: 15,
  offset: 0,
  effects: [],
  speed: 1,
  volume: 1,
  opacity: 1,
  filters: [],
  transitions: [],
})

// Helper to create timeline mock
function createTimelineMock(overrides = {}) {
  return {
    currentTime: 0,
    duration: 100,
    isPlaying: false,
    seek: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    setDuration: vi.fn(),
    ...overrides,
  }
}

// Helper to create selection mock
function createSelectionMock(overrides = {}) {
  return {
    selectedClips: [],
    selectedTracks: [],
    selectedSections: [],
    selectClip: vi.fn(),
    selectTrack: vi.fn(),
    selectSection: vi.fn(),
    clearSelection: vi.fn(),
    ...overrides,
  }
}

// Mock player context
const mockPlayerContext = {
  // State
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  volume: 1,
  playbackRate: 1,
  isLoading: false,
  isReady: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isResizableMode: false,
  currentVideo: null,
  videoSource: null,
  previewMedia: null,
  appliedEffects: [],
  appliedFilters: [],
  currentTemplate: null,
  speedRampingEnabled: false,
  basePlaybackRate: 1,

  // Settings
  renderSettings: {
    codec: "h264",
    quality: 80,
    fps: 30,
    subtitle_font_size: 30,
    subtitle_color: "#FFFFFF",
    subtitle_background_color: "#000000",
    subtitle_align_x: "center",
    subtitle_align_y: "bottom",
    bitrate: 5000,
    use_gpu: true,
    gpu_encoder: "h264",
  },

  prerenderSettings: {
    enabled: false,
    quality: 80,
    segmentDuration: 10,
    applyEffects: true,
    autoPrerender: false,
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
  // Get references to the mocked functions
  const mockUsePlayer = usePlayer as unknown as ReturnType<typeof vi.fn>
  const mockUseTimeline = useTimeline as unknown as ReturnType<typeof vi.fn>
  const mockUseTimelineSelection = useTimelineSelection as unknown as ReturnType<typeof vi.fn>
  const mockTimelinePlayerSyncService = timelinePlayerSyncModule.timelinePlayerSync

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUsePlayer.mockReturnValue(mockPlayerContext)
    mockUseTimeline.mockReturnValue(createTimelineMock())
    mockUseTimelineSelection.mockReturnValue(createSelectionMock())
  })

  describe("Initialization", () => {
    it("должен инициализировать player context при монтировании", () => {
      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.setPlayerContext).toHaveBeenCalledWith(mockPlayerContext)
    })

    it("должен обновлять player context при его изменении", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      const newPlayerContext = { ...mockPlayerContext, volume: 0.5 }
      mockUsePlayer.mockReturnValue(newPlayerContext)

      rerender()

      expect(mockTimelinePlayerSyncService.setPlayerContext).toHaveBeenCalledTimes(2)
      expect(mockTimelinePlayerSyncService.setPlayerContext).toHaveBeenLastCalledWith(newPlayerContext)
    })
  })

  describe("Синхронизация выбранных клипов", () => {
    it("должен синхронизировать один выбранный клип", () => {
      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.syncSelectedClip).toHaveBeenCalledWith(mockClip1)
    })

    it("должен очищать синхронизацию когда нет выбранных клипов", () => {
      mockUseTimelineSelection.mockReturnValue(createSelectionMock())

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.clearSelection).toHaveBeenCalled()
    })

    it("не должен синхронизировать когда выбрано несколько клипов", () => {
      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1, mockClip2],
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      // При выборе нескольких клипов хук не делает ничего - ни sync, ни clear
      expect(mockTimelinePlayerSyncService.syncSelectedClip).not.toHaveBeenCalled()
      expect(mockTimelinePlayerSyncService.clearSelection).not.toHaveBeenCalled()
    })

    it("должен обновлять синхронизацию при изменении выбора", () => {
      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      const { rerender } = renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip2],
        }),
      )

      rerender()

      expect(mockTimelinePlayerSyncService.syncSelectedClip).toHaveBeenCalledTimes(2)
      expect(mockTimelinePlayerSyncService.syncSelectedClip).toHaveBeenLastCalledWith(mockClip2)
    })
  })

  describe("Синхронизация времени воспроизведения", () => {
    it("должен синхронизировать текущее время воспроизведения", () => {
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: 42.5,
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenCalledWith(42.5)
    })

    it("должен обновлять время при его изменении", () => {
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: 10,
        }),
      )

      const { rerender } = renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: 20,
        }),
      )

      rerender()

      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenCalledTimes(2)
      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenLastCalledWith(20)
    })
  })

  describe("Комплексная синхронизация", () => {
    it("должен синхронизировать все состояния при монтировании", () => {
      mockUsePlayer.mockReturnValue(mockPlayerContext)
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: 15,
        }),
      )
      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip1],
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.setPlayerContext).toHaveBeenCalledWith(mockPlayerContext)
      expect(mockTimelinePlayerSyncService.syncSelectedClip).toHaveBeenCalledWith(mockClip1)
      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenCalledWith(15)
    })

    it("должен обновлять все состояния при их изменении", () => {
      const { rerender } = renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      const newPlayerContext = { ...mockPlayerContext, volume: 0.8 }
      mockUsePlayer.mockReturnValue(newPlayerContext)
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: 25,
        }),
      )
      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [mockClip2],
        }),
      )

      rerender()

      expect(mockTimelinePlayerSyncService.setPlayerContext).toHaveBeenLastCalledWith(newPlayerContext)
      expect(mockTimelinePlayerSyncService.syncSelectedClip).toHaveBeenLastCalledWith(mockClip2)
      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenLastCalledWith(25)
    })
  })

  describe("Edge cases", () => {
    it("должен обрабатывать null player context", () => {
      mockUsePlayer.mockReturnValue(null as any)

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.setPlayerContext).toHaveBeenCalledWith(null)
    })

    it("должен обрабатывать пустой массив выбранных клипов", () => {
      mockUseTimelineSelection.mockReturnValue(
        createSelectionMock({
          selectedClips: [],
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.clearSelection).toHaveBeenCalled()
      expect(mockTimelinePlayerSyncService.syncSelectedClip).not.toHaveBeenCalled()
    })

    it("должен обрабатывать нулевое время", () => {
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: 0,
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenCalledWith(0)
    })

    it("должен обрабатывать отрицательное время", () => {
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: -1,
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenCalledWith(-1)
    })

    it("должен обрабатывать очень большое время", () => {
      mockUseTimeline.mockReturnValue(
        createTimelineMock({
          currentTime: Number.MAX_SAFE_INTEGER,
        }),
      )

      renderHook(() => useTimelinePlayerSync(), { wrapper: TimelineProviders })

      expect(mockTimelinePlayerSyncService.syncPlaybackTime).toHaveBeenCalledWith(Number.MAX_SAFE_INTEGER)
    })
  })
})
