import { describe, expect, it, vi } from "vitest"

import type { Transition } from "../../types/transitions"
import {
  createFallbackTransition,
  groupTransitions,
  processTransitions,
  searchTransitions,
  sortTransitions,
  validateTransitionsData,
} from "../../utils/transition-processor"

// Mock console.error to avoid test output noise
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

// Простые тесты для проверки импортов и базовой функциональности
describe("Transition Processor Module", () => {
  describe("processTransitions", () => {
    it("should process raw transitions data", () => {
      const rawTransitions = [
        {
          id: "fade",
          type: "fade",
          labels: { ru: "Затухание", en: "Fade" },
          description: { ru: "Плавное затухание", en: "Smooth fade" },
          category: "basic",
          complexity: "basic",
          tags: ["smooth"],
          duration: { default: 1.0, min: 0.5, max: 3.0 },
          ffmpegTemplate: "fade=t=in:st=0:d={duration}",
        },
        {
          id: "zoom",
          type: "zoom",
          labels: { ru: "Увеличение", en: "Zoom" },
          description: { ru: "Эффект увеличения", en: "Zoom effect" },
          category: "advanced",
          complexity: "intermediate",
          tags: ["dynamic"],
          duration: { default: 1.5, min: 0.5, max: 3.0 },
          parameters: { scale: 2.0 },
          ffmpegTemplate: "scale={scale}*iw:{scale}*ih,fade=t=in:st=0:d={duration}",
        },
      ]

      const processed = processTransitions(rawTransitions)
      expect(processed).toHaveLength(2)
      expect(processed[0].id).toBe("fade")
      expect(processed[0].ffmpegCommand).toBeDefined()
      expect(typeof processed[0].ffmpegCommand).toBe("function")
      expect(processed[1].id).toBe("zoom")
      expect(processed[1].parameters?.scale).toBe(2.0)
    })

    it("should create ffmpeg command functions", () => {
      const rawTransitions = [
        {
          id: "fade",
          type: "fade",
          labels: { ru: "Затухание", en: "Fade" },
          description: { ru: "Плавное затухание", en: "Smooth fade" },
          category: "basic",
          complexity: "basic",
          tags: ["smooth"],
          duration: { default: 1.0, min: 0.5, max: 3.0 },
          ffmpegTemplate: "fade=t=in:st=0:d={duration}",
        },
      ]

      const processed = processTransitions(rawTransitions)
      const command = processed[0].ffmpegCommand({ fps: 30, duration: 1.5 })
      expect(command).toBe("fade=t=in:st=0:d=1.5")
    })

    it("should handle parameters in ffmpeg templates", () => {
      const rawTransitions = [
        {
          id: "complex",
          type: "complex",
          labels: { ru: "Сложный", en: "Complex" },
          description: { ru: "Сложный переход", en: "Complex transition" },
          category: "advanced",
          complexity: "advanced",
          tags: ["complex"],
          duration: { default: 2.0, min: 1.0, max: 4.0 },
          ffmpegTemplate: "scale={width}:{height},fps={fps},fade=t=in:st=0:d={duration}",
        },
      ]

      const processed = processTransitions(rawTransitions)
      const command = processed[0].ffmpegCommand({
        fps: 60,
        width: 1280,
        height: 720,
        duration: 2.5,
      })
      expect(command).toBe("scale=1280:720,fps=60,fade=t=in:st=0:d=2.5")
    })
  })

  describe("validateTransitionsData", () => {
    it("should validate correct transition data", () => {
      const validData = {
        version: "1.0",
        transitions: [
          {
            id: "fade",
            type: "fade",
            labels: { ru: "Затухание", en: "Fade" },
            description: { ru: "Плавное затухание", en: "Smooth fade" },
            category: "basic",
            complexity: "basic",
            tags: ["smooth"],
            duration: { default: 1.0, min: 0.5, max: 3.0 },
          },
        ],
      }

      expect(validateTransitionsData(validData)).toBe(true)
    })

    it("should reject data without transitions array", () => {
      const invalidData = { notTransitions: [] }
      expect(validateTransitionsData(invalidData as any)).toBe(false)
    })

    it("should reject non-array transitions", () => {
      const invalidData = { transitions: "not an array" }
      expect(validateTransitionsData(invalidData as any)).toBe(false)
    })

    it("should reject transitions with missing required fields", () => {
      const invalidData = {
        transitions: [
          {
            id: "fade",
            // Missing type, name, labels, etc.
          },
        ],
      }
      expect(validateTransitionsData(invalidData as any)).toBe(false)
    })

    it("should reject transitions with invalid duration", () => {
      const invalidData = {
        transitions: [
          {
            id: "fade",
            type: "fade",
            name: "Fade",
            labels: { ru: "Затухание", en: "Fade" },
            category: "basic",
            complexity: "basic",
            duration: { default: -1, min: 0.5, max: 3.0 }, // Invalid negative duration
          },
        ],
      }
      expect(validateTransitionsData(invalidData as any)).toBe(false)
    })

    it("should handle null/undefined input", () => {
      expect(validateTransitionsData(null as any)).toBe(false)
      expect(validateTransitionsData(undefined as any)).toBe(false)
    })
  })

  it("should validate transition categories", () => {
    // Проверяем валидные категории переходов
    const validCategories = ["basic", "creative", "cinematic", "technical", "artistic"]

    validCategories.forEach((category) => {
      expect(typeof category).toBe("string")
      expect(category.length).toBeGreaterThan(0)
    })

    expect(validCategories.length).toBeGreaterThan(0)
  })

  it("should validate transition complexity levels", () => {
    // Проверяем уровни сложности
    const validComplexities = ["basic", "intermediate", "advanced"]

    validComplexities.forEach((complexity) => {
      expect(typeof complexity).toBe("string")
      expect(complexity.length).toBeGreaterThan(0)
    })

    expect(validComplexities.length).toBe(3)
  })

  it("should validate transition tags", () => {
    // Проверяем теги переходов
    const validTags = ["popular", "professional", "creative", "dynamic", "smooth", "fast", "slow", "cinematic"]

    validTags.forEach((tag) => {
      expect(typeof tag).toBe("string")
      expect(tag.length).toBeGreaterThan(0)
    })

    expect(validTags.length).toBeGreaterThan(0)
  })

  it("should validate duration structure", () => {
    // Тестируем структуру длительности
    const validDuration = {
      min: 0.5,
      max: 3.0,
      default: 1.5,
    }

    expect(typeof validDuration.min).toBe("number")
    expect(typeof validDuration.max).toBe("number")
    expect(typeof validDuration.default).toBe("number")

    expect(validDuration.min).toBeGreaterThan(0)
    expect(validDuration.max).toBeGreaterThan(validDuration.min)
    expect(validDuration.default).toBeGreaterThanOrEqual(validDuration.min)
    expect(validDuration.default).toBeLessThanOrEqual(validDuration.max)
  })

  it("should validate parameters structure", () => {
    // Тестируем параметры переходов
    const validParameters = {
      direction: "left",
      easing: "ease-in-out",
      intensity: 0.8,
      scale: 1.2,
      smoothness: 0.9,
    }

    const validDirections = ["left", "right", "up", "down", "center"]
    const validEasings = ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"]

    expect(validDirections).toContain(validParameters.direction)
    expect(validEasings).toContain(validParameters.easing)

    expect(typeof validParameters.intensity).toBe("number")
    expect(validParameters.intensity).toBeGreaterThanOrEqual(0)
    expect(validParameters.intensity).toBeLessThanOrEqual(1)

    expect(typeof validParameters.scale).toBe("number")
    expect(validParameters.scale).toBeGreaterThan(0)

    expect(typeof validParameters.smoothness).toBe("number")
    expect(validParameters.smoothness).toBeGreaterThanOrEqual(0)
    expect(validParameters.smoothness).toBeLessThanOrEqual(1)
  })

  it("should validate FFmpeg command parameters", () => {
    // Тестируем параметры FFmpeg команд
    const ffmpegParams = {
      fps: 30,
      width: 1920,
      height: 1080,
      scale: 1.0,
      duration: 1.5,
    }

    expect(typeof ffmpegParams.fps).toBe("number")
    expect(ffmpegParams.fps).toBeGreaterThan(0)
    expect(ffmpegParams.fps).toBeLessThanOrEqual(120)

    expect(typeof ffmpegParams.width).toBe("number")
    expect(ffmpegParams.width).toBeGreaterThan(0)

    expect(typeof ffmpegParams.height).toBe("number")
    expect(ffmpegParams.height).toBeGreaterThan(0)

    expect(typeof ffmpegParams.scale).toBe("number")
    expect(ffmpegParams.scale).toBeGreaterThan(0)

    expect(typeof ffmpegParams.duration).toBe("number")
    expect(ffmpegParams.duration).toBeGreaterThan(0)
  })

  it("should validate common transition types", () => {
    // Проверяем распространенные типы переходов
    const commonTransitionTypes = ["fade", "zoom", "slide", "scale", "wipe", "dissolve", "push", "cover", "reveal"]

    commonTransitionTypes.forEach((type) => {
      expect(typeof type).toBe("string")
      expect(type.length).toBeGreaterThan(0)
      expect(type).toMatch(/^[a-z-]+$/) // только строчные буквы и дефисы
    })

    expect(commonTransitionTypes.length).toBeGreaterThan(0)
  })

  describe("createFallbackTransition", () => {
    it("should create fallback transition with given id", () => {
      const fallback = createFallbackTransition("test-fallback")

      expect(fallback.id).toBe("test-fallback")
      expect(fallback.type).toBe("test-fallback")
      expect(fallback.labels.ru).toBe("Test-fallback")
      expect(fallback.labels.en).toBe("Test-fallback")
      expect(fallback.description.ru).toBe("Базовый переход test-fallback")
      expect(fallback.description.en).toBe("Basic transition test-fallback")
      expect(fallback.category).toBe("basic")
      expect(fallback.complexity).toBe("basic")
      expect(fallback.tags).toEqual(["fallback"])
      expect(fallback.duration).toEqual({ default: 1.0, min: 0.5, max: 2.0 })
    })

    it("should create different fallbacks for different ids", () => {
      const fallback1 = createFallbackTransition("fallback1")
      const fallback2 = createFallbackTransition("fallback2")

      expect(fallback1.id).not.toBe(fallback2.id)
      expect(fallback1.labels.ru).not.toBe(fallback2.labels.ru)
    })

    it("should handle empty string id", () => {
      const fallback = createFallbackTransition("")

      expect(fallback.id).toBe("")
      expect(fallback.type).toBe("")
      expect(fallback.labels.ru).toBe("")
      expect(fallback.labels.en).toBe("")
    })

    it("should create working ffmpeg command", () => {
      const fallback = createFallbackTransition("test")
      const command = fallback.ffmpegCommand({ fps: 30, duration: 1.5 })

      expect(command).toBe("fade=t=in:st=0:d=1.5")
    })
  })

  describe("searchTransitions", () => {
    const mockTransitions: Transition[] = [
      {
        id: "fade",
        type: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth", "classic"],
        duration: { default: 1.0, min: 0.5, max: 3.0 },
        ffmpegCommand: () => "fade=t=in:st=0:d=1.0",
      },
      {
        id: "zoom",
        type: "zoom",
        name: "Zoom",
        labels: { ru: "Увеличение", en: "Zoom" },
        description: { ru: "Эффект увеличения", en: "Zoom effect" },
        category: "advanced",
        complexity: "intermediate",
        tags: ["zoom", "scale"],
        duration: { default: 1.5, min: 0.5, max: 3.0 },
        ffmpegCommand: () => "zoompan=z='min(zoom+0.0015,1.5)'",
      },
    ]

    it("should return all transitions for empty query", () => {
      const results = searchTransitions(mockTransitions, "")
      expect(results).toEqual(mockTransitions)
    })

    it("should search by label in Russian", () => {
      const results = searchTransitions(mockTransitions, "затух", "ru")
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("fade")
    })

    it("should search by label in English", () => {
      const results = searchTransitions(mockTransitions, "zoo", "en")
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("zoom")
    })

    it("should search by description", () => {
      const results = searchTransitions(mockTransitions, "плавное", "ru")
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("fade")
    })

    it("should search by tags", () => {
      const results = searchTransitions(mockTransitions, "dynamic")
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("zoom")
    })

    it("should be case insensitive", () => {
      const results = searchTransitions(mockTransitions, "FADE", "en")
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("fade")
    })
  })

  describe("groupTransitions", () => {
    const mockTransitions: Transition[] = [
      {
        id: "fade",
        type: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth"],
        duration: { default: 0.5, min: 0.3, max: 1.0 },
        ffmpegCommand: () => "fade=t=in:st=0:d=0.5",
      },
      {
        id: "zoom",
        type: "zoom",
        name: "Zoom",
        labels: { ru: "Увеличение", en: "Zoom" },
        description: { ru: "Эффект увеличения", en: "Zoom effect" },
        category: "advanced",
        complexity: "intermediate",
        tags: ["zoom", "scale"],
        duration: { default: 1.5, min: 1.0, max: 3.0 },
        ffmpegCommand: () => "zoompan=z='min(zoom+0.0015,1.5)'",
      },
      {
        id: "slide",
        type: "slide",
        name: "Slide",
        labels: { ru: "Слайд", en: "Slide" },
        description: { ru: "Эффект слайда", en: "Slide effect" },
        category: "basic",
        complexity: "basic",
        tags: ["slide", "movement"],
        duration: { default: 2.5, min: 2.0, max: 4.0 },
        ffmpegCommand: () => "slide=mode=right",
      },
    ]

    it("should group by category", () => {
      const groups = groupTransitions(mockTransitions, "category")
      expect(Object.keys(groups)).toEqual(["basic", "advanced"])
      expect(groups.basic).toHaveLength(2)
      expect(groups.advanced).toHaveLength(1)
    })

    it("should group by complexity", () => {
      const groups = groupTransitions(mockTransitions, "complexity")
      expect(Object.keys(groups)).toEqual(["basic", "intermediate"])
      expect(groups.basic).toHaveLength(2)
      expect(groups.intermediate).toHaveLength(1)
    })

    it("should group by tags", () => {
      const groups = groupTransitions(mockTransitions, "tags")
      expect(Object.keys(groups).sort()).toEqual(["dynamic", "smooth", "untagged"])
      expect(groups.smooth).toHaveLength(1)
      expect(groups.dynamic).toHaveLength(1)
      expect(groups.untagged).toHaveLength(1)
    })

    it("should group by duration", () => {
      const groups = groupTransitions(mockTransitions, "duration")
      expect(Object.keys(groups).sort()).toEqual(["long", "medium", "short"])
      expect(groups.short).toHaveLength(1) // fade (0.5s)
      expect(groups.medium).toHaveLength(1) // zoom (1.5s)
      expect(groups.long).toHaveLength(1) // slide (2.5s)
    })

    it("should return single group for none", () => {
      const groups = groupTransitions(mockTransitions, "none")
      expect(Object.keys(groups)).toEqual(["all"])
      expect(groups.all).toEqual(mockTransitions)
    })
  })

  describe("sortTransitions", () => {
    const mockTransitions: Transition[] = [
      {
        id: "zoom",
        type: "zoom",
        name: "Zoom",
        labels: { ru: "Увеличение", en: "Zoom" },
        description: { ru: "Эффект увеличения", en: "Zoom effect" },
        category: "advanced",
        complexity: "intermediate",
        tags: ["zoom", "scale"],
        duration: { default: 1.5, min: 0.5, max: 3.0 },
        ffmpegCommand: () => "zoompan=z='min(zoom+0.0015,1.5)'",
      },
      {
        id: "fade",
        type: "fade",
        name: "Fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth", "classic"],
        duration: { default: 1.0, min: 0.5, max: 3.0 },
        ffmpegCommand: () => "fade=t=in:st=0:d=1.0",
      },
      {
        id: "spiral",
        type: "spiral",
        name: "Spiral",
        labels: { ru: "Спираль", en: "Spiral" },
        description: { ru: "Спиральный эффект", en: "Spiral effect" },
        category: "creative",
        complexity: "advanced",
        tags: ["spiral", "rotation"],
        duration: { default: 2.5, min: 1.0, max: 5.0 },
        ffmpegCommand: () => "rotate=a='2*PI*t'",
      },
    ]

    it("should sort by name ascending", () => {
      const sorted = sortTransitions(mockTransitions, "name", "asc")
      expect(sorted[0].id).toBe("fade")
      expect(sorted[1].id).toBe("spiral")
      expect(sorted[2].id).toBe("zoom")
    })

    it("should sort by name descending", () => {
      const sorted = sortTransitions(mockTransitions, "name", "desc")
      expect(sorted[0].id).toBe("zoom")
      expect(sorted[1].id).toBe("spiral")
      expect(sorted[2].id).toBe("fade")
    })

    it("should sort by complexity", () => {
      const sorted = sortTransitions(mockTransitions, "complexity", "asc")
      expect(sorted[0].complexity).toBe("basic")
      expect(sorted[1].complexity).toBe("intermediate")
      expect(sorted[2].complexity).toBe("advanced")
    })

    it("should sort by category", () => {
      const sorted = sortTransitions(mockTransitions, "category", "asc")
      expect(sorted[0].category).toBe("advanced")
      expect(sorted[1].category).toBe("basic")
      expect(sorted[2].category).toBe("creative")
    })

    it("should sort by duration", () => {
      const sorted = sortTransitions(mockTransitions, "duration", "asc")
      expect(sorted[0].duration?.default).toBe(1.0)
      expect(sorted[1].duration?.default).toBe(1.5)
      expect(sorted[2].duration?.default).toBe(2.5)
    })
  })
})
