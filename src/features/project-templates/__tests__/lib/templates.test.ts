import { describe, expect, it } from "vitest"

import {
  allProjectTemplates,
  getProjectTemplateById,
  getProjectTemplatesByAspectRatio,
  getProjectTemplatesByCategory,
  getProjectTemplatesByPlatform,
  projectTemplatesByCategory,
  projectTemplatesByPlatform,
} from "../../lib/templates"

describe("templates library", () => {
  describe("allProjectTemplates", () => {
    it("should export array of templates", () => {
      expect(Array.isArray(allProjectTemplates)).toBe(true)
      expect(allProjectTemplates.length).toBeGreaterThan(0)
    })

    it("should have templates with required fields", () => {
      allProjectTemplates.forEach((template) => {
        expect(template).toHaveProperty("id")
        expect(template).toHaveProperty("name")
        expect(template).toHaveProperty("category")
        expect(template).toHaveProperty("settings")
        expect(template).toHaveProperty("structure")
      })
    })

    it("should have unique template IDs", () => {
      const ids = allProjectTemplates.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("should have both English and Russian names", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.name.en).toBeTruthy()
        expect(template.name.ru).toBeTruthy()
      })
    })
  })

  describe("projectTemplatesByCategory", () => {
    it("should group templates by category", () => {
      expect(projectTemplatesByCategory).toHaveProperty("youtube")
      expect(projectTemplatesByCategory).toHaveProperty("social")
      expect(projectTemplatesByCategory).toHaveProperty("podcast")
    })

    it("should have youtube templates", () => {
      expect(projectTemplatesByCategory.youtube.length).toBeGreaterThan(0)
      // YouTube templates can include tutorial category
      projectTemplatesByCategory.youtube.forEach((template) => {
        expect(["youtube", "tutorial"]).toContain(template.category)
      })
    })

    it("should have social templates", () => {
      expect(projectTemplatesByCategory.social.length).toBeGreaterThan(0)
      projectTemplatesByCategory.social.forEach((template) => {
        expect(template.category).toBe("social")
      })
    })

    it("should have podcast templates", () => {
      expect(projectTemplatesByCategory.podcast.length).toBeGreaterThan(0)
      projectTemplatesByCategory.podcast.forEach((template) => {
        expect(template.category).toBe("podcast")
      })
    })

    it("should have tutorial templates subset", () => {
      expect(Array.isArray(projectTemplatesByCategory.tutorial)).toBe(true)
      projectTemplatesByCategory.tutorial.forEach((template) => {
        expect(template.category).toBe("tutorial")
      })
    })
  })

  describe("projectTemplatesByPlatform", () => {
    it("should group templates by platform", () => {
      expect(projectTemplatesByPlatform).toHaveProperty("youtube")
      expect(projectTemplatesByPlatform).toHaveProperty("instagram")
      expect(projectTemplatesByPlatform).toHaveProperty("tiktok")
      expect(projectTemplatesByPlatform).toHaveProperty("facebook")
      expect(projectTemplatesByPlatform).toHaveProperty("twitter")
      expect(projectTemplatesByPlatform).toHaveProperty("custom")
    })

    it("should filter youtube platform templates", () => {
      projectTemplatesByPlatform.youtube.forEach((template) => {
        expect(template.targetPlatform).toBe("youtube")
      })
    })

    it("should filter instagram platform templates", () => {
      projectTemplatesByPlatform.instagram.forEach((template) => {
        expect(template.targetPlatform).toBe("instagram")
      })
    })

    it("should filter tiktok platform templates", () => {
      projectTemplatesByPlatform.tiktok.forEach((template) => {
        expect(template.targetPlatform).toBe("tiktok")
      })
    })
  })

  describe("getProjectTemplateById", () => {
    it("should find template by id", () => {
      const firstTemplate = allProjectTemplates[0]
      const found = getProjectTemplateById(firstTemplate.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(firstTemplate.id)
    })

    it("should return undefined for non-existent id", () => {
      const found = getProjectTemplateById("non-existent-id")

      expect(found).toBeUndefined()
    })

    it("should find all templates by their IDs", () => {
      allProjectTemplates.forEach((template) => {
        const found = getProjectTemplateById(template.id)
        expect(found).toBeDefined()
        expect(found?.id).toBe(template.id)
      })
    })
  })

  describe("getProjectTemplatesByCategory", () => {
    it("should filter templates by category", () => {
      const youtubeTemplates = getProjectTemplatesByCategory("youtube")

      expect(Array.isArray(youtubeTemplates)).toBe(true)
      youtubeTemplates.forEach((template) => {
        expect(template.category).toBe("youtube")
      })
    })

    it("should return empty array for non-existent category", () => {
      const templates = getProjectTemplatesByCategory("non-existent" as any)

      expect(templates).toEqual([])
    })

    it("should filter social templates", () => {
      const socialTemplates = getProjectTemplatesByCategory("social")

      expect(socialTemplates.length).toBeGreaterThan(0)
      socialTemplates.forEach((template) => {
        expect(template.category).toBe("social")
      })
    })

    it("should filter podcast templates", () => {
      const podcastTemplates = getProjectTemplatesByCategory("podcast")

      expect(podcastTemplates.length).toBeGreaterThan(0)
      podcastTemplates.forEach((template) => {
        expect(template.category).toBe("podcast")
      })
    })
  })

  describe("getProjectTemplatesByPlatform", () => {
    it("should filter templates by platform", () => {
      const youtubeTemplates = getProjectTemplatesByPlatform("youtube")

      expect(Array.isArray(youtubeTemplates)).toBe(true)
      youtubeTemplates.forEach((template) => {
        expect(template.targetPlatform).toBe("youtube")
      })
    })

    it("should return empty array for non-existent platform", () => {
      const templates = getProjectTemplatesByPlatform("non-existent-platform")

      expect(templates).toEqual([])
    })

    it("should filter instagram templates", () => {
      const instagramTemplates = getProjectTemplatesByPlatform("instagram")

      instagramTemplates.forEach((template) => {
        expect(template.targetPlatform).toBe("instagram")
      })
    })

    it("should filter tiktok templates", () => {
      const tiktokTemplates = getProjectTemplatesByPlatform("tiktok")

      tiktokTemplates.forEach((template) => {
        expect(template.targetPlatform).toBe("tiktok")
      })
    })
  })

  describe("getProjectTemplatesByAspectRatio", () => {
    it("should filter templates by aspect ratio", () => {
      const wideTemplates = getProjectTemplatesByAspectRatio("16:9")

      expect(Array.isArray(wideTemplates)).toBe(true)
      wideTemplates.forEach((template) => {
        expect(template.aspectRatio).toBe("16:9")
      })
    })

    it("should filter vertical templates", () => {
      const verticalTemplates = getProjectTemplatesByAspectRatio("9:16")

      verticalTemplates.forEach((template) => {
        expect(template.aspectRatio).toBe("9:16")
      })
    })

    it("should filter square templates", () => {
      const squareTemplates = getProjectTemplatesByAspectRatio("1:1")

      squareTemplates.forEach((template) => {
        expect(template.aspectRatio).toBe("1:1")
      })
    })

    it("should return empty array for non-existent aspect ratio", () => {
      const templates = getProjectTemplatesByAspectRatio("21:9")

      expect(templates).toEqual([])
    })
  })

  describe("template structure validation", () => {
    it("should have sections in all templates", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.structure.sections).toBeDefined()
        expect(Array.isArray(template.structure.sections)).toBe(true)
        expect(template.structure.sections.length).toBeGreaterThan(0)
      })
    })

    it("should have tracks in all templates", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.structure.tracks).toBeDefined()
        expect(Array.isArray(template.structure.tracks)).toBe(true)
        expect(template.structure.tracks.length).toBeGreaterThan(0)
      })
    })

    it("should have valid section IDs", () => {
      allProjectTemplates.forEach((template) => {
        const sectionIds = template.structure.sections.map((s) => s.id)
        const uniqueIds = new Set(sectionIds)
        expect(uniqueIds.size).toBe(sectionIds.length)
      })
    })

    it("should have valid track IDs", () => {
      allProjectTemplates.forEach((template) => {
        const trackIds = template.structure.tracks.map((t) => t.id)
        const uniqueIds = new Set(trackIds)
        expect(uniqueIds.size).toBe(trackIds.length)
      })
    })
  })

  describe("template settings validation", () => {
    it("should have resolution settings as string", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.settings.resolution).toBeDefined()
        expect(typeof template.settings.resolution).toBe("string")
        expect(template.settings.resolution).toMatch(/^\d+x\d+$/)
      })
    })

    it("should have frame rate settings as string", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.settings.frameRate).toBeDefined()
        expect(typeof template.settings.frameRate).toBe("string")
      })
    })

    it("should have aspect ratio settings as object", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.settings.aspectRatio).toBeDefined()
        expect(typeof template.settings.aspectRatio).toBe("object")
        expect(template.settings.aspectRatio.label).toBeDefined()
        expect(template.settings.aspectRatio.value).toBeDefined()
      })
    })

    it("should have valid aspect ratio label matching template aspect ratio", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.settings.aspectRatio.label).toBe(template.aspectRatio)
      })
    })

    it("should have valid aspect ratio for vertical templates", () => {
      const verticalTemplates = allProjectTemplates.filter((t) => t.aspectRatio === "9:16")

      verticalTemplates.forEach((template) => {
        expect(template.settings.aspectRatio.value.width).toBeLessThan(template.settings.aspectRatio.value.height)
      })
    })

    it("should have valid aspect ratio for horizontal templates", () => {
      const horizontalTemplates = allProjectTemplates.filter((t) => t.aspectRatio === "16:9")

      horizontalTemplates.forEach((template) => {
        expect(template.settings.aspectRatio.value.width).toBeGreaterThan(template.settings.aspectRatio.value.height)
      })
    })

    it("should have color space settings", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.settings.colorSpace).toBeDefined()
        expect(typeof template.settings.colorSpace).toBe("string")
      })
    })
  })

  describe("template duration validation", () => {
    it("should have positive estimated duration", () => {
      allProjectTemplates.forEach((template) => {
        expect(template.estimatedDuration).toBeGreaterThan(0)
      })
    })

    it("should have sections that fit within estimated duration", () => {
      allProjectTemplates.forEach((template) => {
        template.structure.sections.forEach((section) => {
          const sectionEnd = section.position + section.duration
          expect(sectionEnd).toBeLessThanOrEqual(template.estimatedDuration)
        })
      })
    })

    it("should have non-overlapping sections", () => {
      allProjectTemplates.forEach((template) => {
        const sections = [...template.structure.sections].sort((a, b) => a.position - b.position)

        for (let i = 0; i < sections.length - 1; i++) {
          const currentEnd = sections[i].position + sections[i].duration
          const nextStart = sections[i + 1].position
          expect(currentEnd).toBeLessThanOrEqual(nextStart)
        }
      })
    })
  })
})
