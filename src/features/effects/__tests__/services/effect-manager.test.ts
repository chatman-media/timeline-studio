import { beforeEach, describe, expect, it, vi } from "vitest"
import { EffectManager } from "../../services/effect-manager"
import type { BaseEffect, AppliedEffect, EffectStack } from "../../types/unified-effects"

describe("EffectManager", () => {
  let manager: EffectManager

  beforeEach(() => {
    manager = new EffectManager()
  })

  const createMockEffect = (id: string, scope: any[] = ["clip"]): BaseEffect => ({
    id,
    name: { en: `Effect ${id}`, ru: `Эффект ${id}` },
    category: "color_correction",
    scope,
    processingType: "realtime",
    version: "1.0.0",
    tags: ["test"],
    complexity: "low",
    gpuAccelerated: true,
    parameters: [
      {
        id: "intensity",
        name: { en: "Intensity", ru: "Интенсивность" },
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
        animatable: true,
        visible: true,
        enabled: true,
      },
      {
        id: "color",
        name: { en: "Color", ru: "Цвет" },
        type: "color",
        defaultValue: "#ffffff",
        animatable: false,
        visible: true,
        enabled: true,
      },
    ],
    presets: [
      {
        id: "preset1",
        name: { en: "Preset 1", ru: "Пресет 1" },
        parameters: { intensity: 75 },
        tags: [],
      },
    ],
    processors: {
      css: {
        filter: () => "brightness(1)",
      },
    },
  })

  describe("effect registration", () => {
    it("should register single effect", () => {
      const effect = createMockEffect("test1")

      manager.registerEffect(effect)

      const effects = manager.getAllEffects()
      expect(effects).toHaveLength(1)
      expect(effects[0].id).toBe("test1")
    })

    it("should register multiple effects", () => {
      const effects = [createMockEffect("test1"), createMockEffect("test2"), createMockEffect("test3")]

      manager.registerEffects(effects)

      expect(manager.getAllEffects()).toHaveLength(3)
    })

    it("should update existing effect on re-registration", () => {
      const effect1 = createMockEffect("test1")
      const effect2 = { ...createMockEffect("test1"), name: { en: "Updated", ru: "Обновлено" } }

      manager.registerEffect(effect1)
      manager.registerEffect(effect2)

      const effects = manager.getAllEffects()
      expect(effects).toHaveLength(1)
      expect(effects[0].name.en).toBe("Updated")
    })
  })

  describe("effect retrieval", () => {
    beforeEach(() => {
      manager.registerEffects([
        createMockEffect("blur", ["clip", "track"]),
        createMockEffect("color", ["clip"]),
        { ...createMockEffect("sharpen", ["track"]), category: "blur_sharpen" },
      ])
    })

    it("should get all effects", () => {
      const effects = manager.getAllEffects()

      expect(effects).toHaveLength(3)
    })

    it("should get effects by category", () => {
      const effects = manager.getEffectsByCategory("color_correction")

      expect(effects).toHaveLength(2)
      expect(effects.every((e) => e.category === "color_correction")).toBe(true)
    })

    it("should get effects by scope", () => {
      const clipEffects = manager.getEffectsByScope("clip")
      const trackEffects = manager.getEffectsByScope("track")

      expect(clipEffects).toHaveLength(2)
      expect(trackEffects).toHaveLength(2)
    })
  })

  describe("effect search", () => {
    beforeEach(() => {
      manager.registerEffects([
        { ...createMockEffect("gaussian_blur"), name: { en: "Gaussian Blur", ru: "Гауссово размытие" }, tags: ["blur"] },
        { ...createMockEffect("motion_blur"), name: { en: "Motion Blur", ru: "Размытие в движении" }, tags: ["blur", "motion"] },
        { ...createMockEffect("color_correct"), name: { en: "Color Correction", ru: "Цветокоррекция" }, tags: ["color"] },
      ])
    })

    it("should search by name (English)", () => {
      const results = manager.searchEffects("blur")

      expect(results).toHaveLength(2)
      expect(results.every((e) => e.name.en.toLowerCase().includes("blur"))).toBe(true)
    })

    it("should search by name (Russian)", () => {
      const results = manager.searchEffects("размытие")

      expect(results.length).toBeGreaterThan(0)
    })

    it("should search by tags", () => {
      const results = manager.searchEffects("motion")

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("motion_blur")
    })

    it("should return all effects for empty query", () => {
      const results = manager.searchEffects("")

      expect(results).toHaveLength(3)
    })

    it("should filter by category", () => {
      const results = manager.searchEffects("", { category: "color_correction" })

      expect(results.every((e) => e.category === "color_correction")).toBe(true)
    })

    it("should filter by scope", () => {
      const results = manager.searchEffects("", { scope: "clip" })

      expect(results.every((e) => e.scope.includes("clip"))).toBe(true)
    })

    it("should filter by complexity", () => {
      manager.registerEffect({ ...createMockEffect("advanced"), complexity: "high" })

      const results = manager.searchEffects("", { complexity: ["high"] })

      expect(results.every((e) => e.complexity === "high")).toBe(true)
    })

    it("should filter by GPU acceleration", () => {
      manager.registerEffect({ ...createMockEffect("cpu_effect"), gpuAccelerated: false })

      const gpuResults = manager.searchEffects("", { gpuAccelerated: true })
      const cpuResults = manager.searchEffects("", { gpuAccelerated: false })

      expect(gpuResults.every((e) => e.gpuAccelerated === true)).toBe(true)
      expect(cpuResults.every((e) => e.gpuAccelerated === false)).toBe(true)
    })

    it("should combine multiple filters", () => {
      const results = manager.searchEffects("blur", {
        category: "color_correction",
        scope: "clip",
      })

      expect(results.every((e) => e.category === "color_correction")).toBe(true)
      expect(results.every((e) => e.scope.includes("clip"))).toBe(true)
    })
  })

  describe("applying effects", () => {
    beforeEach(() => {
      manager.registerEffect(createMockEffect("test_effect"))
    })

    it("should apply effect to target", () => {
      const applied = manager.applyEffect("test_effect", "clip1", "clip")

      expect(applied).toBeDefined()
      expect(applied.effectId).toBe("test_effect")
      expect(applied.enabled).toBe(true)
    })

    it("should throw on non-existent effect", () => {
      expect(() => manager.applyEffect("missing", "clip1", "clip")).toThrow()
    })

    it("should throw on incompatible scope", () => {
      manager.registerEffect({ ...createMockEffect("track_only"), scope: ["track"] })

      expect(() => manager.applyEffect("track_only", "clip1", "clip")).toThrow()
    })

    it("should apply with custom parameters", () => {
      const applied = manager.applyEffect("test_effect", "clip1", "clip", {
        parameters: { intensity: 75 },
      })

      expect(applied.parameters.intensity).toBe(75)
    })

    it("should apply with time range", () => {
      const applied = manager.applyEffect("test_effect", "clip1", "clip", {
        startTime: 1000,
        duration: 5000,
      })

      expect(applied.startTime).toBe(1000)
      expect(applied.duration).toBe(5000)
    })

    it("should set default parameters", () => {
      const applied = manager.applyEffect("test_effect", "clip1", "clip")

      expect(applied.parameters.intensity).toBe(50) // default value
      expect(applied.parameters.color).toBe("#ffffff") // default value
    })

    it("should merge custom parameters with defaults", () => {
      const applied = manager.applyEffect("test_effect", "clip1", "clip", {
        parameters: { intensity: 90 },
      })

      expect(applied.parameters.intensity).toBe(90) // custom
      expect(applied.parameters.color).toBe("#ffffff") // default
    })

    it("should assign unique IDs to applied effects", () => {
      const applied1 = manager.applyEffect("test_effect", "clip1", "clip")
      const applied2 = manager.applyEffect("test_effect", "clip1", "clip")

      expect(applied1.id).not.toBe(applied2.id)
    })

    it("should add applied effect to stack", () => {
      manager.applyEffect("test_effect", "clip1", "clip")

      const stack = manager.getEffectStack("clip1")
      expect(stack?.effects).toHaveLength(1)
    })
  })

  describe("removing effects", () => {
    it("should remove applied effect", () => {
      const applied = manager.applyEffect("test_effect", "clip1", "clip")
      manager.removeAppliedEffect(applied.id)

      const stack = manager.getEffectStack("clip1")
      expect(stack?.effects).toHaveLength(0)
    })

    it("should handle removing non-existent effect", () => {
      expect(() => manager.removeAppliedEffect("missing")).not.toThrow()
    })
  })

  describe("parameter management", () => {
    let appliedEffect: AppliedEffect

    beforeEach(() => {
      manager.registerEffect(createMockEffect("test_effect"))
      appliedEffect = manager.applyEffect("test_effect", "clip1", "clip")
    })

    it("should set parameter value", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 90)

      expect(appliedEffect.parameters.intensity).toBe(90)
    })

    it("should add keyframe", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 100, true, 5000)

      expect(appliedEffect.keyframes.intensity).toHaveLength(1)
      expect(appliedEffect.keyframes.intensity[0].value).toBe(100)
      expect(appliedEffect.keyframes.intensity[0].time).toBe(5000)
    })

    it("should sort keyframes by time", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 100, true, 5000)
      manager.setEffectParameter(appliedEffect.id, "intensity", 50, true, 2000)
      manager.setEffectParameter(appliedEffect.id, "intensity", 75, true, 3500)

      const keyframes = appliedEffect.keyframes.intensity
      expect(keyframes[0].time).toBe(2000)
      expect(keyframes[1].time).toBe(3500)
      expect(keyframes[2].time).toBe(5000)
    })

    it("should get parameter value at time with no keyframes", () => {
      const value = manager.getEffectParameterAtTime(appliedEffect.id, "intensity", 5000)

      expect(value).toBe(50) // default value
    })

    it("should get parameter value before first keyframe", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 100, true, 5000)

      const value = manager.getEffectParameterAtTime(appliedEffect.id, "intensity", 2000)

      expect(value).toBe(100) // first keyframe value
    })

    it("should get parameter value after last keyframe", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 100, true, 5000)

      const value = manager.getEffectParameterAtTime(appliedEffect.id, "intensity", 8000)

      expect(value).toBe(100) // last keyframe value
    })

    it("should interpolate between keyframes", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 0, true, 0)
      manager.setEffectParameter(appliedEffect.id, "intensity", 100, true, 10)

      const value = manager.getEffectParameterAtTime(appliedEffect.id, "intensity", 5)

      expect(value).toBe(50) // linear interpolation
    })

    it("should handle hold interpolation", () => {
      manager.setEffectParameter(appliedEffect.id, "intensity", 25, true, 0)
      const keyframes = appliedEffect.keyframes.intensity
      keyframes[0].interpolation = "hold"
      manager.setEffectParameter(appliedEffect.id, "intensity", 75, true, 10)

      const value = manager.getEffectParameterAtTime(appliedEffect.id, "intensity", 5)

      expect(value).toBe(25) // hold value
    })
  })

  describe("effect stacks", () => {
    it("should create effect stack", () => {
      const stack = manager.createEffectStack("clip1", "Test Stack")

      expect(stack.id).toBe("clip1")
      expect(stack.name).toBe("Test Stack")
      expect(stack.effects).toEqual([])
      expect(stack.enabled).toBe(true)
    })

    it("should get effect stack", () => {
      manager.createEffectStack("clip1")

      const stack = manager.getEffectStack("clip1")

      expect(stack).toBeDefined()
      expect(stack?.id).toBe("clip1")
    })

    it("should return undefined for non-existent stack", () => {
      const stack = manager.getEffectStack("missing")

      expect(stack).toBeUndefined()
    })

    it("should auto-create stack when applying effect", () => {
      manager.registerEffect(createMockEffect("test"))
      manager.applyEffect("test", "clip1", "clip")

      const stack = manager.getEffectStack("clip1")

      expect(stack).toBeDefined()
    })

    it("should maintain effect order in stack", () => {
      manager.registerEffect(createMockEffect("test"))

      const effect1 = manager.applyEffect("test", "clip1", "clip", { order: 2 })
      const effect2 = manager.applyEffect("test", "clip1", "clip", { order: 0 })
      const effect3 = manager.applyEffect("test", "clip1", "clip", { order: 1 })

      const stack = manager.getEffectStack("clip1")!
      expect(stack.effects[0].id).toBe(effect2.id)
      expect(stack.effects[1].id).toBe(effect3.id)
      expect(stack.effects[2].id).toBe(effect1.id)
    })

    it("should reorder effects", () => {
      manager.registerEffect(createMockEffect("test"))

      const effect1 = manager.applyEffect("test", "clip1", "clip")
      const effect2 = manager.applyEffect("test", "clip1", "clip")
      const effect3 = manager.applyEffect("test", "clip1", "clip")

      manager.reorderEffects("clip1", [effect3.id, effect1.id, effect2.id])

      const stack = manager.getEffectStack("clip1")!
      expect(stack.effects[0].id).toBe(effect3.id)
      expect(stack.effects[1].id).toBe(effect1.id)
      expect(stack.effects[2].id).toBe(effect2.id)
    })
  })

  describe("presets", () => {
    let appliedEffect: AppliedEffect

    beforeEach(() => {
      manager.registerEffect(createMockEffect("test_effect"))
      appliedEffect = manager.applyEffect("test_effect", "clip1", "clip", {
        parameters: { intensity: 80, color: "#ff0000" },
      })
    })

    it("should create preset from applied effect", () => {
      const preset = manager.createPreset(appliedEffect.id, {
        en: "My Preset",
        ru: "Мой Пресет",
      })

      expect(preset).toBeDefined()
      expect(preset.name).toEqual({ en: "My Preset", ru: "Мой Пресет" })
      expect(preset.parameters).toEqual({ intensity: 80, color: "#ff0000" })
    })

    it("should create preset with description", () => {
      const preset = manager.createPreset(
        appliedEffect.id,
        { en: "My Preset", ru: "Мой Пресет" },
        { en: "Description", ru: "Описание" },
      )

      expect(preset.description).toEqual({ en: "Description", ru: "Описание" })
    })

    it("should mark preset as user preset", () => {
      const preset = manager.createPreset(appliedEffect.id, { en: "My Preset", ru: "Мой Пресет" })

      expect(preset.isUserPreset).toBe(true)
    })

    it("should add preset to base effect", () => {
      const presetsBefore = manager.getAllEffects()[0].presets.length

      manager.createPreset(appliedEffect.id, { en: "My Preset", ru: "Мой Пресет" })

      const presetsAfter = manager.getAllEffects()[0].presets.length
      expect(presetsAfter).toBe(presetsBefore + 1)
    })

    it("should apply preset to effect", () => {
      const preset = manager.createPreset(appliedEffect.id, { en: "My Preset", ru: "Мой Пресет" })

      // Change parameters
      appliedEffect.parameters = { intensity: 10, color: "#000000" }

      // Apply preset
      manager.applyPreset(appliedEffect.id, preset.id)

      expect(appliedEffect.parameters.intensity).toBe(80)
      expect(appliedEffect.parameters.color).toBe("#ff0000")
    })

    it("should merge preset parameters with existing", () => {
      const preset = manager.createPreset(appliedEffect.id, { en: "Partial", ru: "Частичный" })
      preset.parameters = { intensity: 90 } // Only intensity, not color

      appliedEffect.parameters = { intensity: 10, color: "#000000" }

      manager.applyPreset(appliedEffect.id, preset.id)

      expect(appliedEffect.parameters.intensity).toBe(90)
      expect(appliedEffect.parameters.color).toBe("#000000") // unchanged
    })
  })

  describe("event system", () => {
    it("should emit events", () => {
      const callback = vi.fn()
      manager.addEventListener(callback)

      manager.registerEffect(createMockEffect("test"))

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0]).toHaveProperty("type")
    })

    it("should remove event listener", () => {
      const callback = vi.fn()
      manager.addEventListener(callback)
      manager.removeEventListener(callback)

      manager.registerEffect(createMockEffect("test"))

      // Should not be called after removal
      // But will be called once for registration before removal
      expect(callback).toHaveBeenCalledTimes(0)
    })

    it("should emit effect_applied event", () => {
      const callback = vi.fn()
      manager.addEventListener(callback)
      manager.registerEffect(createMockEffect("test"))

      callback.mockClear() // Clear registration event

      manager.applyEffect("test", "clip1", "clip")

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0].type).toBe("effect_applied")
    })

    it("should emit effect_removed event", () => {
      const callback = vi.fn()
      manager.registerEffect(createMockEffect("test"))
      const applied = manager.applyEffect("test", "clip1", "clip")

      manager.addEventListener(callback)

      manager.removeAppliedEffect(applied.id)

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0].type).toBe("effect_removed")
    })

    it("should emit parameter_changed event", () => {
      const callback = vi.fn()
      manager.registerEffect(createMockEffect("test"))
      const applied = manager.applyEffect("test", "clip1", "clip")

      manager.addEventListener(callback)

      manager.setEffectParameter(applied.id, "intensity", 90)

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0].type).toBe("parameter_changed")
    })

    it("should emit keyframe_added event", () => {
      const callback = vi.fn()
      manager.registerEffect(createMockEffect("test"))
      const applied = manager.applyEffect("test", "clip1", "clip")

      manager.addEventListener(callback)

      manager.setEffectParameter(applied.id, "intensity", 90, true, 5000)

      expect(callback.mock.calls.some((call) => call[0].type === "keyframe_added")).toBe(true)
    })
  })

  describe("import/export", () => {
    it("should export effect stack", () => {
      manager.registerEffect(createMockEffect("test"))
      manager.applyEffect("test", "clip1", "clip")

      const exported = manager.exportEffectStack("clip1")

      expect(exported).toBeDefined()
      expect(exported?.effects).toHaveLength(1)
    })

    it("should return null for non-existent stack", () => {
      const exported = manager.exportEffectStack("missing")

      expect(exported).toBeNull()
    })

    it("should import effect stack", () => {
      const stack: EffectStack = {
        id: "clip1",
        effects: [],
        groups: [],
        enabled: true,
      }

      manager.importEffectStack("clip1", stack)

      const imported = manager.getEffectStack("clip1")
      expect(imported).toEqual(stack)
    })
  })

  describe("cleanup", () => {
    it("should clear all data", () => {
      manager.registerEffect(createMockEffect("test"))
      manager.applyEffect("test", "clip1", "clip")

      manager.clear()

      expect(manager.getAllEffects()).toHaveLength(0)
      expect(manager.getEffectStack("clip1")).toBeUndefined()
    })
  })
})
