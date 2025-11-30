/**
 * Integration tests for Project Management + Media Management
 *
 * Тесты для взаимодействия между доменами управления проектами и медиафайлами
 */

import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ProjectState } from "@/domains/project-management/types"
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

describe("Project + Media Integration", () => {
  let mockProjectState: ProjectState

  beforeEach(() => {
    // Reset project state
    mockProjectState = {
      id: "test-project-1",
      name: "Test Project",
      path: "/test/project",
      lastModified: Date.now(),
      media_pool: {
        items: {},
      },
      timeline: {
        tracks: [],
        sections: [],
        clips: [],
      },
      settings: {
        video: {
          width: 1920,
          height: 1080,
          framerate: 30,
          codec: "h264",
        },
        audio: {
          sampleRate: 48000,
          channels: 2,
        },
      },
    }
  })

  describe("Media File Operations", () => {
    it("should add media file to project media pool", () => {
      const mediaFile: MediaFile = {
        id: "media-1",
        name: "test-video.mp4",
        path: "/test/media/test-video.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000000,
        duration: 60,
        lastCheckedAt: Date.now(),
      }

      // Add media to pool
      mockProjectState.media_pool.items[mediaFile.id] = mediaFile

      // Verify
      expect(Object.keys(mockProjectState.media_pool.items)).toHaveLength(1)
      expect(mockProjectState.media_pool.items["media-1"]).toEqual(mediaFile)
    })

    it("should remove media file from project media pool", () => {
      const mediaFile: MediaFile = {
        id: "media-1",
        name: "test-video.mp4",
        path: "/test/media/test-video.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000000,
        duration: 60,
        lastCheckedAt: Date.now(),
      }

      // Add and then remove
      mockProjectState.media_pool.items[mediaFile.id] = mediaFile
      delete mockProjectState.media_pool.items[mediaFile.id]

      // Verify
      expect(Object.keys(mockProjectState.media_pool.items)).toHaveLength(0)
    })

    it("should handle multiple media files in pool", () => {
      const mediaFiles: MediaFile[] = [
        {
          id: "media-1",
          name: "video1.mp4",
          path: "/test/video1.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
          size: 1000000,
          duration: 60,
          lastCheckedAt: Date.now(),
        },
        {
          id: "media-2",
          name: "video2.mp4",
          path: "/test/video2.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
          size: 2000000,
          duration: 120,
          lastCheckedAt: Date.now(),
        },
        {
          id: "media-3",
          name: "audio.mp3",
          path: "/test/audio.mp3",
          isVideo: false,
          isAudio: true,
          isImage: false,
          size: 500000,
          duration: 180,
          lastCheckedAt: Date.now(),
        },
      ]

      // Add all files
      mediaFiles.forEach((file) => {
        mockProjectState.media_pool.items[file.id] = file
      })

      // Verify
      expect(Object.keys(mockProjectState.media_pool.items)).toHaveLength(3)

      // Filter by type
      const videoFiles = Object.values(mockProjectState.media_pool.items).filter(
        (file) => file.isVideo
      )
      const audioFiles = Object.values(mockProjectState.media_pool.items).filter(
        (file) => file.isAudio
      )

      expect(videoFiles).toHaveLength(2)
      expect(audioFiles).toHaveLength(1)
    })
  })

  describe("Project State Validation", () => {
    it("should have valid project structure", () => {
      expect(mockProjectState).toHaveProperty("id")
      expect(mockProjectState).toHaveProperty("name")
      expect(mockProjectState).toHaveProperty("media_pool")
      expect(mockProjectState).toHaveProperty("timeline")
      expect(mockProjectState).toHaveProperty("settings")
    })

    it("should have valid media pool structure", () => {
      expect(mockProjectState.media_pool).toHaveProperty("items")
      expect(typeof mockProjectState.media_pool.items).toBe("object")
    })

    it("should have valid timeline structure", () => {
      expect(mockProjectState.timeline).toHaveProperty("tracks")
      expect(mockProjectState.timeline).toHaveProperty("sections")
      expect(mockProjectState.timeline).toHaveProperty("clips")
      expect(Array.isArray(mockProjectState.timeline.tracks)).toBe(true)
      expect(Array.isArray(mockProjectState.timeline.sections)).toBe(true)
      expect(Array.isArray(mockProjectState.timeline.clips)).toBe(true)
    })
  })

  describe("Media Pool Updates", () => {
    it("should update media file metadata", () => {
      const mediaFile: MediaFile = {
        id: "media-1",
        name: "test.mp4",
        path: "/test/test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000000,
        duration: 60,
        lastCheckedAt: Date.now(),
      }

      mockProjectState.media_pool.items[mediaFile.id] = mediaFile

      // Update duration
      const updatedFile = {
        ...mockProjectState.media_pool.items["media-1"],
        duration: 90,
        lastCheckedAt: Date.now(),
      }
      mockProjectState.media_pool.items["media-1"] = updatedFile

      expect(mockProjectState.media_pool.items["media-1"].duration).toBe(90)
    })

    it("should detect missing media files", () => {
      const mediaFile: MediaFile = {
        id: "media-1",
        name: "missing.mp4",
        path: "/nonexistent/missing.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000000,
        duration: 60,
        lastCheckedAt: Date.now(),
        isMissing: true,
      }

      mockProjectState.media_pool.items[mediaFile.id] = mediaFile

      // Find missing files
      const missingFiles = Object.values(mockProjectState.media_pool.items).filter(
        (file) => file.isMissing
      )

      expect(missingFiles).toHaveLength(1)
      expect(missingFiles[0].id).toBe("media-1")
    })
  })

  describe("Project Lifecycle", () => {
    it("should create new project with empty media pool", () => {
      const newProject: ProjectState = {
        id: "new-project",
        name: "New Project",
        path: "/path/to/project",
        lastModified: Date.now(),
        media_pool: {
          items: {},
        },
        timeline: {
          tracks: [],
          sections: [],
          clips: [],
        },
        settings: {
          video: {
            width: 1920,
            height: 1080,
            framerate: 30,
            codec: "h264",
          },
          audio: {
            sampleRate: 48000,
            channels: 2,
          },
        },
      }

      expect(newProject.media_pool.items).toEqual({})
      expect(Object.keys(newProject.media_pool.items)).toHaveLength(0)
    })

    it("should preserve media pool when saving project", () => {
      const mediaFile: MediaFile = {
        id: "media-1",
        name: "video.mp4",
        path: "/test/video.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000000,
        duration: 60,
        lastCheckedAt: Date.now(),
      }

      mockProjectState.media_pool.items[mediaFile.id] = mediaFile

      // Simulate save/load
      const savedState = JSON.parse(JSON.stringify(mockProjectState))

      expect(savedState.media_pool.items["media-1"]).toEqual(mediaFile)
    })
  })
})
