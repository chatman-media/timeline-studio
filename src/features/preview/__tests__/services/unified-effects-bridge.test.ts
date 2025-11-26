/**
 * Tests for UnifiedEffectsBridge
 * Тесты для моста между унифицированной системой эффектов и preview
 */

import { describe, expect, it, vi } from "vitest"
import type { AppliedEffect, BaseEffect } from "@/features/effects/types/unified-effects"
import { UnifiedEffectsBridge } from "../../services/unified-effects-bridge"

// Mock EffectManager
const createMockEffectManager = () => ({
  getAllEffects: vi.fn().mockReturnValue([]),
  getEffectsByCategory: vi.fn().mockReturnValue([]),
  getEffectById: vi.fn(),
  addEffect: vi.fn(),
  removeEffect: vi.fn(),
  updateEffect: vi.fn(),
  applyEffect: vi.fn(),
  removeAppliedEffect: vi.fn(),
  getAppliedEffects: vi.fn(),
})

describe("UnifiedEffectsBridge", () => {
  describe("convertToPreviewEffect", () => {
    it("should convert color correction effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "color_correct_basic",
        name: { en: "Color Correction", ru: "Цветокоррекция" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          {
            id: "brightness",
            name: { en: "Brightness", ru: "Яркость" },
            type: "number",
            defaultValue: 0.0,
            min: -1,
            max: 1,
          },
          {
            id: "contrast",
            name: { en: "Contrast", ru: "Контраст" },
            type: "number",
            defaultValue: 1.0,
            min: 0,
            max: 3,
          },
          {
            id: "saturation",
            name: { en: "Saturation", ru: "Насыщенность" },
            type: "number",
            defaultValue: 1.0,
            min: 0,
            max: 3,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("color_correction")
      expect(result.enabled).toBe(true)
      expect(result.parameters).toHaveProperty("brightness")
      expect(result.parameters).toHaveProperty("contrast")
      expect(result.parameters).toHaveProperty("saturation")
    })

    it("should apply custom parameters from applied effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "blur_gaussian",
        name: { en: "Gaussian Blur", ru: "Гауссово размытие" },
        category: "blur_sharpen",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "radius", name: { en: "Radius", ru: "Радиус" }, type: "number", defaultValue: 5, min: 0, max: 50 },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const appliedEffect: AppliedEffect = {
        id: "applied_blur_1",
        effectId: "blur_gaussian",
        enabled: false,
        parameters: { radius: 15 },
        startTime: 0,
        order: 0,
        keyframes: {},
        masks: [],
        blendMode: "normal",
        opacity: 1,
        effectVersion: "1.0.0",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }

      const result = bridge.convertToPreviewEffect(baseEffect, appliedEffect)

      expect(result.enabled).toBe(false)
      expect(result.parameters.radius).toBe(15)
      expect(result.id).toBe("applied_blur_1")
    })

    it("should convert blur effect correctly", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "blur_gaussian",
        name: { en: "Gaussian Blur", ru: "Гауссово размытие" },
        category: "blur_sharpen",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "radius", name: { en: "Radius", ru: "Радиус" }, type: "number", defaultValue: 10, min: 0, max: 50 },
          { id: "blur_type", name: { en: "Type", ru: "Тип" }, type: "text", defaultValue: "gaussian" },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("blur")
      expect(result.parameters.radius).toBe(10)
      expect(result.parameters.type).toBe("gaussian")
    })

    it("should convert glow effect with color", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "glow_effect",
        name: { en: "Glow", ru: "Свечение" },
        category: "lighting",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          {
            id: "glow_intensity",
            name: { en: "Intensity", ru: "Интенсивность" },
            type: "number",
            defaultValue: 0.5,
            min: 0,
            max: 1,
          },
          {
            id: "glow_radius",
            name: { en: "Radius", ru: "Радиус" },
            type: "number",
            defaultValue: 20,
            min: 0,
            max: 100,
          },
          {
            id: "glow_threshold",
            name: { en: "Threshold", ru: "Порог" },
            type: "number",
            defaultValue: 0.5,
            min: 0,
            max: 1,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("glow")
      expect(result.parameters.intensity).toBe(0.5)
      expect(result.parameters.radius).toBe(20)
      expect(result.parameters.threshold).toBe(0.5)
    })

    it("should convert glitch effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "glitch_digital",
        name: { en: "Digital Glitch", ru: "Цифровой глитч" },
        category: "stylize",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "glitch_type", name: { en: "Type", ru: "Тип" }, type: "text", defaultValue: "digital" },
          {
            id: "glitch_amount",
            name: { en: "Amount", ru: "Количество" },
            type: "number",
            defaultValue: 0.5,
            min: 0,
            max: 1,
          },
          {
            id: "glitch_frequency",
            name: { en: "Frequency", ru: "Частота" },
            type: "number",
            defaultValue: 0.1,
            min: 0,
            max: 1,
          },
          {
            id: "block_size",
            name: { en: "Block Size", ru: "Размер блока" },
            type: "number",
            defaultValue: 10,
            min: 1,
            max: 100,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("glitch")
      expect(result.parameters.type).toBe("digital")
      expect(result.parameters.intensity).toBe(0.5)
      expect(result.parameters.frequency).toBe(0.1)
    })

    it("should convert film emulation effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "film_kodak",
        name: { en: "Kodak Film", ru: "Плёнка Kodak" },
        category: "stylize",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "film_type", name: { en: "Film Type", ru: "Тип плёнки" }, type: "text", defaultValue: "kodak" },
          {
            id: "grain_amount",
            name: { en: "Grain", ru: "Зернистость" },
            type: "number",
            defaultValue: 0.3,
            min: 0,
            max: 1,
          },
          {
            id: "vignette_intensity",
            name: { en: "Vignette", ru: "Виньетка" },
            type: "number",
            defaultValue: 0.2,
            min: 0,
            max: 1,
          },
          {
            id: "color_shift",
            name: { en: "Color Shift", ru: "Сдвиг цвета" },
            type: "number",
            defaultValue: 0.5,
            min: 0,
            max: 1,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("film_emulation")
      expect(result.parameters.type).toBe("kodak")
      expect(result.parameters.grain).toBe(0.3)
      expect(result.parameters.vignette).toBe(0.2)
    })

    it("should convert transform effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "transform_2d",
        name: { en: "2D Transform", ru: "2D Трансформация" },
        category: "transform",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          {
            id: "scale_x",
            name: { en: "Scale X", ru: "Масштаб X" },
            type: "number",
            defaultValue: 1.0,
            min: 0.1,
            max: 5,
          },
          {
            id: "scale_y",
            name: { en: "Scale Y", ru: "Масштаб Y" },
            type: "number",
            defaultValue: 1.0,
            min: 0.1,
            max: 5,
          },
          {
            id: "rotation",
            name: { en: "Rotation", ru: "Поворот" },
            type: "number",
            defaultValue: 0,
            min: -360,
            max: 360,
          },
          { id: "position_x", name: { en: "Position X", ru: "Позиция X" }, type: "number", defaultValue: 0 },
          { id: "position_y", name: { en: "Position Y", ru: "Позиция Y" }, type: "number", defaultValue: 0 },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("transform")
      expect(result.parameters.scaleX).toBe(1.0)
      expect(result.parameters.scaleY).toBe(1.0)
      expect(result.parameters.rotation).toBe(0)
      expect(result.parameters.translateX).toBe(0)
      expect(result.parameters.translateY).toBe(0)
    })

    it("should convert chroma key effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "chroma_key",
        name: { en: "Chroma Key", ru: "Хромакей" },
        category: "keying",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "key_color", name: { en: "Key Color", ru: "Ключевой цвет" }, type: "color", defaultValue: [0, 255, 0] },
          {
            id: "threshold",
            name: { en: "Threshold", ru: "Порог" },
            type: "number",
            defaultValue: 0.4,
            min: 0,
            max: 1,
          },
          {
            id: "smoothness",
            name: { en: "Smoothness", ru: "Сглаживание" },
            type: "number",
            defaultValue: 0.1,
            min: 0,
            max: 1,
          },
          {
            id: "spill_suppression",
            name: { en: "Spill", ru: "Подавление переливов" },
            type: "number",
            defaultValue: 0.2,
            min: 0,
            max: 1,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("chroma_key")
      expect(result.parameters.keyColor).toEqual([0, 255, 0])
      expect(result.parameters.threshold).toBe(0.4)
      expect(result.parameters.spill).toBe(0.2)
    })

    it("should handle intensity and mix parameters", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "test_effect",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          {
            id: "intensity",
            name: { en: "Intensity", ru: "Интенсивность" },
            type: "number",
            defaultValue: 0.8,
            min: 0,
            max: 1,
          },
          { id: "mix", name: { en: "Mix", ru: "Смешение" }, type: "number", defaultValue: 0.6, min: 0, max: 1 },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      // Should prefer intensity over mix
      expect(result.intensity).toBe(0.8)
    })

    it("should detect effect type from ID", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const testCases = [
        { id: "blur_gaussian", expectedType: "blur" },
        { id: "sharpen_basic", expectedType: "sharpen" },
        { id: "glow_soft", expectedType: "glow" },
        { id: "shadow_drop", expectedType: "shadow" },
        { id: "glitch_analog", expectedType: "glitch" },
        { id: "cartoon_style", expectedType: "cartoon" },
        { id: "chromatic_aberration", expectedType: "chromatic_aberration" },
        { id: "depth_of_field", expectedType: "depth_of_field" },
      ]

      testCases.forEach(({ id, expectedType }) => {
        const baseEffect: BaseEffect = {
          id,
          name: { en: "Test", ru: "Тест" },
          category: "stylize",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        }

        const result = bridge.convertToPreviewEffect(baseEffect)
        expect(result.type).toBe(expectedType)
      })
    })

    it("should map scope correctly", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const testCases = [
        { scope: ["clip"], expected: "clip" },
        { scope: ["track"], expected: "track" },
        { scope: ["sequence"], expected: "track" }, // sequence maps to track
        { scope: ["global"], expected: "global" },
      ]

      testCases.forEach(({ scope, expected }) => {
        const baseEffect: BaseEffect = {
          id: "test",
          name: { en: "Test", ru: "Тест" },
          category: "color_correction",
          scope: scope as any,
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        }

        const result = bridge.convertToPreviewEffect(baseEffect)
        expect(result.scope).toBe(expected)
      })
    })
  })

  describe("getAllPreviewEffects", () => {
    it("should get all effects from manager", () => {
      const mockEffects: BaseEffect[] = [
        {
          id: "effect1",
          name: { en: "Effect 1", ru: "Эффект 1" },
          category: "color_correction",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
        {
          id: "effect2",
          name: { en: "Effect 2", ru: "Эффект 2" },
          category: "blur_sharpen",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
      ]

      const effectManager = createMockEffectManager()
      effectManager.getAllEffects.mockReturnValue(mockEffects)

      const bridge = new UnifiedEffectsBridge(effectManager as any)
      const results = bridge.getAllPreviewEffects()

      expect(results.length).toBe(2)
      expect(effectManager.getAllEffects).toHaveBeenCalled()
    })

    it("should convert all effects to preview format", () => {
      const mockEffects: BaseEffect[] = [
        {
          id: "color_correct",
          name: { en: "Color Correction", ru: "Цветокоррекция" },
          category: "color_correction",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
      ]

      const effectManager = createMockEffectManager()
      effectManager.getAllEffects.mockReturnValue(mockEffects)

      const bridge = new UnifiedEffectsBridge(effectManager as any)
      const results = bridge.getAllPreviewEffects()

      expect(results[0].type).toBe("color_correction")
      expect(results[0].enabled).toBe(true)
    })
  })

  describe("getEffectsByCategory", () => {
    it("should get effects by category", () => {
      const mockEffects: BaseEffect[] = [
        {
          id: "color_effect",
          name: { en: "Color Effect", ru: "Цветовой эффект" },
          category: "color_correction",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
      ]

      const effectManager = createMockEffectManager()
      effectManager.getEffectsByCategory.mockReturnValue(mockEffects)

      const bridge = new UnifiedEffectsBridge(effectManager as any)
      const results = bridge.getEffectsByCategory("color_correction")

      expect(results.length).toBe(1)
      expect(effectManager.getEffectsByCategory).toHaveBeenCalledWith("color_correction")
    })

    it("should convert category effects to preview format", () => {
      const mockEffects: BaseEffect[] = [
        {
          id: "blur",
          name: { en: "Blur", ru: "Размытие" },
          category: "blur_sharpen",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "low",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
      ]

      const effectManager = createMockEffectManager()
      effectManager.getEffectsByCategory.mockReturnValue(mockEffects)

      const bridge = new UnifiedEffectsBridge(effectManager as any)
      const results = bridge.getEffectsByCategory("blur_sharpen")

      expect(results[0].type).toBe("blur")
    })
  })

  describe("parameter conversion edge cases", () => {
    it("should handle missing default parameters", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "test",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.parameters).toBeDefined()
      expect(result.parameters.brightness).toBe(0)
      expect(result.parameters.contrast).toBe(1)
    })

    it("should handle vignette effect", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "vignette",
        name: { en: "Vignette", ru: "Виньетка" },
        category: "lighting",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          {
            id: "intensity",
            name: { en: "Intensity", ru: "Интенсивность" },
            type: "number",
            defaultValue: 0.6,
            min: 0,
            max: 1,
          },
          {
            id: "smoothness",
            name: { en: "Smoothness", ru: "Сглаживание" },
            type: "number",
            defaultValue: 0.8,
            min: 0,
            max: 1,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("vignette")
      expect(result.parameters.intensity).toBe(0.6)
      expect(result.parameters.smoothness).toBe(0.8)
    })

    it("should handle grain effect with time parameter", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "grain",
        name: { en: "Film Grain", ru: "Зернистость плёнки" },
        category: "noise_grain",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          {
            id: "grain_amount",
            name: { en: "Amount", ru: "Количество" },
            type: "number",
            defaultValue: 0.2,
            min: 0,
            max: 1,
          },
          { id: "grain_size", name: { en: "Size", ru: "Размер" }, type: "number", defaultValue: 1.5, min: 0.5, max: 3 },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("grain")
      expect(result.parameters.amount).toBe(0.2)
      expect(result.parameters.size).toBe(1.5)
      expect(result.parameters.time).toBeDefined()
    })

    it("should handle color grading with lift/gamma/gain", () => {
      const effectManager = createMockEffectManager()
      const bridge = new UnifiedEffectsBridge(effectManager as any)

      const baseEffect: BaseEffect = {
        id: "color_grading",
        name: { en: "Color Grading", ru: "Цветокоррекция" },
        category: "color_grading",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "lift_r", name: { en: "Lift R", ru: "Подъём R" }, type: "number", defaultValue: 0.1 },
          { id: "lift_g", name: { en: "Lift G", ru: "Подъём G" }, type: "number", defaultValue: 0.2 },
          { id: "lift_b", name: { en: "Lift B", ru: "Подъём B" }, type: "number", defaultValue: 0.3 },
          {
            id: "lift_luminance",
            name: { en: "Lift Luminance", ru: "Подъём яркости" },
            type: "number",
            defaultValue: 0.05,
          },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = bridge.convertToPreviewEffect(baseEffect)

      expect(result.type).toBe("color_grading")
      expect(result.parameters.lift).toEqual({
        r: 0.1,
        g: 0.2,
        b: 0.3,
        luminance: 0.05,
      })
    })
  })
})
