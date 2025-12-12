import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useUnifiedEffects } from "../../hooks/use-unified-effects"
import type { BaseEffect } from "../../types/unified-effects"

// Mock dependencies
vi.mock("@/features/timeline/hooks/state/use-timeline", () => ({
  useTimeline: () => ({
    currentTime: 0,
  }),
}))

vi.mock("@/features/video-player", () => ({
  usePlayer: () => ({
    currentVideo: null,
    isPlaying: false,
  }),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock("../../services/effect-manager", () => {
  class EffectManager {
    private effects = new Map<string, BaseEffect>()
    private stacks = new Map()

    registerEffect = vi.fn((effect: BaseEffect) => {
      this.effects.set(effect.id, effect)
    })

    registerEffects = vi.fn((effectsArray: BaseEffect[]) => {
      effectsArray.forEach((e) => this.effects.set(e.id, e))
    })

    getAllEffects = vi.fn(() => Array.from(this.effects.values()))

    getEffectsByCategory = vi.fn((category: string) =>
      Array.from(this.effects.values()).filter((e) => e.category === category),
    )

    getEffectsByScope = vi.fn((scope: "clip" | "track" | "sequence" | "global") =>
      Array.from(this.effects.values()).filter((e) => e.scope.includes(scope)),
    )

    searchEffects = vi.fn(() => Array.from(this.effects.values()))

    createEffectStack = vi.fn((id: string) => {
      const stack = { id, effects: [], groups: [], enabled: true }
      this.stacks.set(id, stack)
      return stack
    })

    getEffectStack = vi.fn((id: string) => this.stacks.get(id))

    applyEffect = vi.fn((effectId, targetId, _targetType, options) => {
      const appliedEffect = {
        id: `applied_${Date.now()}`,
        effectId,
        startTime: options?.startTime || 0,
        duration: options?.duration,
        parameters: options?.parameters || {},
        enabled: true,
        order: 0,
        keyframes: {},
        masks: [],
        blendMode: "normal",
        opacity: 1,
        effectVersion: "1.0.0",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }

      // Add to stack
      let stack = this.stacks.get(targetId)
      if (!stack) {
        stack = { id: targetId, effects: [], groups: [], enabled: true }
        this.stacks.set(targetId, stack)
      }
      stack.effects.push(appliedEffect)

      return appliedEffect
    })

    removeAppliedEffect = vi.fn()
    setEffectParameter = vi.fn()
    reorderEffects = vi.fn()
    applyPreset = vi.fn()

    createPreset = vi.fn((_, name) => ({
      id: `preset_${Date.now()}`,
      name,
      parameters: {},
      tags: [],
    }))

    exportEffectStack = vi.fn((id: string) => this.stacks.get(id) || null)

    importEffectStack = vi.fn((id, stack) => {
      this.stacks.set(id, stack)
    })

    addEventListener = vi.fn()
    removeEventListener = vi.fn()
  }

  return { EffectManager }
})

vi.mock("../../services/webgl2-unified-renderer", () => {
  class WebGL2UnifiedRenderer {
    initialize = vi.fn().mockResolvedValue(undefined)
    renderEffectStack = vi.fn().mockResolvedValue({
      success: true,
      output: null,
      processingTime: 10,
    })
    dispose = vi.fn()
  }

  return { WebGL2UnifiedRenderer }
})

describe("useUnifiedEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockEffect = (id: string): BaseEffect => ({
    id,
    name: { en: `Effect ${id}`, ru: `Эффект ${id}` },
    category: "color_correction",
    scope: ["clip" as const, "track" as const],
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
        animatable: true,
        visible: true,
        enabled: true,
      },
    ],
    presets: [],
    processors: {
      css: {
        filter: () => "brightness(1)",
      },
    },
  })

  describe("initialization", () => {
    it("should initialize with default options", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.availableEffects).toBeDefined()
      })
    })

    it("should load basic effects by default", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip", { loadBasicEffects: true }))

      await waitFor(() => {
        expect(result.current.availableEffects.length).toBeGreaterThan(0)
      })
    })

    it("should skip loading basic effects when disabled", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip", { loadBasicEffects: false }))

      await waitFor(() => {
        expect(result.current.availableEffects).toEqual([])
      })
    })

    it("should create effect stack for target", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.currentStack).toBeDefined()
        expect(result.current.currentStack?.id).toBe("clip1")
      })
    })
  })

  describe("effect management", () => {
    it("should apply effect to target", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.availableEffects.length).toBeGreaterThan(0)
      })

      const effect = result.current.availableEffects[0]
      const appliedEffect = result.current.applyEffect(effect.id)

      expect(appliedEffect).toBeDefined()
      expect(appliedEffect.effectId).toBe(effect.id)
    })

    it("should apply effect with custom parameters", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.availableEffects.length).toBeGreaterThan(0)
      })

      const effect = result.current.availableEffects[0]
      const appliedEffect = result.current.applyEffect(effect.id, {
        parameters: { intensity: 75 },
      })

      expect(appliedEffect.parameters).toEqual({ intensity: 75 })
    })

    it("should apply effect with time range", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.availableEffects.length).toBeGreaterThan(0)
      })

      const effect = result.current.availableEffects[0]
      const appliedEffect = result.current.applyEffect(effect.id, {
        startTime: 1000,
        duration: 5000,
      })

      expect(appliedEffect.startTime).toBe(1000)
      expect(appliedEffect.duration).toBe(5000)
    })

    it("should remove applied effect", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.availableEffects.length).toBeGreaterThan(0)
      })

      const effect = result.current.availableEffects[0]
      const appliedEffect = result.current.applyEffect(effect.id)

      result.current.removeEffect(appliedEffect.id)

      expect(result.current.effectManager.removeAppliedEffect).toHaveBeenCalledWith(appliedEffect.id)
    })

    it("should set effect parameter", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      result.current.setEffectParameter("effect1", "intensity", 90)

      expect(result.current.effectManager.setEffectParameter).toHaveBeenCalledWith(
        "effect1",
        "intensity",
        90,
        false,
        undefined,
      )
    })

    it("should set effect parameter with keyframe", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      result.current.setEffectParameter("effect1", "intensity", 90, true, 5000)

      expect(result.current.effectManager.setEffectParameter).toHaveBeenCalledWith(
        "effect1",
        "intensity",
        90,
        true,
        5000,
      )
    })

    it("should reorder effects", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const newOrder = ["effect3", "effect1", "effect2"]
      result.current.reorderEffects(newOrder)

      expect(result.current.effectManager.reorderEffects).toHaveBeenCalledWith("clip1", newOrder)
    })
  })

  describe("preset management", () => {
    it("should apply preset to effect", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      result.current.applyPreset("effect1", "preset1")

      expect(result.current.effectManager.applyPreset).toHaveBeenCalledWith("effect1", "preset1")
    })

    it("should create preset from effect", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const preset = result.current.createPreset("effect1", { en: "My Preset", ru: "Мой Пресет" })

      expect(preset).toBeDefined()
      expect(preset.name).toEqual({ en: "My Preset", ru: "Мой Пресет" })
    })

    it("should create preset with description", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const preset = result.current.createPreset(
        "effect1",
        { en: "My Preset", ru: "Мой Пресет" },
        { en: "Description", ru: "Описание" },
      )

      expect(result.current.effectManager.createPreset).toHaveBeenCalledWith(
        "effect1",
        { en: "My Preset", ru: "Мой Пресет" },
        { en: "Description", ru: "Описание" },
      )
    })
  })

  describe("search and filtering", () => {
    it("should search effects", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const searchResults = result.current.searchEffects("blur")

      expect(result.current.effectManager.searchEffects).toHaveBeenCalledWith("blur", { scope: "clip" })
    })

    it("should search with filters", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const searchResults = result.current.searchEffects("blur", {
        category: "blur_sharpen",
        complexity: ["low", "medium"],
      })

      expect(result.current.effectManager.searchEffects).toHaveBeenCalledWith("blur", {
        category: "blur_sharpen",
        complexity: ["low", "medium"],
        scope: "clip",
      })
    })

    it("should get effects by category", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.availableEffects.length).toBeGreaterThan(0)
      })

      const effects = result.current.getEffectsByCategory("color_correction")

      expect(effects).toBeDefined()
    })

    it("should filter effects by scope", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        const effects = result.current.effectsByCategory
        // Should only include effects that support clip scope
        Object.values(effects).forEach((categoryEffects) => {
          categoryEffects.forEach((effect) => {
            expect(effect.scope).toContain("clip")
          })
        })
      })
    })
  })

  describe("rendering", () => {
    it("should render effects", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const renderResult = await result.current.renderEffects()

      expect(renderResult.success).toBe(true)
    })

    it("should handle rendering errors", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      // Apply an effect first so rendering actually happens
      await act(async () => {
        result.current.applyEffect("color_correct_basic")
      })

      // Wait for the effect to be applied
      await waitFor(() => {
        expect(result.current.appliedEffects.length).toBeGreaterThan(0)
      })

      // Mock renderer to fail
      vi.mocked(result.current.renderer.renderEffectStack).mockResolvedValueOnce({
        success: false,
        error: "Rendering failed",
        processingTime: 0,
      })

      const renderResult = await result.current.renderEffects()

      expect(renderResult.success).toBe(false)
    })

    it("should skip rendering when no effects applied", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const renderResult = await result.current.renderEffects()

      expect(renderResult.success).toBe(true)
      expect(renderResult.processingTime).toBe(0)
    })

    it("should render with custom time", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      // Apply an effect first so rendering actually happens
      await act(async () => {
        result.current.applyEffect("color_correct_basic")
      })

      // Wait for the effect to be applied
      await waitFor(() => {
        expect(result.current.appliedEffects.length).toBeGreaterThan(0)
      })

      const renderResult = await result.current.renderEffects(undefined, 5000)

      expect(result.current.renderer.renderEffectStack).toHaveBeenCalled()
    })
  })

  describe("import/export", () => {
    it("should export effect stack", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const stack = result.current.exportEffectStack()

      expect(result.current.effectManager.exportEffectStack).toHaveBeenCalledWith("clip1")
    })

    it("should import effect stack", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      const mockStack = {
        id: "clip1",
        effects: [],
        groups: [],
        enabled: true,
      }

      result.current.importEffectStack(mockStack)

      expect(result.current.effectManager.importEffectStack).toHaveBeenCalledWith("clip1", mockStack)
    })
  })

  describe("computed values", () => {
    it("should compute effectsByCategory", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.effectsByCategory).toBeDefined()
        expect(typeof result.current.effectsByCategory).toBe("object")
      })
    })

    it("should compute hasActiveEffects", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      expect(result.current.hasActiveEffects).toBe(false)
    })

    it("should compute canRender", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      expect(typeof result.current.canRender).toBe("boolean")
    })
  })

  describe("cleanup", () => {
    it("should cleanup on unmount", async () => {
      const { unmount, result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      await waitFor(() => {
        expect(result.current.renderer).toBeDefined()
      })

      unmount()

      // Should call dispose on renderer
      expect(result.current.renderer.dispose).toHaveBeenCalled()
    })
  })

  describe("quality settings", () => {
    it("should use preview quality by default", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip"))

      // Apply an effect first so rendering actually happens
      await act(async () => {
        result.current.applyEffect("color_correct_basic")
      })

      // Wait for the effect to be applied
      await waitFor(() => {
        expect(result.current.appliedEffects.length).toBeGreaterThan(0)
      })

      await result.current.renderEffects()

      const call = vi.mocked(result.current.renderer.renderEffectStack).mock.calls[0]
      expect(call[2].quality).toBe("preview")
    })

    it("should use custom quality", async () => {
      const { result } = renderHook(() => useUnifiedEffects("clip1", "clip", { quality: "full" }))

      // Apply an effect first so rendering actually happens
      await act(async () => {
        result.current.applyEffect("color_correct_basic")
      })

      // Wait for the effect to be applied
      await waitFor(() => {
        expect(result.current.appliedEffects.length).toBeGreaterThan(0)
      })

      await result.current.renderEffects()

      const call = vi.mocked(result.current.renderer.renderEffectStack).mock.calls[0]
      expect(call[2].quality).toBe("full")
    })
  })
})
