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
        name: "Color Correction",
        category: "color_correction",
        scope: ["clip"],
        parameters: [
          { id: "brightness", name: "Brightness", type: "number", defaultValue: 0.0, min: -1, max: 1 },
          { id: "contrast", name: "Contrast", type: "number", defaultValue: 1.0, min: 0, max: 3 },
          { id: "saturation", name: "Saturation", type: "number", defaultValue: 1.0, min: 0, max: 3 },
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
        name: "Gaussian Blur",
        category: "blur_sharpen",
        scope: ["clip"],
        parameters: [{ id: "radius", name: "Radius", type: "number", defaultValue: 5, min: 0, max: 50 }],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const appliedEffect: AppliedEffect = {
        id: "applied_blur_1",
        effectId: "blur_gaussian",
        targetId: "clip_1",
        targetType: "clip",
        enabled: false,
        parameters: [{ parameterId: "radius", value: 15 }],
        timestamp: Date.now(),
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
        name: "Gaussian Blur",
        category: "blur_sharpen",
        scope: ["clip"],
        parameters: [
          { id: "radius", name: "Radius", type: "number", defaultValue: 10, min: 0, max: 50 },
          { id: "blur_type", name: "Type", type: "string", defaultValue: "gaussian" },
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
        name: "Glow",
        category: "lighting",
        scope: ["clip"],
        parameters: [
          { id: "glow_intensity", name: "Intensity", type: "number", defaultValue: 0.5, min: 0, max: 1 },
          { id: "glow_radius", name: "Radius", type: "number", defaultValue: 20, min: 0, max: 100 },
          { id: "glow_threshold", name: "Threshold", type: "number", defaultValue: 0.5, min: 0, max: 1 },
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
        name: "Digital Glitch",
        category: "stylize",
        scope: ["clip"],
        parameters: [
          { id: "glitch_type", name: "Type", type: "string", defaultValue: "digital" },
          { id: "glitch_amount", name: "Amount", type: "number", defaultValue: 0.5, min: 0, max: 1 },
          { id: "glitch_frequency", name: "Frequency", type: "number", defaultValue: 0.1, min: 0, max: 1 },
          { id: "block_size", name: "Block Size", type: "number", defaultValue: 10, min: 1, max: 100 },
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
        name: "Kodak Film",
        category: "stylize",
        scope: ["clip"],
        parameters: [
          { id: "film_type", name: "Film Type", type: "string", defaultValue: "kodak" },
          { id: "grain_amount", name: "Grain", type: "number", defaultValue: 0.3, min: 0, max: 1 },
          { id: "vignette_intensity", name: "Vignette", type: "number", defaultValue: 0.2, min: 0, max: 1 },
          { id: "color_shift", name: "Color Shift", type: "number", defaultValue: 0.5, min: 0, max: 1 },
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
        name: "2D Transform",
        category: "transform",
        scope: ["clip"],
        parameters: [
          { id: "scale_x", name: "Scale X", type: "number", defaultValue: 1.0, min: 0.1, max: 5 },
          { id: "scale_y", name: "Scale Y", type: "number", defaultValue: 1.0, min: 0.1, max: 5 },
          { id: "rotation", name: "Rotation", type: "number", defaultValue: 0, min: -360, max: 360 },
          { id: "position_x", name: "Position X", type: "number", defaultValue: 0 },
          { id: "position_y", name: "Position Y", type: "number", defaultValue: 0 },
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
        name: "Chroma Key",
        category: "keying",
        scope: ["clip"],
        parameters: [
          { id: "key_color", name: "Key Color", type: "color", defaultValue: [0, 255, 0] },
          { id: "threshold", name: "Threshold", type: "number", defaultValue: 0.4, min: 0, max: 1 },
          { id: "smoothness", name: "Smoothness", type: "number", defaultValue: 0.1, min: 0, max: 1 },
          { id: "spill_suppression", name: "Spill", type: "number", defaultValue: 0.2, min: 0, max: 1 },
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
        name: "Test",
        category: "color_correction",
        scope: ["clip"],
        parameters: [
          { id: "intensity", name: "Intensity", type: "number", defaultValue: 0.8, min: 0, max: 1 },
          { id: "mix", name: "Mix", type: "number", defaultValue: 0.6, min: 0, max: 1 },
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
          name: "Test",
          category: "stylize",
          scope: ["clip"],
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
          name: "Test",
          category: "color_correction",
          scope: scope as any,
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
          name: "Effect 1",
          category: "color_correction",
          scope: ["clip"],
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
        {
          id: "effect2",
          name: "Effect 2",
          category: "blur_sharpen",
          scope: ["clip"],
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
          name: "Color Correction",
          category: "color_correction",
          scope: ["clip"],
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
          name: "Color Effect",
          category: "color_correction",
          scope: ["clip"],
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
          name: "Blur",
          category: "blur_sharpen",
          scope: ["clip"],
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
        name: "Test",
        category: "color_correction",
        scope: ["clip"],
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
        name: "Vignette",
        category: "lighting",
        scope: ["clip"],
        parameters: [
          { id: "intensity", name: "Intensity", type: "number", defaultValue: 0.6, min: 0, max: 1 },
          { id: "smoothness", name: "Smoothness", type: "number", defaultValue: 0.8, min: 0, max: 1 },
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
        name: "Film Grain",
        category: "noise_grain",
        scope: ["clip"],
        parameters: [
          { id: "grain_amount", name: "Amount", type: "number", defaultValue: 0.2, min: 0, max: 1 },
          { id: "grain_size", name: "Size", type: "number", defaultValue: 1.5, min: 0.5, max: 3 },
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
        name: "Color Grading",
        category: "color_grading",
        scope: ["clip"],
        parameters: [
          { id: "lift_r", name: "Lift R", type: "number", defaultValue: 0.1 },
          { id: "lift_g", name: "Lift G", type: "number", defaultValue: 0.2 },
          { id: "lift_b", name: "Lift B", type: "number", defaultValue: 0.3 },
          { id: "lift_luminance", name: "Lift Luminance", type: "number", defaultValue: 0.05 },
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
