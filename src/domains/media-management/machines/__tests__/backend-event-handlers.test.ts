/**
 * Backend Event Handlers Tests
 *
 * Тесты для обработчиков событий от Rust backend
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import { handleMediaBackendEvent, type MediaManagementContext } from "../backend-event-handlers"

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("handleMediaBackendEvent", () => {
  let context: MediaManagementContext

  beforeEach(() => {
    context = {
      mediaPool: new Map(),
      isLoading: false,
      error: null,
    }
    vi.clearAllMocks()
  })

  describe("Project Events", () => {
    it("should reset media pool on ProjectCreated", () => {
      // Setup initial state
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "ProjectCreated",
        payload: {
          project_id: "test-project",
          name: "Test Project",
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.size).toBe(0)
      expect(updates.isLoading).toBe(false)
      expect(updates.error).toBeNull()
    })

    it("should reset media pool on ProjectClosed", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "ProjectClosed",
        payload: {
          project_id: "test-project",
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.size).toBe(0)
    })
  })

  describe("Media Events", () => {
    it("should add media to pool on MediaAdded", () => {
      const event: ProjectEvent = {
        type: "MediaAdded",
        payload: {
          media: {
            id: "media-1",
            path: "/test/video.mp4",
            name: "video.mp4",
            media_type: "Video",
            duration: 120,
            codec: null,
          },
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.size).toBe(1)
      expect(updates.mediaPool!.get("media-1")).toEqual({
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
        duration: 120,
        thumbnailPath: undefined,
        metadata: {
          type: "Video",
        },
      })
    })

    it("should add media with H.265 codec detection", () => {
      const event: ProjectEvent = {
        type: "MediaAdded",
        payload: {
          media: {
            id: "media-1",
            path: "/test/video.mp4",
            name: "video.mp4",
            media_type: "Video",
            duration: null,
            codec: null,
          },
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool!.get("media-1")!.metadata).toEqual({
        type: "Video",
      })
    })

    it("should remove media from pool on MediaRemoved", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "MediaRemoved",
        payload: {
          media_id: "media-1",
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.size).toBe(0)
    })

    it("should update media in pool on MediaUpdated", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "old_name.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "MediaUpdated",
        payload: {
          media_id: "media-1",
          changes: {
            name: "new_name.mp4",
            thumbnail: "/cache/thumb.jpg",
          },
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.get("media-1")).toEqual({
        id: "media-1",
        path: "/test/video.mp4",
        name: "new_name.mp4",
        type: "Video",
        thumbnailPath: "/cache/thumb.jpg",
      })
    })

    it("should not update non-existent media", () => {
      const event: ProjectEvent = {
        type: "MediaUpdated",
        payload: {
          media_id: "non-existent",
          changes: {
            name: "new_name.mp4",
            thumbnail: null,
          },
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates).toEqual({})
    })
  })

  describe("Imported Media Events (backward compatibility)", () => {
    it("should add imported media to pool on ImportedMediaAdded", () => {
      const event: ProjectEvent = {
        type: "ImportedMediaAdded",
        payload: {
          media: {
            id: "media-1",
            path: "/test/video.mp4",
            name: "video.mp4",
            media_type: "Video",
            duration: 120,
            codec: null,
          },
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.size).toBe(1)
      expect(updates.mediaPool!.get("media-1")!.metadata).toEqual({
        type: "Video",
      })
    })

    it("should remove imported media from pool on ImportedMediaRemoved", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "ImportedMediaRemoved",
        payload: {
          media_id: "media-1",
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.size).toBe(0)
    })

    it("should update imported media with codec on ImportedMediaUpdated", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "ImportedMediaUpdated",
        payload: {
          media_id: "media-1",
          codec: "hevc",
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates.mediaPool).toBeDefined()
      expect(updates.mediaPool!.get("media-1")!.metadata).toEqual({
        type: "Video",
        codec: "hevc",
      })
    })

    it("should not update media when codec is not provided", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })

      const event: ProjectEvent = {
        type: "ImportedMediaUpdated",
        payload: {
          media_id: "media-1",
          codec: null,
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates).toEqual({})
    })

    it("should handle ImportedMediaCleared as no-op", () => {
      const event: ProjectEvent = {
        type: "ImportedMediaCleared",
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates).toEqual({})
    })
  })

  describe("Unhandled Events", () => {
    it("should return empty object for unhandled event types", () => {
      const event: ProjectEvent = {
        type: "ClipAdded",
        payload: {
          track_id: "track-1",
          clip: {
            id: "clip-1",
            media_id: "media-1",
            name: "test.mp4",
            timeline_in: 0,
            timeline_out: 10,
            source_in: 0,
            source_out: 10,
          },
        },
      }

      const updates = handleMediaBackendEvent(context, event)

      expect(updates).toEqual({})
    })
  })

  describe("Immutability", () => {
    it("should not mutate original mediaPool on add", () => {
      const originalMap = context.mediaPool

      const event: ProjectEvent = {
        type: "MediaAdded",
        payload: {
          media: {
            id: "media-1",
            path: "/test/video.mp4",
            name: "video.mp4",
            media_type: "Video",
            duration: null,
            codec: null,
          },
        },
      }

      handleMediaBackendEvent(context, event)

      expect(context.mediaPool).toBe(originalMap)
      expect(context.mediaPool.size).toBe(0)
    })

    it("should not mutate original mediaPool on remove", () => {
      context.mediaPool.set("media-1", {
        id: "media-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: "Video",
      })
      const originalMap = context.mediaPool

      const event: ProjectEvent = {
        type: "MediaRemoved",
        payload: {
          media_id: "media-1",
        },
      }

      handleMediaBackendEvent(context, event)

      expect(context.mediaPool).toBe(originalMap)
      expect(context.mediaPool.size).toBe(1)
    })
  })
})
