import { beforeEach, describe, expect, it } from "vitest"

import { TemplateValidator } from "../../services/template-validator"
import type { ProjectTemplate } from "../../types/project-template"

describe("TemplateValidator", () => {
  let validator: TemplateValidator
  let validTemplate: ProjectTemplate

  beforeEach(() => {
    validator = new TemplateValidator()

    validTemplate = {
      id: "test-template",
      name: { en: "Test Template", ru: "Тестовый шаблон" },
      description: { en: "Test description", ru: "Тестовое описание" },
      category: "youtube",
      aspectRatio: "16:9",
      estimatedDuration: 600,
      settings: {
        resolution: "1920x1080",
        frameRate: "30",
        aspectRatio: {
          label: "16:9",
          textLabel: "Широкоэкнранный",
          description: "YouTube",
          value: {
            width: 1920,
            height: 1080,
            name: "16:9",
          },
        },
        colorSpace: "sdr",
      },
      structure: {
        sections: [
          {
            id: "section-1",
            type: "intro",
            name: { en: "Intro", ru: "Интро" },
            duration: 5,
            position: 0,
          },
          {
            id: "section-2",
            type: "content",
            name: { en: "Content", ru: "Контент" },
            duration: 10,
            position: 5,
          },
        ],
        tracks: [
          { id: "track-1", type: "video", name: "Video Track" },
          { id: "track-2", type: "audio", name: "Audio Track" },
        ],
      },
      placeholders: {},
    } as unknown as ProjectTemplate
  })

  describe("validate", () => {
    it("should validate correct template", () => {
      const result = validator.validate(validTemplate)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should collect all errors and warnings", () => {
      const result = validator.validate(validTemplate)

      expect(result).toHaveProperty("valid")
      expect(result).toHaveProperty("errors")
      expect(result).toHaveProperty("warnings")
    })
  })

  describe("basic fields validation", () => {
    it("should require template id", () => {
      const template = { ...validTemplate, id: "" }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "id")).toBe(true)
    })

    it("should require English name", () => {
      const template = { ...validTemplate, name: { en: "", ru: "Тест" } }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "name.en")).toBe(true)
    })

    it("should require Russian name", () => {
      const template = { ...validTemplate, name: { en: "Test", ru: "" } }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "name.ru")).toBe(true)
    })

    it("should require category", () => {
      const template = { ...validTemplate, category: undefined as any }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "category")).toBe(true)
    })

    it("should require aspect ratio", () => {
      const template = { ...validTemplate, aspectRatio: undefined as any }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "aspectRatio")).toBe(true)
    })

    it("should require positive duration", () => {
      const template = { ...validTemplate, estimatedDuration: 0 }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "estimatedDuration")).toBe(true)
    })
  })

  describe("structure validation", () => {
    it("should require structure object", () => {
      const template = { ...validTemplate, structure: undefined as any }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "structure")).toBe(true)
    })

    it("should require at least one section", () => {
      const template = {
        ...validTemplate,
        structure: { ...validTemplate.structure, sections: [] },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "structure.sections")).toBe(true)
    })

    it("should require at least one track", () => {
      const template = {
        ...validTemplate,
        structure: { ...validTemplate.structure, tracks: [] },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "structure.tracks")).toBe(true)
    })

    it("should warn if no video track", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          tracks: [{ id: "track-1", type: "audio" as const, name: "Audio Only" }],
        },
      } as unknown as ProjectTemplate
      const result = validator.validate(template)

      expect(result.warnings.some((w) => w.field === "structure.tracks")).toBe(true)
    })
  })

  describe("sections validation", () => {
    it("should require section id", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "",
              type: "intro" as const,
              name: { en: "Test", ru: "Тест" },
              duration: 5,
              position: 0,
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("sections[0].id"))).toBe(true)
    })

    it("should detect duplicate section IDs", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "duplicate",
              type: "intro" as const,
              name: { en: "Section 1", ru: "Секция 1" },
              duration: 5,
              position: 0,
            },
            {
              id: "duplicate",
              type: "content" as const,
              name: { en: "Section 2", ru: "Секция 2" },
              duration: 5,
              position: 5,
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes("Duplicate section ID"))).toBe(true)
    })

    it("should require section name", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "section-1",
              type: "intro" as const,
              name: { en: "", ru: "" },
              duration: 5,
              position: 0,
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("sections[0].name"))).toBe(true)
    })

    it("should require positive section duration", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "section-1",
              type: "intro" as const,
              name: { en: "Test", ru: "Тест" },
              duration: 0,
              position: 0,
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("sections[0].duration"))).toBe(true)
    })

    it("should not allow negative section position", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "section-1",
              type: "intro" as const,
              name: { en: "Test", ru: "Тест" },
              duration: 5,
              position: -1,
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("sections[0].position"))).toBe(true)
    })

    it("should detect overlapping sections", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "section-1",
              type: "intro" as const,
              name: { en: "Intro", ru: "Интро" },
              duration: 10,
              position: 0,
            },
            {
              id: "section-2",
              type: "content" as const,
              name: { en: "Content", ru: "Контент" },
              duration: 5,
              position: 5, // Overlaps with section-1
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes("overlap"))).toBe(true)
    })

    it("should warn about very short sections", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          sections: [
            {
              id: "section-1",
              type: "intro" as const,
              name: { en: "Short", ru: "Короткая" },
              duration: 0.5,
              position: 0,
            },
          ],
        },
      }
      const result = validator.validate(template)

      expect(result.warnings.some((w) => w.message.includes("very short"))).toBe(true)
    })
  })

  describe("tracks validation", () => {
    it("should require track id", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          tracks: [{ id: "", type: "video" as const, name: "Test" }],
        },
      } as unknown as ProjectTemplate
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("tracks[0].id"))).toBe(true)
    })

    it("should detect duplicate track IDs", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          tracks: [
            { id: "duplicate", type: "video" as const, name: "Track 1" },
            { id: "duplicate", type: "audio" as const, name: "Track 2" },
          ],
        },
      } as unknown as ProjectTemplate
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes("Duplicate track ID"))).toBe(true)
    })

    it("should require track type", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          tracks: [{ id: "track-1", type: "" as any, name: "Test" }],
        },
      } as unknown as ProjectTemplate
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("tracks[0].type"))).toBe(true)
    })

    it("should require track name", () => {
      const template = {
        ...validTemplate,
        structure: {
          ...validTemplate.structure,
          tracks: [{ id: "track-1", type: "video" as const, name: "" }],
        },
      } as unknown as ProjectTemplate
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes("tracks[0].name"))).toBe(true)
    })
  })

  describe("settings validation", () => {
    it("should require settings object", () => {
      const template = { ...validTemplate, settings: undefined as any }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "settings")).toBe(true)
    })

    it("should require resolution", () => {
      const template = {
        ...validTemplate,
        settings: { ...validTemplate.settings, resolution: undefined as any },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "settings.resolution")).toBe(true)
    })

    it("should require valid resolution format", () => {
      const template = {
        ...validTemplate,
        settings: {
          ...validTemplate.settings,
          resolution: "invalid",
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "settings.resolution")).toBe(true)
    })

    it("should warn about unusual resolution", () => {
      const template = {
        ...validTemplate,
        settings: {
          ...validTemplate.settings,
          resolution: "800x600",
        },
      }
      const result = validator.validate(template)

      expect(result.warnings.some((w) => w.field === "settings.resolution")).toBe(true)
      expect(result.warnings.some((w) => w.message.includes("Unusual resolution"))).toBe(true)
    })

    it("should require frame rate", () => {
      const template = {
        ...validTemplate,
        settings: { ...validTemplate.settings, frameRate: undefined as any },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "settings.frameRate")).toBe(true)
    })

    it("should warn about unusual frame rate", () => {
      const template = {
        ...validTemplate,
        settings: { ...validTemplate.settings, frameRate: "48" },
      } as unknown as ProjectTemplate
      const result = validator.validate(template)

      expect(result.warnings.some((w) => w.field === "settings.frameRate")).toBe(true)
    })

    it("should require aspect ratio object", () => {
      const template = {
        ...validTemplate,
        settings: { ...validTemplate.settings, aspectRatio: undefined as any },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "settings.aspectRatio")).toBe(true)
    })

    it("should require color space", () => {
      const template = {
        ...validTemplate,
        settings: { ...validTemplate.settings, colorSpace: undefined as any },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "settings.colorSpace")).toBe(true)
    })
  })

  describe("placeholders validation", () => {
    it("should require positive intro duration", () => {
      const template = {
        ...validTemplate,
        placeholders: {
          intro: { duration: 0, templateId: "intro-1" },
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "placeholders.intro.duration")).toBe(true)
    })

    it("should require positive outro duration", () => {
      const template = {
        ...validTemplate,
        placeholders: {
          outro: { duration: -1, templateId: "outro-1" },
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "placeholders.outro.duration")).toBe(true)
    })

    it("should require positive main content min duration", () => {
      const template = {
        ...validTemplate,
        placeholders: {
          mainContent: { minDuration: 0 },
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "placeholders.mainContent.minDuration")).toBe(true)
    })

    it("should validate max duration is not less than min", () => {
      const template = {
        ...validTemplate,
        placeholders: {
          mainContent: { minDuration: 100, maxDuration: 50 },
        },
      }
      const result = validator.validate(template)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === "placeholders.mainContent.maxDuration")).toBe(true)
    })
  })

  describe("quickValidate", () => {
    it("should return true for valid template", () => {
      const result = validator.quickValidate(validTemplate)

      expect(result).toBe(true)
    })

    it("should return false for invalid template", () => {
      const invalidTemplate = { ...validTemplate, id: "" }
      const result = validator.quickValidate(invalidTemplate)

      expect(result).toBe(false)
    })

    it("should return false for template without structure", () => {
      const invalidTemplate = { ...validTemplate, structure: undefined as any }
      const result = validator.quickValidate(invalidTemplate)

      expect(result).toBe(false)
    })

    it("should return false for template without sections", () => {
      const invalidTemplate = {
        ...validTemplate,
        structure: { ...validTemplate.structure, sections: [] },
      }
      const result = validator.quickValidate(invalidTemplate)

      expect(result).toBe(false)
    })
  })
})
