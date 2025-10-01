import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media/types/media"

import { VideoPlayer } from "../video-player"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => path),
}))

// Мокаем tauri-utils
vi.mock("@/lib/tauri-utils", () => ({
  convertVideoSrc: vi.fn((path: string) => path),
  isTauriEnvironment: vi.fn(() => false),
}))

// Мокаем AspectRatio компонент
vi.mock("@/components/ui/aspect-ratio", () => ({
  AspectRatio: ({ children, ratio, className }: any) => (
    <div data-testid="aspect-ratio" data-ratio={ratio} className={className}>
      {children}
    </div>
  ),
}))

// Мокаем PlayerControls
vi.mock("../components/player-controls", () => ({
  PlayerControls: ({ currentTime, file }: any) => (
    <div data-testid="player-controls" data-current-time={currentTime} data-file-name={file?.name}>
      Player Controls
    </div>
  ),
}))

// Мокаем хуки Timeline
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: {
      id: "test-project",
      name: "Test Project",
      path: null,
      duration: 0,
      tracks: [],
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
}))

vi.mock("@/features/timeline/hooks/use-timeline-effects", () => ({
  useTimelineEffects: () => ({
    applyEffect: vi.fn(),
    removeEffect: vi.fn(),
    applyFilter: vi.fn(),
    removeFilter: vi.fn(),
    getClipEffects: vi.fn(() => []),
    getClipFilters: vi.fn(() => []),
    getClipTransitions: vi.fn(() => []),
  }),
}))

// Мокаем AI интеграцию
vi.mock("../hooks/use-player-ai-integration", () => ({
  usePlayerAIIntegration: () => ({
    isReady: true,
  }),
}))

// Мокаем хуки
const mockProjectSettings = {
  settings: {
    aspectRatio: {
      value: { width: 16, height: 9 },
    },
  },
}

vi.mock("@/features/project-settings", () => ({
  useProjectSettings: () => mockProjectSettings,
}))

const mockPlayerContext = {
  currentVideo: null as MediaFile | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  playbackRate: 1,
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
  videoSource: "browser" as "browser" | "timeline",
  previewMedia: null,
  isVideoLoading: false,
  isVideoReady: true,
  isSeeking: false,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn().mockResolvedValue(undefined),
  seek: vi.fn().mockResolvedValue(undefined),
  setVolume: vi.fn(),
  setPlaybackRate: vi.fn().mockResolvedValue(undefined),
  applyEffect: vi.fn(),
  applyFilter: vi.fn(),
  applyTemplate: vi.fn(),
  clearEffects: vi.fn(),
  clearFilters: vi.fn(),
  clearTemplate: vi.fn(),
  setPreviewMedia: vi.fn(),
  setVideoSource: vi.fn(),
}

vi.mock("../services/player-provider", () => ({
  usePlayer: () => mockPlayerContext,
}))

// Мокаем хук AI интеграции
vi.mock("@/features/ai-chat/hooks/use-player-ai-integration", () => ({
  usePlayerAIIntegration: () => ({
    isReady: true,
    hasMedia: false,
    isPlaying: false,
    effectsCount: 0,
    filtersCount: 0,
  }),
}))

