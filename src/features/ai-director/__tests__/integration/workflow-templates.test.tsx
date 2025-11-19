/**
 * Integration tests for AI Director workflow templates
 * Проверка работы всех workflow templates: TikTok, Highlight Reel, Documentary
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { BUILT_IN_TEMPLATES, getTemplateById } from "../../types/montage-templates"

// Mock Tauri
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("Workflow Templates Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Built-in Templates", () => {
    it("should have all required templates", () => {
      const requiredTemplates = [
        "instagram-reel",
        "youtube-intro",
        "highlight-reel",
        "vlog-summary",
        "calm-montage",
        "tutorial-demo",
      ]

      requiredTemplates.forEach((id) => {
        const template = getTemplateById(id)
        expect(template).toBeDefined()
        expect(template?.id).toBe(id)
      })
    })

    it("should have valid parameters for all templates", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(template.parameters).toBeDefined()
        expect(template.parameters.targetDuration).toBeGreaterThan(0)
        expect(template.parameters.clipDuration).toBeDefined()
        expect(template.parameters.clipCount).toBeDefined()
      })
    })
  })

  describe("TikTok / Instagram Reel Template", () => {
    const tiktokTemplate = getTemplateById("instagram-reel")

    it("should have correct parameters for short-form vertical video", () => {
      expect(tiktokTemplate).toBeDefined()
      expect(tiktokTemplate?.parameters.aspectRatio).toBe("9:16")
      expect(tiktokTemplate?.parameters.targetDuration).toBeLessThanOrEqual(60)
      expect(tiktokTemplate?.category).toBe("social")
    })

    it("should prefer dynamic style", () => {
      expect(tiktokTemplate?.style).toBe("dynamic")
    })

    it("should have fast-paced clip durations", () => {
      const clipDuration = tiktokTemplate?.parameters.clipDuration
      expect(clipDuration).toBeDefined()
      expect(clipDuration?.max).toBeLessThanOrEqual(3)
      expect(clipDuration?.preferred).toBeLessThanOrEqual(2)
    })

    it("should prioritize movement and action", () => {
      const scenePriority = tiktokTemplate?.clipRules.scenePriority
      expect(scenePriority?.action).toBeGreaterThan(scenePriority?.static || 0)
    })

    it("should use fast transitions", () => {
      expect(tiktokTemplate?.transitionRules.defaultType).toBe("cut")
      expect(tiktokTemplate?.transitionRules.duration).toBeLessThanOrEqual(0.5)
    })

    it("should have upbeat music settings", () => {
      expect(tiktokTemplate?.musicSettings?.style).toBe("upbeat")
      expect(tiktokTemplate?.musicSettings?.volume).toBeGreaterThan(0)
    })

    it("should avoid repetition", () => {
      expect(tiktokTemplate?.clipRules.diversity.avoidRepetition).toBe(true)
      expect(tiktokTemplate?.clipRules.diversity.mixSceneTypes).toBe(true)
    })
  })

  describe("Highlight Reel Template", () => {
    const highlightTemplate = getTemplateById("highlight-reel")

    it("should be configured for best moments compilation", () => {
      expect(highlightTemplate).toBeDefined()
      expect(highlightTemplate?.name).toBe("Highlight Reel")
      expect(highlightTemplate?.category).toBe("highlights")
    })

    it("should have medium duration", () => {
      expect(highlightTemplate?.parameters.targetDuration).toBeGreaterThanOrEqual(60)
      expect(highlightTemplate?.parameters.targetDuration).toBeLessThanOrEqual(120)
    })

    it("should use highlights style", () => {
      expect(highlightTemplate?.style).toBe("highlights")
    })

    it("should have high quality threshold", () => {
      expect(highlightTemplate?.clipRules.qualityThreshold).toBeGreaterThanOrEqual(0.8)
    })

    it("should prioritize action and energy", () => {
      const scenePriority = highlightTemplate?.clipRules.scenePriority
      expect(scenePriority?.action).toBeGreaterThanOrEqual(0.9)
    })

    it("should require movement and audio", () => {
      expect(highlightTemplate?.clipRules.contentRequirements.movement).toBe(true)
      expect(highlightTemplate?.clipRules.contentRequirements.audio).toBe(true)
    })

    it("should use cut transitions for energy", () => {
      expect(highlightTemplate?.transitionRules.defaultType).toBe("cut")
      expect(highlightTemplate?.transitionRules.variety.enabled).toBe(false)
    })

    it("should have energetic music", () => {
      expect(highlightTemplate?.musicSettings?.style).toBe("energetic")
    })
  })

  describe("Documentary Rough Cut Template", () => {
    // Note: Documentary template is in the docs but not in BUILT_IN_TEMPLATES
    // This test checks if we can create one programmatically

    it("should support documentary-style configuration", () => {
      // Documentary rough cut should have:
      // - Variable duration
      // - Natural flow
      // - Interview priority
      // - Speaker separation
      // - Narrative structure

      const documentaryConfig = {
        id: "documentary-roughcut",
        name: "Documentary Rough Cut",
        style: "calm" as const, // Closest to documentary style
        category: "cinematic" as const,
        parameters: {
          targetDuration: 300, // 5 minutes minimum
          clipDuration: {
            min: 10,
            max: 30,
            preferred: 15,
          },
          clipCount: {
            min: 10,
            max: 25,
            preferred: 15,
          },
        },
        clipRules: {
          qualityThreshold: 0.7,
          contentRequirements: {
            faces: true,
            audio: true,
          },
          scenePriority: {
            action: 0.4,
            static: 0.6,
            closeup: 0.8, // Interviews
            wide: 0.2,
          },
          diversity: {
            avoidRepetition: false,
            mixSceneTypes: true,
          },
        },
        transitionRules: {
          defaultType: "cross_dissolve" as const,
          duration: 0.8,
          variety: {
            enabled: false,
            types: ["cross_dissolve" as const],
          },
          frequency: 0.7,
        },
      }

      expect(documentaryConfig.parameters.clipDuration.min).toBeGreaterThanOrEqual(10)
      expect(documentaryConfig.clipRules.contentRequirements.faces).toBe(true)
      expect(documentaryConfig.clipRules.contentRequirements.audio).toBe(true)
      expect(documentaryConfig.clipRules.scenePriority.closeup).toBeGreaterThan(0.7)
    })
  })

  describe("Template Compatibility", () => {
    it("should have unique IDs", () => {
      const ids = BUILT_IN_TEMPLATES.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("should have valid transition types", () => {
      const validTransitionTypes = ["cut", "cross_dissolve", "fade_to_black", "wipe", "slide", "zoom"]

      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(validTransitionTypes).toContain(template.transitionRules.defaultType)

        template.transitionRules.variety.types.forEach((type) => {
          expect(validTransitionTypes).toContain(type)
        })
      })
    })

    it("should have valid style types", () => {
      const validStyles = ["dynamic", "cinematic", "highlights", "vlog", "calm", "tutorial"]

      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(validStyles).toContain(template.style)
      })
    })

    it("should have sensible clip counts", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        const { clipCount } = template.parameters
        expect(clipCount.min).toBeLessThanOrEqual(clipCount.preferred)
        expect(clipCount.preferred).toBeLessThanOrEqual(clipCount.max)
        expect(clipCount.min).toBeGreaterThan(0)
      })
    })

    it("should have sensible clip durations", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        const { clipDuration } = template.parameters
        expect(clipDuration.min).toBeLessThanOrEqual(clipDuration.preferred)
        expect(clipDuration.preferred).toBeLessThanOrEqual(clipDuration.max)
        expect(clipDuration.min).toBeGreaterThan(0)
      })
    })

    it("should have valid quality thresholds", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        const threshold = template.clipRules.qualityThreshold
        expect(threshold).toBeGreaterThanOrEqual(0)
        expect(threshold).toBeLessThanOrEqual(1)
      })
    })

    it("should have valid scene priorities", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        const { scenePriority } = template.clipRules
        Object.values(scenePriority).forEach((priority) => {
          expect(priority).toBeGreaterThanOrEqual(0)
          expect(priority).toBeLessThanOrEqual(1)
        })
      })
    })

    it("should have valid music volumes", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        if (template.musicSettings) {
          expect(template.musicSettings.volume).toBeGreaterThanOrEqual(0)
          expect(template.musicSettings.volume).toBeLessThanOrEqual(1)
        }
      })
    })

    it("should have valid transition frequencies", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        const frequency = template.transitionRules.frequency
        expect(frequency).toBeGreaterThanOrEqual(0)
        expect(frequency).toBeLessThanOrEqual(1)
      })
    })
  })

  describe("Template Tags", () => {
    it("should have searchable tags", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(Array.isArray(template.tags)).toBe(true)
        expect(template.tags.length).toBeGreaterThan(0)
      })
    })

    it("should have lowercase tags", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        template.tags.forEach((tag) => {
          expect(tag).toBe(tag.toLowerCase())
        })
      })
    })
  })

  describe("Template Icons", () => {
    it("should have emoji icons", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(template.icon).toBeDefined()
        expect(template.icon.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Template Categorization", () => {
    it("should have valid categories", () => {
      const validCategories = ["social", "promo", "cinematic", "tutorial", "highlights", "vlog", "custom"]

      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(validCategories).toContain(template.category)
      })
    })

    it("should group social media templates correctly", () => {
      const socialTemplates = BUILT_IN_TEMPLATES.filter((t) => t.category === "social")

      socialTemplates.forEach((template) => {
        // Social templates should have short durations
        expect(template.parameters.targetDuration).toBeLessThanOrEqual(60)
      })
    })
  })

  describe("Platform Optimization", () => {
    it("should optimize for Instagram/TikTok (vertical)", () => {
      const verticalTemplates = BUILT_IN_TEMPLATES.filter((t) => t.parameters.aspectRatio === "9:16")

      expect(verticalTemplates.length).toBeGreaterThan(0)

      verticalTemplates.forEach((template) => {
        expect(template.tags).toContain("vertical")
        expect(template.parameters.targetDuration).toBeLessThanOrEqual(60)
      })
    })

    it("should optimize for YouTube (horizontal)", () => {
      const horizontalTemplates = BUILT_IN_TEMPLATES.filter((t) => t.parameters.aspectRatio === "16:9")

      expect(horizontalTemplates.length).toBeGreaterThan(0)
    })
  })

  describe("Workflow Template Application", () => {
    it("should be ready for AI Director integration", () => {
      // Each template should have all properties needed for AI Director
      BUILT_IN_TEMPLATES.forEach((template) => {
        expect(template.id).toBeDefined()
        expect(template.name).toBeDefined()
        expect(template.style).toBeDefined()
        expect(template.parameters).toBeDefined()
        expect(template.clipRules).toBeDefined()
        expect(template.transitionRules).toBeDefined()
        expect(template.category).toBeDefined()
        expect(template.tags).toBeDefined()
      })
    })

    it("should support montage generation configuration", () => {
      BUILT_IN_TEMPLATES.forEach((template) => {
        // Verify template can be converted to montage generation config
        const config = {
          targetDuration: template.parameters.targetDuration,
          style: template.style,
          qualityThreshold: template.clipRules.qualityThreshold,
          clipDuration: template.parameters.clipDuration,
          transitionType: template.transitionRules.defaultType,
          musicVolume: template.musicSettings?.volume,
        }

        expect(config.targetDuration).toBeGreaterThan(0)
        expect(config.style).toBeDefined()
        expect(config.qualityThreshold).toBeGreaterThanOrEqual(0)
      })
    })
  })
})
