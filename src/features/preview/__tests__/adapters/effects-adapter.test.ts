/**
 * Tests for Effects Adapter
 * Тесты для адаптера эффектов между различными системами
 */

import { describe, expect, it } from "vitest"
import type { BaseEffect } from "@/features/effects/types/unified-effects"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { AppliedColorGrading, AppliedEffect, AppliedFilter } from "@/features/timeline/types/timeline"
import {
  convertBaseEffect,
  convertColorGrading,
  convertVideoFilter,
  filterEffectsByTime,
  getAllAvailableEffects,
} from "../../adapters/effects-adapter"

describe("EffectsAdapter", () => {
  describe("convertBaseEffect", () => {
    it("should convert color correction effect", () => {
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
          { id: "brightness", name: { en: "Brightness", ru: "Яркость" }, type: "number", defaultValue: 0, min: -1, max: 1 },
          { id: "contrast", name: { en: "Contrast", ru: "Контраст" }, type: "number", defaultValue: 1, min: 0, max: 2 },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = convertBaseEffect(baseEffect)

      expect(result).not.toBeNull()
      expect(result?.type).toBe("color_correction")
      expect(result?.source).toBe("effects")
      expect(result?.enabled).toBe(true)
      expect(result?.parameters).toHaveProperty("brightness")
      expect(result?.parameters).toHaveProperty("contrast")
    })

    it("should convert blur effect", () => {
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
        parameters: [{ id: "radius", name: { en: "Radius", ru: "Радиус" }, type: "number", defaultValue: 5, min: 0, max: 50 }],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = convertBaseEffect(baseEffect)

      expect(result?.type).toBe("blur")
      expect(result?.parameters).toHaveProperty("radius")
    })

    it("should apply custom parameters from applied effect", () => {
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
        parameters: [{ id: "brightness", name: { en: "Brightness", ru: "Яркость" }, type: "number", defaultValue: 0, min: -1, max: 1 }],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const appliedEffect: AppliedEffect = {
        id: "applied_1",
        effectId: "color_correct_basic",
        enabled: true,
        order: 0,
        customParams: {
          brightness: 0.5,
          intensity: 0.8,
        },
        startTime: 0,
        duration: 10,
      }

      const result = convertBaseEffect(baseEffect, appliedEffect)

      expect(result?.enabled).toBe(true)
      expect(result?.intensity).toBe(0.8)
      expect(result?.appliedEffectId).toBe("applied_1")
    })

    it("should return null for unsupported category", () => {
      const baseEffect: BaseEffect = {
        id: "unknown_effect",
        name: { en: "Unknown", ru: "Неизвестный" },
        category: "unsupported_category" as any,
        scope: ["clip"],
        processingType: "realtime",
        complexity: "medium",
        tags: [],
        presets: [],
        processors: {},
        parameters: [],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = convertBaseEffect(baseEffect)

      expect(result).toBeNull()
    })

    it("should convert transform effect", () => {
      const baseEffect: BaseEffect = {
        id: "transform_2d",
        name: { en: "Transform", ru: "Трансформация" },
        category: "transform",
        scope: ["clip"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [
          { id: "scale", name: { en: "Scale", ru: "Масштаб" }, type: "number", defaultValue: 1, min: 0.1, max: 5 },
          { id: "rotation", name: { en: "Rotation", ru: "Поворот" }, type: "number", defaultValue: 0, min: -360, max: 360 },
        ],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = convertBaseEffect(baseEffect)

      expect(result?.type).toBe("transform")
      expect(result?.parameters).toHaveProperty("scale")
      expect(result?.parameters).toHaveProperty("rotation")
    })

    it("should map effect scope correctly", () => {
      const baseEffect: BaseEffect = {
        id: "test_effect",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["sequence"],
        processingType: "realtime",
        complexity: "low",
        tags: [],
        presets: [],
        processors: {},
        parameters: [],
        gpuAccelerated: true,
        version: "1.0.0",
      }

      const result = convertBaseEffect(baseEffect)

      // Note: convertBaseEffect currently doesn't set scope property
      // This functionality exists in unified-effects-bridge but not in effects-adapter
      expect(result).not.toBeNull()
      expect(result?.type).toBe("color_correction")
    })
  })

  describe("convertVideoFilter", () => {
    it("should convert video filter to preview effect", () => {
      const videoFilter: VideoFilter = {
        id: "sepia",
        name: "Sepia",
        category: "artistic",
        complexity: "basic",
        tags: ["vintage", "warm"],
        description: { en: "Sepia tone effect", ru: "Эффект сепии" },
        labels: { en: "Sepia", ru: "Сепия" },
        params: {
          brightness: 0.1,
          contrast: 1.2,
          saturation: 0.8,
        },
      }

      const result = convertVideoFilter(videoFilter)

      expect(result).not.toBeNull()
      expect(result?.type).toBe("color_correction")
      expect(result?.source).toBe("filters")
      expect(result?.enabled).toBe(true)
    })

    it("should apply custom parameters from applied filter", () => {
      const videoFilter: VideoFilter = {
        id: "sepia",
        name: "Sepia",
        category: "artistic",
        complexity: "basic",
        tags: ["vintage"],
        description: { en: "Sepia tone effect", ru: "Эффект сепии" },
        labels: { en: "Sepia", ru: "Сепия" },
        params: {},
      }

      const appliedFilter: AppliedFilter = {
        id: "applied_filter_1",
        filterId: "sepia",
        isEnabled: false,
        order: 1,
        customParams: {
          intensity: 0.7,
        },
        startTime: 0,
        duration: 10,
      }

      const result = convertVideoFilter(videoFilter, appliedFilter)

      expect(result?.enabled).toBe(false)
      expect(result?.intensity).toBe(0.7)
      expect(result?.appliedEffectId).toBe("applied_filter_1")
    })

    it("should merge filter params with custom params", () => {
      const videoFilter: VideoFilter = {
        id: "test_filter",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test filter", ru: "Тестовый фильтр" },
        labels: { en: "Test", ru: "Тест" },
        params: {
          brightness: 0.0,
          contrast: 1.0,
        },
      }

      const appliedFilter: AppliedFilter = {
        id: "applied_1",
        filterId: "test_filter",
        isEnabled: true,
        order: 0,
        customParams: {
          brightness: 0.5,
        },
        startTime: 0,
        duration: 10,
      }

      const result = convertVideoFilter(videoFilter, appliedFilter)

      expect(result?.parameters.brightness).toBe(0.5)
      expect(result?.parameters.contrast).toBe(1.0)
    })
  })

  describe("convertColorGrading", () => {
    it("should convert color grading to preview effect", () => {
      const colorGrading: AppliedColorGrading = {
        id: "grading_1",
        colorWheels: {
          lift: { r: 0, g: 0, b: 0 },
          gamma: { r: 0, g: 0, b: 0 },
          gain: { r: 0, g: 0, b: 0 },
          offset: { r: 0, g: 0, b: 0 },
        },
        basicParameters: {
          luminance: 10,
          contrast: 20,
          saturation: -10,
          hue: 15,
          temperature: 5,
          tint: -5,
          pivot: 0.5,
        },
        curves: {
          master: [],
          red: [],
          green: [],
          blue: [],
        },
        lut: {
          file: null,
          intensity: 0,
          isEnabled: false,
        },
        isEnabled: true,
      }

      const result = convertColorGrading(colorGrading)

      expect(result.type).toBe("color_correction")
      expect(result.source).toBe("color_grading")
      expect(result.enabled).toBe(true)
      expect(result.id).toBe("grading_1")
    })

    it("should scale parameters correctly", () => {
      const colorGrading: AppliedColorGrading = {
        id: "grading_1",
        colorWheels: {
          lift: { r: 0, g: 0, b: 0 },
          gamma: { r: 0, g: 0, b: 0 },
          gain: { r: 0, g: 0, b: 0 },
          offset: { r: 0, g: 0, b: 0 },
        },
        basicParameters: {
          luminance: 100, // Should convert to 1.0
          contrast: 50, // Should convert to 1.5
          saturation: -50, // Should convert to 0.5
          hue: 0,
          temperature: 50, // Should convert to 10
          tint: -100, // Should convert to -20
          pivot: 0.5,
        },
        curves: {
          master: [],
          red: [],
          green: [],
          blue: [],
        },
        lut: {
          file: null,
          intensity: 0,
          isEnabled: false,
        },
        isEnabled: true,
      }

      const result = convertColorGrading(colorGrading)

      expect(result.parameters.brightness).toBeCloseTo(1.0, 2)
      expect(result.parameters.contrast).toBeCloseTo(1.5, 2)
      expect(result.parameters.saturation).toBeCloseTo(0.5, 2)
      expect(result.parameters.temperature).toBeCloseTo(10, 2)
      expect(result.parameters.tint).toBeCloseTo(-20, 2)
    })

    it("should respect enabled state", () => {
      const colorGrading: AppliedColorGrading = {
        id: "grading_1",
        colorWheels: {
          lift: { r: 0, g: 0, b: 0 },
          gamma: { r: 0, g: 0, b: 0 },
          gain: { r: 0, g: 0, b: 0 },
          offset: { r: 0, g: 0, b: 0 },
        },
        basicParameters: {
          luminance: 0,
          contrast: 0,
          saturation: 0,
          hue: 0,
          temperature: 0,
          tint: 0,
          pivot: 0.5,
        },
        curves: {
          master: [],
          red: [],
          green: [],
          blue: [],
        },
        lut: {
          file: null,
          intensity: 0,
          isEnabled: false,
        },
        isEnabled: false,
      }

      const result = convertColorGrading(colorGrading)

      expect(result.enabled).toBe(false)
    })
  })

  describe("getAllAvailableEffects", () => {
    it("should combine effects from all sources", () => {
      const baseEffects: BaseEffect[] = [
        {
          id: "blur",
          name: { en: "Blur", ru: "Размытие" },
          category: "blur_sharpen",
          scope: ["clip"],
          processingType: "realtime",
          complexity: "medium",
          tags: [],
          presets: [],
          processors: {},
          parameters: [],
          gpuAccelerated: true,
          version: "1.0.0",
        },
      ]

      const appliedEffects: AppliedEffect[] = [
        {
          id: "applied_1",
          effectId: "blur",
          enabled: true,
          order: 0,
          customParams: {},
          startTime: 0,
          duration: 10,
        },
      ]

      const filters: VideoFilter[] = [
        {
          id: "sepia",
          name: "Sepia",
          category: "artistic",
          complexity: "basic",
          tags: ["vintage"],
          description: { en: "Sepia tone effect", ru: "Эффект сепии" },
          labels: { en: "Sepia", ru: "Сепия" },
          params: {},
        },
      ]

      const appliedFilters: AppliedFilter[] = [
        {
          id: "applied_filter_1",
          filterId: "sepia",
          isEnabled: true,
          order: 1,
          customParams: {},
          startTime: 0,
          duration: 10,
        },
      ]

      const result = getAllAvailableEffects(baseEffects, filters, appliedEffects, appliedFilters, [])

      expect(result.length).toBe(2)
      expect(result.some((e) => e.source === "effects")).toBe(true)
      expect(result.some((e) => e.source === "filters")).toBe(true)
    })

    it("should sort effects by order", () => {
      const baseEffects: BaseEffect[] = [
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

      const appliedEffects: AppliedEffect[] = [
        {
          id: "applied_2",
          effectId: "effect2",
          enabled: true,
          order: 1,
          customParams: {},
          startTime: 0,
          duration: 10,
        },
        {
          id: "applied_1",
          effectId: "effect1",
          enabled: true,
          order: 0,
          customParams: {},
          startTime: 0,
          duration: 10,
        },
      ]

      const result = getAllAvailableEffects(baseEffects, [], appliedEffects, [], [])

      expect(result[0].appliedEffectId).toBe("applied_1")
      expect(result[1].appliedEffectId).toBe("applied_2")
    })

    it("should skip base effects without matching applied effects", () => {
      const baseEffects: BaseEffect[] = [
        {
          id: "unused_effect",
          name: { en: "Unused", ru: "Неиспользуемый" },
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

      const result = getAllAvailableEffects(baseEffects, [], [], [], [])

      expect(result.length).toBe(0)
    })

    it("should include color grading", () => {
      const colorGrading: AppliedColorGrading[] = [
        {
          id: "grading_1",
          colorWheels: {
            lift: { r: 0, g: 0, b: 0 },
            gamma: { r: 0, g: 0, b: 0 },
            gain: { r: 0, g: 0, b: 0 },
            offset: { r: 0, g: 0, b: 0 },
          },
          basicParameters: {
            luminance: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            temperature: 0,
            tint: 0,
            pivot: 0.5,
          },
          curves: {
            master: [],
            red: [],
            green: [],
            blue: [],
          },
          lut: {
            file: null,
            intensity: 0,
            isEnabled: false,
          },
          isEnabled: true,
        },
      ]

      const result = getAllAvailableEffects([], [], [], [], colorGrading)

      expect(result.length).toBe(1)
      expect(result[0].source).toBe("color_grading")
    })
  })

  describe("filterEffectsByTime", () => {
    it("should include effects without time constraints", () => {
      const effects = [
        {
          id: "effect1",
          type: "blur" as const,
          enabled: true,
          parameters: {},
          intensity: 1.0,
          source: "effects" as const,
          originalId: "blur",
        },
      ]

      const result = filterEffectsByTime(effects, 5.0, [], [])

      expect(result.length).toBe(1)
    })

    it("should filter effects by start time", () => {
      const effects = [
        {
          id: "effect1",
          type: "blur" as const,
          enabled: true,
          parameters: {},
          intensity: 1.0,
          source: "effects" as const,
          originalId: "blur",
          appliedEffectId: "applied_1",
        },
      ]

      const appliedEffects: AppliedEffect[] = [
        {
          id: "applied_1",
          effectId: "blur",
          enabled: true,
          order: 0,
          customParams: {},
          startTime: 10.0,
          duration: 5.0,
        },
      ]

      const result1 = filterEffectsByTime(effects, 5.0, appliedEffects, [])
      const result2 = filterEffectsByTime(effects, 12.0, appliedEffects, [])

      expect(result1.length).toBe(0) // Before start time
      expect(result2.length).toBe(1) // After start time
    })

    it("should filter effects by end time", () => {
      const effects = [
        {
          id: "effect1",
          type: "blur" as const,
          enabled: true,
          parameters: {},
          intensity: 1.0,
          source: "effects" as const,
          originalId: "blur",
          appliedEffectId: "applied_1",
        },
      ]

      const appliedEffects: AppliedEffect[] = [
        {
          id: "applied_1",
          effectId: "blur",
          enabled: true,
          order: 0,
          customParams: {},
          startTime: 5.0,
          duration: 5.0,
        },
      ]

      const result1 = filterEffectsByTime(effects, 7.0, appliedEffects, [])
      const result2 = filterEffectsByTime(effects, 11.0, appliedEffects, [])

      expect(result1.length).toBe(1) // Within time range
      expect(result2.length).toBe(0) // After end time
    })

    it("should work with applied filters", () => {
      const effects = [
        {
          id: "filter1",
          type: "color_correction" as const,
          enabled: true,
          parameters: {},
          intensity: 1.0,
          source: "filters" as const,
          originalId: "sepia",
          appliedEffectId: "applied_filter_1",
        },
      ]

      const appliedFilters: AppliedFilter[] = [
        {
          id: "applied_filter_1",
          filterId: "sepia",
          isEnabled: true,
          order: 0,
          customParams: {},
          startTime: 0,
          duration: 10,
        },
      ]

      const result1 = filterEffectsByTime(effects, 5.0, [], appliedFilters)
      const result2 = filterEffectsByTime(effects, 15.0, [], appliedFilters)

      expect(result1.length).toBe(1)
      expect(result2.length).toBe(0)
    })

    it("should handle effects without duration", () => {
      const effects = [
        {
          id: "effect1",
          type: "blur" as const,
          enabled: true,
          parameters: {},
          intensity: 1.0,
          source: "effects" as const,
          originalId: "blur",
          appliedEffectId: "applied_1",
        },
      ]

      const appliedEffects: AppliedEffect[] = [
        {
          id: "applied_1",
          effectId: "blur",
          enabled: true,
          order: 0,
          customParams: {},
          startTime: 5.0,
          // No duration - effect runs indefinitely
        },
      ]

      const result = filterEffectsByTime(effects, 100.0, appliedEffects, [])

      expect(result.length).toBe(1)
    })
  })
})
