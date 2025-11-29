import { beforeEach, describe, expect, it, vi } from "vitest"
import { type BrowserResourcesContext, handleBackendEvent } from "../../machines/resource-backend-event-handlers"
import type { Resource } from "../../types/browser-resources-provider"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debugSync: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}))

describe("Resource Backend Event Handlers", () => {
  let context: BrowserResourcesContext

  beforeEach(() => {
    context = {
      resources: new Map<string, Resource[]>(),
      loadedSources: new Set(),
      isLoading: false,
      error: null,
    }
  })

  describe("handleBackendEvent", () => {
    it("should handle unknown event types", () => {
      const result = handleBackendEvent(context, { type: "UnknownEvent", payload: {} })
      expect(result).toEqual({})
    })

    it("should handle events without crashing", () => {
      expect(() => {
        handleBackendEvent(context, { type: "InvalidEvent" })
      }).not.toThrow()
    })
  })

  describe("Effect Events", () => {
    describe("EffectAdded", () => {
      it("should add new effect to resources", () => {
        const event = {
          type: "EffectAdded" as const,
          payload: { effect_id: "effect-1", name: "Blur Effect" },
        }

        const result = handleBackendEvent(context, event)

        expect(result.resources).toBeDefined()
        const effectResources = result.resources!.get("effect:imported")
        expect(effectResources).toHaveLength(1)
        expect(effectResources![0]).toEqual({
          id: "effect-1",
          name: "Blur Effect",
          type: "effect",
        })
        expect(result.loadedSources).toContain("imported")
      })

      it("should not add duplicate effects", () => {
        context.resources.set("effect:imported", [{ id: "effect-1", name: "Blur Effect", type: "effect" } as Resource])

        const event = {
          type: "EffectAdded" as const,
          payload: { effect_id: "effect-1", name: "Blur Effect" },
        }

        const result = handleBackendEvent(context, event)
        expect(result).toEqual({})
      })

      it("should add multiple different effects", () => {
        const event1 = {
          type: "EffectAdded" as const,
          payload: { effect_id: "effect-1", name: "Blur" },
        }
        const event2 = {
          type: "EffectAdded" as const,
          payload: { effect_id: "effect-2", name: "Sharpen" },
        }

        const result1 = handleBackendEvent(context, event1)
        context.resources = result1.resources!
        const result2 = handleBackendEvent(context, event2)

        const effectResources = result2.resources!.get("effect:imported")
        expect(effectResources).toHaveLength(2)
      })
    })

    describe("EffectRemoved", () => {
      it("should remove effect from resources", () => {
        context.resources.set("effect:imported", [
          { id: "effect-1", name: "Blur", type: "effect" } as Resource,
          { id: "effect-2", name: "Sharpen", type: "effect" } as Resource,
        ])

        const event = {
          type: "EffectRemoved" as const,
          payload: { effect_id: "effect-1" },
        }

        const result = handleBackendEvent(context, event)

        const effectResources = result.resources!.get("effect:imported")
        expect(effectResources).toHaveLength(1)
        expect(effectResources![0].id).toBe("effect-2")
      })

      it("should handle removing non-existent effect", () => {
        context.resources.set("effect:imported", [])

        const event = {
          type: "EffectRemoved" as const,
          payload: { effect_id: "non-existent" },
        }

        const result = handleBackendEvent(context, event)
        const effectResources = result.resources!.get("effect:imported")
        expect(effectResources).toHaveLength(0)
      })
    })
  })

  describe("Filter Events", () => {
    describe("FilterAdded", () => {
      it("should add new filter to resources", () => {
        const event = {
          type: "FilterAdded" as const,
          payload: { filter_id: "filter-1", name: "Cinematic" },
        }

        const result = handleBackendEvent(context, event)

        const filterResources = result.resources!.get("filter:imported")
        expect(filterResources).toHaveLength(1)
        expect(filterResources![0]).toEqual({
          id: "filter-1",
          name: "Cinematic",
          type: "filter",
        })
      })

      it("should not add duplicate filters", () => {
        context.resources.set("filter:imported", [{ id: "filter-1", name: "Cinematic", type: "filter" } as Resource])

        const event = {
          type: "FilterAdded" as const,
          payload: { filter_id: "filter-1", name: "Cinematic" },
        }

        const result = handleBackendEvent(context, event)
        expect(result).toEqual({})
      })
    })

    describe("FilterRemoved", () => {
      it("should remove filter from resources", () => {
        context.resources.set("filter:imported", [{ id: "filter-1", name: "Cinematic", type: "filter" } as Resource])

        const event = {
          type: "FilterRemoved" as const,
          payload: { filter_id: "filter-1" },
        }

        const result = handleBackendEvent(context, event)
        const filterResources = result.resources!.get("filter:imported")
        expect(filterResources).toHaveLength(0)
      })
    })
  })

  describe("Transition Events", () => {
    describe("TransitionAdded", () => {
      it("should add new transition to resources", () => {
        const event = {
          type: "TransitionAdded" as const,
          payload: { transition_id: "transition-1", name: "Fade" },
        }

        const result = handleBackendEvent(context, event)

        const transitionResources = result.resources!.get("transition:imported")
        expect(transitionResources).toHaveLength(1)
        expect(transitionResources![0]).toEqual({
          id: "transition-1",
          name: "Fade",
          type: "transition",
        })
      })

      it("should not add duplicate transitions", () => {
        context.resources.set("transition:imported", [
          { id: "transition-1", name: "Fade", type: "transition" } as Resource,
        ])

        const event = {
          type: "TransitionAdded" as const,
          payload: { transition_id: "transition-1", name: "Fade" },
        }

        const result = handleBackendEvent(context, event)
        expect(result).toEqual({})
      })
    })

    describe("TransitionRemoved", () => {
      it("should remove transition from resources", () => {
        context.resources.set("transition:imported", [
          { id: "transition-1", name: "Fade", type: "transition" } as Resource,
        ])

        const event = {
          type: "TransitionRemoved" as const,
          payload: { transition_id: "transition-1" },
        }

        const result = handleBackendEvent(context, event)
        const transitionResources = result.resources!.get("transition:imported")
        expect(transitionResources).toHaveLength(0)
      })
    })
  })

  describe("Template Events", () => {
    describe("TemplateAdded", () => {
      it("should add new template to resources", () => {
        const event = {
          type: "TemplateAdded" as const,
          payload: { template_id: "template-1", name: "Grid 2x2" },
        }

        const result = handleBackendEvent(context, event)

        const templateResources = result.resources!.get("template:imported")
        expect(templateResources).toHaveLength(1)
        expect(templateResources![0]).toEqual({
          id: "template-1",
          name: "Grid 2x2",
          type: "template",
        })
      })
    })

    describe("TemplateRemoved", () => {
      it("should remove template from resources", () => {
        context.resources.set("template:imported", [
          { id: "template-1", name: "Grid 2x2", type: "template" } as Resource,
        ])

        const event = {
          type: "TemplateRemoved" as const,
          payload: { template_id: "template-1" },
        }

        const result = handleBackendEvent(context, event)
        const templateResources = result.resources!.get("template:imported")
        expect(templateResources).toHaveLength(0)
      })
    })
  })

  describe("Style Template Events", () => {
    describe("StyleTemplateAdded", () => {
      it("should add new style template to resources", () => {
        const event = {
          type: "StyleTemplateAdded" as const,
          payload: { template_id: "style-1", name: "Modern Intro" },
        }

        const result = handleBackendEvent(context, event)

        const styleTemplateResources = result.resources!.get("styleTemplate:imported")
        expect(styleTemplateResources).toHaveLength(1)
        expect(styleTemplateResources![0]).toEqual({
          id: "style-1",
          name: "Modern Intro",
          type: "styleTemplate",
        })
      })
    })

    describe("StyleTemplateRemoved", () => {
      it("should remove style template from resources", () => {
        context.resources.set("styleTemplate:imported", [
          { id: "style-1", name: "Modern Intro", type: "styleTemplate" } as Resource,
        ])

        const event = {
          type: "StyleTemplateRemoved" as const,
          payload: { template_id: "style-1" },
        }

        const result = handleBackendEvent(context, event)
        const styleTemplateResources = result.resources!.get("styleTemplate:imported")
        expect(styleTemplateResources).toHaveLength(0)
      })
    })
  })

  describe("Subtitle Events", () => {
    describe("SubtitleAdded", () => {
      it("should add new subtitle to resources", () => {
        const event = {
          type: "SubtitleAdded" as const,
          payload: { subtitle_id: "subtitle-1", name: "Default Style" },
        }

        const result = handleBackendEvent(context, event)

        const subtitleResources = result.resources!.get("subtitle:imported")
        expect(subtitleResources).toHaveLength(1)
        expect(subtitleResources![0]).toEqual({
          id: "subtitle-1",
          name: "Default Style",
          type: "subtitle",
        })
      })
    })

    describe("SubtitleRemoved", () => {
      it("should remove subtitle from resources", () => {
        context.resources.set("subtitle:imported", [
          { id: "subtitle-1", name: "Default Style", type: "subtitle" } as Resource,
        ])

        const event = {
          type: "SubtitleRemoved" as const,
          payload: { subtitle_id: "subtitle-1" },
        }

        const result = handleBackendEvent(context, event)
        const subtitleResources = result.resources!.get("subtitle:imported")
        expect(subtitleResources).toHaveLength(0)
      })
    })
  })

  describe("Media Events (Unified Architecture)", () => {
    describe("MediaAdded", () => {
      it("should add new media to resources", () => {
        const event = {
          type: "MediaAdded" as const,
          payload: { media: { id: "media-1", name: "video.mp4" } },
        }

        const result = handleBackendEvent(context, event)

        const mediaResources = result.resources!.get("media:imported")
        expect(mediaResources).toHaveLength(1)
        expect(mediaResources![0]).toEqual({
          id: "media-1",
          name: "video.mp4",
          type: "media",
        })
      })

      it("should not add duplicate media", () => {
        context.resources.set("media:imported", [{ id: "media-1", name: "video.mp4", type: "media" } as Resource])

        const event = {
          type: "MediaAdded" as const,
          payload: { media: { id: "media-1", name: "video.mp4" } },
        }

        const result = handleBackendEvent(context, event)
        expect(result).toEqual({})
      })
    })

    describe("MediaRemoved", () => {
      it("should remove media from resources", () => {
        context.resources.set("media:imported", [{ id: "media-1", name: "video.mp4", type: "media" } as Resource])

        const event = {
          type: "MediaRemoved" as const,
          payload: { media_id: "media-1" },
        }

        const result = handleBackendEvent(context, event)
        const mediaResources = result.resources!.get("media:imported")
        expect(mediaResources).toHaveLength(0)
      })
    })
  })

  describe("Legacy ImportedMedia Events", () => {
    describe("ImportedMediaAdded", () => {
      it("should add imported media to resources", () => {
        const event = {
          type: "ImportedMediaAdded" as const,
          payload: { media: { id: "media-1", name: "video.mp4" } },
        }

        const result = handleBackendEvent(context, event)

        const mediaResources = result.resources!.get("media:imported")
        expect(mediaResources).toHaveLength(1)
        expect(mediaResources![0]).toEqual({
          id: "media-1",
          name: "video.mp4",
          type: "media",
        })
      })

      it("should not add duplicate imported media", () => {
        context.resources.set("media:imported", [{ id: "media-1", name: "video.mp4", type: "media" } as Resource])

        const event = {
          type: "ImportedMediaAdded" as const,
          payload: { media: { id: "media-1", name: "video.mp4" } },
        }

        const result = handleBackendEvent(context, event)
        expect(result).toEqual({})
      })
    })

    describe("ImportedMediaRemoved", () => {
      it("should remove imported media from resources", () => {
        context.resources.set("media:imported", [{ id: "media-1", name: "video.mp4", type: "media" } as Resource])

        const event = {
          type: "ImportedMediaRemoved" as const,
          payload: { media_id: "media-1" },
        }

        const result = handleBackendEvent(context, event)
        const mediaResources = result.resources!.get("media:imported")
        expect(mediaResources).toHaveLength(0)
      })
    })

    describe("ImportedMediaUpdated", () => {
      it("should trigger refresh for imported media", () => {
        const event = {
          type: "ImportedMediaUpdated" as const,
          payload: { media_id: "media-1" },
        }

        const result = handleBackendEvent(context, event)
        expect(result.shouldRefreshSource).toBe("imported")
      })
    })

    describe("ImportedMediaCleared", () => {
      it("should return empty result (no-op)", () => {
        const event = {
          type: "ImportedMediaCleared" as const,
          payload: {},
        }

        const result = handleBackendEvent(context, event)
        expect(result).toEqual({})
      })
    })
  })

  describe("Context Preservation", () => {
    it("should not mutate original context", () => {
      const originalResources = context.resources
      const originalLoadedSources = context.loadedSources

      const event = {
        type: "EffectAdded" as const,
        payload: { effect_id: "effect-1", name: "Blur" },
      }

      handleBackendEvent(context, event)

      expect(context.resources).toBe(originalResources)
      expect(context.loadedSources).toBe(originalLoadedSources)
    })

    it("should preserve existing resources when adding new ones", () => {
      context.resources.set("effect:imported", [{ id: "effect-1", name: "Blur", type: "effect" } as Resource])
      context.resources.set("filter:imported", [{ id: "filter-1", name: "Cinematic", type: "filter" } as Resource])

      const event = {
        type: "EffectAdded" as const,
        payload: { effect_id: "effect-2", name: "Sharpen" },
      }

      const result = handleBackendEvent(context, event)

      expect(result.resources!.get("filter:imported")).toHaveLength(1)
      expect(result.resources!.get("effect:imported")).toHaveLength(2)
    })
  })

  describe("Multiple Resources", () => {
    it("should handle adding multiple different resource types", () => {
      const currentContext = { ...context }

      const events = [
        { type: "EffectAdded" as const, payload: { effect_id: "effect-1", name: "Blur" } },
        { type: "FilterAdded" as const, payload: { filter_id: "filter-1", name: "Cinematic" } },
        { type: "TransitionAdded" as const, payload: { transition_id: "transition-1", name: "Fade" } },
        { type: "TemplateAdded" as const, payload: { template_id: "template-1", name: "Grid" } },
      ]

      events.forEach((event) => {
        const result = handleBackendEvent(currentContext, event)
        if (result.resources) {
          currentContext.resources = result.resources
        }
        if (result.loadedSources) {
          currentContext.loadedSources = result.loadedSources
        }
      })

      expect(currentContext.resources.get("effect:imported")).toHaveLength(1)
      expect(currentContext.resources.get("filter:imported")).toHaveLength(1)
      expect(currentContext.resources.get("transition:imported")).toHaveLength(1)
      expect(currentContext.resources.get("template:imported")).toHaveLength(1)
    })

    it("should handle removing resources from mixed collection", () => {
      context.resources.set("effect:imported", [
        { id: "effect-1", name: "Blur", type: "effect" } as Resource,
        { id: "effect-2", name: "Sharpen", type: "effect" } as Resource,
      ])
      context.resources.set("filter:imported", [{ id: "filter-1", name: "Cinematic", type: "filter" } as Resource])

      const removeEvent = {
        type: "EffectRemoved" as const,
        payload: { effect_id: "effect-1" },
      }

      const result = handleBackendEvent(context, removeEvent)

      expect(result.resources!.get("effect:imported")).toHaveLength(1)
      expect(result.resources!.get("filter:imported")).toHaveLength(1)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty payload", () => {
      const event = { type: "EffectAdded" as const, payload: { effect_id: "", name: "" } }

      expect(() => handleBackendEvent(context, event)).not.toThrow()
    })

    it("should handle undefined loadedSources", () => {
      const contextWithoutSources: BrowserResourcesContext = {
        resources: new Map(),
        loadedSources: new Set(),
        isLoading: false,
        error: null,
      }

      const event = {
        type: "EffectAdded" as const,
        payload: { effect_id: "effect-1", name: "Blur" },
      }

      const result = handleBackendEvent(contextWithoutSources, event)
      expect(result.loadedSources).toBeDefined()
    })

    it("should handle special characters in names", () => {
      const event = {
        type: "EffectAdded" as const,
        payload: { effect_id: "effect-1", name: "Test Effect 🎬 (Special)" },
      }

      const result = handleBackendEvent(context, event)
      const effectResources = result.resources!.get("effect:imported")
      expect(effectResources![0].name).toBe("Test Effect 🎬 (Special)")
    })
  })
})
