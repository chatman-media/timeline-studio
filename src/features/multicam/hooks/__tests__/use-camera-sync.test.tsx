/**
 * Тесты для хука управления синхронизацией камер
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineProvider } from "@/domains/video-editing/timeline-providers"

import { useCameraSync } from "../use-camera-sync"

// Мокаем зависимости
vi.mock("@/features/timeline/hooks/use-linked-clips", () => ({
  useLinkedClips: () => ({
    getMulticamGroup: vi.fn(() => [
      {
        id: "clip1",
        name: "Clip clip1",
        trackId: "track1",
        mediaId: "media-clip1",
        startTime: 0,
        duration: 10,
        mediaStartTime: 0,
        mediaEndTime: 10,
        offset: 0,
        speed: 1,
        volume: 1,
        opacity: 1,
        isReversed: false,
        isSelected: false,
        isLocked: false,
        effects: [],
        filters: [],
        transitions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "clip2",
        name: "Clip clip2",
        trackId: "track2",
        mediaId: "media-clip2",
        startTime: 0,
        duration: 10,
        mediaStartTime: 0,
        mediaEndTime: 10,
        offset: 0,
        speed: 1,
        volume: 1,
        opacity: 1,
        isReversed: false,
        isSelected: false,
        isLocked: false,
        effects: [],
        filters: [],
        transitions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    moveLinkedClips: vi.fn(),
  }),
}))

vi.mock("@/domains/project-management/hooks/use-media-files", () => ({
  useMediaFiles: () => ({
    mediaFiles: [
      {
        id: "media-clip1",
        name: "media-clip1.mp4",
        path: "/media/media-clip1.mp4",
        probeData: {
          streams: [{ index: 0, timecode: "10:00:00:00" }],
          format: {},
        },
      },
      {
        id: "media-clip2",
        name: "media-clip2.mp4",
        path: "/media/media-clip2.mp4",
        probeData: {
          streams: [{ index: 0, timecode: "10:00:05:00" }],
          format: {},
        },
      },
    ],
  }),
}))

vi.mock("../../services/timecode-sync", () => ({
  syncByTimecode: vi.fn(() => [
    {
      clipId: "clip2",
      offset: -5,
      confidence: 1.0,
      method: "timecode" as const,
    },
  ]),
}))

vi.mock("../../services/audio-sync-adapter", () => ({
  syncByAudio: vi.fn(() =>
    Promise.resolve({
      offset: -2.5,
      confidence: 0.85,
    }),
  ),
}))

vi.mock("../../utils/media-mapper", () => ({
  mediaItemsToMediaFiles: vi.fn((items) => items),
}))

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    clips: [
      {
        id: "clip1",
        name: "Clip clip1",
        trackId: "track1",
        mediaId: "media-clip1",
        startTime: 0,
        duration: 10,
        mediaStartTime: 0,
        mediaEndTime: 10,
        offset: 0,
        speed: 1,
        volume: 1,
        opacity: 1,
        isReversed: false,
        isSelected: false,
        isLocked: false,
        effects: [],
        filters: [],
        transitions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "clip2",
        name: "Clip clip2",
        trackId: "track2",
        mediaId: "media-clip2",
        startTime: 0,
        duration: 10,
        mediaStartTime: 0,
        mediaEndTime: 10,
        offset: 0,
        speed: 1,
        volume: 1,
        opacity: 1,
        isReversed: false,
        isSelected: false,
        isLocked: false,
        effects: [],
        filters: [],
        transitions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }),
}))

describe("useCameraSync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with idle state", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    expect(result.current.syncStatus).toBe("idle")
    expect(result.current.syncResults).toEqual([])
    expect(result.current.syncProgress).toBe(0)
    expect(result.current.syncError).toBeNull()
  })

  it("should sync by timecode", async () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    await act(async () => {
      await result.current.syncByTimecode()
    })

    expect(result.current.syncStatus).toBe("success")
    expect(result.current.syncResults).toHaveLength(1)
    expect(result.current.syncResults[0]).toEqual({
      clipId: "clip2",
      offset: -5,
      confidence: 1.0,
      method: "timecode",
    })
  })

  it("should handle manual sync", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip3", 3.5)
    })

    expect(result.current.syncResults).toHaveLength(1)
    expect(result.current.syncResults[0]).toEqual({
      clipId: "clip3",
      offset: 3.5,
      confidence: 1.0,
      method: "manual",
    })
    expect(result.current.syncStatus).toBe("success")
  })

  it("should update existing sync result on manual sync", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    // Первая синхронизация
    act(() => {
      result.current.syncManual("clip2", 2.0)
    })

    expect(result.current.syncResults).toHaveLength(1)
    expect(result.current.syncResults[0].offset).toBe(2.0)

    // Обновление синхронизации
    act(() => {
      result.current.syncManual("clip2", 3.0)
    })

    expect(result.current.syncResults).toHaveLength(1)
    expect(result.current.syncResults[0].offset).toBe(3.0)
  })

  it("should get sync offset for clip", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip2", 2.5)
    })

    expect(result.current.getSyncOffset("clip2")).toBe(2.5)
    expect(result.current.getSyncOffset("clip3")).toBe(0)
  })

  it("should check if clip is synced", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip2", 1.0)
    })

    expect(result.current.isSynced("clip2")).toBe(true)
    expect(result.current.isSynced("clip3")).toBe(false)
  })

  it("should get sync method for clip", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip2", 1.0)
    })

    expect(result.current.getSyncMethod("clip2")).toBe("manual")
    expect(result.current.getSyncMethod("clip3")).toBeNull()
  })

  it("should clear sync results", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip2", 1.0)
    })

    expect(result.current.syncResults).toHaveLength(1)

    act(() => {
      result.current.clearSyncResults()
    })

    expect(result.current.syncResults).toHaveLength(0)
    expect(result.current.syncStatus).toBe("idle")
    expect(result.current.syncProgress).toBe(0)
    expect(result.current.syncError).toBeNull()
  })

  it("should cancel sync operation", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip2", 1.0)
    })

    act(() => {
      result.current.cancelSync()
    })

    expect(result.current.syncStatus).toBe("idle")
    expect(result.current.syncProgress).toBe(0)
  })

  it("should apply sync results to clips", () => {
    const { result } = renderHook(() => useCameraSync({ baseClipId: "clip1" }), {
      wrapper: TimelineProvider,
    })

    act(() => {
      result.current.syncManual("clip2", 2.5)
    })

    act(() => {
      result.current.applySyncResults()
    })

    // Проверяем что функция не падает
    expect(result.current.syncResults).toHaveLength(1)
  })
})
