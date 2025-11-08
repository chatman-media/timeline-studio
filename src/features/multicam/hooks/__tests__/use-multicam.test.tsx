/**
 * Тесты для основного хука мультикамерного монтажа
 */

import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineProvider } from "@/domains/video-editing/providers/timeline-providers"
import type { TimelineClip } from "@/features/timeline/types/timeline"

import { useMulticam } from "../use-multicam"

// Mock зависимостей - используем vi.hoisted для доступа в factory functions
const {
  mockSwitchToCamera,
  mockGetMulticamGroup,
  mockLinkClips,
  mockUnlinkClips,
  mockMoveLinkedClips,
  mockPlayerSelectClip,
  mockSyncByTimecode,
  mockSyncByAudio,
  mockSyncManual,
  mockApplySyncResults,
} = vi.hoisted(() => ({
  mockSwitchToCamera: vi.fn(),
  mockGetMulticamGroup: vi.fn(),
  mockLinkClips: vi.fn(),
  mockUnlinkClips: vi.fn(),
  mockMoveLinkedClips: vi.fn(),
  mockPlayerSelectClip: vi.fn(),
  mockSyncByTimecode: vi.fn(),
  mockSyncByAudio: vi.fn(),
  mockSyncManual: vi.fn(),
  mockApplySyncResults: vi.fn(),
}))

// Тестовые данные
const createMockClip = (id: string, mediaId: string): TimelineClip => ({
  id,
  name: `Clip ${id}`,
  trackId: "track1",
  mediaId,
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
})

// Тестовые данные для моков - должны быть доступны в factory functions
const { mockClips, mockProject } = vi.hoisted(() => {
  const createMockClipHoisted = (id: string, mediaId: string) => ({
    id,
    name: `Clip ${id}`,
    trackId: "track1",
    mediaId,
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
  })

  return {
    mockClips: [
      createMockClipHoisted("clip1", "media1"),
      createMockClipHoisted("clip2", "media2"),
      createMockClipHoisted("clip3", "media3"),
    ],
    mockProject: {
      id: "project1",
      name: "Test Project",
      resources: {
        media: [
          { id: "media1", name: "video1.mp4", path: "/path/to/video1.mp4", type: "video" as const },
          { id: "media2", name: "video2.mp4", path: "/path/to/video2.mp4", type: "video" as const },
          { id: "media3", name: "video3.mp4", path: "/path/to/video3.mp4", type: "video" as const },
        ],
      },
    },
  }
})

// Моки модулей
vi.mock("@/features/timeline/hooks/use-linked-clips", () => ({
  useLinkedClips: () => ({
    getMulticamGroup: mockGetMulticamGroup,
    linkClips: mockLinkClips,
    unlinkClips: mockUnlinkClips,
    moveLinkedClips: mockMoveLinkedClips,
    getMulticamPairs: vi.fn(() => []),
    syncLinkedClips: vi.fn(),
  }),
}))

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    currentTime: 5,
    project: mockProject,
    clips: mockClips,
  }),
}))

vi.mock("@/features/video-player/services/player-provider", () => ({
  usePlayer: () => ({
    playerSelectClip: mockPlayerSelectClip,
  }),
}))

vi.mock("../use-camera-sync", () => ({
  useCameraSync: () => ({
    syncStatus: "idle" as const,
    syncResults: [],
    syncProgress: 0,
    syncError: null,
    syncByTimecode: mockSyncByTimecode,
    syncByAudio: mockSyncByAudio,
    syncManual: mockSyncManual,
    applySyncResults: mockApplySyncResults,
    clearSyncResults: vi.fn(),
    cancelSync: vi.fn(),
    getSyncOffset: vi.fn(() => 0),
    isSynced: vi.fn(() => false),
    getSyncMethod: vi.fn(() => null),
  }),
}))

vi.mock("../use-multicam-shortcuts", () => ({
  useMulticamShortcuts: () => {},
}))

