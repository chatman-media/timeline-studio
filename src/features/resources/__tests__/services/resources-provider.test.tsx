import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType as LocalMediaType } from "@/features/media/types/media"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { Transition } from "@/features/transitions/types/transitions"
import { ResourcesProvider, useResources } from "../../services/resources-provider"

// Mock dependencies
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  createLogger: () => ({
    errorSync: vi.fn(),
    infoSync: vi.fn(),
  }),
}))

// Mock container
const mockExecuteCommand = vi.fn()
const mockOnEvent = vi.fn(() => vi.fn())
const mockBackend = {
  executeCommand: mockExecuteCommand,
  onEvent: mockOnEvent,
}

vi.mock("@/core/container", () => ({
  container: {
    getBackend: () => mockBackend,
  },
}))

// Mock useApp hook
const mockProjectState = {
  project: {
    id: "test-project",
    name: "Test Project",
    media_pool: { items: {} },
    effects_pool: {},
    filters_pool: {},
    transitions_pool: {},
    templates_pool: {},
    style_templates_pool: {},
    subtitles_pool: {},
  },
}

vi.mock("@/domains/project-management/providers", () => ({
  useApp: () => ({
    projectState: mockProjectState,
  }),
}))

describe("ResourcesProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockResolvedValue({ success: true, data: null })
    mockOnEvent.mockReturnValue(vi.fn())

    // Reset mock project state
    mockProjectState.project = {
      id: "test-project",
      name: "Test Project",
      media_pool: { items: {} },
      effects_pool: {},
      filters_pool: {},
      transitions_pool: {},
      templates_pool: {},
      style_templates_pool: {},
      subtitles_pool: {},
    }
  })

  const wrapper = ({ children }: { children: ReactNode }) => <ResourcesProvider>{children}</ResourcesProvider>

  describe("Initialization", () => {
    it("initializes with empty resources when no project", () => {
      mockProjectState.project = null as any

      const { result } = renderHook(() => useResources(), { wrapper })

      expect(result.current.resources).toEqual([])
      expect(result.current.mediaResources).toEqual([])
      expect(result.current.musicResources).toEqual([])
      expect(result.current.effectResources).toEqual([])
      expect(result.current.filterResources).toEqual([])
      expect(result.current.transitionResources).toEqual([])
      expect(result.current.templateResources).toEqual([])
      expect(result.current.styleTemplateResources).toEqual([])
      expect(result.current.subtitleResources).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("initializes with resources from backend state", () => {
      mockProjectState.project.media_pool = {
        items: {
          "media-1": {
            id: "media-1",
            name: "video.mp4",
            path: "/path/to/video.mp4",
            media_type: "Video",
            duration: 120,
          },
        },
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      expect(result.current.mediaResources).toHaveLength(1)
      expect(result.current.mediaResources[0]).toMatchObject({
        id: "media-1",
        type: "media",
        name: "video.mp4",
        resourceId: "media-1",
      })
    })

    it("subscribes to backend events on mount", () => {
      renderHook(() => useResources(), { wrapper })

      expect(mockOnEvent).toHaveBeenCalledWith(expect.any(Function))
    })

    it("unsubscribes from backend events on unmount", () => {
      const mockUnsubscribe = vi.fn()
      mockOnEvent.mockReturnValue(mockUnsubscribe)

      const { unmount } = renderHook(() => useResources(), { wrapper })
      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe("addMedia", () => {
    it("adds media file to backend and caches metadata", async () => {
      const file: MediaFile = {
        id: "video-1",
        name: "test.mp4",
        path: "/path/to/test.mp4",
        type: LocalMediaType.Video,
        size: 1024000,
        duration: 60,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: false,
        probeData: {
          streams: [{ codec_type: "video" }],
          format: {},
        } as any,
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addMedia(file)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddMedia",
        params: {
          path: "/path/to/test.mp4",
          media_type: "Video",
        },
      })
    })

    it("converts VideoWithAudio type to Video media type", async () => {
      const file: MediaFile = {
        id: "video-2",
        name: "movie.mp4",
        path: "/path/to/movie.mp4",
        type: LocalMediaType.VideoWithAudio,
        size: 2048000,
        duration: 120,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addMedia(file)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddMedia",
        params: {
          path: "/path/to/movie.mp4",
          media_type: "Video",
        },
      })
    })

    it("converts StillImage type to Image media type", async () => {
      const file: MediaFile = {
        id: "image-1",
        name: "photo.jpg",
        path: "/path/to/photo.jpg",
        type: LocalMediaType.StillImage,
        size: 512000,
        duration: 0,
        isVideo: false,
        isAudio: false,
        isImage: true,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addMedia(file)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddMedia",
        params: {
          path: "/path/to/photo.jpg",
          media_type: "Image",
        },
      })
    })

    it("skips adding media if it already exists in media pool", async () => {
      mockProjectState.project.media_pool = {
        items: {
          "existing-media": {
            id: "existing-media",
            name: "existing.mp4",
            path: "/path/to/existing.mp4",
            media_type: "Video",
            duration: 60,
          },
        },
      }

      const file: MediaFile = {
        id: "new-id",
        name: "existing.mp4",
        path: "/path/to/existing.mp4",
        type: LocalMediaType.Video,
        size: 1024000,
        duration: 60,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addMedia(file)

      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("handles command execution errors", async () => {
      mockExecuteCommand.mockResolvedValue({
        success: false,
        error: "Failed to add media",
      })

      const file: MediaFile = {
        id: "video-1",
        name: "test.mp4",
        path: "/path/to/test.mp4",
        type: LocalMediaType.Video,
        size: 1024000,
        duration: 60,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await expect(result.current.addMedia(file)).rejects.toThrow("Failed to add media")
    })
  })

  describe("addMusic", () => {
    it("adds music file to backend as Audio type", async () => {
      const file: MediaFile = {
        id: "audio-1",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: LocalMediaType.Music,
        size: 512000,
        duration: 180,
        isVideo: false,
        isAudio: true,
        isImage: false,
        isLoadingMetadata: false,
        probeData: {
          streams: [{ codec_type: "audio" }],
          format: {},
        } as any,
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addMusic(file)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddMedia",
        params: {
          path: "/path/to/song.mp3",
          media_type: "Audio",
        },
      })
    })

    it("skips adding music if it already exists", async () => {
      mockProjectState.project.media_pool = {
        items: {
          "existing-audio": {
            id: "existing-audio",
            name: "song.mp3",
            path: "/path/to/song.mp3",
            media_type: "Audio",
            duration: 180,
          },
        },
      }

      const file: MediaFile = {
        id: "new-audio",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: LocalMediaType.Music,
        size: 512000,
        duration: 180,
        isVideo: false,
        isAudio: true,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addMusic(file)

      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })
  })

  describe("addEffect", () => {
    it("adds effect to backend via SaveResource command", async () => {
      const effect: VideoEffect = {
        id: "blur-effect",
        name: "Blur",
        type: "blur",
        parameters: [],
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addEffect(effect)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "blur-effect",
          resource_type: "effect",
          data: effect,
          metadata: {},
        },
      })
    })
  })

  describe("addFilter", () => {
    it("adds filter to backend via SaveResource command", async () => {
      const filter: VideoFilter = {
        id: "vintage-filter",
        name: "Vintage",
        type: "filter",
        params: { saturation: 0.8 },
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addFilter(filter)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "vintage-filter",
          resource_type: "filter",
          data: filter,
          metadata: {},
        },
      })
    })
  })

  describe("addTransition", () => {
    it("adds transition to backend via SaveResource command", async () => {
      const transition: Transition = {
        id: "fade-transition",
        labels: { ru: "Затухание", en: "Fade" },
        parameters: { duration: 1000 },
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addTransition(transition)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "fade-transition",
          resource_type: "transition",
          data: transition,
          metadata: {},
        },
      })
    })
  })

  describe("addTemplate", () => {
    it("adds template to backend via SaveResource command", async () => {
      const template: MediaTemplate = {
        id: "split-screen",
        type: "split-screen",
        layout: "horizontal",
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addTemplate(template)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "split-screen",
          resource_type: "template",
          data: template,
          metadata: {},
        },
      })
    })
  })

  describe("addStyleTemplate", () => {
    it("adds style template to backend via SaveResource command", async () => {
      const template: StyleTemplate = {
        id: "intro-template",
        name: { ru: "Вступление", en: "Intro" },
        type: "intro",
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addStyleTemplate(template)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "intro-template",
          resource_type: "styleTemplate",
          data: template,
          metadata: {},
        },
      })
    })

    it("handles string name in style template", async () => {
      const template: StyleTemplate = {
        id: "string-name-template",
        name: "String Name" as any,
        type: "intro",
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addStyleTemplate(template)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "string-name-template",
          resource_type: "styleTemplate",
          data: template,
          metadata: {},
        },
      })
    })
  })

  describe("addSubtitle", () => {
    it("adds subtitle to backend via SaveResource command", async () => {
      const style: SubtitleStyleTemplate = {
        id: "subtitle-1",
        name: "Bold White",
        fontFamily: "Arial",
        fontSize: 24,
      } as any

      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.addSubtitle(style)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveResource",
        params: {
          resource_id: "subtitle-1",
          resource_type: "subtitle",
          data: style,
          metadata: {},
        },
      })
    })
  })

  describe("removeResource", () => {
    it("removes media resource via RemoveMedia command", async () => {
      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.removeResource("media-1", "media")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "RemoveMedia",
        params: { media_id: "media-1" },
      })
    })

    it("removes music resource via RemoveMedia command", async () => {
      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.removeResource("audio-1", "music")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "RemoveMedia",
        params: { media_id: "audio-1" },
      })
    })

    it("removes effect resource via DeleteResource command", async () => {
      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.removeResource("effect-1", "effect")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "DeleteResource",
        params: {
          resource_id: "effect-1",
          resource_type: "effect",
        },
      })
    })

    it("uses default media type if not specified", async () => {
      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.removeResource("resource-1")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "RemoveMedia",
        params: { media_id: "resource-1" },
      })
    })
  })

  describe("updateResource", () => {
    it("updates resource via UpdateMedia command", async () => {
      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.updateResource("media-1", { volume: 0.8 })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateMedia",
        params: {
          media_id: "media-1",
          updates: { volume: 0.8 },
        },
      })
    })
  })

  describe("clearResources", () => {
    it("loads empty resources for all types", async () => {
      const { result } = renderHook(() => useResources(), { wrapper })

      await result.current.clearResources()

      const resourceTypes = ["effect", "filter", "transition", "template", "styleTemplate", "subtitle"]
      expect(mockExecuteCommand).toHaveBeenCalledTimes(resourceTypes.length)

      resourceTypes.forEach((resourceType) => {
        expect(mockExecuteCommand).toHaveBeenCalledWith({
          type: "LoadResources",
          params: {
            resource_type: resourceType,
            source: "local",
            category: null,
          },
        })
      })
    })
  })

  describe("Utility functions", () => {
    beforeEach(() => {
      mockProjectState.project.media_pool = {
        items: {
          "media-1": {
            id: "media-1",
            name: "video.mp4",
            path: "/path/to/video.mp4",
            media_type: "Video",
            duration: 120,
          },
        },
      }
      mockProjectState.project.effects_pool = {
        "effect-1": {
          id: "effect-res-1",
          effect_id: "effect-1",
          name: "Blur",
          parameters: [],
          added_at: Math.floor(Date.now() / 1000),
        },
      }
    })

    describe("getResourceById", () => {
      it("returns resource by resourceId", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const resource = result.current.getResourceById("media-1")

        expect(resource).toBeDefined()
        expect(resource?.resourceId).toBe("media-1")
      })

      it("returns undefined for non-existent resource", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const resource = result.current.getResourceById("non-existent")

        expect(resource).toBeUndefined()
      })
    })

    describe("getResourcesByType", () => {
      it("returns media resources", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const resources = result.current.getResourcesByType("media")

        expect(resources).toHaveLength(1)
        expect(resources[0].type).toBe("media")
      })

      it("returns effect resources", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const resources = result.current.getResourcesByType("effect")

        expect(resources).toHaveLength(1)
        expect(resources[0].type).toBe("effect")
      })

      it("returns empty array for unknown type", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const resources = result.current.getResourcesByType("unknown")

        expect(resources).toEqual([])
      })
    })

    describe("isMusicAdded", () => {
      it("returns true if music with same path exists", () => {
        mockProjectState.project.media_pool = {
          items: {
            "audio-1": {
              id: "audio-1",
              name: "song.mp3",
              path: "/path/to/song.mp3",
              media_type: "Audio",
              duration: 180,
            },
          },
        }

        const { result } = renderHook(() => useResources(), { wrapper })

        const file: MediaFile = {
          id: "different-id",
          name: "song.mp3",
          path: "/path/to/song.mp3",
          type: LocalMediaType.Music,
        } as any

        expect(result.current.isMusicAdded(file)).toBe(true)
      })

      it("returns false if music not added", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const file: MediaFile = {
          id: "audio-1",
          name: "new-song.mp3",
          path: "/path/to/new-song.mp3",
          type: LocalMediaType.Music,
        } as any

        expect(result.current.isMusicAdded(file)).toBe(false)
      })
    })

    describe("isEffectAdded", () => {
      it("returns true if effect with same id exists", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const effect: VideoEffect = {
          id: "effect-1",
          name: "Blur",
        } as any

        expect(result.current.isEffectAdded(effect)).toBe(true)
      })

      it("returns false if effect not added", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        const effect: VideoEffect = {
          id: "new-effect",
          name: "New Effect",
        } as any

        expect(result.current.isEffectAdded(effect)).toBe(false)
      })
    })

    describe("isAdded", () => {
      it("checks media by path", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        expect(result.current.isAdded("/path/to/video.mp4", "media")).toBe(true)
        expect(result.current.isAdded("/path/to/other.mp4", "media")).toBe(false)
      })

      it("checks media by file id", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        expect(result.current.isAdded("media-1", "media")).toBe(true)
      })

      it("checks effect by resourceId", () => {
        const { result } = renderHook(() => useResources(), { wrapper })

        expect(result.current.isAdded("effect-1", "effect")).toBe(true)
        expect(result.current.isAdded("other-effect", "effect")).toBe(false)
      })
    })
  })

  describe("Error handling", () => {
    it("sets error state when command fails", async () => {
      mockExecuteCommand.mockResolvedValue({
        success: false,
        error: "Backend error",
      })

      const { result } = renderHook(() => useResources(), { wrapper })

      await expect(result.current.addEffect({ id: "effect-1", name: "Test" } as any)).rejects.toThrow("Backend error")

      await waitFor(() => {
        expect(result.current.error).toBe("Backend error")
      })
    })

    it("sets loading state during command execution", async () => {
      let resolveCommand: (value: any) => void
      const commandPromise = new Promise((resolve) => {
        resolveCommand = resolve
      })
      mockExecuteCommand.mockReturnValue(commandPromise)

      const { result } = renderHook(() => useResources(), { wrapper })

      const addPromise = result.current.addEffect({ id: "effect-1", name: "Test" } as any)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      resolveCommand!({ success: true, data: null })
      await addPromise

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe("Hook error handling", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useResources())
      }).toThrow("useResources must be used within ResourcesProviderV2")

      console.error = originalError
    })
  })
})
