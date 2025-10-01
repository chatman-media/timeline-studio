import { renderHook } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"

// Мокаем backend-sync ДО импорта компонентов
const mockPlayerState = {
  previewMedia: null as MediaFile | null,
  videoSource: "browser" as "browser" | "timeline",
}

vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: () => ({
    onStateChange: vi.fn(() => () => {}),
    sendCommand: vi.fn(),
    executeCommand: vi.fn().mockResolvedValue({ success: true }),
    onEvent: vi.fn(() => () => {}),
  }),
}))

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: vi.fn(() => ({
    playerVolume: 100,
    handlePlayerVolumeChange: vi.fn(),
  })),
}))

// Мокаем usePlayer для возврата нужного состояния
vi.mock("@/features/video-player/services/player-provider", async () => {
  const actual = await vi.importActual("@/features/video-player/services/player-provider")
  return {
    ...actual,
    usePlayer: () => ({
      previewMedia: mockPlayerState.previewMedia,
      videoSource: mockPlayerState.videoSource,
      // Добавляем остальные необходимые поля
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1,
      volume: 1,
      duration: 0,
      isVideoLoading: false,
      isVideoReady: false,
      appliedEffects: [],
      appliedFilters: [],
      appliedTemplate: null,
    }),
  }
})

// Импортируем после определения моков
import { useVideoSelection } from "@/features/video-player/hooks/use-video-selection"
import { PlayerProvider } from "@/features/video-player/services/player-provider"

// Типы для тестирования
const createMockMediaFile = (name: string): MediaFile => ({
  id: `file-${name}`,
  name,
  path: `/test/${name}`,
  isVideo: true,
  isAudio: false,
  isImage: false,
})

describe("useVideoSelection", () => {
  const mockSelectedFiles = [
    createMockMediaFile("video1.mp4"),
    createMockMediaFile("video2.mp4"),
    createMockMediaFile("video3.mp4"),
  ]

  beforeEach(() => {
    // Reset context before each test
    mockPlayerState.previewMedia = null
    mockPlayerState.videoSource = "browser"
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(PlayerProvider, null, children)
  }

  describe("getVideosForPreview", () => {
    it("should return previewMedia when source is browser and previewMedia exists", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[0]
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const videos = result.current.getVideosForPreview()

      expect(videos).toEqual([mockSelectedFiles[0]])
    })

    it("should return empty array when source is browser and no previewMedia", () => {
      mockPlayerState.previewMedia = null
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const videos = result.current.getVideosForPreview()

      expect(videos).toEqual([])
    })

    it("should return previewMedia when source is timeline and previewMedia exists", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[0]
      mockPlayerState.videoSource = "timeline"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const videos = result.current.getVideosForPreview()

      expect(videos).toEqual([mockSelectedFiles[0]])
    })

    it("should respect count parameter when getting videos", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[0]
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      // Request 2 videos but only have 1 previewMedia
      const videos = result.current.getVideosForPreview(2)

      expect(videos).toEqual([mockSelectedFiles[0]])
    })
  })

  describe("getCurrentVideo", () => {
    it("should return previewMedia when it exists", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[0]
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const video = result.current.getCurrentVideo()

      expect(video).toEqual(mockSelectedFiles[0])
    })

    it("should return previewMedia from timeline source", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[1]
      mockPlayerState.videoSource = "timeline"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const video = result.current.getCurrentVideo()

      expect(video).toEqual(mockSelectedFiles[1])
    })

    it("should return null when no previewMedia is available", () => {
      mockPlayerState.previewMedia = null
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      const video = result.current.getCurrentVideo()

      expect(video).toBeNull()
    })
  })

  describe("hasEnoughVideos", () => {
    it("should return true when enough videos are available", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[0]
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.hasEnoughVideos(1)).toBe(true)
      expect(result.current.hasEnoughVideos(2)).toBe(false) // Only 1 video available
    })

    it("should return false when no videos are available", () => {
      mockPlayerState.previewMedia = null
      mockPlayerState.videoSource = "browser"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.hasEnoughVideos(1)).toBe(false)
      expect(result.current.hasEnoughVideos(2)).toBe(false)
    })

    it("should work with timeline source", () => {
      mockPlayerState.previewMedia = mockSelectedFiles[0]
      mockPlayerState.videoSource = "timeline"

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.hasEnoughVideos(1)).toBe(true)
      expect(result.current.hasEnoughVideos(2)).toBe(false)
    })
  })

  describe("integration tests", () => {
    it("should handle switching between browser and timeline sources", () => {
      // Set initial state
      mockPlayerState.videoSource = "browser"
      mockPlayerState.previewMedia = mockSelectedFiles[0]

      const { result } = renderHook(() => useVideoSelection(), { wrapper })

      expect(result.current.getCurrentVideo()).toEqual(mockSelectedFiles[0])

      // Switch to timeline source
      mockPlayerState.videoSource = "timeline"
      mockPlayerState.previewMedia = mockSelectedFiles[1]

      // Need to re-render to pick up context changes
      const { result: result2 } = renderHook(() => useVideoSelection(), {
        wrapper,
      })

      expect(result2.current.getCurrentVideo()).toEqual(mockSelectedFiles[1])
    })
  })
})