describe("VideoPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlayerContext.currentVideo = null
    mockPlayerContext.previewMedia = null
    mockPlayerContext.appliedEffects = []
    mockPlayerContext.appliedFilters = []
    mockPlayerContext.appliedTemplate = null
    mockPlayerContext.isVideoReady = true
  })

  describe("Без видео", () => {
    it("должен отображать плеер без видео", () => {
      render(<VideoPlayer />)

      const video = document.querySelector("video")!
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute("src", "#")
      expect(video).not.toHaveAttribute("controls") // controls={false} не добавляет атрибут
      expect(video).not.toHaveAttribute("muted") // muted={false} не добавляет атрибут
    })

    it("должен отображать контролы с нулевым временем", () => {
      render(<VideoPlayer />)

      const controls = screen.getByTestId("player-controls")
      expect(controls).toBeInTheDocument()
      expect(controls).toHaveAttribute("data-current-time", "0")
      expect(controls).toHaveAttribute("data-file-name", "Нет видео")
    })

    it("должен использовать правильное соотношение сторон", () => {
      render(<VideoPlayer />)

      const aspectRatio = screen.getByTestId("aspect-ratio")
      expect(aspectRatio).toBeInTheDocument()
      expect(aspectRatio).toHaveAttribute("data-ratio", "1.7777777777777777") // 16/9
    })

    it("должен применять правильные стили к контейнеру", () => {
      render(<VideoPlayer />)

      const container = document.querySelector("video")!.closest(".media-player-container")
      expect(container?.className).toMatch(/relative/)
      expect(container?.className).toMatch(/flex/)
      expect(container?.className).toMatch(/h-full/)
      expect(container?.className).toMatch(/flex-col/)
    })
  })

  describe("С видео", () => {
    const mockVideo: MediaFile = {
      id: "test-video",
      path: "/path/to/video.mp4",
      name: "Test Video.mp4",
      size: 1024000,
      isVideo: true,
      duration: 60000,
    }

    beforeEach(() => {
      mockPlayerContext.currentVideo = mockVideo
    })

    it("должен отображать видео с правильным src", () => {
      render(<VideoPlayer />)

      const video = document.querySelector("video")!
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute("src", "/path/to/video.mp4")
    })

    it("должен передавать правильные атрибуты видео", () => {
      render(<VideoPlayer />)

      const video = document.querySelector("video")!
      expect(video).not.toHaveAttribute("controls") // controls={false}
      expect(video).not.toHaveAttribute("autoplay") // autoPlay={false}
      expect(video).not.toHaveAttribute("loop") // loop={false}
      expect(video).toHaveAttribute("preload", "auto")
      expect(video).toHaveAttribute("playsinline") // playsInline={true}
      expect(video).not.toHaveAttribute("muted") // muted={false}
    })

    it("должен передавать видео файл в контролы", () => {
      render(<VideoPlayer />)

      const controls = screen.getByTestId("player-controls")
      expect(controls).toHaveAttribute("data-file-name", "Test Video.mp4")
    })

    it("должен применять правильные классы к видео", () => {
      render(<VideoPlayer />)

      const video = document.querySelector("video")!
      expect(video.className).toMatch(/absolute/)
      expect(video.className).toMatch(/inset-0/)
      expect(video.className).toMatch(/h-full/)
      expect(video.className).toMatch(/w-full/)
    })
  })

  describe("Различные соотношения сторон", () => {
    it("должен правильно вычислять соотношение 4:3", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 4, height: 3 }
      render(<VideoPlayer />)

      const aspectRatio = screen.getByTestId("aspect-ratio")
      expect(aspectRatio).toHaveAttribute("data-ratio", "1.3333333333333333")
    })

    it("должен правильно вычислять соотношение 21:9", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 21, height: 9 }
      render(<VideoPlayer />)

      const aspectRatio = screen.getByTestId("aspect-ratio")
      expect(aspectRatio).toHaveAttribute("data-ratio", "2.3333333333333335")
    })

    it("должен правильно вычислять соотношение 1:1", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 1, height: 1 }
      render(<VideoPlayer />)

      const aspectRatio = screen.getByTestId("aspect-ratio")
      expect(aspectRatio).toHaveAttribute("data-ratio", "1")
    })
  })

  describe("Стили и разметка", () => {
    it("должен иметь правильную структуру DOM", () => {
      render(<VideoPlayer />)

      const container = document.querySelector(".media-player-container")
      expect(container).toBeInTheDocument()

      const videoContainer = container?.querySelector(".bg-black")
      expect(videoContainer).toBeInTheDocument()
      expect(videoContainer?.className).toMatch(/relative/)
      expect(videoContainer?.className).toMatch(/flex-1/)

      const aspectRatio = screen.getByTestId("aspect-ratio")
      expect(aspectRatio.className).toMatch(/bg-black/)
    })

    it("должен применять inline стили к видео", () => {
      render(<VideoPlayer />)

      const video = document.querySelector("video")!
      const style = video.getAttribute("style")

      expect(style).toContain("position: absolute")
      expect(style).toContain("top: 0")
      expect(style).toContain("left: 0")
      expect(style).toContain("width: 100%")
      expect(style).toContain("height: 100%")
      expect(style).toContain("display: block")
    })

    it("должен иметь правильную вложенность элементов", () => {
      render(<VideoPlayer />)

      const container = document.querySelector(".media-player-container")
      const videoWrapper = container?.querySelector(".bg-black")
      const flexContainer = videoWrapper?.querySelector(".flex")
      const aspectRatio = flexContainer?.querySelector('[data-testid="aspect-ratio"]')
      const video = aspectRatio?.querySelector("video")

      expect(container).toBeInTheDocument()
      expect(videoWrapper).toBeInTheDocument()
      expect(flexContainer).toBeInTheDocument()
      expect(aspectRatio).toBeInTheDocument()
      expect(video).toBeInTheDocument()
    })
  })

  describe("Переключение видео", () => {
    it("должен обновлять видео при изменении", () => {
      const { rerender } = render(<VideoPlayer />)

      const videoInitial = document.querySelector("video")!
      expect(videoInitial).toHaveAttribute("src", "#")

      // Устанавливаем видео
      mockPlayerContext.currentVideo = {
        id: "new-video",
        path: "/new/video.mp4",
        name: "New Video.mp4",
        size: 2048000,
        isVideo: true,
        duration: 120000,
      }

      rerender(<VideoPlayer />)

      const videoUpdated = document.querySelector("video")!
      expect(videoUpdated).toHaveAttribute("src", "/new/video.mp4")
      // key атрибут не появляется в DOM
    })

    it("должен возвращаться к пустому состоянию при удалении видео", () => {
      mockPlayerContext.currentVideo = {
        id: "temp-video",
        path: "/temp/video.mp4",
        name: "Temp Video.mp4",
        size: 1024000,
        isVideo: true,
        duration: 30000,
      }

      const { rerender } = render(<VideoPlayer />)

      const videoWithFile = document.querySelector("video")!
      expect(videoWithFile).toHaveAttribute("src", "/temp/video.mp4")

      // Удаляем видео
      mockPlayerContext.currentVideo = null

      rerender(<VideoPlayer />)

      const videoEmpty = document.querySelector("video")!
      expect(videoEmpty).toHaveAttribute("src", "#")
    })
  })

  describe("Обработка edge cases", () => {
    it("должен обрабатывать видео без id", () => {
      mockPlayerContext.currentVideo = {
        id: "",
        path: "/path/to/video.mp4",
        name: "Video without ID.mp4",
        size: 1024000,
        isVideo: true,
        duration: 45000,
        createdAt: new Date().toISOString(),
      }

      render(<VideoPlayer />)

      const video = document.querySelector("video")!
      expect(video).toBeInTheDocument() // key не виден в DOM
    })

    it("должен обрабатывать нулевое соотношение сторон", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 0, height: 0 }

      // Не должно вызвать ошибку деления на ноль
      expect(() => render(<VideoPlayer />)).not.toThrow()
    })
  })
})