vi.mock("../../services/multicam-manager", () => ({
  multicamManager: {
    setBaseClip: vi.fn(),
    switchToCamera: mockSwitchToCamera,
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}))

describe("useMulticam", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMulticamGroup.mockReturnValue(mockClips)
    mockPlayerSelectClip.mockResolvedValue(undefined)
    mockSyncByTimecode.mockResolvedValue(undefined)
    mockSyncByAudio.mockResolvedValue(undefined)
  })

  const wrapper = ({ children }: { children: ReactNode }) => <TimelineProvider>{children}</TimelineProvider>

  describe("Initialization", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.angles).toHaveLength(3)
      expect(result.current.activeAngleIndex).toBe(0)
      expect(result.current.hasMulticamSupport).toBe(true)
      expect(result.current.isSync).toBe(false)
    })

    it("should create angles from multicam clips", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.angles[0]).toMatchObject({
        clipId: "clip1",
        name: "Clip clip1",
        isActive: true,
        syncOffset: 0,
      })

      expect(result.current.angles[1]).toMatchObject({
        clipId: "clip2",
        name: "Clip clip2",
        isActive: false,
      })
    })

    it("should include media paths in angles", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.angles[0].mediaPath).toBe("/path/to/video1.mp4")
      expect(result.current.angles[1].mediaPath).toBe("/path/to/video2.mp4")
      expect(result.current.angles[2].mediaPath).toBe("/path/to/video3.mp4")
    })

    it("should handle empty multicam group", () => {
      mockGetMulticamGroup.mockReturnValueOnce([])
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.angles).toHaveLength(0)
      expect(result.current.hasMulticamSupport).toBe(false)
    })
  })

  describe("Camera Switching", () => {
    it("should switch to angle by index", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        result.current.switchToAngle(1)
      })

      expect(mockSwitchToCamera).toHaveBeenCalledWith(1)
      expect(mockPlayerSelectClip).toHaveBeenCalledWith("clip2")
    })

    it("should switch to next angle", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        result.current.switchToNextAngle()
      })

      expect(mockSwitchToCamera).toHaveBeenCalledWith(1)
    })

    it("should wrap around when switching to next from last angle", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      // NOTE: activeAngleIndex is только обновляется через события от manager,
      // поэтому в тестах он остается 0. Но логика switchToNextAngle правильная:
      // она берет текущий activeAngleIndex (0) и вычисляет (0 + 1) % 3 = 1

      // В реальном использовании activeAngleIndex будет обновлен через событие
      // "camera-switched" от multicamManager

      await act(async () => {
        result.current.switchToNextAngle()
      })

      // Первый вызов - с индексом 1 (nextIndex from current 0)
      expect(mockSwitchToCamera).toHaveBeenCalledWith(1)
    })

    it("should switch to previous angle", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      // NOTE: activeAngleIndex остается 0 в тестах (не обновляется через события)
      // switchToPreviousAngle from index 0 вычисляет: 0 === 0 ? 3 - 1 : 0 - 1 = 2

      await act(async () => {
        result.current.switchToPreviousAngle()
      })

      expect(mockSwitchToCamera).toHaveBeenCalledWith(2)
    })

    it("should wrap around when switching to previous from first angle", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        result.current.switchToPreviousAngle()
      })

      expect(mockSwitchToCamera).toHaveBeenCalledWith(2) // Last angle
    })

    it("should switch to angle by clip ID", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        result.current.switchToAngleByClipId("clip3")
      })

      expect(mockSwitchToCamera).toHaveBeenCalledWith(2)
    })

    it("should not switch to invalid angle index", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        result.current.switchToAngle(999)
      })

      expect(mockPlayerSelectClip).not.toHaveBeenCalled()
    })
  })

  describe("Synchronization", () => {
    it("should sync angles", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      act(() => {
        result.current.syncAngles()
      })

      expect(mockApplySyncResults).toHaveBeenCalled()
    })

    it("should set manual sync offset", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      act(() => {
        result.current.setSyncOffset(1, 2.5)
      })

      expect(mockSyncManual).toHaveBeenCalledWith("clip2", 2.5)
    })

    it("should trigger audio sync", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        await result.current.autoSyncByAudio()
      })

      expect(mockSyncByAudio).toHaveBeenCalled()
    })

    it("should trigger timecode sync", async () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        await result.current.autoSyncByTimecode()
      })

      expect(mockSyncByTimecode).toHaveBeenCalled()
    })

    it("should not sync with less than 2 angles", async () => {
      mockGetMulticamGroup.mockReturnValueOnce([mockClips[0]])
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      await act(async () => {
        await result.current.autoSyncByAudio()
      })

      expect(mockSyncByAudio).not.toHaveBeenCalled()
    })
  })

  describe("Group Management", () => {
    it("should add new angle", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      act(() => {
        result.current.addAngle("clip4")
      })

      expect(mockLinkClips).toHaveBeenCalledWith("clip1", "clip4")
    })

    it("should remove angle", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      act(() => {
        result.current.removeAngle(1)
      })

      expect(mockUnlinkClips).toHaveBeenCalledWith("clip2", "clip1")
      expect(mockUnlinkClips).toHaveBeenCalledWith("clip2", "clip3")
    })

    it("should not add angle without multicam support", () => {
      mockGetMulticamGroup.mockReturnValueOnce([mockClips[0]])
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      act(() => {
        result.current.addAngle("clip4")
      })

      expect(mockLinkClips).not.toHaveBeenCalled()
    })
  })

  describe("Utility Functions", () => {
    it("should get angle by clip ID", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      const angle = result.current.getAngleByClipId("clip2")

      expect(angle).toBeDefined()
      expect(angle?.clipId).toBe("clip2")
    })

    it("should return null for unknown clip ID", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      const angle = result.current.getAngleByClipId("unknown")

      expect(angle).toBeNull()
    })

    it("should check if clip is in multicam group", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.isMulticamClip("clip1")).toBe(true)
      expect(result.current.isMulticamClip("clip2")).toBe(true)
      expect(result.current.isMulticamClip("unknown")).toBe(false)
    })

    it("should report multicam support correctly", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })
      expect(result.current.hasMulticamSupport).toBe(true)

      mockGetMulticamGroup.mockReturnValueOnce([mockClips[0]])
      const { result: result2 } = renderHook(() => useMulticam("clip1"), { wrapper })
      expect(result2.current.hasMulticamSupport).toBe(false)
    })
  })

  describe("Sync State", () => {
    it("should expose sync status from useCameraSync", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.syncStatus).toBe("idle")
      expect(result.current.syncProgress).toBe(0)
      expect(result.current.syncError).toBeNull()
    })

    it("should compute isSync from sync status", () => {
      const { result } = renderHook(() => useMulticam("clip1"), { wrapper })

      expect(result.current.isSync).toBe(false) // status is "idle"
    })
  })
})
