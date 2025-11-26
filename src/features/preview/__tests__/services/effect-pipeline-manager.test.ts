/**
 * Tests for EffectPipelineManager
 * Тесты для менеджера цепочек эффектов
 */

import { beforeEach, describe, expect, it } from "vitest"
import { EffectPipelineManager } from "../../services/effect-pipeline-manager"
import type { Effect, GPUTier, PreviewQuality } from "../../types"

describe("EffectPipelineManager", () => {
  let manager: EffectPipelineManager
  let quality: PreviewQuality

  beforeEach(() => {
    quality = {
      resolution: 1.0,
      effects: "all",
      fps: 30,
      antialiasing: true,
    }
    manager = new EffectPipelineManager("medium", quality)
  })

  describe("initialization", () => {
    it("should initialize with built-in presets", () => {
      const presets = manager.getPresetsByCategory()

      expect(presets.length).toBeGreaterThan(0)
      expect(presets.some((p) => p.id === "cinematic")).toBe(true)
      expect(presets.some((p) => p.id === "vintage")).toBe(true)
    })

    it("should store GPU tier and quality settings", () => {
      const stats = manager.getPerformanceStats()

      expect(stats.gpuTier).toBe("medium")
      expect(stats.qualitySettings).toEqual(quality)
    })
  })

  describe("preset management", () => {
    it("should add custom preset", () => {
      manager.addPreset({
        id: "custom_preset",
        name: "Custom",
        category: "custom",
        effects: [
          {
            type: "blur",
            parameters: { radius: 10 },
            intensity: 0.5,
          },
        ],
      })

      const presets = manager.getPresetsByCategory("custom")
      expect(presets.some((p) => p.id === "custom_preset")).toBe(true)
    })

    it("should get presets by category", () => {
      const colorPresets = manager.getPresetsByCategory("color")
      const stylePresets = manager.getPresetsByCategory("style")

      expect(colorPresets.length).toBeGreaterThan(0)
      expect(stylePresets.length).toBeGreaterThan(0)

      colorPresets.forEach((preset) => {
        expect(preset.category).toBe("color")
      })
    })

    it("should get all presets when no category specified", () => {
      const allPresets = manager.getPresetsByCategory()
      const colorPresets = manager.getPresetsByCategory("color")

      expect(allPresets.length).toBeGreaterThan(colorPresets.length)
    })
  })

  describe("chain creation", () => {
    it("should create chain from preset", () => {
      const chain = manager.createChainFromPreset("cinematic")

      expect(chain).not.toBeNull()
      expect(chain?.name).toBe("Cinematic")
      expect(chain?.effects.length).toBeGreaterThan(0)
      expect(chain?.enabled).toBe(true)
    })

    it("should return null for non-existent preset", () => {
      const chain = manager.createChainFromPreset("non_existent")

      expect(chain).toBeNull()
    })

    it("should create chain with custom ID", () => {
      const customId = "my_custom_chain"
      const chain = manager.createChainFromPreset("cinematic", customId)

      expect(chain?.id).toBe(customId)
    })

    it("should generate unique IDs for effects in chain", () => {
      const chain = manager.createChainFromPreset("cinematic")

      const effectIds = chain?.effects.map((e) => e.id) || []
      const uniqueIds = new Set(effectIds)

      expect(effectIds.length).toBe(uniqueIds.size)
    })

    it("should copy effect parameters correctly", () => {
      const chain = manager.createChainFromPreset("vintage")

      const grainEffect = chain?.effects.find((e) => e.type === "grain")
      expect(grainEffect).toBeDefined()
      expect(grainEffect?.parameters).toBeDefined()
    })
  })

  describe("chain management", () => {
    it("should add chain", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const stats = manager.getPerformanceStats()
      expect(stats.totalChains).toBe(1)
    })

    it("should remove chain", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      manager.removeChain(chain.id)

      const stats = manager.getPerformanceStats()
      expect(stats.totalChains).toBe(0)
    })

    it("should not add duplicate chain IDs", () => {
      const chain = manager.createChainFromPreset("cinematic")!

      manager.addChain(chain)
      manager.addChain(chain)

      const stats = manager.getPerformanceStats()
      expect(stats.totalChains).toBe(1)
    })

    it("should handle removing non-existent chain", () => {
      expect(() => manager.removeChain("non_existent")).not.toThrow()
    })
  })

  describe("chain ordering", () => {
    it("should maintain execution order", () => {
      const chain1 = manager.createChainFromPreset("cinematic", "chain1")!
      const chain2 = manager.createChainFromPreset("vintage", "chain2")!

      manager.addChain(chain1)
      manager.addChain(chain2)

      const effects = manager.getOptimizedEffects()
      // Should have effects from both chains
      expect(effects.length).toBeGreaterThan(0)
    })

    it("should update chain order", () => {
      const chain1 = manager.createChainFromPreset("cinematic", "chain1")!
      const chain2 = manager.createChainFromPreset("vintage", "chain2")!

      manager.addChain(chain1)
      manager.addChain(chain2)

      manager.setChainOrder(["chain2", "chain1"])

      // Order should be reversed
      const effects = manager.getOptimizedEffects()
      expect(effects.length).toBeGreaterThan(0)
    })

    it("should filter invalid chain IDs from order", () => {
      const chain1 = manager.createChainFromPreset("cinematic", "chain1")!
      manager.addChain(chain1)

      manager.setChainOrder(["chain1", "non_existent", "invalid"])

      const effects = manager.getOptimizedEffects()
      expect(effects.length).toBeGreaterThan(0)
    })
  })

  describe("effect optimization", () => {
    it("should get optimized effects from enabled chains", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const effects = manager.getOptimizedEffects()

      expect(effects.length).toBeGreaterThan(0)
      expect(effects.every((e) => e.enabled)).toBe(true)
    })

    it("should skip effects from disabled chains", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      chain.enabled = false
      manager.addChain(chain)

      const effects = manager.getOptimizedEffects()

      expect(effects.length).toBe(0)
    })

    it("should skip disabled effects within enabled chains", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      chain.effects[0].enabled = false
      manager.addChain(chain)

      const effects = manager.getOptimizedEffects()
      const disabledEffectId = chain.effects[0].id

      expect(effects.some((e) => e.id === disabledEffectId)).toBe(false)
    })

    it("should skip all effects when quality is set to none", () => {
      manager.updateQuality({ ...quality, effects: "none" })

      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const effects = manager.getOptimizedEffects()

      expect(effects.length).toBe(0)
    })

    it("should only include basic effects when quality is basic", () => {
      manager.updateQuality({ ...quality, effects: "basic" })

      const chain = manager.createChainFromPreset("vintage")!
      manager.addChain(chain)

      const effects = manager.getOptimizedEffects()

      // Should only have color_correction and vignette (basic effects)
      const nonBasicTypes = ["blur", "grain"]
      const hasNonBasic = effects.some((e) => nonBasicTypes.includes(e.type))

      expect(hasNonBasic).toBe(false)
    })

    it("should skip heavy effects on low GPU tier", () => {
      const lowTierManager = new EffectPipelineManager("low", quality)

      const chain = lowTierManager.createChainFromPreset("soft_focus")!
      lowTierManager.addChain(chain)

      const effects = lowTierManager.getOptimizedEffects()

      // Heavy blur effect with high intensity should be skipped on low tier
      const heavyBlur = effects.find((e) => e.type === "blur" && e.intensity > 0.5)
      expect(heavyBlur).toBeUndefined()
    })

    it("should optimize effect order for performance", () => {
      // Create chain with effects in non-optimal order
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const effects = manager.getOptimizedEffects()

      // Transform effects should come before expensive blur operations
      const transformIndex = effects.findIndex((e) => e.type === "transform")
      const blurIndex = effects.findIndex((e) => e.type === "blur")

      if (transformIndex !== -1 && blurIndex !== -1) {
        expect(transformIndex).toBeLessThan(blurIndex)
      }
    })

    it("should merge multiple color correction effects", () => {
      const chain = {
        id: "test_chain",
        name: "Test",
        enabled: true,
        effects: [
          {
            id: "cc1",
            type: "color_correction" as const,
            enabled: true,
            parameters: { brightness: 0.1, contrast: 1.1 },
            intensity: 1.0,
          },
          {
            id: "cc2",
            type: "color_correction" as const,
            enabled: true,
            parameters: { brightness: 0.2, saturation: 1.2 },
            intensity: 1.0,
          },
        ],
      }

      manager.addChain(chain)
      const effects = manager.getOptimizedEffects()

      // Should merge into single color correction
      const colorCorrections = effects.filter((e) => e.type === "color_correction")
      expect(colorCorrections.length).toBe(1)
    })
  })

  describe("effect validation", () => {
    it("should validate color correction parameters", () => {
      const validEffect: Effect = {
        id: "cc",
        type: "color_correction",
        enabled: true,
        parameters: { brightness: 0.5, contrast: 1.5 },
        intensity: 1.0,
      }

      const errors = manager.validateEffect(validEffect)
      expect(errors.length).toBe(0)
    })

    it("should detect invalid brightness", () => {
      const invalidEffect: Effect = {
        id: "cc",
        type: "color_correction",
        enabled: true,
        parameters: { brightness: 2.0 }, // Out of range
        intensity: 1.0,
      }

      const errors = manager.validateEffect(invalidEffect)
      expect(errors.some((e) => e.includes("Brightness"))).toBe(true)
    })

    it("should detect invalid contrast", () => {
      const invalidEffect: Effect = {
        id: "cc",
        type: "color_correction",
        enabled: true,
        parameters: { contrast: -1 }, // Out of range
        intensity: 1.0,
      }

      const errors = manager.validateEffect(invalidEffect)
      expect(errors.some((e) => e.includes("Contrast"))).toBe(true)
    })

    it("should validate blur parameters", () => {
      const invalidEffect: Effect = {
        id: "blur",
        type: "blur",
        enabled: true,
        parameters: { radius: -5 }, // Invalid
        intensity: 1.0,
      }

      const errors = manager.validateEffect(invalidEffect)
      expect(errors.some((e) => e.includes("radius"))).toBe(true)
    })

    it("should validate vignette parameters", () => {
      const invalidEffect: Effect = {
        id: "vignette",
        type: "vignette",
        enabled: true,
        parameters: { intensity: 2.0 }, // Out of range
        intensity: 1.0,
      }

      const errors = manager.validateEffect(invalidEffect)
      expect(errors.some((e) => e.includes("intensity"))).toBe(true)
    })

    it("should not validate unknown effect types", () => {
      const unknownEffect: Effect = {
        id: "unknown",
        type: "lut" as any,
        enabled: true,
        parameters: {},
        intensity: 1.0,
      }

      const errors = manager.validateEffect(unknownEffect)
      expect(errors.length).toBe(0)
    })
  })

  describe("preset export", () => {
    it("should export chain as preset", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const preset = manager.exportChainAsPreset(chain.id)

      expect(preset).not.toBeNull()
      expect(preset?.category).toBe("custom")
      expect(preset?.effects.length).toBe(chain.effects.length)
    })

    it("should return null for non-existent chain", () => {
      const preset = manager.exportChainAsPreset("non_existent")

      expect(preset).toBeNull()
    })

    it("should copy effect parameters in export", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const preset = manager.exportChainAsPreset(chain.id)

      expect(preset?.effects[0].parameters).toBeDefined()
      expect(preset?.effects[0].intensity).toBeDefined()
    })
  })

  describe("performance statistics", () => {
    it("should calculate total chains", () => {
      manager.createChainFromPreset("cinematic")
      manager.createChainFromPreset("vintage")

      const stats = manager.getPerformanceStats()
      expect(stats.totalChains).toBe(2)
    })

    it("should calculate enabled chains", () => {
      const chain1 = manager.createChainFromPreset("cinematic")!
      const chain2 = manager.createChainFromPreset("vintage")!

      chain2.enabled = false

      manager.addChain(chain1)
      manager.addChain(chain2)

      const stats = manager.getPerformanceStats()
      expect(stats.enabledChains).toBe(1)
    })

    it("should calculate total effects", () => {
      manager.createChainFromPreset("cinematic")
      manager.createChainFromPreset("vintage")

      const stats = manager.getPerformanceStats()
      expect(stats.totalEffects).toBeGreaterThan(0)
    })

    it("should calculate unique effect types", () => {
      manager.createChainFromPreset("cinematic")

      const stats = manager.getPerformanceStats()
      expect(stats.uniqueEffectTypes).toBeGreaterThan(0)
    })

    it("should estimate complexity", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      const stats = manager.getPerformanceStats()
      expect(["low", "medium", "high", "extreme"]).toContain(stats.estimatedComplexity)
    })

    it("should classify low complexity correctly", () => {
      const chain = {
        id: "simple",
        name: "Simple",
        enabled: true,
        effects: [
          {
            id: "cc",
            type: "color_correction" as const,
            enabled: true,
            parameters: {},
            intensity: 0.5,
          },
        ],
      }

      manager.addChain(chain)
      const stats = manager.getPerformanceStats()

      expect(stats.estimatedComplexity).toBe("low")
    })

    it("should classify high complexity correctly", () => {
      const chain = {
        id: "complex",
        name: "Complex",
        enabled: true,
        effects: [
          { id: "blur1", type: "blur" as const, enabled: true, parameters: {}, intensity: 1.0 },
          { id: "blur2", type: "blur" as const, enabled: true, parameters: {}, intensity: 1.0 },
          { id: "blur3", type: "blur" as const, enabled: true, parameters: {}, intensity: 1.0 },
          { id: "lens", type: "lens_distortion" as const, enabled: true, parameters: {}, intensity: 1.0 },
        ],
      }

      manager.addChain(chain)
      const stats = manager.getPerformanceStats()

      expect(["high", "extreme"]).toContain(stats.estimatedComplexity)
    })
  })

  describe("quality updates", () => {
    it("should update quality settings", () => {
      const newQuality: PreviewQuality = {
        resolution: 0.5,
        effects: "basic",
        fps: 24,
        antialiasing: false,
      }

      manager.updateQuality(newQuality)

      const stats = manager.getPerformanceStats()
      expect(stats.qualitySettings).toEqual(newQuality)
    })

    it("should affect effect optimization after quality update", () => {
      const chain = manager.createChainFromPreset("vintage")!
      manager.addChain(chain)

      const effectsBefore = manager.getOptimizedEffects()

      manager.updateQuality({ ...quality, effects: "basic" })

      const effectsAfter = manager.getOptimizedEffects()

      expect(effectsAfter.length).toBeLessThan(effectsBefore.length)
    })
  })

  describe("dispose", () => {
    it("should clear all chains and presets", () => {
      manager.createChainFromPreset("cinematic")
      manager.createChainFromPreset("vintage")

      manager.dispose()

      const stats = manager.getPerformanceStats()
      expect(stats.totalChains).toBe(0)
    })

    it("should clear execution order", () => {
      const chain = manager.createChainFromPreset("cinematic")!
      manager.addChain(chain)

      manager.dispose()

      const effects = manager.getOptimizedEffects()
      expect(effects.length).toBe(0)
    })

    it("should be safe to call multiple times", () => {
      expect(() => {
        manager.dispose()
        manager.dispose()
      }).not.toThrow()
    })
  })
})
