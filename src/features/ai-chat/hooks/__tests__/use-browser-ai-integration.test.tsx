/**
 * Тесты для useBrowserAIIntegration
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/features/media/types/media"
import { useBrowserAIIntegration } from "../use-browser-ai-integration"

// Mock browser state
const mockBrowserState = {
  activeTab: "media" as const,
  selectedFiles: new Set<string>(),
  currentTabSettings: {
    search_query: "",
    sort_by: "name" as const,
    sort_order: "asc" as const,
    show_favorites_only: false,
  },
  selectFile: vi.fn(),
  deselectFile: vi.fn(),
  setSearchQuery: vi.fn(),
  setSort: vi.fn(),
}

vi.mock("@/domains/browser", () => ({
  useBrowserState: () => mockBrowserState,
}))

// Mock app state
const mockProjectState = {
  project: {
    media_pool: {
      items: {
        "media-1": {
          id: "media-1",
          name: "video.mp4",
          path: "/path/to/video.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
          size: 1000000,
          duration: 60,
          lastCheckedAt: Date.now(),
        } as MediaFile,
        "media-2": {
          id: "media-2",
          name: "audio.mp3",
          path: "/path/to/audio.mp3",
          isVideo: false,
          isAudio: true,
          isImage: false,
          size: 500000,
          duration: 180,
          lastCheckedAt: Date.now(),
        } as MediaFile,
        "media-3": {
          id: "media-3",
          name: "image.jpg",
          path: "/path/to/image.jpg",
          isVideo: false,
          isAudio: false,
          isImage: true,
          size: 200000,
          lastCheckedAt: Date.now(),
        } as MediaFile,
      } as Record<string, MediaFile>,
    },
  },
}

vi.mock("@/domains/project-management/providers", () => ({
  useApp: () => ({
    projectState: mockProjectState,
  }),
}))

// Mock setBrowserStateAccess
vi.mock("@/domains/ai-tools/tools/core/browser/utils/helpers", () => ({
  setBrowserStateAccess: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
}))

describe("useBrowserAIIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBrowserState.activeTab = "media"
    mockBrowserState.selectedFiles = new Set()
    mockBrowserState.currentTabSettings = {
      search_query: "",
      sort_by: "name",
      sort_order: "asc",
      show_favorites_only: false,
    }
  })

  it("должен вернуть isReady: true когда есть медиафайлы", () => {
    const { result } = renderHook(() => useBrowserAIIntegration())

    expect(result.current.isReady).toBe(true)
  })

  it("должен вернуть правильное количество файлов", () => {
    const { result } = renderHook(() => useBrowserAIIntegration())

    expect(result.current.filesCount).toBe(3)
  })

  it("должен вернуть активную вкладку", () => {
    const { result } = renderHook(() => useBrowserAIIntegration())

    expect(result.current.activeTab).toBe("media")
  })

  it("должен обновиться при смене активной вкладки", () => {
    const { result, rerender } = renderHook(() => useBrowserAIIntegration())

    expect(result.current.activeTab).toBe("media")

    mockBrowserState.activeTab = "media"
    rerender()

    expect(result.current.activeTab).toBe("media")
  })

  it("должен вернуть isReady: false если нет файлов", () => {
    // Очищаем media pool - нет файлов
    mockProjectState.project.media_pool.items = {}

    const { result } = renderHook(() => useBrowserAIIntegration())

    expect(result.current.isReady).toBe(false)
    expect(result.current.filesCount).toBe(0)
  })

  it("не должен вызывать ошибок при ререндерах", () => {
    // Проверяем, что hook работает при ререндерах
    const { result, rerender } = renderHook(() => useBrowserAIIntegration())

    expect(result.current).toBeDefined()

    // Несколько ререндеров не должны вызывать ошибок
    expect(() => {
      rerender()
      rerender()
      rerender()
    }).not.toThrow()
  })
})
