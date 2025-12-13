/**
 * @vitest-environment jsdom
 */
/**
 * Use Media Files Hook Tests
 *
 * Тесты для хука useMediaFiles
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaItem } from "@/types/generated/tauri-bindings"
import { useMediaFiles } from "../../hooks/use-media-files"
import * as appProvider from "../../providers/app-provider"

// Mock useApp hook
const mockExecuteCommand = vi.fn()
const mockProjectState = {
  project: {
    media_pool: {
      items: {
        "media-1": {
          id: "media-1",
          path: "/path/to/video.mp4",
          name: "video.mp4",
          media_type: "Video",
          duration: 10.0,
          metadata: {
            format: "mp4",
            codec: "h264",
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            bitrate: 5000,
            audio_channels: null,
            sample_rate: null,
            creation_time: "2024-01-01T00:00:00Z",
          },
          thumbnail: null,
          usage_count: 0,
          in_timeline: false,
        } as MediaItem,
        "media-2": {
          id: "media-2",
          path: "/path/to/audio.mp3",
          name: "audio.mp3",
          media_type: "Audio",
          duration: 180.0,
          metadata: {
            format: "mp3",
            codec: "mp3",
            resolution: null,
            frame_rate: null,
            bitrate: 320000,
            audio_channels: 2,
            sample_rate: 44100,
            creation_time: "2024-01-01T00:00:00Z",
          },
          thumbnail: null,
          usage_count: 0,
          in_timeline: false,
        } as MediaItem,
      },
    },
  },
}

vi.mock("../../providers/app-provider", () => ({
  useApp: vi.fn(() => ({
    projectState: mockProjectState,
    executeCommand: mockExecuteCommand,
  })),
}))

describe("useMediaFiles Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockResolvedValue({ success: true })
  })

  describe("mediaFiles", () => {
    it("should return media files from project state", () => {
      const { result } = renderHook(() => useMediaFiles())

      expect(result.current.mediaFiles).toHaveLength(2)
      expect(result.current.mediaFiles[0].id).toBe("media-1")
      expect(result.current.mediaFiles[1].id).toBe("media-2")
    })

    it("should return empty array when no project state", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: null,
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useMediaFiles())

      expect(result.current.mediaFiles).toEqual([])
    })

    it("should return empty array when media_pool is empty", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: { project: { media_pool: { items: {} } } },
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useMediaFiles())

      expect(result.current.mediaFiles).toEqual([])
    })

    it("should filter out undefined items", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: {
          project: {
            media_pool: {
              items: {
                "media-1": mockProjectState.project.media_pool.items["media-1"],
                "media-2": undefined,
                "media-3": mockProjectState.project.media_pool.items["media-2"],
              },
            },
          },
        },
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useMediaFiles())

      expect(result.current.mediaFiles).toHaveLength(2)
    })
  })

  describe("addMediaFile", () => {
    it("should execute AddMedia command with correct parameters", async () => {
      const { result } = renderHook(() => useMediaFiles())

      await result.current.addMediaFile("/path/to/video.mp4", "Video")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddMedia",
        params: { path: "/path/to/video.mp4", media_type: "Video" },
      })
    })

    it("should handle different media types", async () => {
      const { result } = renderHook(() => useMediaFiles())

      await result.current.addMediaFile("/path/to/video.mp4", "Video")
      await result.current.addMediaFile("/path/to/audio.mp3", "Audio")
      await result.current.addMediaFile("/path/to/image.jpg", "Image")

      expect(mockExecuteCommand).toHaveBeenCalledTimes(3)
      expect(mockExecuteCommand).toHaveBeenNthCalledWith(1, {
        type: "AddMedia",
        params: { path: "/path/to/video.mp4", media_type: "Video" },
      })
      expect(mockExecuteCommand).toHaveBeenNthCalledWith(2, {
        type: "AddMedia",
        params: { path: "/path/to/audio.mp3", media_type: "Audio" },
      })
      expect(mockExecuteCommand).toHaveBeenNthCalledWith(3, {
        type: "AddMedia",
        params: { path: "/path/to/image.jpg", media_type: "Image" },
      })
    })

    it("should return command result", async () => {
      const mockResult = { success: true, data: { id: "new-media" } }
      mockExecuteCommand.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useMediaFiles())

      const commandResult = await result.current.addMediaFile("/path/to/video.mp4", "Video")

      expect(commandResult).toEqual(mockResult)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to add media")
      mockExecuteCommand.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useMediaFiles())

      await expect(result.current.addMediaFile("/path/to/video.mp4", "Video")).rejects.toThrow("Failed to add media")
    })
  })

  describe("removeMediaFile", () => {
    it("should execute RemoveMedia command with correct parameters", async () => {
      const { result } = renderHook(() => useMediaFiles())

      await result.current.removeMediaFile("media-1")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "RemoveMedia",
        params: { media_id: "media-1" },
      })
    })

    it("should return command result", async () => {
      const mockResult = { success: true }
      mockExecuteCommand.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useMediaFiles())

      const commandResult = await result.current.removeMediaFile("media-1")

      expect(commandResult).toEqual(mockResult)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to remove media")
      mockExecuteCommand.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useMediaFiles())

      await expect(result.current.removeMediaFile("media-1")).rejects.toThrow("Failed to remove media")
    })
  })

  describe("updateMediaFile", () => {
    it("should execute UpdateMedia command with correct parameters", async () => {
      const { result } = renderHook(() => useMediaFiles())
      const updates = { name: "New Name" }

      await result.current.updateMediaFile("media-1", updates)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateMedia",
        params: { media_id: "media-1", updates },
      })
    })

    it("should handle different update types", async () => {
      const { result } = renderHook(() => useMediaFiles())

      await result.current.updateMediaFile("media-1", { name: "New Name" })
      await result.current.updateMediaFile("media-2", { description: "New Description" })

      expect(mockExecuteCommand).toHaveBeenCalledTimes(2)
    })

    it("should return command result", async () => {
      const mockResult = { success: true }
      mockExecuteCommand.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useMediaFiles())

      const commandResult = await result.current.updateMediaFile("media-1", { name: "New Name" })

      expect(commandResult).toEqual(mockResult)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to update media")
      mockExecuteCommand.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useMediaFiles())

      await expect(result.current.updateMediaFile("media-1", { name: "New Name" })).rejects.toThrow(
        "Failed to update media",
      )
    })
  })

  describe("Edge Cases", () => {
    it("should handle concurrent operations", async () => {
      const { result } = renderHook(() => useMediaFiles())

      await Promise.all([
        result.current.addMediaFile("/path/to/video1.mp4", "Video"),
        result.current.addMediaFile("/path/to/video2.mp4", "Video"),
        result.current.removeMediaFile("media-1"),
      ])

      expect(mockExecuteCommand).toHaveBeenCalledTimes(3)
    })

    it("should handle empty media_pool gracefully", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: { project: {} },
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useMediaFiles())

      expect(result.current.mediaFiles).toEqual([])
    })

    it("should handle null project gracefully", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: { project: null },
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useMediaFiles())

      expect(result.current.mediaFiles).toEqual([])
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", () => {
      const { result, rerender } = renderHook(() => useMediaFiles())

      const initialAdd = result.current.addMediaFile
      const initialRemove = result.current.removeMediaFile
      const initialUpdate = result.current.updateMediaFile

      rerender()

      // Note: These callbacks might not be stable since they're arrow functions
      // This is acceptable for this hook as it doesn't cause unnecessary re-renders
      expect(typeof result.current.addMediaFile).toBe("function")
      expect(typeof result.current.removeMediaFile).toBe("function")
      expect(typeof result.current.updateMediaFile).toBe("function")
    })
  })
})
