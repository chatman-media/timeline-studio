import { describe, expect, it } from "vitest"
import type { BaseEffect } from "../../types/unified-effects"
import {
  createFallbackEffect,
  processEffect,
  processEffects,
  validateEffect,
  validateEffectsData,
} from "../../utils/effect-processor"

describe("effect-processor", () => {
  const createRawEffect = (id: string, overrides: any = {}) => ({
    id,
    name: `Test Effect ${id}`,
    type: "color",
    duration: 1000,
    category: "color-correction",
    complexity: "basic",
    tags: ["test"],
    description: {
      ru: `Тестовый эффект ${id}`,
      en: `Test effect ${id}`,
    },
    ffmpegCommand: "eq=brightness={brightness}",
    cssFilter: "brightness({brightness})",
    params: {
      brightness: 1.0,
      contrast: 1.0,
    },
    previewPath: "/preview.png",
    labels: {
      ru: `Эффект ${id}`,
      en: `Effect ${id}`,
    },
    ...overrides,
  })

  describe("processEffect", () => {
    it("should process valid effect data", () => {
      const rawEffect = createRawEffect("test1")

      const result = processEffect(rawEffect)

      expect(result).toBeDefined()
      expect(result.id).toBe("effect_test1")
      expect(result.name).toEqual({
        en: "Effect test1",
        ru: "Эффект test1",
      })
      expect(result.category).toBe("color_correction")
      expect(result.parameters).toHaveLength(2)
      expect(result.processors).toBeDefined()
    })

    it("should throw on invalid effect data", () => {
      expect(() => processEffect(null as any)).toThrow()
      expect(() => processEffect(undefined as any)).toThrow()
      expect(() => processEffect({} as any)).toThrow()
    })

    it("should throw on missing required fields", () => {
      const invalidEffect = {
        name: "Test",
        // missing id
      }

      expect(() => processEffect(invalidEffect as any)).toThrow()
    })

    it("should convert parameters correctly", () => {
      const rawEffect = createRawEffect("test1", {
        params: {
          brightness: 1.2,
          saturation: 1.5,
          hue: 0,
        },
      })

      const result = processEffect(rawEffect)

      expect(result.parameters).toHaveLength(3)

      const brightness = result.parameters.find((p) => p.id === "brightness")
      expect(brightness).toBeDefined()
      expect(brightness?.type).toBe("number")
      expect(brightness?.defaultValue).toBe(1.2)
      expect(brightness?.animatable).toBe(true)

      const saturation = result.parameters.find((p) => p.id === "saturation")
      expect(saturation?.defaultValue).toBe(1.5)
    })

    it("should set parameter ranges for known parameters", () => {
      const rawEffect = createRawEffect("test1", {
        params: {
          brightness: 1.0,
          contrast: 1.0,
          saturation: 1.0,
          hue: 0,
        },
      })

      const result = processEffect(rawEffect)

      const brightness = result.parameters.find((p) => p.id === "brightness")
      expect(brightness?.min).toBeDefined()
      expect(brightness?.max).toBeDefined()
      expect(brightness?.step).toBeDefined()

      const hue = result.parameters.find((p) => p.id === "hue")
      expect(hue?.min).toBe(-180)
      expect(hue?.max).toBe(180)
    })

    it("should convert presets correctly", () => {
      const rawEffect = createRawEffect("test1", {
        presets: {
          preset1: {
            name: { en: "Preset 1", ru: "Пресет 1" },
            params: { brightness: 1.5 },
          },
          preset2: {
            name: { en: "Preset 2", ru: "Пресет 2" },
            params: { brightness: 0.5 },
          },
        },
      })

      const result = processEffect(rawEffect)

      expect(result.presets).toHaveLength(2)
      expect(result.presets[0].id).toBe("preset1")
      expect(result.presets[0].parameters).toEqual({ brightness: 1.5 })
    })

    it("should map old categories to new", () => {
      const testCases = [
        { old: "color-correction", new: "color_correction" },
        { old: "artistic", new: "stylize" },
        { old: "vintage", new: "stylize" },
        { old: "cinematic", new: "stylize" },
        { old: "technical", new: "color_correction" },
        { old: "motion", new: "motion" },
        { old: "distortion", new: "distort" },
      ]

      testCases.forEach(({ old, new: expected }) => {
        const rawEffect = createRawEffect("test", { category: old })
        const result = processEffect(rawEffect)
        expect(result.category).toBe(expected)
      })
    })

    it("should map complexity correctly", () => {
      const testCases = [
        { old: "basic", new: "low" },
        { old: "intermediate", new: "medium" },
        { old: "advanced", new: "high" },
      ]

      testCases.forEach(({ old, new: expected }) => {
        const rawEffect = createRawEffect("test", { complexity: old })
        const result = processEffect(rawEffect)
        expect(result.complexity).toBe(expected)
      })
    })

    it("should determine scope correctly", () => {
      // Temporal effects - only clip
      let rawEffect = createRawEffect("test", { type: "speed" })
      let result = processEffect(rawEffect)
      expect(result.scope).toEqual(["clip"])

      // Color correction - clip, track, sequence
      rawEffect = createRawEffect("test", { category: "color-correction" })
      result = processEffect(rawEffect)
      expect(result.scope).toContain("clip")
      expect(result.scope).toContain("track")

      // Default - clip, track
      rawEffect = createRawEffect("test", { category: "artistic" })
      result = processEffect(rawEffect)
      expect(result.scope).toContain("clip")
      expect(result.scope).toContain("track")
    })

    it("should determine processing type correctly", () => {
      // Realtime - CSS only
      let rawEffect = createRawEffect("test", { cssFilter: "blur(5px)", ffmpegCommand: undefined })
      let result = processEffect(rawEffect)
      expect(result.processingType).toBe("realtime")

      // Render - FFmpeg only
      rawEffect = createRawEffect("test", { cssFilter: undefined, ffmpegCommand: "blur=5" })
      result = processEffect(rawEffect)
      expect(result.processingType).toBe("render")

      // Hybrid - both
      rawEffect = createRawEffect("test", { cssFilter: "blur(5px)", ffmpegCommand: "blur=5" })
      result = processEffect(rawEffect)
      expect(result.processingType).toBe("hybrid")
    })

    it("should create processor functions", () => {
      const rawEffect = createRawEffect("test", {
        cssFilter: "brightness({brightness})",
        ffmpegCommand: "eq=brightness={brightness}",
      })

      const result = processEffect(rawEffect)

      expect(result.processors.css).toBeDefined()
      expect(result.processors.ffmpeg).toBeDefined()

      const cssFilter = result.processors.css?.filter({ brightness: 1.5 })
      expect(cssFilter).toBe("brightness(1.5)")

      const ffmpegFilter = result.processors.ffmpeg?.filter({ brightness: 0.2 })
      expect(ffmpegFilter).toBe("eq=brightness=0.2")
    })

    it("should handle missing optional fields", () => {
      const rawEffect = createRawEffect("test", {
        cssFilter: undefined,
        presets: undefined,
        previewPath: undefined,
      })

      const result = processEffect(rawEffect)

      expect(result).toBeDefined()
      expect(result.processors.css).toBeUndefined()
      expect(result.presets).toHaveLength(0)
    })

    it("should translate parameter names", () => {
      const rawEffect = createRawEffect("test", {
        params: {
          brightness: 1.0,
          contrast: 1.0,
          saturation: 1.0,
        },
      })

      const result = processEffect(rawEffect)

      const brightness = result.parameters.find((p) => p.id === "brightness")
      expect(brightness?.name.ru).toBe("Яркость")
      expect(brightness?.name.en).toContain("Brightness")

      const contrast = result.parameters.find((p) => p.id === "contrast")
      expect(contrast?.name.ru).toBe("Контраст")
    })
  })

  describe("processEffects", () => {
    it("should process array of effects", () => {
      const rawEffects = [createRawEffect("test1"), createRawEffect("test2"), createRawEffect("test3")]

      const results = processEffects(rawEffects)

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe("effect_test1")
      expect(results[1].id).toBe("effect_test2")
      expect(results[2].id).toBe("effect_test3")
    })

    it("should filter out invalid effects", () => {
      const rawEffects = [
        createRawEffect("test1"),
        null,
        createRawEffect("test2"),
        { invalid: "data" },
        createRawEffect("test3"),
      ]

      const results = processEffects(rawEffects as any)

      expect(results.length).toBeLessThan(5)
      expect(results.every((effect) => effect.id)).toBe(true)
    })

    it("should return empty array for non-array input", () => {
      const results = processEffects(null as any)

      expect(results).toEqual([])
    })

    it("should handle empty array", () => {
      const results = processEffects([])

      expect(results).toEqual([])
    })
  })

  describe("validateEffect", () => {
    it("should validate correct BaseEffect", () => {
      const effect: BaseEffect = {
        id: "test_effect",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: false,
        parameters: [],
        presets: [],
        processors: {
          css: {
            filter: () => "brightness(1)",
          },
        },
      }

      expect(validateEffect(effect)).toBe(true)
    })

    it("should reject invalid effect", () => {
      expect(validateEffect(null)).toBe(false)
      expect(validateEffect(undefined)).toBe(false)
      expect(validateEffect({})).toBe(false)
      expect(validateEffect("string")).toBe(false)
    })

    it("should reject effect missing required fields", () => {
      const incompleteEffect = {
        id: "test",
        name: { en: "Test" },
        // missing category, scope, etc.
      }

      expect(validateEffect(incompleteEffect)).toBe(false)
    })

    it("should validate all required fields", () => {
      const requiredFields = ["id", "name", "category", "scope", "processingType", "parameters", "processors"]

      requiredFields.forEach((field) => {
        const effect: any = {
          id: "test",
          name: { en: "Test" },
          category: "color_correction",
          scope: ["clip"],
          processingType: "realtime",
          parameters: [],
          processors: {},
        }

        delete effect[field]

        expect(validateEffect(effect)).toBe(false)
      })
    })
  })

  describe("validateEffectsData", () => {
    it("should validate correct effects data", () => {
      const data = {
        effects: [
          {
            id: "test1",
            name: { en: "Test 1" },
            category: "color_correction",
            scope: ["clip"],
            processingType: "realtime",
            parameters: [],
            processors: {},
          },
        ],
      }

      expect(validateEffectsData(data)).toBe(true)
    })

    it("should reject invalid data structure", () => {
      expect(validateEffectsData(null)).toBe(false)
      expect(validateEffectsData({})).toBe(false)
      expect(validateEffectsData({ effects: null })).toBe(false)
      expect(validateEffectsData({ effects: "not an array" })).toBe(false)
    })

    it("should validate all effects in array", () => {
      const data = {
        effects: [
          {
            id: "valid",
            name: { en: "Valid" },
            category: "color_correction",
            scope: ["clip"],
            processingType: "realtime",
            parameters: [],
            processors: {},
          },
          {
            id: "invalid",
            // missing required fields
          },
        ],
      }

      expect(validateEffectsData(data)).toBe(false)
    })

    it("should handle null effects in array", () => {
      const data = {
        effects: [
          {
            id: "test1",
            name: { en: "Test" },
            category: "color_correction",
            scope: ["clip"],
            processingType: "realtime",
            parameters: [],
            processors: {},
          },
          null,
          {
            id: "test2",
            name: { en: "Test" },
            category: "color_correction",
            scope: ["clip"],
            processingType: "realtime",
            parameters: [],
            processors: {},
          },
        ],
      }

      // Should filter null but still validate
      const result = validateEffectsData(data)
      expect(typeof result).toBe("boolean")
    })
  })

  describe("createFallbackEffect", () => {
    it("should create valid fallback effect", () => {
      const fallback = createFallbackEffect("missing_effect")

      expect(fallback.id).toBe("effect_missing_effect")
      expect(fallback.name.en).toBe("Unknown Effect")
      expect(fallback.name.ru).toBe("Неизвестный эффект")
      expect(validateEffect(fallback)).toBe(true)
    })

    it("should have working processors", () => {
      const fallback = createFallbackEffect("test")

      expect(fallback.processors.css).toBeDefined()
      expect(fallback.processors.ffmpeg).toBeDefined()

      const cssFilter = fallback.processors.css?.filter({})
      expect(cssFilter).toBe("brightness(1)")

      const ffmpegFilter = fallback.processors.ffmpeg?.filter({})
      expect(ffmpegFilter).toBe("null")
    })

    it("should have default parameter", () => {
      const fallback = createFallbackEffect("test")

      expect(fallback.parameters).toHaveLength(1)
      expect(fallback.parameters[0].id).toBe("intensity")
      expect(fallback.parameters[0].type).toBe("number")
      expect(fallback.parameters[0].defaultValue).toBe(1)
    })

    it("should be suitable as replacement", () => {
      const fallback = createFallbackEffect("test")

      expect(fallback.category).toBe("color_correction")
      expect(fallback.scope).toEqual(["clip"])
      expect(fallback.processingType).toBe("realtime")
      expect(fallback.complexity).toBe("low")
    })
  })

  describe("edge cases", () => {
    it("should handle effect with empty parameters", () => {
      const rawEffect = createRawEffect("test", { params: {} })

      const result = processEffect(rawEffect)

      expect(result.parameters).toHaveLength(0)
    })

    it("should handle effect with complex parameters", () => {
      const rawEffect = createRawEffect("test", {
        params: {
          number: 1.5,
          string: "test",
          boolean: true,
          object: { nested: "value" },
          array: [1, 2, 3],
        },
      })

      const result = processEffect(rawEffect)

      expect(result.parameters.length).toBeGreaterThan(0)
      expect(result.parameters.find((p) => p.id === "number")?.type).toBe("number")
      expect(result.parameters.find((p) => p.id === "boolean")?.type).toBe("boolean")
    })

    it("should handle effects with special characters in names", () => {
      const rawEffect = createRawEffect("test-special_chars@123", {
        name: "Effect with special & characters",
      })

      const result = processEffect(rawEffect)

      expect(result).toBeDefined()
      expect(result.id).toContain("test-special_chars@123")
    })

    it("should handle missing description", () => {
      const rawEffect = createRawEffect("test", { description: undefined })

      const result = processEffect(rawEffect)

      expect(result.description).toBeUndefined()
    })

    it("should handle effects with very long parameter lists", () => {
      const params: any = {}
      for (let i = 0; i < 50; i++) {
        params[`param${i}`] = i
      }

      const rawEffect = createRawEffect("test", { params })

      const result = processEffect(rawEffect)

      expect(result.parameters).toHaveLength(50)
    })
  })
})
