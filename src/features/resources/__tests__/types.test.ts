import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/domains/media-management"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyleTemplate } from "@/features/subtitles/types"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { Transition } from "@/features/transitions/types/transitions"
import {
  createEffectResource,
  createFilterResource,
  createMediaResource,
  createMusicResource,
  createStyleTemplateResource,
  createSubtitleResource,
  createTemplateResource,
  createTransitionResource,
} from "../types"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    errorSync: vi.fn(),
    infoSync: vi.fn(),
  }),
}))

describe("Resources Types - Factory Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createMediaResource", () => {
    it("creates a valid media resource from a media file", () => {
      const file: MediaFile = {
        id: "media-123",
        name: "video.mp4",
        path: "/path/to/video.mp4",
        type: "video" as any,
        size: 1024000,
        duration: 120,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const resource = createMediaResource(file)

      expect(resource).toMatchObject({
        type: "media",
        name: "video.mp4",
        resourceId: "media-123",
        file,
        params: {},
      })
      expect(resource.id).toMatch(/^media-media-123-\d+$/)
      expect(resource.addedAt).toBeGreaterThan(0)
    })

    it("generates IDs with timestamp component", () => {
      const file: MediaFile = {
        id: "media-123",
        name: "video.mp4",
        path: "/path/to/video.mp4",
        type: "video" as any,
        size: 1024000,
        duration: 120,
        isVideo: true,
        isAudio: false,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const before = Date.now()
      const resource = createMediaResource(file)
      const after = Date.now()

      // ID should contain the file ID and a timestamp
      expect(resource.id).toMatch(/^media-media-123-\d+$/)
      expect(resource.addedAt).toBeGreaterThanOrEqual(before)
      expect(resource.addedAt).toBeLessThanOrEqual(after)
    })
  })

  describe("createMusicResource", () => {
    it("creates a valid music resource from an audio file", () => {
      const file: MediaFile = {
        id: "audio-456",
        name: "song.mp3",
        path: "/path/to/song.mp3",
        type: "audio" as any,
        size: 512000,
        duration: 180,
        isVideo: false,
        isAudio: true,
        isImage: false,
        isLoadingMetadata: false,
        probeData: { streams: [], format: {} },
      }

      const resource = createMusicResource(file)

      expect(resource).toMatchObject({
        type: "music",
        name: "song.mp3",
        resourceId: "audio-456",
        file,
        params: {},
      })
      expect(resource.id).toMatch(/^music-audio-456-\d+$/)
      expect(resource.addedAt).toBeGreaterThan(0)
    })
  })

  describe("createSubtitleResource", () => {
    it("creates a valid subtitle resource from a style template", () => {
      const style: SubtitleStyleTemplate = {
        id: "subtitle-style-1",
        name: "Bold White",
        fontFamily: "Arial",
        fontSize: 24,
        color: "#FFFFFF",
        backgroundColor: "#000000",
        opacity: 1,
        position: "bottom",
      } as any

      const resource = createSubtitleResource(style)

      expect(resource).toMatchObject({
        type: "subtitle",
        name: "Bold White",
        resourceId: "subtitle-style-1",
        style,
        params: {},
      })
      expect(resource.id).toMatch(/^subtitle-subtitle-style-1-\d+$/)
    })
  })

  describe("createEffectResource", () => {
    it("creates a valid effect resource with parameters", () => {
      const effect: VideoEffect = {
        id: "blur-effect",
        name: { en: "Blur Effect", ru: "Эффект размытия" },
        type: "blur",
        parameters: [
          {
            id: "intensity",
            name: { en: "Intensity", ru: "Интенсивность" },
            type: "number",
            defaultValue: 5,
            min: 0,
            max: 10,
          },
          {
            id: "radius",
            name: { en: "Radius", ru: "Радиус" },
            type: "number",
            defaultValue: 10,
            min: 0,
            max: 50,
          },
        ],
      } as any

      const resource = createEffectResource(effect)

      expect(resource).toMatchObject({
        type: "effect",
        name: "Blur Effect",
        resourceId: "blur-effect",
        effect,
        params: {
          intensity: 5,
          radius: 10,
        },
      })
      expect(resource.id).toMatch(/^effect-blur-effect-\d+$/)
    })

    it("creates effect resource with string name", () => {
      const effect: VideoEffect = {
        id: "simple-effect",
        name: "Simple Effect",
        type: "simple",
      } as any

      const resource = createEffectResource(effect)

      expect(resource.name).toBe("Simple Effect")
    })

    it("extracts English name from localized effect name (prefers en over ru)", () => {
      const effect: VideoEffect = {
        id: "localized-effect",
        name: { en: "English name", ru: "Русское название" },
        type: "localized",
      } as any

      const resource = createEffectResource(effect)

      // The code prefers English name (en) over Russian (ru)
      expect(resource.name).toBe("English name")
    })

    it("falls back to English name if Russian is not available", () => {
      const effect: VideoEffect = {
        id: "en-only-effect",
        name: { en: "English Only" },
        type: "english",
      } as any

      const resource = createEffectResource(effect)

      expect(resource.name).toBe("English Only")
    })

    it("uses default name if no localized name is available", () => {
      const effect: VideoEffect = {
        id: "no-name-effect",
        name: {} as any,
        type: "no-name",
      } as any

      const resource = createEffectResource(effect)

      expect(resource.name).toBe("Effect")
    })

    it("creates effect resource without parameters", () => {
      const effect: VideoEffect = {
        id: "no-params-effect",
        name: "No Params",
        type: "no-params",
      } as any

      const resource = createEffectResource(effect)

      expect(resource.params).toEqual({})
    })

    it("throws error for invalid effect object without id", () => {
      const invalidEffect = {
        name: "Invalid",
      } as any

      expect(() => createEffectResource(invalidEffect)).toThrow(
        "Invalid effect object provided to createEffectResource",
      )
    })

    it("throws error for invalid effect object without name", () => {
      const invalidEffect = {
        id: "invalid-id",
      } as any

      expect(() => createEffectResource(invalidEffect)).toThrow(
        "Invalid effect object provided to createEffectResource",
      )
    })

    it("throws error for null effect object", () => {
      expect(() => createEffectResource(null as any)).toThrow("Invalid effect object provided to createEffectResource")
    })
  })

  describe("createFilterResource", () => {
    it("creates a valid filter resource with params", () => {
      const filter: VideoFilter = {
        id: "vintage-filter",
        name: "Vintage",
        type: "filter",
        params: {
          saturation: 0.8,
          brightness: 1.1,
        },
      } as any

      const resource = createFilterResource(filter)

      expect(resource).toMatchObject({
        type: "filter",
        name: "Vintage",
        resourceId: "vintage-filter",
        filter,
        params: {
          saturation: 0.8,
          brightness: 1.1,
        },
      })
      expect(resource.id).toMatch(/^filter-vintage-filter-\d+$/)
    })

    it("creates filter resource without params", () => {
      const filter: VideoFilter = {
        id: "simple-filter",
        name: "Simple",
        type: "filter",
      } as any

      const resource = createFilterResource(filter)

      expect(resource.params).toEqual({})
    })

    it("throws error for invalid filter object without id", () => {
      const invalidFilter = {
        name: "Invalid",
      } as any

      expect(() => createFilterResource(invalidFilter)).toThrow(
        "Invalid filter object provided to createFilterResource",
      )
    })

    it("throws error for invalid filter object without name", () => {
      const invalidFilter = {
        id: "invalid-id",
      } as any

      expect(() => createFilterResource(invalidFilter)).toThrow(
        "Invalid filter object provided to createFilterResource",
      )
    })

    it("throws error for null filter object", () => {
      expect(() => createFilterResource(null as any)).toThrow("Invalid filter object provided to createFilterResource")
    })
  })

  describe("createTransitionResource", () => {
    it("creates a valid transition resource with Russian label", () => {
      const transition: Transition = {
        id: "fade-transition",
        labels: {
          ru: "Затухание",
          en: "Fade",
        },
        parameters: {
          duration: 1000,
        },
      } as any

      const resource = createTransitionResource(transition)

      expect(resource).toMatchObject({
        type: "transition",
        name: "Затухание",
        resourceId: "fade-transition",
        transition,
        params: {
          duration: 1000,
        },
      })
      expect(resource.id).toMatch(/^transition-fade-transition-\d+$/)
    })

    it("uses transition ID as name if no labels", () => {
      const transition: Transition = {
        id: "no-label-transition",
        parameters: {},
      } as any

      const resource = createTransitionResource(transition)

      expect(resource.name).toBe("no-label-transition")
    })

    it("creates transition resource without parameters", () => {
      const transition: Transition = {
        id: "simple-transition",
        labels: { ru: "Простой" },
      } as any

      const resource = createTransitionResource(transition)

      expect(resource.params).toEqual({})
    })

    it("throws error for invalid transition object without id", () => {
      const invalidTransition = {
        labels: { ru: "Invalid" },
      } as any

      expect(() => createTransitionResource(invalidTransition)).toThrow(
        "Invalid transition object provided to createTransitionResource",
      )
    })

    it("throws error for null transition object", () => {
      expect(() => createTransitionResource(null as any)).toThrow(
        "Invalid transition object provided to createTransitionResource",
      )
    })
  })

  describe("createTemplateResource", () => {
    it("creates a valid template resource", () => {
      const template: MediaTemplate = {
        id: "split-screen-2",
        type: "split-screen",
        layout: "horizontal",
      } as any

      const resource = createTemplateResource(template)

      expect(resource).toMatchObject({
        type: "template",
        name: "split-screen-2",
        resourceId: "split-screen-2",
        template,
        params: {},
      })
      expect(resource.id).toMatch(/^template-split-screen-2-\d+$/)
    })
  })

  describe("createStyleTemplateResource", () => {
    it("creates a valid style template resource from Russian name", () => {
      const template: StyleTemplate = {
        id: "intro-template",
        name: {
          ru: "Вступление",
          en: "Intro",
        },
        type: "intro",
      } as any

      const resource = createStyleTemplateResource(template)

      expect(resource).toMatchObject({
        type: "styleTemplate",
        name: "Вступление",
        resourceId: "intro-template",
        template,
        params: {},
      })
      expect(resource.id).toMatch(/^styleTemplate-intro-template-\d+$/)
    })
  })
})
