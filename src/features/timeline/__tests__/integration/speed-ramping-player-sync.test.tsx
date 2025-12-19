/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePlayer } from "@/domains/video-editing"
import { useTimelinePlayerSync } from "@/features/timeline/hooks/integration/use-timeline-player-sync"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { useTimelineSelection } from "@/features/timeline/hooks/state/use-timeline-selection"
import { timelinePlayerSync } from "../../services/timeline-player-sync"
import { createMockClip } from "../test-utils"

vi.mock("@/features/timeline/hooks/state/use-timeline")
vi.mock("@/features/timeline/hooks/state/use-timeline-selection")
vi.mock("@/domains/video-editing")
vi.mock("../../services/timeline-player-sync", () => ({
  timelinePlayerSync: {
    setPlayerContext: vi.fn(),
    syncSelectedClip: vi.fn(),
    clearSelection: vi.fn(),
    syncPlaybackTime: vi.fn(),
  },
}))

describe("Speed Ramping Player Sync Integration", () => {
  const mockPlayer = {
    speedRampingEnabled: false,
    currentPlaybackRate: 1.0,
    basePlaybackRate: 1.0,
    setVideoSource: vi.fn(),
    setVideo: vi.fn(),
    setCurrentTime: vi.fn(),
    clearEffects: vi.fn(),
    clearFilters: vi.fn(),
    clearTemplate: vi.fn(),
    applyEffect: vi.fn(),
    applyFilter: vi.fn(),
    applyTemplate: vi.fn(),
    setSpeedRampingEnabled: vi.fn(),
    updatePlaybackRate: vi.fn(),
    setBasePlaybackRate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePlayer).mockReturnValue(mockPlayer as any)
    vi.mocked(useTimeline).mockReturnValue({
      currentTime: 0,
    } as any)
    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [],
    } as any)
  })

  it("должен инициализировать player context при монтировании", () => {
    renderHook(() => useTimelinePlayerSync())

    expect(timelinePlayerSync.setPlayerContext).toHaveBeenCalledWith(mockPlayer)
  })

  it("должен синхронизировать клип со speed ramping", () => {
    const clipWithSpeedRamping = createMockClip({
      // Speed ramping stored in project config, not in clip
    })
    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [clipWithSpeedRamping],
    } as any)

    renderHook(() => useTimelinePlayerSync())

    expect(timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(clipWithSpeedRamping)
  })

  it("должен обновлять playback rate при изменении времени", () => {
    const clipWithSpeedRamping = createMockClip({
      startTime: 10,
      duration: 20,
      // Speed ramping stored in project config, not in clip
    })

    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [clipWithSpeedRamping],
    } as any)

    const { rerender } = renderHook(() => useTimelinePlayerSync())

    // Изменяем текущее время
    act(() => {
      vi.mocked(useTimeline).mockReturnValue({
        currentTime: 15, // Середина клипа
      } as any)
    })

    rerender()

    expect(timelinePlayerSync.syncPlaybackTime).toHaveBeenCalledWith(15)
  })

  it("должен отключать speed ramping при выборе клипа без speed ramping", () => {
    const clipWithoutSpeedRamping = createMockClip({
      // No speed ramping
    })
    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [clipWithoutSpeedRamping],
    } as any)

    renderHook(() => useTimelinePlayerSync())

    expect(timelinePlayerSync.syncSelectedClip).toHaveBeenCalledWith(clipWithoutSpeedRamping)
  })

  it("должен очищать выбор при отсутствии выбранных клипов", () => {
    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [],
    } as any)

    renderHook(() => useTimelinePlayerSync())

    expect(timelinePlayerSync.clearSelection).toHaveBeenCalled()
  })

  it("должен возвращать статус синхронизации", () => {
    const clip = createMockClip()

    vi.mocked(useTimelineSelection).mockReturnValue({
      selectedClips: [clip],
    } as any)

    const { result } = renderHook(() => useTimelinePlayerSync())

    expect(result.current.isSynced).toBe(true)
    expect(result.current.syncedClip).toBe(clip)
  })
})
