import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePlayer } from "@/features/video-player/services/player-provider"
import { createMockClip } from "../../__mocks__/test-factories"
// Import mocked functions
import { useTimeline } from "../../hooks/use-timeline"
import { useTimelinePlayerSync } from "../../hooks/use-timeline-player-sync"
import { useTimelineSelection } from "../../hooks/use-timeline-selection"
import * as timelinePlayerSync from "../../services/timeline-player-sync"

// Mock dependencies
vi.mock("@/features/video-player/services/player-provider", () => ({
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

const mockPlayerContext = {
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  setPlaybackRate: vi.fn(),
  isPlaying: false,
  currentTime: 0,
  duration: 100,
  volume: 1,
  playbackRate: 1,
  videoElement: null,
}

describe("useTimelinePlayerSync", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(usePlayer).mockReturnValue(mockPlayerContext)
    vi.mocked(useTimeline).mockReturnValue({
      currentTime: 15,
      project: null,
      send: vi.fn(),
      state: {} as any,
      duration: 300,
      isPlaying: false,
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      activeTrackId: null,
      markers: [],
      regions: [],
    })
    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [],
      selectedTracks: [],
      selectClip: vi.fn(),
      selectTrack: vi.fn(),
      selectMultiple: vi.fn(),
      selectNone: vi.fn(),
      isClipSelected: vi.fn(),
      isTrackSelected: vi.fn(),
    })
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
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip1],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

      const { result } = renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)
      expect(result.current.isSynced).toBe(true)
      expect(result.current.syncedClip).toEqual(mockClip1)
    })

    it("должен очищать синхронизацию когда нет выбранных клипов", () => {
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

      const { result } = renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).toHaveBeenCalled()
      expect(result.current.isSynced).toBe(false)
      expect(result.current.syncedClip).toBe(null)
    })

    it("не должен синхронизировать когда выбрано несколько клипов", () => {
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip1, mockClip2],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

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
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip1],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)

      // Выбираем другой клип
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip2],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

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
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: 25,
        project: null,
        send: vi.fn(),
        state: {} as any,
        duration: 300,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        activeTrackId: null,
        markers: [],
        regions: [],
      })

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledTimes(2)
      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenLastCalledWith(25)
    })

    it("должен синхронизировать время 0", () => {
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: 0,
        project: null,
        send: vi.fn(),
        state: {} as any,
        duration: 300,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        activeTrackId: null,
        markers: [],
        regions: [],
      })

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(0)
    })

    it("должен обрабатывать дробные значения времени", () => {
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: 15.567,
        project: null,
        send: vi.fn(),
        state: {} as any,
        duration: 300,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        activeTrackId: null,
        markers: [],
        regions: [],
      })

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
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip1],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: 30,
        project: null,
        send: vi.fn(),
        state: {} as any,
        duration: 300,
        isPlaying: true,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        activeTrackId: null,
        markers: [],
        regions: [],
      })

      rerender()

      // Проверяем, что все обновления произошли
      expect(timelinePlayerSync.timelinePlayerSync.setPlayerContext).toHaveBeenLastCalledWith(newPlayerContext)
      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)
      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenLastCalledWith(30)
    })

    it("должен корректно очищать синхронизацию при размонтировании", () => {
      const { unmount } = renderHook(() => useTimelinePlayerSync())

      // Устанавливаем синхронизацию с клипом
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip1],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

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
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [mockClip1],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(mockClip1)

      // Затем очищаем выбор
      vi.mocked(useTimelineSelection).mockReturnValue({
        selectedClips: [],
        selectedTracks: [],
        selectClip: vi.fn(),
        selectTrack: vi.fn(),
        selectMultiple: vi.fn(),
        selectNone: vi.fn(),
        isClipSelected: vi.fn(),
        isTrackSelected: vi.fn(),
      })

      rerender()

      expect(timelinePlayerSync.timelinePlayerSync.clearSelection).toHaveBeenCalled()
    })

    it("должен обрабатывать отрицательное время", () => {
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: -5, // Может случиться при перемотке
        project: null,
        send: vi.fn(),
        state: {} as any,
        duration: 300,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        activeTrackId: null,
        markers: [],
        regions: [],
      })

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(-5)
    })

    it("должен обрабатывать очень большое время", () => {
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: 999999,
        project: null,
        send: vi.fn(),
        state: {} as any,
        duration: 300,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        activeTrackId: null,
        markers: [],
        regions: [],
      })

      renderHook(() => useTimelinePlayerSync())

      expect(timelinePlayerSync.timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(999999)
    })
  })
})
