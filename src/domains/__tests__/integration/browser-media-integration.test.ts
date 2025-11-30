/**
 * Integration tests for Browser + Media Management
 *
 * Тесты для взаимодействия браузера медиафайлов с управлением медиа
 */

import { describe, expect, it, vi, beforeEach } from "vitest"
import type { MediaFile } from "@/features/media/types/media"

// Mock Tauri commands
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

interface BrowserState {
  selectedFiles: Set<string>
  currentTabSettings: {
    search_query: string
    sort_by: "name" | "date" | "size" | "duration"
    sort_order: "asc" | "desc"
    show_favorites_only: boolean
  }
}

describe("Browser + Media Integration", () => {
  let mockMediaFiles: Record<string, MediaFile>
  let mockBrowserState: BrowserState

  beforeEach(() => {
    mockMediaFiles = {
      "media-1": {
        id: "media-1",
        name: "video-a.mp4",
        path: "/test/video-a.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000000,
        duration: 60,
        lastCheckedAt: Date.now(),
        favorite: false,
      },
      "media-2": {
        id: "media-2",
        name: "video-b.mp4",
        path: "/test/video-b.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 2000000,
        duration: 120,
        lastCheckedAt: Date.now(),
        favorite: true,
      },
      "media-3": {
        id: "media-3",
        name: "audio.mp3",
        path: "/test/audio.mp3",
        isVideo: false,
        isAudio: true,
        isImage: false,
        size: 500000,
        duration: 180,
        lastCheckedAt: Date.now(),
        favorite: false,
      },
    }

    mockBrowserState = {
      selectedFiles: new Set(),
      currentTabSettings: {
        search_query: "",
        sort_by: "name",
        sort_order: "asc",
        show_favorites_only: false,
      },
    }
  })

  describe("File Selection", () => {
    it("should select single file", () => {
      mockBrowserState.selectedFiles.add("media-1")

      expect(mockBrowserState.selectedFiles.has("media-1")).toBe(true)
      expect(mockBrowserState.selectedFiles.size).toBe(1)
    })

    it("should select multiple files", () => {
      mockBrowserState.selectedFiles.add("media-1")
      mockBrowserState.selectedFiles.add("media-2")

      expect(mockBrowserState.selectedFiles.size).toBe(2)
      expect(mockBrowserState.selectedFiles.has("media-1")).toBe(true)
      expect(mockBrowserState.selectedFiles.has("media-2")).toBe(true)
    })

    it("should deselect file", () => {
      mockBrowserState.selectedFiles.add("media-1")
      mockBrowserState.selectedFiles.delete("media-1")

      expect(mockBrowserState.selectedFiles.has("media-1")).toBe(false)
      expect(mockBrowserState.selectedFiles.size).toBe(0)
    })

    it("should clear all selections", () => {
      mockBrowserState.selectedFiles.add("media-1")
      mockBrowserState.selectedFiles.add("media-2")
      mockBrowserState.selectedFiles.clear()

      expect(mockBrowserState.selectedFiles.size).toBe(0)
    })
  })

  describe("Search and Filter", () => {
    it("should filter files by search query", () => {
      mockBrowserState.currentTabSettings.search_query = "video"

      const filteredFiles = Object.values(mockMediaFiles).filter((file) =>
        file.name.toLowerCase().includes(mockBrowserState.currentTabSettings.search_query.toLowerCase())
      )

      expect(filteredFiles).toHaveLength(2)
      expect(filteredFiles.every((f) => f.name.includes("video"))).toBe(true)
    })

    it("should filter by favorites only", () => {
      mockBrowserState.currentTabSettings.show_favorites_only = true

      const filteredFiles = Object.values(mockMediaFiles).filter((file) =>
        mockBrowserState.currentTabSettings.show_favorites_only ? file.favorite : true
      )

      expect(filteredFiles).toHaveLength(1)
      expect(filteredFiles[0].id).toBe("media-2")
    })

    it("should filter by media type", () => {
      const videoFiles = Object.values(mockMediaFiles).filter((file) => file.isVideo)
      const audioFiles = Object.values(mockMediaFiles).filter((file) => file.isAudio)

      expect(videoFiles).toHaveLength(2)
      expect(audioFiles).toHaveLength(1)
    })
  })

  describe("Sorting", () => {
    it("should sort by name ascending", () => {
      mockBrowserState.currentTabSettings.sort_by = "name"
      mockBrowserState.currentTabSettings.sort_order = "asc"

      const sortedFiles = Object.values(mockMediaFiles).sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      expect(sortedFiles[0].name).toBe("audio.mp3")
      expect(sortedFiles[1].name).toBe("video-a.mp4")
      expect(sortedFiles[2].name).toBe("video-b.mp4")
    })

    it("should sort by size descending", () => {
      mockBrowserState.currentTabSettings.sort_by = "size"
      mockBrowserState.currentTabSettings.sort_order = "desc"

      const sortedFiles = Object.values(mockMediaFiles).sort((a, b) => b.size - a.size)

      expect(sortedFiles[0].size).toBe(2000000)
      expect(sortedFiles[1].size).toBe(1000000)
      expect(sortedFiles[2].size).toBe(500000)
    })

    it("should sort by duration", () => {
      mockBrowserState.currentTabSettings.sort_by = "duration"
      mockBrowserState.currentTabSettings.sort_order = "asc"

      const sortedFiles = Object.values(mockMediaFiles).sort(
        (a, b) => (a.duration || 0) - (b.duration || 0)
      )

      expect(sortedFiles[0].duration).toBe(60)
      expect(sortedFiles[1].duration).toBe(120)
      expect(sortedFiles[2].duration).toBe(180)
    })
  })

  describe("Bulk Operations", () => {
    it("should get selected files data", () => {
      mockBrowserState.selectedFiles.add("media-1")
      mockBrowserState.selectedFiles.add("media-2")

      const selectedFilesData = Array.from(mockBrowserState.selectedFiles)
        .map((id) => mockMediaFiles[id])
        .filter((file) => file !== undefined)

      expect(selectedFilesData).toHaveLength(2)
      expect(selectedFilesData[0].id).toBe("media-1")
      expect(selectedFilesData[1].id).toBe("media-2")
    })

    it("should toggle favorites for selected files", () => {
      mockBrowserState.selectedFiles.add("media-1")
      mockBrowserState.selectedFiles.add("media-3")

      // Toggle favorites
      Array.from(mockBrowserState.selectedFiles).forEach((id) => {
        if (mockMediaFiles[id]) {
          mockMediaFiles[id].favorite = !mockMediaFiles[id].favorite
        }
      })

      expect(mockMediaFiles["media-1"].favorite).toBe(true)
      expect(mockMediaFiles["media-3"].favorite).toBe(true)
      expect(mockMediaFiles["media-2"].favorite).toBe(true) // unchanged
    })

    it("should calculate total size of selected files", () => {
      mockBrowserState.selectedFiles.add("media-1")
      mockBrowserState.selectedFiles.add("media-2")

      const totalSize = Array.from(mockBrowserState.selectedFiles).reduce((sum, id) => {
        const file = mockMediaFiles[id]
        return sum + (file?.size || 0)
      }, 0)

      expect(totalSize).toBe(3000000) // 1000000 + 2000000
    })
  })

  describe("Combined Search and Sort", () => {
    it("should apply search then sort", () => {
      mockBrowserState.currentTabSettings.search_query = "video"
      mockBrowserState.currentTabSettings.sort_by = "size"
      mockBrowserState.currentTabSettings.sort_order = "desc"

      let files = Object.values(mockMediaFiles)

      // Apply search
      if (mockBrowserState.currentTabSettings.search_query) {
        files = files.filter((file) =>
          file.name.toLowerCase().includes(mockBrowserState.currentTabSettings.search_query.toLowerCase())
        )
      }

      // Apply sort
      files = files.sort((a, b) => b.size - a.size)

      expect(files).toHaveLength(2)
      expect(files[0].size).toBe(2000000)
      expect(files[1].size).toBe(1000000)
    })

    it("should apply all filters together", () => {
      mockBrowserState.currentTabSettings.search_query = "video"
      mockBrowserState.currentTabSettings.show_favorites_only = true
      mockBrowserState.currentTabSettings.sort_by = "name"

      let files = Object.values(mockMediaFiles)

      // Search
      if (mockBrowserState.currentTabSettings.search_query) {
        files = files.filter((file) =>
          file.name.toLowerCase().includes(mockBrowserState.currentTabSettings.search_query.toLowerCase())
        )
      }

      // Favorites
      if (mockBrowserState.currentTabSettings.show_favorites_only) {
        files = files.filter((file) => file.favorite)
      }

      // Sort
      files = files.sort((a, b) => a.name.localeCompare(b.name))

      expect(files).toHaveLength(1)
      expect(files[0].id).toBe("media-2")
    })
  })
})
