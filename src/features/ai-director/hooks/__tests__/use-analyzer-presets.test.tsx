/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { AnalyzerType } from "../../types/analysis-progress"
import { DEFAULT_PRESETS } from "../../types/analyzer-presets"
import { useAnalyzerPresets } from "../use-analyzer-presets"

describe("useAnalyzerPresets", () => {
  describe("Initial State", () => {
    it("should initialize with default presets", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      expect(result.current.presets).toHaveLength(DEFAULT_PRESETS.length)
      expect(result.current.selectedPreset).toBeNull()
    })

    it("should provide all default presets", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      const presetIds = result.current.presets.map((p) => p.id)
      expect(presetIds).toContain("quick-scan")
      expect(presetIds).toContain("balanced-analysis")
      expect(presetIds).toContain("deep-analysis")
      expect(presetIds).toContain("montage-focus")
      expect(presetIds).toContain("quality-focus")
    })
  })

  describe("Preset Selection", () => {
    it("should select preset by id", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("quick-scan")
      })

      expect(result.current.selectedPreset).not.toBeNull()
      expect(result.current.selectedPreset?.id).toBe("quick-scan")
    })

    it("should get selected analyzers from preset", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("quick-scan")
      })

      const analyzers = result.current.getSelectedAnalyzers()
      expect(analyzers.size).toBeGreaterThan(0)
    })

    it("should handle invalid preset id", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("non-existent-preset")
      })

      expect(result.current.selectedPreset).toBeNull()
    })

    it("should clear preset selection", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("quick-scan")
      })

      expect(result.current.selectedPreset).not.toBeNull()

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedPreset).toBeNull()
    })
  })

  describe("Preset Characteristics", () => {
    it("should have quick-scan with minimal analyzers", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("quick-scan")
      })

      const preset = result.current.selectedPreset
      expect(preset?.estimatedTime).toBe("< 1 min")
      expect(preset?.analyzers.size).toBeLessThan(5)
    })

    it("should have balanced-analysis with moderate analyzers", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("balanced-analysis")
      })

      const preset = result.current.selectedPreset
      expect(preset?.estimatedTime).toContain("min")
      expect(preset?.analyzers.size).toBeGreaterThan(5)
      expect(preset?.analyzers.size).toBeLessThan(10)
    })

    it("should have deep-analysis with all analyzers", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("deep-analysis")
      })

      const preset = result.current.selectedPreset
      expect(preset?.analyzers.size).toBeGreaterThan(10)
      expect(preset?.description.toLowerCase()).toContain("complete")
    })

    it("should have montage-focus optimized for editing", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("montage-focus")
      })

      const preset = result.current.selectedPreset
      expect(preset?.analyzers.has("moment_detection")).toBe(true)
      expect(preset?.analyzers.has("scene_detection")).toBe(true)
    })

    it("should have quality-focus for quality assessment", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("quality-focus")
      })

      const preset = result.current.selectedPreset
      expect(preset?.analyzers.has("quality_assessment")).toBe(true)
      expect(preset?.analyzers.has("composition_analysis")).toBe(true)
    })
  })

  describe("Custom Presets", () => {
    it("should create custom preset", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      const customAnalyzers = new Set(["scene_detection", "audio_quality", "moment_detection"])

      act(() => {
        result.current.createCustomPreset({
          name: "My Custom Preset",
          description: "Custom analyzer selection",
          analyzers: customAnalyzers as Set<AnalyzerType>,
        })
      })

      expect(result.current.customPresets).toHaveLength(1)
      expect(result.current.customPresets[0].name).toBe("My Custom Preset")
      expect(result.current.customPresets[0].analyzers).toEqual(customAnalyzers)
    })

    it("should delete custom preset", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      const customAnalyzers = new Set(["scene_detection"])

      act(() => {
        result.current.createCustomPreset({
          name: "Test Preset",
          description: "Test",
          analyzers: customAnalyzers as Set<AnalyzerType>,
        })
      })

      const customId = result.current.customPresets[0].id

      act(() => {
        result.current.deleteCustomPreset(customId)
      })

      expect(result.current.customPresets).toHaveLength(0)
    })

    it("should not delete built-in presets", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.deleteCustomPreset("quick-scan")
      })

      const preset = result.current.presets.find((p) => p.id === "quick-scan")
      expect(preset).toBeDefined()
    })

    it("should update custom preset", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      const customAnalyzers = new Set(["scene_detection"])

      act(() => {
        result.current.createCustomPreset({
          name: "Test Preset",
          description: "Original",
          analyzers: customAnalyzers as Set<AnalyzerType>,
        })
      })

      const customId = result.current.customPresets[0].id

      act(() => {
        result.current.updateCustomPreset(customId, {
          name: "Updated Preset",
          description: "Modified",
        })
      })

      expect(result.current.customPresets[0].name).toBe("Updated Preset")
      expect(result.current.customPresets[0].description).toBe("Modified")
    })
  })

  describe("Preset Recommendations", () => {
    it("should recommend preset based on use case", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.getRecommendation("montage")
      })

      expect(result.current.recommendedPreset?.id).toBe("montage-focus")
    })

    it("should recommend quick-scan for preview", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.getRecommendation("preview")
      })

      expect(result.current.recommendedPreset?.id).toBe("quick-scan")
    })

    it("should recommend deep-analysis for archival", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.getRecommendation("archival")
      })

      expect(result.current.recommendedPreset?.id).toBe("deep-analysis")
    })
  })

  describe("Preset Comparison", () => {
    it("should compare two presets", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.comparePresets("quick-scan", "deep-analysis")
      })

      expect(result.current.comparison).not.toBeNull()
      expect(result.current.comparison?.preset1.id).toBe("quick-scan")
      expect(result.current.comparison?.preset2.id).toBe("deep-analysis")
      expect(result.current.comparison?.differences).toBeDefined()
    })

    it("should show analyzer differences", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.comparePresets("quick-scan", "deep-analysis")
      })

      const diff = result.current.comparison?.differences
      expect(diff?.additionalIn2.size).toBeGreaterThan(0)
    })
  })

  describe("Preset Export/Import", () => {
    it("should export preset as JSON", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      act(() => {
        result.current.selectPreset("balanced-analysis")
      })

      const exported = result.current.exportPreset()
      expect(exported).toBeDefined()

      const parsed = JSON.parse(exported)
      expect(parsed.id).toBe("balanced-analysis")
      expect(Array.isArray(parsed.analyzers)).toBe(true)
    })

    it("should import preset from JSON", () => {
      const { result } = renderHook(() => useAnalyzerPresets())

      const customPreset = {
        id: "imported-preset",
        name: "Imported Preset",
        description: "From JSON",
        analyzers: ["scene_detection", "audio_quality"],
        isBuiltIn: false,
      }

      act(() => {
        result.current.importPreset(JSON.stringify(customPreset))
      })

      expect(result.current.customPresets.some((p) => p.id === "imported-preset")).toBe(true)
    })
  })
})
